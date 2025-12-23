# File Uploader MCP Server

Uploads local files to OAP (OpenAgentPlatform) remote storage API.

## Installation
```json
{
  "mcpServers": {
    "file-uploader": {
      "command": "npx",
      "args": ["@oaphub/file-uploader-mcp"],
      "env": {
        "OAP_CLIENT_KEY": "your-client-key"
      }
    }
  }
}
```

## Configuration

Set these environment variables before running:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OAP_CLIENT_KEY` | Yes | - | Your OAP client key |
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


## Local Development

To test the MCP server locally before publishing
```bash
npm run build
```

```json
{
  "mcpServers": {
    "file-uploader": {
      "command": "node",
      "args": ["/path/to/file-uploader/dist/index.js"],
      "env": {
        "OAP_CLIENT_KEY": "your-client-key"
      }
    }
  }
}
```

## Publishing

This package uses automated publishing via GitHub Actions. To release:
- Create and push a git tag:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

The GitHub Action will automatically build and publish to npm.
