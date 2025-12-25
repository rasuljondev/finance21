import type { Request, Response } from "express";
import { z } from "zod";
import { DidoxClient } from "../didox/didoxClient.js";
import { prisma } from "../prisma.js";
import { setSessionCookie } from "../auth/session.js";

const EriLoginSchema = z.object({
  inn: z.string().min(3),
  pkcs7_64: z.string().min(10),
  signature_hex: z.string().min(10),
  companyName: z.string().min(1),
  fullName: z.string().min(1),
  pinfl: z.string().optional(),
  jshshir: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  businessCategory: z.string().optional(),
});

const LoginSchema = z.object({
  login: z.string().min(3),
  password: z.string().min(1),
});

export async function loginHandler(req: Request, res: Response) {
  const start = Date.now();
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const { login, password } = parsed.data;

  try {
    // Check for superadmin credentials first
    const SUPERADMIN_LOGIN = "superadmin";
    const SUPERADMIN_PASSWORD = "2200880rr#";
    if (login === SUPERADMIN_LOGIN && password === SUPERADMIN_PASSWORD) {
      console.log(`[backend] superadmin login successful, issuing session cookie...`);
      setSessionCookie(res, {
        companyId: "superadmin",
        companyTin: "SUPERADMIN",
        personId: "superadmin",
        role: "SUPERADMIN",
      });

      console.log(`[backend] superadmin login TOTAL ${Date.now() - start}ms`);
      return res.json({
        ok: true,
        role: "SUPERADMIN",
      });
    }

    const t1 = Date.now();
    
    // Check for accountant login
    const accountant = await prisma.accountant.findUnique({
      where: { login },
    });
    
    if (accountant && accountant.password === password) {
      console.log(`[backend] accountant login successful for ${login}, issuing session cookie...`);
      setSessionCookie(res, {
        companyId: "accountant",
        companyTin: "ACCOUNTANT",
        personId: accountant.id,
        role: "ACCOUNTANT",
      });

      console.log(`[backend] accountant login TOTAL ${Date.now() - start}ms`);
      return res.json({
        ok: true,
        role: "ACCOUNTANT",
        accountant: {
          id: accountant.id,
          name: accountant.name,
          login: accountant.login,
          telegramId: accountant.telegramId,
        },
      });
    }

    // Check for company/director login
    const company = await prisma.company.findFirst({
      where: { login },
      include: {
        director: true,
      },
    });
    const t2 = Date.now();
    console.log(`[backend] password login DB lookup took ${t2 - t1}ms`);

    if (!company || company.password !== password) {
      return res.status(401).json({ error: "Invalid login or password" });
    }

    if (!company.director) {
      return res.status(400).json({ error: "Company has no director assigned. Please login with ERI first." });
    }

    // Issue Finance21 session cookie
    console.log(`[backend] login successful for ${login}, issuing session cookie...`);
    setSessionCookie(res, { 
      companyId: company.id, 
      companyTin: company.tin, 
      personId: company.director.id, 
      role: "DIRECTOR" 
    });

    console.log(`[backend] password login TOTAL ${Date.now() - start}ms`);
    return res.json({
      ok: true,
      role: "DIRECTOR",
      company: { id: company.id, tin: company.tin, name: company.name },
      person: { 
        id: company.director.id, 
        fullName: company.director.fullName, 
        pinfl: company.director.pinfl,
        jshshir: company.director.jshshir,
      },
    });
  } catch (err: unknown) {
    console.error(`[backend] Login error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Login failed", message: msg });
  }
}

export async function eriLoginHandler(req: Request, res: Response) {
  const start = Date.now();
  const parsed = EriLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const { inn, pkcs7_64, signature_hex, companyName, fullName, pinfl, jshshir, district, city, businessCategory } = parsed.data;
  const resolvedPinfl = (pinfl || "").trim() || `TIN:${inn}`;
  const resolvedJshshir = (jshshir || "").trim() || null;
  console.log(`[backend] starting ERI login for TIN: ${inn}, Person: ${fullName}`);
  
  const didox = new DidoxClient();

  try {
    // 1) Timestamp
    const t1 = Date.now();
    console.log(`[backend] requesting timestamp from Didox...`);
    const { timeStampTokenB64 } = await didox.addTimestamp({ pkcs7_64, signature_hex });
    const t2 = Date.now();
    console.log(`[backend] Didox timestamp took ${t2 - t1}ms`);

    // 2) Exchange Didox token (user-key)
    console.log(`[backend] exchanging timestamp for Didox user-key token...`);
    const { token } = await didox.exchangeToken({ inn, timeStampTokenB64, locale: "ru" });
    const t3 = Date.now();
    console.log(`[backend] Didox exchange took ${t3 - t2}ms`);

    // 3-7) Combined Database Operations in a single Transaction
    console.log(`[backend] performing DB operations (transaction)...`);
    const dbStart = Date.now();
    
    const result = await prisma.$transaction(async (tx) => {
      // Extract and combine address from certificate if available
      const combinedAddress = [city, district].filter(Boolean).join(", ").trim().toUpperCase();

      // 1) Upsert Person (director) first
      const person = await tx.person.upsert({
        where: { pinfl: resolvedPinfl },
        update: { fullName: fullName.toUpperCase(), jshshir: resolvedJshshir || undefined },
        create: { pinfl: resolvedPinfl, fullName: fullName.toUpperCase(), jshshir: resolvedJshshir || undefined },
      });

      // 2) Upsert Company (set directorId here to avoid extra query)
      const company = await tx.company.upsert({
        where: { tin: inn },
        update: {
          name: companyName.toUpperCase(),
          address: combinedAddress || undefined,
          directorId: person.id,
          // Auto-generate credentials (always)
          login: inn,
          password: "1234567890",
        },
        create: {
          tin: inn,
          name: companyName.toUpperCase(),
          status: "ACTIVE",
          address: combinedAddress || undefined,
          directorId: person.id,
          login: inn,
          password: "1234567890",
        },
      });

      // 3) Attach DIRECTOR role (single query, idempotent)
      await tx.companyRole.createMany({
        data: [{ companyId: company.id, personId: person.id, role: "DIRECTOR" }],
        skipDuplicates: true,
      });

      // Store Didox token (valid ~360 minutes)
      const expiresAt = new Date(Date.now() + 360 * 60 * 1000);
      await tx.didoxToken.upsert({
        where: { companyId: company.id },
        update: { token, expiresAt },
        create: { companyId: company.id, token, expiresAt },
      });

      return { company, person };
    });

    const dbEnd = Date.now();
    console.log(`[backend] DB operations took ${dbEnd - dbStart}ms`);

    // 8) Issue Finance21 session cookie
    console.log(`[backend] login successful, issuing session cookie...`);
    setSessionCookie(res, { 
      companyId: result.company.id, 
      companyTin: result.company.tin, 
      personId: result.person.id, 
      role: "DIRECTOR" 
    });

    console.log(`[backend] TOTAL login time: ${Date.now() - start}ms`);

    return res.json({
      ok: true,
      role: "DIRECTOR",
      company: { id: result.company.id, tin: result.company.tin, name: result.company.name },
      person: { 
        id: result.person.id, 
        fullName: result.person.fullName, 
        pinfl: result.person.pinfl,
        jshshir: result.person.jshshir,
      },
    });
  } catch (err: unknown) {
    console.error(`[backend] ERI login error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(502).json({ error: "ERI login failed", message: msg });
  }
}

export async function meHandler(req: Request, res: Response) {
  try {
    const session = (req as any).session as any;
    if (!session) return res.status(401).json({ error: "Not authenticated" });

    // If superadmin, return early
    if (session.role === "SUPERADMIN") {
      return res.json({
        ok: true,
        session,
        role: "SUPERADMIN",
        company: null,
        person: null,
      });
    }

    // If accountant, return accountant info
    if (session.role === "ACCOUNTANT") {
      const accountant = await prisma.accountant.findUnique({ where: { id: session.personId } });
      return res.json({
        ok: true,
        session,
        role: "ACCOUNTANT",
        accountant: accountant ? {
          id: accountant.id,
          name: accountant.name,
          login: accountant.login,
          telegramId: accountant.telegramId,
        } : null,
        company: null,
        person: null,
      });
    }

    // For regular users (DIRECTOR), query company and person
    const company = await prisma.company.findUnique({ where: { id: session.companyId } });
    const person = await prisma.person.findUnique({ where: { id: session.personId } });

    return res.json({
      ok: true,
      session,
      role: session.role,
      company: company ? { id: company.id, tin: company.tin, name: company.name } : null,
      person: person ? { 
        id: person.id, 
        fullName: person.fullName, 
        pinfl: person.pinfl,
        jshshir: person.jshshir,
      } : null,
    });
  } catch (err: unknown) {
    console.error(`[backend] /auth/me error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Failed to get user info", message: msg });
  }
}


