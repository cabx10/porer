import { Router } from "express";
import { prisma } from "./db";
import { getUser, requireAuth } from "./auth";

export const appointmentsRouter = Router();

// Seeker requests a viewing
appointmentsRouter.post("/", requireAuth("SEEKER"), async (req, res) => {
  const { listingId, date, message } = req.body;
  const when = new Date(date);
  if (!listingId || isNaN(when.getTime()) || when < new Date())
    return res.status(400).json({ error: "Invalid listing or date" });
  if (!(await prisma.listing.findUnique({ where: { id: Number(listingId) } })))
    return res.status(404).json({ error: "Listing not found" });
  res.status(201).json(
    await prisma.appointment.create({
      data: { listingId: Number(listingId), seekerId: getUser(req).id, date: when, message },
    })
  );
});

// Seeker: own requests
appointmentsRouter.get("/mine", requireAuth("SEEKER"), async (req, res) => {
  res.json(
    await prisma.appointment.findMany({
      where: { seekerId: getUser(req).id },
      include: { listing: { select: { title: true, address: true } } },
      orderBy: { date: "asc" },
    })
  );
});

// Owner: requests on their listings
appointmentsRouter.get("/incoming", requireAuth("OWNER"), async (req, res) => {
  res.json(
    await prisma.appointment.findMany({
      where: { listing: { ownerId: getUser(req).id } },
      include: { listing: { select: { title: true } }, seeker: { select: { name: true, email: true } } },
      orderBy: { date: "asc" },
    })
  );
});

// Owner approves / rejects
appointmentsRouter.patch("/:id", requireAuth("OWNER"), async (req, res) => {
  const { status } = req.body;
  if (!["APPROVED", "REJECTED"].includes(status)) return res.status(400).json({ error: "Invalid status" });
  const r = await prisma.appointment.updateMany({
    where: { id: Number(req.params.id), listing: { ownerId: getUser(req).id } },
    data: { status },
  });
  r.count ? res.json({ ok: true }) : res.status(404).json({ error: "Not found" });
});
