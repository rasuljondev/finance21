"use client";

export interface EIMZOCertificate {
  disk: string;
  path: string;
  name: string;
  alias: string;
}

export interface EIMZOCertificateListResponse {
  certificates: EIMZOCertificate[];
  success: boolean;
  error?: string;
}

export interface EIMZOLoadKeyResponse {
  keyId?: string;
  type?: string;
  success: boolean;
  error?: string;
}

export interface EIMZOCreateSignatureResponse {
  pkcs7_64?: string;
  signer_serial_number?: string;
  signature_hex?: string;
  success: boolean;
  error?: string;
}

export interface EIMZOWSMessage {
  plugin: string;
  name: string;
  arguments?: unknown[];
}

class EIMZOClient {
  private ws: WebSocket | null = null;
  private messageQueue: Array<{
    message: EIMZOWSMessage;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = [];
  private messageId = 0;

  private async connect(): Promise<WebSocket> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.ws;
    }

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket("wss://127.0.0.1:64443/service/cryptapi");

        ws.onopen = () => {
          this.ws = ws;
          this.processQueue();
          resolve(ws);
        };

        ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            // Handle response (simplified - in real implementation, match with request ID)
            if (this.messageQueue.length > 0) {
              const { resolve } = this.messageQueue.shift()!;
              resolve(response);
            }
          } catch (error) {
            console.error("Error parsing E-IMZO response:", error);
            if (this.messageQueue.length > 0) {
              const { reject } = this.messageQueue.shift()!;
              reject(new Error("Failed to parse response"));
            }
          }
        };

        ws.onerror = (error) => {
          reject(new Error("E-IMZO connection failed. Please ensure E-IMZO is running."));
        };

        ws.onclose = () => {
          this.ws = null;
        };
      } catch (error) {
        reject(new Error("Failed to connect to E-IMZO"));
      }
    });
  }

  private async processQueue() {
    // Process queued messages when connection is established
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const { message, resolve, reject } = this.messageQueue.shift()!;
      try {
        const response = await this.sendMessage(message);
        resolve(response);
      } catch (error) {
        reject(error as Error);
      }
    }
  }

  private async sendMessage(message: EIMZOWSMessage): Promise<unknown> {
    const ws = await this.connect();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("E-IMZO request timeout"));
      }, 30000);

      const handler = (event: MessageEvent) => {
        clearTimeout(timeout);
        ws.removeEventListener("message", handler);
        try {
          const response = JSON.parse(event.data);
          resolve(response);
        } catch (error) {
          reject(new Error("Failed to parse response"));
        }
      };

      ws.addEventListener("message", handler);
      ws.send(JSON.stringify(message));
    });
  }

  /**
   * Get list of available certificates
   */
  async getCertificates(): Promise<EIMZOCertificateListResponse> {
    const message: EIMZOWSMessage = {
      plugin: "pfx",
      name: "list_all_certificates",
    };

    const response = await this.sendMessage(message);
    return response as EIMZOCertificateListResponse;
  }

  /**
   * Load key and get keyId
   */
  async loadKey(certificate: EIMZOCertificate): Promise<EIMZOLoadKeyResponse> {
    const message: EIMZOWSMessage = {
      plugin: "pfx",
      name: "load_key",
      arguments: [certificate.disk, certificate.path, certificate.name, certificate.alias],
    };

    const response = await this.sendMessage(message);
    return response as EIMZOLoadKeyResponse;
  }

  /**
   * Create PKCS7 signature
   * @param data Base64 encoded data to sign (usually INN)
   * @param keyId Key ID from loadKey
   */
  async createSignature(
    data: string,
    keyId: string
  ): Promise<EIMZOCreateSignatureResponse> {
    const message: EIMZOWSMessage = {
      plugin: "pkcs7",
      name: "create_pkcs7",
      arguments: [data, keyId, "no"],
    };

    const response = await this.sendMessage(message);
    return response as EIMZOCreateSignatureResponse;
  }

  /**
   * Close connection
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

/**
 * Helper function to parse certificate alias string
 */
export function parseCertificateData(aliasString: string): {
  inn: string;
  companyName: string;
  fullName: string;
  validTo: string;
  position: string;
  pinfl: string;
  jshshir: string;
  district: string;
  city: string;
  country: string;
  businessCategory: string;
  serialNumber: string;
  validFrom: string;
  name: string;
  surname: string;
} {
  const parts = aliasString.split(",");
  const data: Record<string, string> = {};

  parts.forEach((part) => {
    const [key, ...valueParts] = part.split("=");
    if (!key) return;
    const value = valueParts.join("=").trim();
    data[key.trim().toLowerCase()] = value;
  });

  // Extract INN from 1.2.860.3.16.1.1 (TIN)
  const inn = data["1.2.860.3.16.1.1"] || data["tin"] || "";

  // O = Organization
  const companyName = data["o"] || "";

  // CN = Common Name (Full Name)
  const fullName = data["cn"] || "";

  // Name and Surname
  const name = data["name"] || "";
  const surname = data["surname"] || "";

  // validto = Expiry date
  const validTo = data["validto"] || "";
  const validFrom = data["validfrom"] || "";

  // T = Title/Position
  const position = data["t"] || "";

  // PINFL is often in 1.2.860.3.16.1.12 or UID
  const pinfl = data["1.2.860.3.16.1.12"] || data["uid"] || data["pinfl"] || "";

  // JSHSHIR from 1.2.860.3.16.1.2
  const jshshir = data["1.2.860.3.16.1.2"] || "";

  // Location fields
  const district = data["l"] || "";
  const city = data["st"] || "";
  const country = data["c"] || "";

  // Business category (company type)
  const businessCategory = data["businesscategory"] || "";

  // Serial number
  const serialNumber = data["serialnumber"] || "";

  return {
    inn,
    companyName,
    fullName,
    validTo,
    position,
    pinfl,
    jshshir,
    district,
    city,
    country,
    businessCategory,
    serialNumber,
    validFrom,
    name,
    surname,
  };
}

// Singleton instance
let eimzoClientInstance: EIMZOClient | null = null;

export function getEIMZOClient(): EIMZOClient {
  if (!eimzoClientInstance) {
    eimzoClientInstance = new EIMZOClient();
  }
  return eimzoClientInstance;
}

