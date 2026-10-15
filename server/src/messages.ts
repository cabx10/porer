import { Router } from "express";
import { prisma } from "./db";
import { getUser, requireAuth } from "./auth";

export const messagesRouter = Router();

// Get conversations grouped by listing and other user (MUST BE BEFORE /:listingId/:otherUserId)
messagesRouter.get("/conversations/list", requireAuth(), async (req, res) => {
  const userId = getUser(req).id;
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true, photos: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const convMap = new Map();
  messages.forEach(m => {
    const listingId = m.listingId || 0;
    const other = m.senderId === userId ? m.receiver : m.sender;
    const key = `${listingId}_${other.id}`;
    if (!convMap.has(key)) {
      convMap.set(key, { 
        listingId: listingId, 
        listingTitle: m.listing?.title || "Genel Mesajlar",
        listingPhoto: m.listing?.photos?.[0],
        otherUser: other, 
        lastMessage: m.content, 
        date: m.createdAt 
      });
    }
  });

  res.json(Array.from(convMap.values()));
});

// Get conversation history for a specific listing and user
messagesRouter.get("/:listingId/:otherUserId", requireAuth(), async (req, res) => {
  const userId = getUser(req).id;
  const otherUserId = Number(req.params.otherUserId);
  const listingId = Number(req.params.listingId);
  const messages = await prisma.message.findMany({
    where: {
      listingId: listingId === 0 ? null : listingId,
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    },
    orderBy: { createdAt: "asc" }
  });
  res.json(messages);
});

// Send a message
messagesRouter.post("/", requireAuth(), async (req, res) => {
  const userId = getUser(req).id;
  const { receiverId, content, listingId } = req.body;
  if (!receiverId || !content) return res.status(400).json({ error: "Missing fields" });

  const message = await prisma.message.create({
    data: {
      content,
      senderId: userId,
      receiverId: Number(receiverId),
      listingId: listingId ? Number(listingId) : null
    },
    include: {
      listing: { select: { title: true } }
    }
  });

  const io = req.app.get("io");
  if (io) {
    io.to("user_" + receiverId).emit("new_message", message);
  }

  res.status(201).json(message);
});
