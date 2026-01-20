#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MIN_EXPIRE_AFTER, VERSION } from "./config.js";
import { detectMimeType, readFile, uploadFile } from "./utils.js";

// Create MCP server
const server = new McpServer({
  name: "file-uploader-mcp",
  version: VERSION,
});

// upload_file tool definition
const uploadFileName = "upload_file";

const uploadFileInputSchema = {
  file_path: z.string().describe("Path to the file to upload"),
  expire_after: z
    .number()
    .int()
    .min(MIN_EXPIRE_AFTER)
    .optional()
    .describe(
      `Seconds until the file expires and is deleted (minimum: ${MIN_EXPIRE_AFTER}, default: ${MIN_EXPIRE_AFTER})`,
    ),
};

type UploadFileInput = z.infer<z.ZodObject<typeof uploadFileInputSchema>>;

const uploadFileSchema = {
  title: "Upload File",
  description: `Upload a file to storage and get a URL. 
Automatically detects MIME type from file extension.
This is a temporary storage, files will be deleted after some time.`,
  inputSchema: uploadFileInputSchema,
  outputSchema: {
    url: z.string().describe("URL to access the uploaded file"),
  },
};

async function uploadFileHandler({ file_path, expire_after }: UploadFileInput) {
  try {
    const { buffer, filename } = await readFile(file_path);
    const mimeType = detectMimeType(filename);
    const expirationSeconds = expire_after ?? MIN_EXPIRE_AFTER;
    const url = await uploadFile(buffer, filename, mimeType, expirationSeconds);

    const output = { url };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(output) }],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [{ type: "text" as const, text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
}

server.registerTool(uploadFileName, uploadFileSchema, uploadFileHandler);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
