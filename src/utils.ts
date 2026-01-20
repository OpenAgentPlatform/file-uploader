import * as fs from "node:fs/promises";
import * as path from "node:path";
import axios from "axios";
import FormData from "form-data";
import mime from "mime-types";
import { z } from "zod";
import { AUTH_TOKEN, BASE_URL } from "./config.js";

/**
 * Reads a file from the filesystem with cross-platform support.
 */
export async function readFile(
  filePath: string,
): Promise<{ buffer: Buffer; filename: string }> {
  const normalizedPath = path.resolve(filePath);
  const buffer = await fs.readFile(normalizedPath);
  const filename = path.basename(normalizedPath);
  return { buffer, filename };
}

/**
 * Detects the MIME type of a file based on its extension.
 * Falls back to application/octet-stream for unknown types.
 */
export function detectMimeType(filename: string): string {
  const mimeType = mime.lookup(filename);
  if (!mimeType) {
    console.error(
      `Warning: Could not detect MIME type for "${filename}". Using application/octet-stream.`,
    );
    return "application/octet-stream";
  }
  return mimeType;
}

const uploadResponseSchema = z.object({
  result: z.boolean(),
  url: z.string().optional().nullable(),
  error: z.string().optional().nullable(),
});

export type UploadFileResponse = z.infer<typeof uploadResponseSchema>;

/**
 * Uploads a file to the storage API.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  expireAfter: number,
): Promise<string> {
  const form = new FormData();
  form.append("file", buffer, { filename, contentType: mimeType });
  form.append("expire_after", expireAfter.toString());

  const response = await axios.post(`${BASE_URL}/upload_volatile`, form, {
    headers: {
      ...form.getHeaders(),
      ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
    },
  });

  const parsed = uploadResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new Error(
      `Invalid response from server: ${parsed.error.message}, body: ${JSON.stringify(response.data)}`,
    );
  }

  if (!parsed.data.result) {
    throw new Error(
      `Upload failed: ${parsed.data.error || "Unknown error"}\nResponse: ${JSON.stringify(response.data)}`,
    );
  }

  if (!parsed.data.url) {
    throw new Error(
      `Upload succeeded but no URL returned\nResponse: ${JSON.stringify(response.data)}`,
    );
  }

  return parsed.data.url;
}
