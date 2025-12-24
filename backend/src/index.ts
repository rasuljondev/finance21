import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { loadRootEnv } from "./config/env.js";
import { requireEnv } from "./config/requireEnv.js";
import { healthHandler } from "./routes/health.js";
import { listDocumentsHandler, syncDocumentsHandler } from "./routes/documents.js";
import { eriLoginHandler, meHandler } from "./routes/auth.js";
import { getCompanyHandler, updateCompanyHandler, generateCredentialsHandler } from "./routes/company.js";
import { clearSessionCookie, requireSession } from "./auth/session.js";

loadRootEnv();

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.get("/health", healthHandler);

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

const port = Number(process.env.BACKEND_PORT || "3001");
app.listen(port, () => {
  // Ensure env is present early (fail fast)
  requireEnv("DIDOX_PARTNER_TOKEN");
  console.log(`[backend] listening on http://localhost:${port}`);
});


