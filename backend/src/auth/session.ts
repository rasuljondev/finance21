import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { requireEnv } from "../config/requireEnv.js";

export interface SessionPayload {
  companyId: string;
  companyTin: string;
  personId: string;
  role: "DIRECTOR" | "ACCOUNTANT" | "SUPERADMIN";
}

const COOKIE_NAME = "finance21_session";

function getJwtSecret(): string {
  // Prefer dedicated secret; fallback to Supabase service role key for dev.
  return process.env.FINANCE21_JWT_SECRET || process.env.SERVICE_ROLE_KEY || requireEnv("SERVICE_ROLE_KEY");
}

export function setSessionCookie(res: Response, payload: SessionPayload) {
  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function requireSession(req: Request, res: Response, next: NextFunction) {
  const token = (req as any).cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, getJwtSecret()) as SessionPayload;
    (req as any).session = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}

export function getSession(req: Request): SessionPayload | null {
  return ((req as any).session as SessionPayload | undefined) || null;
}

export function requireSuperadmin(req: Request, res: Response, next: NextFunction) {
  const session = getSession(req);
  if (!session || session.role !== "SUPERADMIN") {
    return res.status(403).json({ error: "Superadmin access required" });
  }
  return next();
}


