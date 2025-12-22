import * as fs from "node:fs/promises";
import * as path from "node:path";
import mime from "mime-types";
import { z } from "zod";
import { AUTH_TOKEN, BASE_URL } from "./config.js";

const uploadResponseSchema = z.object({
  result: z.boolean(),
  url: z.string().optional().nullable(),
  error: z.string().optional().nullable(),
});

export type UploadFileResponse = z.infer<typeof uploadResponseSchema>;

/**
 * Reads a file from the filesystem with cross-platform support.
 * Provides descriptive error messages for common failure cases.
 */
export async function readFile(
  filePath: string,
): Promise<{ buffer: Buffer; filename: string }> {
  const normalizedPath = path.resolve(filePath);

  try {
    const stats = await fs.stat(normalizedPath);

    if (stats.isDirectory()) {
      throw new Error(
        `Cannot upload a directory: "${normalizedPath}". Please provide a path to a file.`,
      );
    }

    if (!stats.isFile()) {
      throw new Error(
        `Path is not a regular file: "${normalizedPath}". Please provide a path to a regular file.`,
      );
    }

    const buffer = await fs.readFile(normalizedPath);
    const filename = path.basename(normalizedPath);

    return { buffer, filename };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("Cannot upload a directory") ||
        error.message.includes("Path is not a regular file")
      ) {
        throw error;
      }

      const nodeError = error as NodeJS.ErrnoException;
      switch (nodeError.code) {
        case "ENOENT":
          throw new Error(
            `File not found: "${normalizedPath}". Please check that the file exists and the path is correct.`,
          );
        case "EACCES":
          throw new Error(
            `Permission denied: Cannot read file "${normalizedPath}". Please check file permissions.`,
          );
        case "EPERM":
          throw new Error(
            `Operation not permitted: Cannot read file "${normalizedPath}". The file may be locked or require elevated permissions.`,
          );
        case "EMFILE":
          throw new Error(
            `Too many open files. Please close some files and try again.`,
          );
        case "ENAMETOOLONG":
          throw new Error(
            `File path too long: "${normalizedPath}". Please use a shorter path.`,
          );
        default:
          throw new Error(
            `Failed to read file "${normalizedPath}": ${error.message}`,
          );
      }
    }
    throw error;
  }
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

/**
 * Uploads a file to the storage API.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  expireAfter: number,
): Promise<string> {
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("expire_after", expireAfter.toString());

  const uploadUrl = `${BASE_URL}/upload_volatile`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: form,
  });

  const textBody = await response.text();
  if (!response.ok) {
    let errorMessage = `Upload failed with status ${response.status}`;
    try {
      if (textBody) {
        errorMessage += `: ${textBody}`;
      }
    } catch {
      // Ignore error reading response body
    }
    throw new Error(errorMessage);
  }

  let responseData: unknown;
  try {
    responseData = await response.json();
  } catch {
    throw new Error(
      `Upload succeeded but server returned invalid JSON response. body: ${textBody}`,
    );
  }

  const parsed = uploadResponseSchema.safeParse(responseData);
  if (!parsed.success) {
    throw new Error(
      `Invalid response from server: ${parsed.error.message}, body: ${textBody}`,
    );
  }

  if (!parsed.data.result) {
    throw new Error(
      `Upload failed: ${parsed.data.error || "Unknown error"}\nResponse: ${textBody}`,
    );
  }

  if (!parsed.data.url) {
    throw new Error(
      `Upload succeeded but no URL returned\nResponse: ${textBody}`,
    );
  }

  return parsed.data.url;
}
