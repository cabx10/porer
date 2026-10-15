import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

const SECRET = process.env.JWT_SECRET || "dev-secret";
export type AuthUser = { id: number };
export const getUser = (req: Request) => (req as any).user as AuthUser;

export const requireAuth =
  () => (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Unauthorized" });
    try {
      const p = jwt.verify(header.replace("Bearer ", ""), SECRET) as AuthUser;
      (req as any).user = { id: p.id };
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password || !phone)
    return res.status(400).json({ error: "Name, email, password, and phone number are required" });
  if (await prisma.user.findUnique({ where: { email } }))
    return res.status(409).json({ error: "Email already in use" });
  const user = await prisma.user.create({
    data: { name, email, phone, password: await bcrypt.hash(password, 10) },
  });
  res.json(issue(user));
});

authRouter.post("/login", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user || !(await bcrypt.compare(req.body.password ?? "", user.password)))
    return res.status(401).json({ error: "Wrong email or password" });
  res.json(issue(user));
});


authRouter.put("/profile", requireAuth(), async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) return res.status(400).json({ error: "Name and phone are required" });
  
  const phoneClean = phone.replace(/[\s\(\)\-]/g, '');
  if (phoneClean.length < 10 || phoneClean.length > 15 || !/^\+?[0-9]+$/.test(phoneClean)) {
    return res.status(400).json({ error: "Invalid phone number format. Please enter a valid number (e.g. 05551234567)." });
  }

  const userId = getUser(req).id;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, phone }
  });
  
  res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
});

const issue = (u: { id: number; name: string; email: string; phone?: string | null }) => ({
  token: jwt.sign({ id: u.id }, SECRET, { expiresIn: "7d" }),
  user: { id: u.id, name: u.name, email: u.email, phone: u.phone },
});