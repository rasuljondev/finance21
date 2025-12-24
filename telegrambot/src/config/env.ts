import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

export function loadRootEnv() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rootEnvPath = path.resolve(__dirname, "../../../.env");
  dotenv.config({ path: rootEnvPath });
}


