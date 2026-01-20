# File Uploader MCP Server
Upload local files to OAP (OpenAgentPlatform) remote storage.  

## Usage
Mainly used in combination with MCP that accepts URL for files.  
For example: 

**Use image edit MCP on a local image.**

Workflow:
1. The user requests the LLM to edit an image, providing a local file path
2. The LLM sends the local file to the FileUploader service for upload
3. The FileUploader returns a storage URL where the file is now hosted
4. The LLM forwards this URL to the ImageEditMCP (Model Context Protocol) tool to perform the image editing
5. The ImageEditMCP processes the image and returns the edited version to the LLM
6. Finally, the LLM presents the edited image result to the user

In essence, this workflow bridges the gap between local files and cloud-based editing tools by:
- Converting local file paths to accessible URLs through an uploader service
- Using those URLs with external image editing services

## Installation
```json
{
  "mcpServers": {
    "file-uploader": {
      "command": "npx",
      "args": ["@oaphub/file-uploader-mcp"]
    }
  }
}
```

## Configuration

Set these environment variables before running:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OAP_CLIENT_KEY` | No | - | Your OAP client key for longer expiration time. (> 1h)|
| `OAP_STORAGE_BASE_URL` | No | `https://storage.oaphub.ai` | Base URL of the storage API |

### Aquire OAP Client Key
- Go to [oaphub.ai](https://oaphub.ai/)
- Click Sign Up and create your account
- Obtain your Client Key from [oaphub.ai/u/clientkeys](https://oaphub.ai/u/clientkeys)

## Tool: `upload_file`

Uploads a file to storage and returns a URL.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `file_path` | string | Yes | Path to the file to upload |
| `expire_after` | number | No | Seconds until file expires (minimum: 60, default: 60) |

### Response

Returns a JSON object with the uploaded file URL:

```json
{
  "url": "https://storage.oaphub.ai/v/xxxxxxxx/xxxxx.md"
}
```

