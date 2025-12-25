import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireSession, requireSuperadmin } from "../auth/session.js";

const CreateAccountantSchema = z.object({
  name: z.string().min(1),
  login: z.string().min(3),
  password: z.string().min(1),
  telegramId: z.string().optional(),
});

const UpdateAccountantSchema = z.object({
  name: z.string().min(1).optional(),
  login: z.string().min(3).optional(),
  password: z.string().min(1).optional(),
  telegramId: z.string().optional().nullable(),
});

export async function createAccountantHandler(req: Request, res: Response) {
  const parsed = CreateAccountantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  try {
    const accountant = await prisma.accountant.create({
      data: parsed.data,
    });

    return res.json({
      ok: true,
      accountant: {
        id: accountant.id,
        name: accountant.name,
        login: accountant.login,
        telegramId: accountant.telegramId,
        createdAt: accountant.createdAt,
        updatedAt: accountant.updatedAt,
      },
    });
  } catch (err: unknown) {
    console.error(`[backend] Create accountant error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint")) {
      return res.status(400).json({ error: "Login already exists" });
    }
    return res.status(500).json({ error: "Failed to create accountant", message: msg });
  }
}

export async function listAccountantsHandler(req: Request, res: Response) {
  try {
    const accountants = await prisma.accountant.findMany({
      include: {
        _count: {
          select: {
            roles: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      ok: true,
      accountants: accountants.map((a) => ({
        id: a.id,
        name: a.name,
        login: a.login,
        telegramId: a.telegramId,
        companyCount: a._count.roles,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
    });
  } catch (err: unknown) {
    console.error(`[backend] List accountants error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Failed to fetch accountants", message: msg });
  }
}

export async function updateAccountantHandler(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = UpdateAccountantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  try {
    const updateData: any = {};
    if (parsed.data.name) updateData.name = parsed.data.name;
    if (parsed.data.login) updateData.login = parsed.data.login;
    if (parsed.data.password) updateData.password = parsed.data.password;
    if (parsed.data.telegramId !== undefined) updateData.telegramId = parsed.data.telegramId;

    const accountant = await prisma.accountant.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      ok: true,
      accountant: {
        id: accountant.id,
        name: accountant.name,
        login: accountant.login,
        telegramId: accountant.telegramId,
        createdAt: accountant.createdAt,
        updatedAt: accountant.updatedAt,
      },
    });
  } catch (err: unknown) {
    console.error(`[backend] Update accountant error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint")) {
      return res.status(400).json({ error: "Login already exists" });
    }
    return res.status(500).json({ error: "Failed to update accountant", message: msg });
  }
}

export async function deleteAccountantHandler(req: Request, res: Response) {
  const { id } = req.params;

  try {
    await prisma.accountant.delete({
      where: { id },
    });

    return res.json({ ok: true });
  } catch (err: unknown) {
    console.error(`[backend] Delete accountant error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Failed to delete accountant", message: msg });
  }
}

export async function assignAccountantToCompanyHandler(req: Request, res: Response) {
  const parsed = z.object({
    companyId: z.string(),
    accountantId: z.string(),
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  try {
    const session = (req as any).session as any;
    
    // Security check: Only allow if Superadmin OR if the company matches the user's session
    if (session.role !== "SUPERADMIN" && session.companyId !== parsed.data.companyId) {
      return res.status(403).json({ error: "Permission denied. You can only assign to your own company." });
    }

    await prisma.companyRole.create({
      data: {
        companyId: parsed.data.companyId,
        accountantId: parsed.data.accountantId,
        role: "ACCOUNTANT",
      },
    });

    return res.json({ ok: true });
  } catch (err: unknown) {
    console.error(`[backend] Assign accountant error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint")) {
      return res.status(400).json({ error: "Accountant already assigned to this company" });
    }
    return res.status(500).json({ error: "Failed to assign accountant", message: msg });
  }
}

export async function removeAccountantFromCompanyHandler(req: Request, res: Response) {
  const { companyId, accountantId } = req.params;

  try {
    const session = (req as any).session as any;

    // Security check: Only allow if Superadmin OR if the company matches the user's session
    if (session.role !== "SUPERADMIN" && session.companyId !== companyId) {
      return res.status(403).json({ error: "Permission denied. You can only remove from your own company." });
    }

    await prisma.companyRole.deleteMany({
      where: {
        companyId,
        accountantId,
        role: "ACCOUNTANT",
      },
    });

    return res.json({ ok: true });
  } catch (err: unknown) {
    console.error(`[backend] Remove accountant error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Failed to remove accountant", message: msg });
  }
}

export async function getAccountantCompaniesHandler(req: Request, res: Response) {
  try {
    const session = (req as any).session as any;
    if (!session || session.role !== "ACCOUNTANT") {
      return res.status(403).json({ error: "Accountant access required" });
    }

    const roles = await prisma.companyRole.findMany({
      where: {
        accountantId: session.personId,
        role: "ACCOUNTANT",
      },
      include: {
        company: {
          select: {
            id: true,
            tin: true,
            name: true,
          },
        },
      },
    });

    const companies = roles.map((r) => r.company);

    return res.json({
      ok: true,
      companies,
    });
  } catch (err: unknown) {
    console.error(`[backend] Get accountant companies error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Failed to fetch companies", message: msg });
  }
}

