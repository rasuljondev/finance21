import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { getSession } from "../auth/session.js";

const UpdateCompanySchema = z.object({
  registrationDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  telegramId: z.string().optional().nullable(),
});

const GenerateCredentialsSchema = z.object({
  password: z.string().min(1),
});

export async function getCompanyHandler(req: Request, res: Response) {
  try {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      include: {
        director: true,
        roles: {
          include: {
            person: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    return res.json({
      ok: true,
      company: {
        id: company.id,
        tin: company.tin,
        name: company.name,
        status: company.status,
        registrationDate: company.registrationDate,
        activityCode: company.activityCode,
        address: company.address,
        login: company.login,
        telegramId: company.telegramId,
        director: company.director
          ? {
              id: company.director.id,
              fullName: company.director.fullName,
              pinfl: company.director.pinfl,
              jshshir: company.director.jshshir,
            }
          : null,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
    });
  } catch (err: unknown) {
    console.error(`[backend] get company error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Failed to get company", message: msg });
  }
}

export async function updateCompanyHandler(req: Request, res: Response) {
  try {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });

    const parsed = UpdateCompanySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const data: any = {};
    if (parsed.data.registrationDate !== undefined) {
      data.registrationDate = parsed.data.registrationDate ? new Date(parsed.data.registrationDate) : null;
    }
    if (parsed.data.address !== undefined) data.address = parsed.data.address;
    if (parsed.data.telegramId !== undefined) data.telegramId = parsed.data.telegramId;

    const company = await prisma.company.update({
      where: { id: session.companyId },
      data,
    });

    return res.json({
      ok: true,
      company: {
        id: company.id,
        tin: company.tin,
        name: company.name,
        registrationDate: company.registrationDate,
        address: company.address,
        telegramId: company.telegramId,
      },
    });
  } catch (err: unknown) {
    console.error(`[backend] update company error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Failed to update company", message: msg });
  }
}

export async function generateCredentialsHandler(req: Request, res: Response) {
  try {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });

    const parsed = GenerateCredentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Generate login = STIR, password = provided password
    const login = company.tin;
    const password = parsed.data.password || "";

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const updated = await prisma.company.update({
      where: { id: session.companyId },
      data: {
        login,
        password,
      },
    });

    return res.json({
      ok: true,
      credentials: {
        login: updated.login,
        password: updated.password,
      },
    });
  } catch (err: unknown) {
    console.error(`[backend] generate credentials error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Failed to generate credentials", message: msg });
  }
}

