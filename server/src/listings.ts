import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getUser, requireAuth } from "./auth";

export const listingsRouter = Router();
const num = (v: unknown) => (v !== undefined && v !== "" && !isNaN(Number(v)) ? Number(v) : undefined);

// Public: filter by price range, area (m²), rooms, city, type — DB-side, indexed, paginated
listingsRouter.get("/", async (req, res) => {
  const q = req.query;
  const where: Prisma.ListingWhereInput = {};
  const [minPrice, maxPrice, minArea, maxArea, rooms] =
    [q.minPrice, q.maxPrice, q.minArea, q.maxArea, q.rooms].map(num);

  if (minPrice !== undefined || maxPrice !== undefined) where.price = { gte: minPrice, lte: maxPrice };
  if (minArea !== undefined || maxArea !== undefined) where.area = { gte: minArea, lte: maxArea };
  if (rooms !== undefined) where.rooms = rooms;
  if (q.city) where.city = String(q.city);
  if (q.type === "HOME" || q.type === "OFFICE") where.type = q.type;

  const page = Math.max(1, num(q.page) ?? 1);
  const limit = Math.min(50, num(q.limit) ?? 20);
  const [items, total] = await Promise.all([
    prisma.listing.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.listing.count({ where }),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

listingsRouter.get("/mine", requireAuth("OWNER"), async (req, res) => {
  res.json(await prisma.listing.findMany({ where: { ownerId: getUser(req).id }, orderBy: { createdAt: "desc" } }));
});

listingsRouter.get("/:id", async (req, res) => {
  const item = await prisma.listing.findUnique({
    where: { id: Number(req.params.id) },
    include: { owner: { select: { name: true } } },
  });
  item ? res.json(item) : res.status(404).json({ error: "Not found" });
});

listingsRouter.post("/", requireAuth("OWNER"), async (req, res) => {
  const b = req.body;
  const data = {
    title: String(b.title ?? ""), description: String(b.description ?? ""),
    type: b.type === "OFFICE" ? "OFFICE" : "HOME",
    price: num(b.price), area: num(b.area), rooms: num(b.rooms),
    city: String(b.city ?? ""), address: String(b.address ?? ""),
    lat: num(b.lat), lng: num(b.lng),
  };
  if (!data.title || [data.price, data.area, data.rooms, data.lat, data.lng].some((v) => v === undefined))
    return res.status(400).json({ error: "Missing or invalid fields" });
  const created = await prisma.listing.create({
    data: { ...(data as Required<typeof data>), ownerId: getUser(req).id },
  });
  res.status(201).json(created);
});

listingsRouter.delete("/:id", requireAuth("OWNER"), async (req, res) => {
  const r = await prisma.listing.deleteMany({ where: { id: Number(req.params.id), ownerId: getUser(req).id } });
  r.count ? res.json({ ok: true }) : res.status(404).json({ error: "Not found" });
});
