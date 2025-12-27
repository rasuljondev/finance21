import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { signingQueue } from "../queues/signing.js";
import { DidoxClient } from "../didox/didoxClient.js";

const didox = new DidoxClient();

/**
 * POST /accountant/company-login
 * Logs an accountant into a specific company to get a temporary user-key.
 */
export async function accountantCompanyLoginHandler(req: Request, res: Response) {
  const schema = z.object({
    companyTin: z.string(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid TIN" });

  const session = (req as any).session;
  
  try {
    // 1. Get accountant's Didox token
    const tokenRecord = await prisma.didoxToken.findUnique({
      where: { accountantId: session.personId },
    });

    if (!tokenRecord) {
      return res.status(401).json({ error: "Accountant not logged into Didox. Please login with ERI." });
    }

    // 2. Exchange for company token
    const { token } = await didox.loginCompanyAsAccountant({
      companyTin: parsed.data.companyTin,
      accountantToken: tokenRecord.token,
    });

    return res.json({ ok: true, token });
  } catch (err: any) {
    console.error(`[backend] companyLogin error:`, err);
    return res.status(500).json({ error: "Failed to login to company", message: err.message });
  }
}

/**
 * GET /documents/:id/sign-data
 * Returns the data that needs to be signed via E-IMZO.
 * For outgoing: document JSON (base64)
 * For incoming: toSign string (from Didox)
 */
export async function getDocumentSignDataHandler(req: Request, res: Response) {
  const { id } = req.params;
  const session = (req as any).session;

  try {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!doc) return res.status(404).json({ error: "Document not found" });

    // In a real scenario, we'd fetch the latest data from Didox to ensure we have the 'toSign' string
    // for incoming documents.
    const companyTokenRes = await prisma.didoxToken.findUnique({
      where: { companyId: doc.companyId },
    });

    if (!companyTokenRes || companyTokenRes.expiresAt < new Date()) {
      return res.status(401).json({ error: "Didox token expired for this company. Please login with ERI again." });
    }

    const details = await didox.getDocumentDetails({
      documentId: doc.didoxDocumentId,
      userKey: companyTokenRes.token,
      owner: doc.direction === "OUTGOING" ? "1" : "0",
    });

    if (doc.direction === "OUTGOING") {
      // For outgoing, we sign the JSON
      const jsonStr = JSON.stringify(details.data?.json);
      const signData = Buffer.from(jsonStr).toString("base64");
      return res.json({ ok: true, signData, type: "create_pkcs7" });
    } else {
      // For incoming, we sign the 'toSign' attached pkcs7
      const signData = details.data?.toSign;
      if (!signData) {
        return res.status(400).json({ error: "Document does not have 'toSign' data from Didox" });
      }
      return res.json({ ok: true, signData, type: "append_pkcs7_attached" });
    }
  } catch (err: any) {
    console.error(`[backend] getSignData error:`, err);
    return res.status(500).json({ error: "Failed to fetch sign data", message: err.message });
  }
}

/**
 * POST /batch-sign/submit
 * Submits a signature to the background queue.
 */
export async function submitBatchSignatureHandler(req: Request, res: Response) {
  const schema = z.object({
    documentId: z.string(),
    signature: z.string(),
    companyId: z.string(),
    companyToken: z.string(), // Provided by browser after accountant login to company
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const session = (req as any).session;

  try {
    const doc = await prisma.document.findUnique({ where: { id: parsed.data.documentId } });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    await signingQueue.add(`sign-${doc.id}`, {
      documentId: doc.id,
      didoxDocumentId: doc.didoxDocumentId,
      signature: parsed.data.signature,
      companyId: parsed.data.companyId,
      companyToken: parsed.data.companyToken,
      accountantId: session.personId,
      direction: doc.direction,
    });

    return res.json({ ok: true });
  } catch (err: any) {
    console.error(`[backend] submitBatchSignature error:`, err);
    return res.status(500).json({ error: "Failed to queue signature", message: err.message });
  }
}

/**
 * GET /accountant/signable-docs
 * Returns a list of all documents that can be signed across all managed companies.
 */
export async function getSignableDocsHandler(req: Request, res: Response) {
  const session = (req as any).session;

  try {
    const roles = await prisma.companyRole.findMany({
      where: { accountantId: session.personId, role: "ACCOUNTANT" },
      include: {
        company: {
          include: {
            documents: {
              where: {
                status: "PENDING", // Only docs needing signature
              },
            },
          },
        },
      },
    });

    const result = roles.map((r) => ({
      companyId: r.company.id,
      companyName: r.company.name,
      tin: r.company.tin,
      documents: r.company.documents.map((d) => ({
        id: d.id,
        number: d.documentNumber,
        date: d.documentDate,
        amount: d.amount,
        direction: d.direction,
      })),
    }));

    return res.json({ ok: true, companies: result });
  } catch (err: any) {
    console.error(`[backend] getSignableDocs error:`, err);
    return res.status(500).json({ error: "Failed to fetch signable documents" });
  }
}

