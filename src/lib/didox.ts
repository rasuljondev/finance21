import axios, { AxiosInstance } from "axios";
import type {
  DIDOXLoginRequest,
  DIDOXLoginResponse,
  DIDOXTimestampRequest,
  DIDOXTimestampResponse,
} from "@/types/didox";

class DIDOXClient {
  private client: AxiosInstance;

  constructor() {
    const apiUrl = typeof window !== "undefined" ? "/api/didox" : (process.env.NEXT_PUBLIC_DIDOX_API_URL || process.env.DIDOX_BASE_URL || "https://api-partners.didox.uz");
    // Note: Partner token should be stored server-side or in environment variable
    // For client-side, we'll need to handle this differently
    const partnerToken = typeof window !== "undefined" 
      ? process.env.NEXT_PUBLIC_DIDOX_PARTNER_TOKEN || process.env.DIDOX_PARTNER_TOKEN || ""
      : process.env.DIDOX_PARTNER_TOKEN || process.env.NEXT_PUBLIC_DIDOX_PARTNER_TOKEN || "";

    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include partner token
    this.client.interceptors.request.use((config) => {
      if (partnerToken && config.headers) {
        config.headers["Partner-Authorization"] = partnerToken;
      }
      return config;
    });
  }

  /**
   * Add timestamp to signature via DIDOX API
   */
  async addTimestamp(
    pkcs7: string,
    signatureHex: string
  ): Promise<DIDOXTimestampResponse> {
    try {
      const payload: DIDOXTimestampRequest = {
        pkcs7,
        signatureHex,
      };

      const response = await this.client.post<DIDOXTimestampResponse>(
        "/v1/dsvs/timestamp",
        payload
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error(`DIDOX timestamp error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Login with ERI signature
   */
  async loginWithSignature(
    taxId: string,
    signature: string,
    locale: string = "ru"
  ): Promise<DIDOXLoginResponse> {
    try {
      const payload: DIDOXLoginRequest = {
        signature,
      };

      const response = await this.client.post<DIDOXLoginResponse>(
        `/v1/auth/${taxId}/token/${locale}`,
        payload
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
        const status = error.response?.status;
        if (status === 401) {
          throw new Error("Signature is invalid or expired. Please try again.");
        } else if (status === 404) {
          throw new Error(`Tax ID ${taxId} not found in system.`);
        }
        throw new Error(`DIDOX login error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Login with password
   */
  async loginWithPassword(
    taxId: string,
    password: string,
    locale: string = "ru"
  ): Promise<DIDOXLoginResponse> {
    const payload: DIDOXLoginRequest = {
      password,
    };

    const response = await this.client.post<DIDOXLoginResponse>(
      `/v1/auth/${taxId}/password/${locale}`,
      payload
    );
    return response.data;
  }

  /**
   * Get API client instance (for custom requests)
   */
  getClient(): AxiosInstance {
    return this.client;
  }
}

export const didoxClient = new DIDOXClient();

