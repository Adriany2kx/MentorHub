import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(5000),
});

// Helper: get or create a conversation between two users
// Ensures participant1Id < participant2Id for uniqueness
async function getOrCreateConversation(userAId: string, userBId: string) {
  const [p1, p2] = [userAId, userBId].sort();
  return prisma.conversation.upsert({
    where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
    create: { participant1Id: p1, participant2Id: p2 },
    update: {},
  });
}

// GET /api/conversations — list own conversations
router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      participant1: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      participant2: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, senderId: true, isRead: true, createdAt: true },
      },
    },
  });

  // Attach unread count per conversation
  const withUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await prisma.message.count({
        where: { conversationId: conv.id, senderId: { not: userId }, isRead: false },
      });
      const other = conv.participant1Id === userId ? conv.participant2 : conv.participant1;
      return { ...conv, unreadCount, other };
    })
  );

  return res.json({ conversations: withUnread });
});

// POST /api/conversations — start or get conversation with a user
router.post("/", requireAuth, async (req, res) => {
  const parsed = z.object({ recipientId: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { recipientId } = parsed.data;
  const userId = req.userId!;

  if (recipientId === userId) {
    return res.status(400).json({ error: "Cannot message yourself" });
  }

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient) return res.status(404).json({ error: "User not found" });

  const conversation = await getOrCreateConversation(userId, recipientId);

  const full = await prisma.conversation.findUnique({
    where: { id: conversation.id },
    include: {
      participant1: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      participant2: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  return res.status(201).json({ conversation: full });
});

// GET /api/conversations/:id/messages — get messages in conversation
router.get("/:id/messages", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } });
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "50"))));
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    }),
    prisma.message.count({ where: { conversationId: conversation.id } }),
  ]);

  // Mark unread messages (sent by the other person) as read
  await prisma.message.updateMany({
    where: { conversationId: conversation.id, senderId: { not: userId }, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return res.json({ messages, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// POST /api/conversations/:id/messages — send a message
router.post("/:id/messages", requireAuth, async (req, res) => {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const userId = req.userId!;
  const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } });
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: conversation.id, senderId: userId, content: parsed.data.content.trim() },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  return res.status(201).json({ message });
});

// PATCH /api/messages/:id/read — mark message as read
router.patch("/:convId/messages/:msgId/read", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const message = await prisma.message.findUnique({
    where: { id: req.params.msgId },
    include: { conversation: true },
  });

  if (!message) return res.status(404).json({ error: "Message not found" });

  const conv = message.conversation;
  if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
    return res.status(404).json({ error: "Message not found" });
  }

  if (message.senderId === userId) {
    return res.status(400).json({ error: "Cannot mark your own message as read" });
  }

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { isRead: true, readAt: new Date() },
  });

  return res.json({ message: updated });
});

export default router;
