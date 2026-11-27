import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getUser, requireAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

export const listingsRouter = Router();
const num = (v: unknown) => (v !== undefined && v !== "" && !isNaN(Number(v)) ? Number(v) : undefined);

/** Parses room numbers from formats like "2+1", "3", "4+1" (takes number before '+') */
const parseRoomNum = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const str = String(v).trim();
  if (str.includes("+")) {
    const before = str.split("+")[0].trim();
    const n = Number(before);
    return !isNaN(n) ? n : undefined;
  }
  const n = Number(str);
  return !isNaN(n) ? n : undefined;
};

listingsRouter.get("/", async (req, res) => {
  const q = req.query;
  const where: Prisma.ListingWhereInput = {};
  const [minPrice, maxPrice, minArea, maxArea] =
    [q.minPrice, q.maxPrice, q.minArea, q.maxArea].map(num);

  if (minPrice !== undefined || maxPrice !== undefined) where.price = { gte: minPrice, lte: maxPrice };
  if (minArea !== undefined || maxArea !== undefined) where.area = { gte: minArea, lte: maxArea };

  // Multi-district support (comma-separated, array, or single string)
  const rawDistricts = q.districts ?? q.district;
  if (rawDistricts) {
    const districtList = (Array.isArray(rawDistricts) ? rawDistricts : String(rawDistricts).split(","))
      .map((d) => String(d).trim())
      .filter(Boolean);
    if (districtList.length === 1) {
      where.district = districtList[0];
    } else if (districtList.length > 1) {
      where.district = { in: districtList };
    }
  }

  if (q.city) where.city = String(q.city);

  // Multi-neighborhood support (comma-separated, array, or single string)
  const rawNeighborhoods = q.neighborhoods ?? q.neighborhood;
  if (rawNeighborhoods) {
    const neighborhoodList = (Array.isArray(rawNeighborhoods) ? rawNeighborhoods : String(rawNeighborhoods).split(","))
      .map((n) => String(n).trim())
      .filter(Boolean);
    if (neighborhoodList.length === 1) {
      where.neighborhood = neighborhoodList[0];
    } else if (neighborhoodList.length > 1) {
      where.neighborhood = { in: neighborhoodList };
    }
  }

  if (q.type === "HOME" || q.type === "OFFICE") where.type = q.type;

  // Rooms filtering:
  // 1) Multi-select room presets or custom input (e.g. 1+1, 2+1, 5+ -> rooms=1,2,5+)
  //    Takes number before '+' like in 2+1 -> 2
  // 2) Minimum room count (if minRooms passed)
  const roomConditions: Prisma.ListingWhereInput[] = [];

  const rawRooms = q.rooms;
  if (rawRooms !== undefined && rawRooms !== "") {
    const parts = (Array.isArray(rawRooms) ? rawRooms : String(rawRooms).split(/[,;\s]+/))
      .map((r) => String(r).trim())
      .filter(Boolean);

    const exactRooms: number[] = [];
    let includeFivePlus = false;

    for (const part of parts) {
      if (part === "5+" || part === "5_plus" || part === "5plus") {
        includeFivePlus = true;
      } else if (part.includes("+")) {
        const beforePlus = part.split("+")[0].trim();
        const n = Number(beforePlus);
        if (!isNaN(n)) exactRooms.push(n);
      } else {
        const n = Number(part);
        if (!isNaN(n)) exactRooms.push(n);
      }
    }

    const presetConditions: Prisma.ListingWhereInput[] = [];
    if (exactRooms.length > 0) {
      presetConditions.push({ rooms: { in: exactRooms } });
    }
    if (includeFivePlus) {
      presetConditions.push({ rooms: { gte: 5 } });
    }

    if (presetConditions.length === 1) {
      roomConditions.push(presetConditions[0]);
    } else if (presetConditions.length > 1) {
      roomConditions.push({ OR: presetConditions });
    }
  }

  const rawMinRooms = q.minRooms;
  if (rawMinRooms !== undefined && rawMinRooms !== "") {
    const str = String(rawMinRooms).trim();
    const n = str.includes("+") ? Number(str.split("+")[0].trim()) : Number(str);
    if (!isNaN(n)) {
      roomConditions.push({ rooms: { gte: n } });
    }
  }

  if (roomConditions.length === 1) {
    Object.assign(where, roomConditions[0]);
  } else if (roomConditions.length > 1) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : (where.AND ? [where.AND] : [])),
      ...roomConditions,
    ];
  }

  // Sorting options:
  // newest: createdAt desc (default)
  // oldest: createdAt asc
  // price_asc: price asc
  // price_desc: price desc
  let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: "desc" };
  const sort = String(q.sort ?? "").toLowerCase();
  if (sort === "price_asc" || sort === "price_low") {
    orderBy = { price: "asc" };
  } else if (sort === "price_desc" || sort === "price_high") {
    orderBy = { price: "desc" };
  } else if (sort === "oldest" || sort === "date_asc") {
    orderBy = { createdAt: "asc" };
  } else {
    orderBy = { createdAt: "desc" };
  }

  const page = Math.max(1, num(q.page) ?? 1);
  const limit = Math.min(50, num(q.limit) ?? 20);
  const [items, total] = await Promise.all([
    prisma.listing.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.listing.count({ where }),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

listingsRouter.get("/mine", requireAuth(), async (req, res) => {
  res.json(await prisma.listing.findMany({ where: { ownerId: getUser(req).id }, orderBy: { createdAt: "desc" } }));
});

listingsRouter.get("/:id", async (req, res) => {
  const item = await prisma.listing.findUnique({
    where: { id: Number(req.params.id) },
    include: { owner: { select: { id: true, name: true, phone: true } } },
  });
  item ? res.json(item) : res.status(404).json({ error: "Not found" });
});

listingsRouter.post("/", requireAuth(), upload.array("photos", 50), async (req, res) => {
  const b = req.body;
  const price = num(b.price);
  const area = num(b.area);
  const rooms = parseRoomNum(b.rooms);
  const lat = num(b.lat);
  const lng = num(b.lng);
  const title = String(b.title ?? "").trim();
  const description = String(b.description ?? "").trim();
  const city = String(b.city ?? "").trim();
  const district = String(b.district ?? "").trim();
  const neighborhood = String(b.neighborhood ?? "").trim();
  const address = String(b.address ?? "").trim();
  const type = b.type === "OFFICE" ? "OFFICE" : "HOME";

  if (!title || price === undefined || area === undefined || rooms === undefined || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  // Files handled by multer
  const files = req.files as Express.Multer.File[];
  const photoUrls = files ? files.map(f => "/uploads/" + f.filename) : [];

  const created = await prisma.listing.create({
    data: {
      title,
      description,
      type,
      price,
      area: Math.round(area),
      rooms: Math.round(rooms),
      city,
      district,
      neighborhood,
      address,
      lat,
      lng,
      photos: photoUrls,
      ownerId: getUser(req).id,
    },
  });

  res.status(201).json(created);
});

listingsRouter.delete("/:id", requireAuth(), async (req, res) => {
  const listingId = Number(req.params.id);
  const userId = getUser(req).id;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.ownerId !== userId) {
    return res.status(404).json({ error: "Not found or not authorized" });
  }

  await prisma.listing.delete({ where: { id: listingId } });

  // Delete photos after a delay to avoid breaking immediate reloads
  if (listing.photos && listing.photos.length > 0) {
    setTimeout(() => {
      listing.photos.forEach(photo => {
        const filePath = path.join(process.cwd(), photo.replace(/^\//, ""));
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) { console.error("Error deleting photo:", e); }
        }
      });
    }, 15 * 60 * 1000);
  }

  res.json({ ok: true });
});

listingsRouter.put("/:id", requireAuth(), upload.array("photos", 50), async (req, res) => {
  const listingId = Number(req.params.id);
  const userId = getUser(req).id;
  
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.ownerId !== userId) {
    return res.status(404).json({ error: "Not found or not authorized" });
  }

  const b = req.body;
  const price = num(b.price) ?? listing.price;
  const area = num(b.area) ?? listing.area;
  const rooms = parseRoomNum(b.rooms) ?? listing.rooms;
  const lat = num(b.lat) ?? listing.lat;
  const lng = num(b.lng) ?? listing.lng;
  const title = String(b.title || listing.title).trim();
  const description = String(b.description || listing.description).trim();
  const city = String(b.city || listing.city).trim();
  const district = String(b.district || listing.district || "").trim();
  const neighborhood = String(b.neighborhood || listing.neighborhood || "").trim();
  const address = String(b.address || listing.address).trim();
  const type = b.type === "OFFICE" ? "OFFICE" : (b.type === "HOME" ? "HOME" : listing.type);

  const files = req.files as Express.Multer.File[];
  let photoUrls = listing.photos || [];
  if (files && files.length > 0) {
    const newPhotos = files.map(f => "/uploads/" + f.filename);
    photoUrls = [...photoUrls, ...newPhotos];
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: {
      title, description, type, price, area: Math.round(area), rooms: Math.round(rooms),
      city, district, neighborhood, address, lat, lng, photos: photoUrls
    }
  });

  res.json(updated);
});
