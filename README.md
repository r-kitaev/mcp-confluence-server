# MCP Confluence Server

MCP server for working with Confluence Cloud and Data Center via REST API v1.

## Installation

```bash
npm install
```

## Quick Start

```bash
# Configure
cp .env.example .env
# Edit .env with your credentials

# Build
npm run build

# Run
npm run start:stdio
```

## Configuration

Copy the example environment file and fill in your Confluence credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `CONFLUENCE_BASE_URL` - Your Confluence URL (e.g., `https://your-company.atlassian.net/wiki` or on-premise URL)
- `CONFLUENCE_EMAIL` - Your account email
- `CONFLUENCE_API_TOKEN` - Your API token or Personal Access Token

Optional environment variables:
- `MCP_SERVER_TOKEN` - Secure token for HTTP transport
- `PORT` - Port for HTTP server (default: 3000)
- `ALLOWED_ORIGINS` - Allowed origins for HTTP transport
- `NODE_TLS_REJECT_UNAUTHORIZED` - Set to `0` for self-signed certificates (on-premise)

## Usage

### Build

```bash
npm run build
```

### Run with stdio transport (local)

```bash
npm run start:stdio
```

### Run with HTTP transport (remote)

```bash
npm run start:http
```

### Development mode (watch)

```bash
npm run dev
```

## Features

### 8 MCP Tools

- `getSpace`, `listSpaces` - Space management
- `getPage`, `listPages`, `createPage`, `updatePage`, `deletePage` - Page CRUD
- `getAttachments` - Attachment management

### 3 MCP Resources

- `confluence://space/{spaceId}` - Space info (JSON)
- `confluence://page/{pageId}` - Page content (Markdown)
- `confluence://page/{pageId}/attachments` - Attachments (JSON)

### 2 MCP Prompts

- `pageReview` - AI-assisted page review
- `contentAudit` - AI-assisted content audit

## Architecture

```
┌─────────────┐      ┌──────────────────────────────────────┐      ┌──────────────────┐      ┌─────────────────────────┐
│ MCP Client  │ ──→  │  McpServer                           │ ──→  │ ConfluenceClient │ ──→  │ Confluence REST API v1  │
│ (AI/IDE)    │      │  Tools: 8                            │      │ (API wrapper)    │      │                         │
│             │      │  Resources: 3                        │      │                  │      │                         │
│             │      │  Prompts: 2                          │      │                  │      │                         │
└─────────────┘      └──────────────────────────────────────┘      └──────────────────┘      └─────────────────────────┘
```

**Components**:
- **MCP Client**: AI assistant or IDE that connects to the server
- **McpServer**: Main server exposing tools, resources, and prompts
- **ConfluenceClient**: HTTP client for Confluence REST API v1 with Bearer token auth
- **Confluence REST API**: Atlassian's REST API v1 for Confluence Cloud and Data Center

## API Compatibility

This server uses **Confluence REST API v1** (`/rest/api`) which is compatible with:
- Confluence Cloud
- Confluence Data Center
- Confluence Server (on-premise)

**Authentication**: Bearer Token (Personal Access Token or API Token)

## Testing

```bash
npm test
```

With coverage:

```bash
npm run test:coverage
```

## Documentation

- [Tools](docs/TOOLS.md) - Complete tool reference
- [Resources](docs/RESOURCES.md) - Resource URI templates
- [Prompts](docs/PROMPTS.md) - AI prompt templates
- [Examples](docs/EXAMPLES.md) - Usage scenarios

## Contributing

1. Create feature branch: `git checkout -b feature/xxx`
2. Make changes
3. Run tests: `npm test`
4. Run typecheck: `npm run typecheck`
5. Run lint: `npm run lint`
6. Commit with conventional commits
7. Create PR

## Linting

```bash
npm run lint
```

## Type Checking

```bash
npm run typecheck
```
