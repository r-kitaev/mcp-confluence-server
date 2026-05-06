# MCP Confluence Server

MCP server for working with Confluence Cloud via REST API v2.

## Installation

```bash
npm install
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

## Testing

```bash
npm test
```

With coverage:

```bash
npm run test:coverage
```

## Linting

```bash
npm run lint
```

## Type Checking

```bash
npm run typecheck
```

## Documentation

See [MCP_IMPLEMENTATION_GUIDE.md](./MCP_IMPLEMENTATION_GUIDE.md) for detailed implementation guide.
