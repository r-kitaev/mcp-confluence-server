# MCP Confluence Server

MCP server for working with Confluence Cloud via REST API v2.

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

Copy the example environment file and fill in your Confluence Cloud credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `CONFLUENCE_BASE_URL` - Your Confluence Cloud URL (e.g., `https://your-company.atlassian.net/wiki`)
- `CONFLUENCE_EMAIL` - Your Atlassian account email
- `CONFLUENCE_API_TOKEN` - Your API token from Atlassian

Optional environment variables:
- `MCP_SERVER_TOKEN` - Secure token for HTTP transport
- `PORT` - Port for HTTP server (default: 3000)
- `ALLOWED_ORIGINS` - Allowed origins for HTTP transport

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
│ MCP Client  │ ──→  │  McpServer                           │ ──→  │ ConfluenceClient │ ──→  │ Confluence Cloud REST   │
│ (AI/IDE)    │      │  Tools: 8                            │      │ (API wrapper)    │      │ API v2                  │
│             │      │  Resources: 3                        │      │                  │      │                         │
│             │      │  Prompts: 2                          │      │                  │      │                         │
└─────────────┘      └──────────────────────────────────────┘      └──────────────────┘      └─────────────────────────┘
```

**Components**:
- **MCP Client**: AI assistant or IDE that connects to the server
- **McpServer**: Main server exposing tools, resources, and prompts
- **ConfluenceClient**: HTTP client for Confluence Cloud REST API v2
- **Confluence Cloud API**: Atlassian's REST API for Confluence Cloud

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
