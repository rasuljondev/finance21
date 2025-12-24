import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

/**
 * Loads environment variables from the repo root `.env`.
 * This allows backend/ and telegrambot/ to share D:\Projects\finance21\.env
 */
export function loadRootEnv() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rootEnvPath = path.resolve(__dirname, "../../../.env");
  dotenv.config({ path: rootEnvPath });
}


