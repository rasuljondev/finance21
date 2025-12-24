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
});

export async function eriLoginHandler(req: Request, res: Response) {
  const parsed = EriLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const { inn, pkcs7_64, signature_hex, companyName, fullName, pinfl } = parsed.data;
  const resolvedPinfl = (pinfl || "").trim() || `TIN:${inn}`;
  console.log(`[backend] starting ERI login for TIN: ${inn}, Person: ${fullName}`);
  
  const didox = new DidoxClient();

  try {
    // 1) Timestamp
    console.log(`[backend] requesting timestamp from Didox...`);
    const { timeStampTokenB64 } = await didox.addTimestamp({ pkcs7_64, signature_hex });

    // 2) Exchange Didox token (user-key)
    console.log(`[backend] exchanging timestamp for Didox user-key token...`);
    const { token } = await didox.exchangeToken({ inn, timeStampTokenB64, locale: "ru" });

    // 3) Upsert Company
    console.log(`[backend] upserting company ${inn} into DB...`);
    const company = await prisma.company.upsert({
      where: { tin: inn },
      update: { name: companyName },
      create: {
        tin: inn,
        name: companyName,
        status: "ACTIVE",
      },
    });

    // 4) Upsert Person (director)
    console.log(`[backend] upserting person ${resolvedPinfl} into DB...`);
    const person = await prisma.person.upsert({
      where: { pinfl: resolvedPinfl },
      update: { fullName },
      create: { pinfl: resolvedPinfl, fullName },
    });

    // 5) Attach DIRECTOR role
    console.log(`[backend] linking director role...`);
    await prisma.companyRole.upsert({
      where: { companyId_personId_role: { companyId: company.id, personId: person.id, role: "DIRECTOR" } },
      update: {},
      create: { companyId: company.id, personId: person.id, role: "DIRECTOR" },
    });

    // 6) Set directorId on company
    await prisma.company.update({
      where: { id: company.id },
      data: { directorId: person.id },
    });

    // 7) Store Didox token (valid ~360 minutes)
    const expiresAt = new Date(Date.now() + 360 * 60 * 1000);
    await prisma.didoxToken.upsert({
      where: { companyId: company.id },
      update: { token, expiresAt },
      create: { companyId: company.id, token, expiresAt },
    });

    // 8) Issue Finance21 session cookie
    console.log(`[backend] login successful, issuing session cookie...`);
    setSessionCookie(res, { companyId: company.id, companyTin: company.tin, personId: person.id, role: "DIRECTOR" });

    return res.json({
      ok: true,
      company: { id: company.id, tin: company.tin, name: company.name },
      person: { id: person.id, fullName: person.fullName, pinfl: person.pinfl },
    });
  } catch (err: unknown) {
    console.error(`[backend] ERI login error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(502).json({ error: "ERI login failed", message: msg });
  }
}

export async function meHandler(req: Request, res: Response) {
  const session = (req as any).session as any;
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  const person = await prisma.person.findUnique({ where: { id: session.personId } });

  return res.json({
    ok: true,
    session,
    company: company ? { id: company.id, tin: company.tin, name: company.name } : null,
    person: person ? { id: person.id, fullName: person.fullName, pinfl: person.pinfl } : null,
  });
}


