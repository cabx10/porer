import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

const SECRET = process.env.JWT_SECRET || "dev-secret";
export type AuthUser = { id: number; role: string };
export const getUser = (req: Request) => (req as any).user as AuthUser;

export const requireAuth =
  (role?: "OWNER" | "SEEKER") => (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Unauthorized" });
    try {
      const p = jwt.verify(header.replace("Bearer ", ""), SECRET) as AuthUser;
      if (role && p.role !== role) return res.status(403).json({ error: "Forbidden" });
      (req as any).user = { id: p.id, role: p.role };
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !["OWNER", "SEEKER"].includes(role))
    return res.status(400).json({ error: "Invalid input" });
  if (await prisma.user.findUnique({ where: { email } }))
    return res.status(409).json({ error: "Email already in use" });
  const user = await prisma.user.create({
    data: { name, email, role, password: await bcrypt.hash(password, 10) },
  });
  res.json(issue(user));
});

authRouter.post("/login", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user || !(await bcrypt.compare(req.body.password ?? "", user.password)))
    return res.status(401).json({ error: "Wrong email or password" });
  res.json(issue(user));
});

const issue = (u: { id: number; role: string; name: string }) => ({
  token: jwt.sign({ id: u.id, role: u.role }, SECRET, { expiresIn: "7d" }),
  user: { id: u.id, name: u.name, role: u.role },
});
