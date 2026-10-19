import { Router } from "express";
import { prisma } from "./db";
import { getUser, requireAuth } from "./auth";

export const appointmentsRouter = Router();

// User requests a viewing
appointmentsRouter.post("/", requireAuth(), async (req, res) => {
  const { listingId, date, message } = req.body;
  const when = new Date(date);
  if (!listingId || isNaN(when.getTime()) || when < new Date())
    return res.status(400).json({ error: "Invalid listing or date" });

  const listing = await prisma.listing.findUnique({ where: { id: Number(listingId) } });
  if (!listing)
    return res.status(404).json({ error: "Listing not found" });

  const userId = getUser(req).id;
  if (listing.ownerId === userId)
    return res.status(400).json({ error: "Cannot request viewing for your own listing" });

  res.status(201).json(
    await prisma.appointment.create({
      data: { listingId: Number(listingId), seekerId: userId, date: when, message },
    })
  );
});

// User: own requests (viewings requested for others' listings)
appointmentsRouter.get("/mine", requireAuth(), async (req, res) => {
  res.json(
    await prisma.appointment.findMany({
      where: { seekerId: getUser(req).id },
      include: { listing: { select: { id: true, title: true, address: true, city: true, price: true } } },
      orderBy: { date: "asc" },
    })
  );
});

// User: incoming requests on their listings
appointmentsRouter.get("/incoming", requireAuth(), async (req, res) => {
  res.json(
    await prisma.appointment.findMany({
      where: { listing: { ownerId: getUser(req).id } },
      include: { listing: { select: { id: true, title: true } }, seeker: { select: { name: true, email: true } } },
      orderBy: { date: "asc" },
    })
  );
});

// User approves / rejects incoming requests
appointmentsRouter.patch("/:id", requireAuth(), async (req, res) => {
  const { status } = req.body;
  if (!["APPROVED", "REJECTED"].includes(status)) return res.status(400).json({ error: "Invalid status" });
  const r = await prisma.appointment.updateMany({
    where: { id: Number(req.params.id), listing: { ownerId: getUser(req).id } },
    data: { status },
  });
  r.count ? res.json({ ok: true }) : res.status(404).json({ error: "Not found" });
});
