import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { loadRootEnv } from "./config/env.js";
import { requireEnv } from "./config/requireEnv.js";
import { healthHandler } from "./routes/health.js";
import { listDocumentsHandler, syncDocumentsHandler } from "./routes/documents.js";
import { eriLoginHandler, meHandler, loginHandler } from "./routes/auth.js";
import { getCompanyHandler, updateCompanyHandler, generateCredentialsHandler } from "./routes/company.js";
import { getCompaniesHandler } from "./routes/superadmin.js";
import {
  createAccountantHandler,
  listAccountantsHandler,
  updateAccountantHandler,
  deleteAccountantHandler,
  assignAccountantToCompanyHandler,
  removeAccountantFromCompanyHandler,
  getAccountantCompaniesHandler,
} from "./routes/accountant.js";
import {
  getDocumentSignDataHandler,
  submitBatchSignatureHandler,
  getSignableDocsHandler,
} from "./routes/batchSign.js";
import { clearSessionCookie, requireSession, requireSuperadmin } from "./auth/session.js";
import "./workers/signing.js"; // Initialize worker

loadRootEnv();

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.get("/health", healthHandler);

app.post("/auth/login", loginHandler);
app.post("/auth/eri/login", eriLoginHandler);
app.get("/auth/me", requireSession, meHandler);
app.post("/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// Mirrors the old architecture: UI -> our backend -> Didox.
// GET /documents?direction=INCOMING|OUTGOING
app.get("/documents", requireSession, listDocumentsHandler);
app.post("/documents/sync", requireSession, syncDocumentsHandler);

// Company management
app.get("/company", requireSession, getCompanyHandler);
app.put("/company", requireSession, updateCompanyHandler);
app.post("/company/generate-credentials", requireSession, generateCredentialsHandler);

// Superadmin routes
app.get("/superadmin/companies", requireSession, requireSuperadmin, getCompaniesHandler);

// Accountant management
app.post("/accountants", requireSession, requireSuperadmin, createAccountantHandler); // Only SA can create
app.get("/accountants", requireSession, listAccountantsHandler); // Everyone can list to pick
app.put("/accountants/:id", requireSession, requireSuperadmin, updateAccountantHandler); // Only SA can edit
app.delete("/accountants/:id", requireSession, requireSuperadmin, deleteAccountantHandler); // Only SA can delete
app.post("/accountants/assign", requireSession, assignAccountantToCompanyHandler); // Director can assign to OWN company
app.delete("/accountants/:accountantId/companies/:companyId", requireSession, removeAccountantFromCompanyHandler); // Director can remove from OWN company

// Accountant routes
app.get("/accountant/companies", requireSession, getAccountantCompaniesHandler);
app.get("/accountant/signable-docs", requireSession, getSignableDocsHandler);
app.get("/documents/:id/sign-data", requireSession, getDocumentSignDataHandler);
app.post("/batch-sign/submit", requireSession, submitBatchSignatureHandler);

const port = Number(process.env.BACKEND_PORT || "3001");
app.listen(port, () => {
  // Ensure env is present early (fail fast)
  requireEnv("DIDOX_PARTNER_TOKEN");
  console.log(`[backend] listening on http://localhost:${port}`);
});


