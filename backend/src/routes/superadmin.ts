import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { setSessionCookie } from "../auth/session.js";

const SuperadminLoginSchema = z.object({
  password: z.string().min(1),
});

export async function superadminLoginHandler(req: Request, res: Response) {
  const parsed = SuperadminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const { password } = parsed.data;
  const SUPERADMIN_PASSWORD = "2200880rr#";

  if (password !== SUPERADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }

  try {
    // Issue superadmin session cookie
    console.log(`[backend] superadmin login successful, issuing session cookie...`);
    setSessionCookie(res, {
      companyId: "superadmin",
      companyTin: "SUPERADMIN",
      personId: "superadmin",
      role: "SUPERADMIN",
    });

    return res.json({
      ok: true,
      role: "SUPERADMIN",
    });
  } catch (err: unknown) {
    console.error(`[backend] Superadmin login error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Superadmin login failed", message: msg });
  }
}

export async function getCompaniesHandler(req: Request, res: Response) {
  try {
    const companies = await prisma.company.findMany({
      include: {
        director: true,
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      ok: true,
      companies: companies.map((c) => ({
        id: c.id,
        tin: c.tin,
        name: c.name,
        status: c.status,
        address: c.address,
        login: c.login,
        telegramId: c.telegramId,
        registrationDate: c.registrationDate,
        activityCode: c.activityCode,
        director: c.director
          ? {
              id: c.director.id,
              fullName: c.director.fullName,
              pinfl: c.director.pinfl,
              jshshir: c.director.jshshir,
            }
          : null,
        documentCount: c._count.documents,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (err: unknown) {
    console.error(`[backend] Get companies error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Failed to fetch companies", message: msg });
  }
}

