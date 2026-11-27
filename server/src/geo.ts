import { Router } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "./db";

export const geoRouter = Router();

const cacheDir = path.join(process.cwd(), "data");
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}
const cacheFile = path.join(cacheDir, "geo_cache.json");

interface GeoResult {
  name: string;
  district?: string;
  center?: { lat: number; lng: number };
  paths: Array<Array<{ lat: number; lng: number }>>;
}

let memoryCache: Record<string, GeoResult> = {};
if (fs.existsSync(cacheFile)) {
  try {
    memoryCache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  } catch (err) {
    console.error("Failed to read geo cache:", err);
  }
}

function saveCache() {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(memoryCache, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save geo cache:", err);
  }
}

// Generate an approximate circular polygon around a center point
function generateCirclePolygon(center: { lat: number; lng: number }, radiusMeters: number = 700): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  const numPoints = 16;
  const earthRadius = 6378137;
  const dLat = (radiusMeters / earthRadius) * (180 / Math.PI);
  const dLng = dLat / Math.cos((center.lat * Math.PI) / 180);

  for (let i = 0; i < numPoints; i++) {
    const angle = (i * 2 * Math.PI) / numPoints;
    points.push({
      lat: Math.round((center.lat + dLat * Math.sin(angle)) * 100000) / 100000,
      lng: Math.round((center.lng + dLng * Math.cos(angle)) * 100000) / 100000,
    });
  }
  // close polygon
  points.push(points[0]);
  return points;
}

geoRouter.get("/neighborhoods", async (req, res) => {
  const rawNames = req.query.names ?? req.query.name;
  if (!rawNames) {
    return res.json([]);
  }

  const district = typeof req.query.district === "string" ? req.query.district.trim() : undefined;
  const city = typeof req.query.city === "string" ? req.query.city.trim() : "Adana";

  const namesList = (Array.isArray(rawNames) ? rawNames : String(rawNames).split(","))
    .map((s) => String(s).trim())
    .filter(Boolean);

  const results: GeoResult[] = [];

  for (const name of namesList) {
    const cacheKey = `${city}_${district || ""}_${name}`.toLowerCase();
    const altCacheKey = `${city}__${name}`.toLowerCase();
    if (memoryCache[cacheKey]) {
      results.push(memoryCache[cacheKey]);
      continue;
    }
    if (memoryCache[altCacheKey]) {
      results.push(memoryCache[altCacheKey]);
      continue;
    }

    // 1. Try Nominatim
    try {
      const queryStr = `${name}, ${district ? district + ", " : ""}${city}, Turkey`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=geojson&polygon_geojson=1&limit=1`;

      const response = await fetch(url, {
        headers: { "User-Agent": "PorerRealEstate/1.0" },
      });
      if (response.ok) {
        const data = await response.json();
        const feature = data.features && data.features[0];

        if (feature && feature.geometry) {
          const geom = feature.geometry;
          const paths: Array<Array<{ lat: number; lng: number }>> = [];

          if (geom.type === "Polygon") {
            const ring = geom.coordinates[0].map(([lng, lat]: [number, number]) => ({ lat, lng }));
            paths.push(ring);
          } else if (geom.type === "MultiPolygon") {
            for (const poly of geom.coordinates) {
              const ring = poly[0].map(([lng, lat]: [number, number]) => ({ lat, lng }));
              paths.push(ring);
            }
          }

          let center: { lat: number; lng: number } | undefined;
          if (feature.bbox && feature.bbox.length === 4) {
            center = {
              lng: (feature.bbox[0] + feature.bbox[2]) / 2,
              lat: (feature.bbox[1] + feature.bbox[3]) / 2,
            };
          }

          if (paths.length === 0 && feature.bbox && feature.bbox.length === 4) {
            const [minLng, minLat, maxLng, maxLat] = feature.bbox;
            paths.push([
              { lat: minLat, lng: minLng },
              { lat: minLat, lng: maxLng },
              { lat: maxLat, lng: maxLng },
              { lat: maxLat, lng: minLng },
              { lat: minLat, lng: minLng },
            ]);
          }

          if (paths.length > 0) {
            if (!center && paths[0].length > 0) {
              center = paths[0][0];
            }
            const item: GeoResult = { name, district, center, paths };
            memoryCache[cacheKey] = item;
            memoryCache[altCacheKey] = item;
            results.push(item);
            continue;
          }
        }
      }
    } catch (err) {
      console.error(`Error querying Nominatim for ${name}:`, err);
    }

    // 2. Try Photon fallback
    try {
      const photonQuery = `${name} ${district ? district + " " : ""}${city}`;
      const pUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(photonQuery)}&limit=1`;
      const pRes = await fetch(pUrl);
      if (pRes.ok) {
        const pData = await pRes.json();
        const feat = pData.features && pData.features[0];
        if (feat && feat.geometry) {
          let center: { lat: number; lng: number } | undefined;
          if (feat.geometry.type === "Point" && Array.isArray(feat.geometry.coordinates)) {
            center = { lat: feat.geometry.coordinates[1], lng: feat.geometry.coordinates[0] };
          }
          const paths: Array<Array<{ lat: number; lng: number }>> = [];
          if (feat.properties && feat.properties.extent && feat.properties.extent.length === 4) {
            const [minLng, maxLat, maxLng, minLat] = feat.properties.extent;
            paths.push([
              { lat: minLat, lng: minLng },
              { lat: minLat, lng: maxLng },
              { lat: maxLat, lng: maxLng },
              { lat: maxLat, lng: minLng },
              { lat: minLat, lng: minLng },
            ]);
            if (!center) {
              center = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
            }
          } else if (center) {
            paths.push(generateCirclePolygon(center, 700));
          }

          if (paths.length > 0 && center) {
            const item: GeoResult = { name, district, center, paths };
            memoryCache[cacheKey] = item;
            memoryCache[altCacheKey] = item;
            results.push(item);
            continue;
          }
        }
      }
    } catch (err) {
      console.error(`Error querying Photon for ${name}:`, err);
    }

    // 3. Fallback: Check listings table for coordinates of this neighborhood
    try {
      const listing = await prisma.listing.findFirst({
        where: {
          city,
          neighborhood: { contains: name.replace(" Mahallesi", "") },
        },
        select: { lat: true, lng: true },
      });

      if (listing && listing.lat && listing.lng) {
        const center = { lat: listing.lat, lng: listing.lng };
        const paths = [generateCirclePolygon(center, 700)];
        const item: GeoResult = { name, district, center, paths };
        memoryCache[cacheKey] = item;
        memoryCache[altCacheKey] = item;
        results.push(item);
        continue;
      }
    } catch (err) {
      console.error(`Error querying listing fallback for ${name}:`, err);
    }
  }

  saveCache();
  res.json(results);
});
