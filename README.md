# llms-mcp

An MCP (Model Context Protocol) server that exposes the `llms.txt` file from your project root as a resource for AI context enhancement.

## Overview

llms-mcp is a MCP server that looks for the `llms.txt` file in the root of your project directory and exposes it as a resource that can be consumed by MCP-compatible AI clients, based on the [llms.txt](https://llmstxt.org) proposed standard.

## Features

- **Detection**: Finds the `llms.txt` file in your project root
- **File Resource**: Exposes the file via `file://` URI for direct content access
- **Parsing**: Extracts local file references and external URLs from llms.txt content. Automatically exposes referenced local files and external URLs as additional MCP resources.
- **Fetching**: Can fetch external resources on-demand.

## Installation

### Prerequisites

- Node.js >= 18.0.0

### Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Running the Server

Start the MCP server:
```bash
npm start
```

### Test Mode

Validate that the server can detect your `llms.txt` file:
```bash
npm test
```

This will scan your project directory and show if an `llms.txt` file is detected without starting the server.

### Environment Configuration

The server uses the `ProjectPath` environment variable to determine the root directory to scan:

```bash
export ProjectPath="/path/to/your/project"
npm start
```

```powershell
$env:projectPath = "/path/to/your/project"; npm start
```

## MCP Client Configuration

### Claude Desktop/Cline/Roo/Kilocode

Add this configuration to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "llms-mcp": {
      "command": "node",
      "args": ["path/to/llms-mcp/src/index.js"],
      "env": {
        "ProjectPath": "./"
      }
    }
  }
}
```

### Referenced Resources

The server automatically parses the `llms.txt` content and exposes referenced files and URLs as additional resources:

**Local Files:**
- Markdown-style file links: `[text](file.ext)`

**External URLs:**
- HTTP/HTTPS URLs: `https://example.com`
- URLs in markdown links: `[text](https://example.com)`

All local files are validated for existence before being exposed as resources. External URLs are exposed as-is and fetched on-demand when accessed.

## License

MIT License - see LICENSE file for details.

## Related Projects

- [llms.txt](https://llmstxt.org) - The llms.txt standard
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification
