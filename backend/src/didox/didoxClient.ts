import { z } from "zod";

const DidoxConfigSchema = z.object({
  DIDOX_TIMESTAMP_BASE_URL: z.string().optional(),
  DIDOX_API_BASE_URL: z.string().optional(),
  DIDOX_BASE_URL: z.string().optional(),
  DIDOX_TIMEOUT: z.string().optional(),
  DIDOX_PARTNER_TOKEN: z.string().optional(),
});

export type DidoxDirection = "INCOMING" | "OUTGOING";

export class DidoxClient {
  private readonly baseUrl: string;
  private readonly timestampBaseUrl: string;
  private readonly partnerToken: string;
  private readonly timeoutMs: number;

  constructor() {
    const cfg = DidoxConfigSchema.parse(process.env);
    this.baseUrl = (cfg.DIDOX_API_BASE_URL || cfg.DIDOX_BASE_URL || "https://api-partners.didox.uz").replace(/\/+$/, "");
    this.timestampBaseUrl = (cfg.DIDOX_TIMESTAMP_BASE_URL || cfg.DIDOX_BASE_URL || "https://api-partners.didox.uz").replace(/\/+$/, "");
    this.partnerToken = (cfg.DIDOX_PARTNER_TOKEN || "").trim();
    this.timeoutMs = Number(cfg.DIDOX_TIMEOUT || "30000");
  }

  private buildHeaders(userKey: string) {
    if (!this.partnerToken) {
      throw new Error("Missing DIDOX_PARTNER_TOKEN (set it in root .env)");
    }

    return {
      "user-key": userKey,
      "Partner-Authorization": this.partnerToken,
      "Accept-Language": "ru",
      "Content-Type": "application/json",
    } as const;
  }

  async listDocuments(params: {
    userKey: string;
    direction: DidoxDirection;
    page?: number;
    limit?: number;
  }): Promise<unknown> {
    const owner = params.direction === "OUTGOING" ? "1" : "0";
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));

    const url = new URL(`${this.baseUrl}/v2/documents`);
    url.searchParams.set("owner", owner);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url, {
      method: "GET",
      headers: this.buildHeaders(params.userKey),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Didox error ${res.status}: ${text || res.statusText}`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async addTimestamp(params: { pkcs7_64: string; signature_hex: string }): Promise<{ timeStampTokenB64: string }> {
    const url = `${this.timestampBaseUrl}/v1/dsvs/timestamp`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pkcs7: params.pkcs7_64, signatureHex: params.signature_hex }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`Didox timestamp error ${res.status}: ${text || res.statusText}`);
    const data = JSON.parse(text) as any;
    const token = data?.timeStampTokenB64;
    if (!token) throw new Error("Didox timestamp response missing timeStampTokenB64");
    return { timeStampTokenB64: token };
  }

  async exchangeToken(params: { inn: string; timeStampTokenB64: string; locale?: string }): Promise<{ token: string }> {
    const locale = params.locale || "ru";
    const url = `${this.baseUrl}/v1/auth/${encodeURIComponent(params.inn)}/token/${locale}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature: params.timeStampTokenB64 }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`Didox auth error ${res.status}: ${text || res.statusText}`);
    const data = JSON.parse(text) as any;
    const token = data?.token;
    if (!token) throw new Error("Didox auth response missing token");
    return { token };
  }
}


