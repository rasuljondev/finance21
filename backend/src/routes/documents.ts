import type { Request, Response } from "express";
import { z } from "zod";
import { DidoxClient } from "../didox/didoxClient.js";
import { prisma } from "../prisma.js";
import { getSession } from "../auth/session.js";

const QuerySchema = z.object({
  direction: z.enum(["INCOMING", "OUTGOING"]),
  search: z.string().optional(),
});

const SyncBodySchema = z.object({
  direction: z.enum(["INCOMING", "OUTGOING"]).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

function mapDidoxStatusToDocumentStatus(raw: unknown): "DRAFT" | "PENDING" | "SIGNED" | "REJECTED" | "CANCELLED" {
  let s: unknown = raw;
  if (typeof s === "string" && s.trim() !== "" && !Number.isNaN(Number(s))) s = Number(s);
  if (typeof s === "number") {
    if ([0, 55].includes(s)) return "DRAFT";
    if ([3, 8, 110, 140, 160].includes(s)) return "SIGNED";
    if ([4, 130].includes(s)) return "REJECTED";
    if ([5, 120, 190].includes(s)) return "CANCELLED";
    return "PENDING";
  }
  const txt = String(s || "").toLowerCase();
  if (txt.includes("signed") || txt.includes("подпис")) return "SIGNED";
  if (txt.includes("rejected") || txt.includes("отказ")) return "REJECTED";
  if (txt.includes("cancel") || txt.includes("удален")) return "CANCELLED";
  if (txt.includes("draft") || txt.includes("чернов")) return "DRAFT";
  return "PENDING";
}

export async function listDocumentsHandler(req: Request, res: Response) {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
  }

  try {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });

    const where: any = { companyId: session.companyId, direction: parsed.data.direction };
    if (parsed.data.search?.trim()) {
      const q = parsed.data.search.trim();
      where.OR = [
        { documentNumber: { contains: q, mode: "insensitive" } },
        { counterpartyName: { contains: q, mode: "insensitive" } },
        { counterpartyStir: { contains: q } },
        { contractNumber: { contains: q, mode: "insensitive" } },
      ];
    }

    const docs = await prisma.document.findMany({
      where,
      orderBy: [{ documentDate: "desc" }, { updatedAt: "desc" }],
      take: 500,
    });

    return res.json({
      documents: docs.map((d: any) => {
        const raw: any = d.didoxData || {};
        return {
          id: d.didoxDocumentId,
          type: d.direction,
          date: d.documentDate ? d.documentDate.toISOString().split("T")[0] : null,
          number: d.documentNumber,
          amount: d.amount ? Number(d.amount) : 0,
          status: d.status, // SIGNED/PENDING/...
          counterpartyName: d.counterpartyName,
          counterpartyStir: d.counterpartyStir,
          contractDate: d.contractDate ? d.contractDate.toISOString().split("T")[0] : null,
          contractNumber: d.contractNumber,
          updatedAt: d.updatedAt.toISOString(),
          vatAmount: Number(raw?.vat_sum || raw?.vatSum || 0),
          deliveryValue: Number(raw?.delivery_sum || raw?.deliverySum || raw?.deliveryValue || 0),
          didoxData: raw,
        };
      }),
      total: docs.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Failed to list documents", message: msg });
  }
}

function sanitizeAmount(raw: any): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? null : n.toFixed(2);
}

