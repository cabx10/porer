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

listingsRouter.get("/", async (req, res) => {
  const q = req.query;
  const where: Prisma.ListingWhereInput = {};
  const [minPrice, maxPrice, minArea, maxArea, rooms] =
    [q.minPrice, q.maxPrice, q.minArea, q.maxArea, q.rooms].map(num);

  if (minPrice !== undefined || maxPrice !== undefined) where.price = { gte: minPrice, lte: maxPrice };
  if (minArea !== undefined || maxArea !== undefined) where.area = { gte: minArea, lte: maxArea };
  if (rooms !== undefined) where.rooms = rooms;
  if (q.city) where.city = String(q.city);
  if (q.district) where.district = String(q.district);
  if (q.neighborhood) where.neighborhood = String(q.neighborhood);
  if (q.type === "HOME" || q.type === "OFFICE") where.type = q.type;

  const page = Math.max(1, num(q.page) ?? 1);
  const limit = Math.min(50, num(q.limit) ?? 20);
  const [items, total] = await Promise.all([
    prisma.listing.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
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
  const rooms = num(b.rooms);
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

  // Delete photos 15 minutes later
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
  const rooms = num(b.rooms) ?? listing.rooms;
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