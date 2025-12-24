import type { Request, Response } from "express";

export function healthHandler(_req: Request, res: Response) {
  res.json({ ok: true, service: "finance21-backend", time: new Date().toISOString() });
}


