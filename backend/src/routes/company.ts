import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { getSession } from "../auth/session.js";

const UpdateCompanySchema = z.object({
  registrationDate: z.string().optional().nullable(),
  registrationNo: z.string().optional().nullable(),
  companyType: z.string().optional().nullable(),
  dbibt: z.string().optional().nullable(),
  authorizedCapital: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
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
        registrationNo: company.registrationNo,
        activityCode: company.activityCode,
        companyType: company.companyType,
        dbibt: company.dbibt,
        authorizedCapital: company.authorizedCapital,
        city: company.city,
        region: company.region,
        district: company.district,
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
    if (parsed.data.registrationNo !== undefined) data.registrationNo = parsed.data.registrationNo;
    if (parsed.data.companyType !== undefined) data.companyType = parsed.data.companyType;
    if (parsed.data.dbibt !== undefined) data.dbibt = parsed.data.dbibt;
    if (parsed.data.authorizedCapital !== undefined) data.authorizedCapital = parsed.data.authorizedCapital;
    if (parsed.data.city !== undefined) data.city = parsed.data.city;
    if (parsed.data.region !== undefined) data.region = parsed.data.region;
    if (parsed.data.district !== undefined) data.district = parsed.data.district;
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
        registrationNo: company.registrationNo,
        companyType: company.companyType,
        dbibt: company.dbibt,
        authorizedCapital: company.authorizedCapital,
        city: company.city,
        region: company.region,
        district: company.district,
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

    // Generate login = STIR, password = registration number (or provided password)
    const login = company.tin;
    const password = parsed.data.password || company.registrationNo || "";

    if (!password) {
      return res.status(400).json({ error: "Registration number is required to generate password" });
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