export async function syncDocumentsHandler(req: Request, res: Response) {
  const bodyParsed = SyncBodySchema.safeParse(req.body || {});
  if (!bodyParsed.success) {
    return res.status(400).json({ error: "Invalid body", details: bodyParsed.error.flatten() });
  }

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  try {
    const tokenRow = await prisma.didoxToken.findUnique({ where: { companyId: session.companyId } });
    if (!tokenRow || tokenRow.expiresAt.getTime() <= Date.now()) {
      return res.status(401).json({ error: "Didox token missing/expired. Please login with ERI again." });
    }

    console.log(`[backend] starting sync for company ${session.companyTin} (${session.companyId})`);
    const didox = new DidoxClient();
    const limit = bodyParsed.data.limit ?? 50;
    const page = bodyParsed.data.page ?? 1;
    const directions = bodyParsed.data.direction ? [bodyParsed.data.direction] : (["INCOMING", "OUTGOING"] as const);

    const synced = { incoming: 0, outgoing: 0 };

    for (const dir of directions) {
      console.log(`[backend] fetching ${dir} documents from Didox...`);
      const didoxRes = await didox.listDocuments({
        userKey: tokenRow.token,
        direction: dir,
        page,
        limit,
      });

      // Normalize v2 response -> array
      let payload: any = didoxRes as any;
      if (payload && payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
        payload = payload.data;
      }
      const candidates = [payload?.data, payload?.documents, payload?.items, (didoxRes as any)?.data, (didoxRes as any)?.documents];
      const items: any[] = (candidates.find((v) => Array.isArray(v)) as any[]) || (Array.isArray(payload) ? payload : Array.isArray(didoxRes) ? (didoxRes as any[]) : []);

      console.log(`[backend] found ${items.length} ${dir} documents, saving to DB...`);

      for (const doc of items) {
        try {
          const didoxId = String(doc?.doc_id || doc?.id || doc?.uuid || "");
          if (!didoxId) continue;

          const status = mapDidoxStatusToDocumentStatus(doc?.doc_status ?? doc?.status);
          const documentNumber = doc?.name || doc?.number || doc?.doc_number || null;
          const documentDate = doc?.doc_date || doc?.docDate || doc?.createdDate || doc?.date;
          const amount = doc?.total_sum || doc?.totalSum || doc?.sum || doc?.amount || null;
          const counterpartyName = doc?.partnerCompany || doc?.partner_name || doc?.partner?.name || doc?.counterparty?.name || null;
          const counterpartyStir = doc?.partnerTin || doc?.partner_tin || doc?.partner?.tin || doc?.counterparty?.tin || null;
          const contractNumber = doc?.contract_number || doc?.contract?.number || null;
          const contractDate = doc?.contract_date || doc?.contract?.date || null;

          await prisma.document.upsert({
            where: { companyId_didoxDocumentId: { companyId: session.companyId, didoxDocumentId: didoxId } },
            update: {
              direction: dir,
              status,
              documentNumber: documentNumber ? String(documentNumber) : null,
              documentDate: documentDate ? new Date(documentDate) : null,
              amount: sanitizeAmount(amount),
              counterpartyName,
              counterpartyStir,
              contractNumber: contractNumber ? String(contractNumber) : null,
              contractDate: contractDate ? new Date(contractDate) : null,
              didoxData: doc,
              lastSyncedAt: new Date(),
            },
            create: {
              companyId: session.companyId,
              didoxDocumentId: didoxId,
              direction: dir,
              status,
              documentNumber: documentNumber ? String(documentNumber) : null,
              documentDate: documentDate ? new Date(documentDate) : null,
              amount: sanitizeAmount(amount),
              currency: String(doc?.currency || "UZS"),
              counterpartyName,
              counterpartyStir,
              contractNumber: contractNumber ? String(contractNumber) : null,
              contractDate: contractDate ? new Date(contractDate) : null,
              didoxData: doc,
              lastSyncedAt: new Date(),
            },
          });

          if (dir === "INCOMING") synced.incoming++;
          if (dir === "OUTGOING") synced.outgoing++;
        } catch (itemErr) {
          console.error(`[backend] failed to sync document ${doc?.doc_id}:`, itemErr);
          // continue to next document
        }
      }
    }

    console.log(`[backend] sync complete. incoming: ${synced.incoming}, outgoing: ${synced.outgoing}`);
    return res.json({ ok: true, synced });
  } catch (err: unknown) {
    console.error(`[backend] sync error:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Failed to sync documents", message: msg });
  }
}


