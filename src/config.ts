import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// Read version from package.json
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  await fs.readFile(path.join(__dirname, "..", "package.json"), "utf-8"),
);

export const VERSION: string = packageJson.version;

// Configuration from environment variables
export const BASE_URL =
  process.env.OAP_STORAGE_BASE_URL || "https://storage.oaphub.ai";
export const AUTH_TOKEN = process.env.OAP_CLIENT_KEY;

if (!AUTH_TOKEN) {
  console.error(
    "Error: OAP_CLIENT_KEY environment variable is required.\n" +
      "Please set it to your OAP client key.\n",
  );
  process.exit(1);
}

export const MIN_EXPIRE_AFTER = 60;
