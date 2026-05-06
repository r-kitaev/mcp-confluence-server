# MCP Server Implementation Guide for Confluence

## 1. MCP Architecture Overview

### Core Components

**MCP (Model Context Protocol)** is an open standard enabling AI applications to securely interact with external data sources and services through a standardized interface.

#### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      MCP Clients                            │
│  (Claude Desktop, VS Code, Cursor, Custom Applications)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ JSON-RPC 2.0 Messages
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Transport Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │    stdio     │  │  Streamable  │  │       SSE        │  │
│  │  (local IPC) │  │    HTTP      │  │ (Server-Sent)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      MCP Servers                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │    Tools     │  │  Resources   │  │     Prompts      │  │
│  │  (Actions)   │  │    (Data)    │  │   (Templates)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Protocol Fundamentals

- **JSON-RPC 2.0**: All MCP communication uses JSON-RPC 2.0 over the chosen transport
- **Capability Negotiation**: Servers declare capabilities during initialization handshake
- **Request-Response**: Clients send requests, servers respond (with optional server-initiated messages)
- **Session Management**: Remote servers maintain session state via session IDs

---

## 2. Server Implementation Requirements

### Server Initialization

#### TypeScript SDK

```typescript
import { McpServer } from '@modelcontextprotocol/server';
import type { ServerCapabilities } from '@modelcontextprotocol/types';

// Basic server with capabilities declaration
const server = new McpServer({
  name: 'confluence-mcp-server',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},           // Server exposes tools
    resources: {},       // Server exposes resources
    prompts: {},         // Server exposes prompts
    // experimental: {    // Experimental features
    //   tasks: {}        // Task augmentation (draft spec)
    // }
  }
});
```

#### Python SDK (FastMCP)

```python
from mcp.server.fastmcp import FastMCP

# Server with capabilities
mcp = FastMCP(
    "confluence-mcp-server",
    capabilities={
        "tools": {},
        "resources": {},
        "prompts": {}
    }
)

# Or with decorator-based registration
mcp = FastMCP("confluence-mcp-server")

@mcp.tool()
def get_page(page_id: str) -> str:
    """Get a Confluence page by ID."""
    pass
```

### Capability Declaration

Servers **MUST** declare capabilities during initialization:

```typescript
// Minimal capabilities - tools only
const server = new McpServer({
  name: 'my-server',
  version: '1.0.0'
}, {
  capabilities: { tools: {} }
});

// Full capabilities
const server = new McpServer({
  name: 'my-server',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {},
    resources: {},
    prompts: {},
    // Optional advanced capabilities
    // logging: {},
    // completions: {}
  }
});
```

---

## 3. Tool Definition Format

### Tool Structure

Tools are functions that LLMs can invoke (with user approval) to perform actions.

#### TypeScript Example

```typescript
import { z } from 'zod';

server.registerTool(
  'get-confluence-page',
  {
    title: 'Get Confluence Page',
    description: 'Retrieve a Confluence page by ID or key',
    inputSchema: z.object({
      pageId: z.string()
        .describe('Confluence page ID (numeric) or content key'),
      includeMetadata: z.boolean()
        .default(false)
        .describe('Include page metadata (author, timestamps)'),
    }),
    // Optional: output schema for structured results
    outputSchema: z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      version: z.number(),
    }),
  },
  async ({ pageId, includeMetadata }) => {
    // Tool implementation
    const page = await confluenceClient.getPage(pageId);
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(page, null, 2),
      }],
      // Optional structured output
      // structuredContent: { ... }
    };
  }
);
```

#### Python Example

```python
from typing import Optional
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("confluence-server")

@mcp.tool()
def get_confluence_page(
    page_id: str,
    include_metadata: bool = False
) -> str:
    """
    Retrieve a Confluence page by ID or key.
    
    Args:
        page_id: Confluence page ID (numeric) or content key
        include_metadata: Include page metadata (author, timestamps)
    
    Returns:
        Page content as JSON string
    """
    page = confluence_client.get_page(page_id)
    
    if include_metadata:
        return json.dumps(page, indent=2)
    return page['content']
```

### Tool Definition Schema (JSON Schema)

```json
{
  "name": "get-confluence-page",
  "title": "Get Confluence Page",
  "description": "Retrieve a Confluence page by ID or key",
  "inputSchema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "pageId": {
        "type": "string",
        "description": "Confluence page ID (numeric) or content key"
      },
      "includeMetadata": {
        "type": "boolean",
        "default": false,
        "description": "Include page metadata (author, timestamps)"
      }
    },
    "required": ["pageId"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "title": { "type": "string" },
      "content": { "type": "string" },
      "version": { "type": "number" }
    },
    "required": ["id", "title", "content"]
  }
}
```

### Tool Registration Patterns

#### Pattern 1: Inline Registration

```typescript
server.registerTool(
  'tool-name',
  {
    description: 'What the tool does',
    inputSchema: z.object({ /* schema */ }),
  },
  async (args) => {
    // Implementation
  }
);
```

#### Pattern 2: Modular Registration

```typescript
// tools/confluence.ts
export function registerConfluenceTools(server: McpServer, client: ConfluenceClient) {
  server.registerTool(
    'get-page',
    { /* config */ },
    async (args) => client.getPage(args.pageId)
  );
  
  server.registerTool(
    'create-page',
    { /* config */ },
    async (args) => client.createPage(args)
  );
}

// server.ts
import { registerConfluenceTools } from './tools/confluence';

const server = new McpServer({ name: 'confluence-server', version: '1.0.0' });
const client = new ConfluenceClient({ baseUrl, username, apiToken });

registerConfluenceTools(server, client);
```

#### Pattern 3: Factory Pattern

```typescript
function createTool(config: {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  handler: (args: any) => Promise<any>;
}) {
  return {
    name: config.name,
    config: {
      description: config.description,
      inputSchema: config.inputSchema,
    },
    handler: config.handler,
  };
}

// Usage
const tools = [
  createTool({
    name: 'search-pages',
    description: 'Search Confluence pages',
    inputSchema: z.object({ query: z.string() }),
    handler: async ({ query }) => confluence.search(query),
  }),
];

tools.forEach(tool => {
  server.registerTool(tool.name, tool.config, tool.handler);
});
```

### Tool Annotations

```typescript
server.registerTool(
  'delete-page',
  {
    description: 'Delete a Confluence page permanently',
    inputSchema: z.object({ pageId: z.string() }),
    annotations: {
      title: 'Delete Page',
      readOnlyHint: false,      // Tool modifies data
      destructiveHint: true,     // Irreversible action
      idempotentHint: false,     // Not safe to retry
      openWorldHint: false,      // Operates on known data
    },
  },
  async ({ pageId }) => {
    // Implementation
  }
);
```

### ResourceLink Outputs

Tools can return references to large resources without embedding them:

```typescript
import type { ResourceLink } from '@modelcontextprotocol/server';

server.registerTool(
  'get-page-attachments',
  {
    description: 'List attachments for a Confluence page',
    inputSchema: z.object({ pageId: z.string() }),
  },
  async ({ pageId }) => {
    const attachments = await confluence.getAttachments(pageId);
    
    return {
      content: attachments.map(att => ({
        type: 'resource_link' as const,
        uri: `confluence://attachment/${att.id}`,
        name: att.filename,
        description: att.mimeType,
      } as ResourceLink)),
    };
  }
);
```

---

## 4. Resource URIs and Templates

### Static Resources

```typescript
server.registerResource(
  'space-info',
  'confluence://space/DEV',
  {
    title: 'Development Space Info',
    description: 'Information about the DEV space',
    mimeType: 'application/json',
  },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'application/json',
      text: JSON.stringify({
        key: 'DEV',
        name: 'Development',
        description: 'Development documentation',
      }),
    }],
  })
);
```

### Dynamic Resources with Templates

```typescript
import { ResourceTemplate } from '@modelcontextprotocol/server';

server.registerResource(
  'page-content',
  new ResourceTemplate('confluence://page/{pageId}', {
    // Optional: list available instances
    list: async () => ({
      resources: [
        { uri: 'confluence://page/123', name: 'Home Page' },
        { uri: 'confluence://page/456', name: 'API Docs' },
      ],
    }),
    // Optional: argument completion
    complete: {
      pageId: async (value) => {
        const pages = await confluence.search(value);
        return pages.map(p => ({ value: p.id, label: p.title }));
      },
    },
  }),
  {
    title: 'Confluence Page',
    description: 'Access Confluence page content by ID',
    mimeType: 'text/markdown',
  },
  async (uri, { pageId }) => {
    const page = await confluence.getPage(pageId);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'text/markdown',
        text: page.content,
      }],
    };
  }
);
```

### Resource Template Patterns

#### Pattern 1: Hierarchical Resources

```typescript
// confluence://space/{spaceKey}/page/{pageId}
new ResourceTemplate('confluence://space/{spaceKey}/page/{pageId}', {
  list: async () => {
    const spaces = await confluence.getSpaces();
    const resources = [];
    
    for (const space of spaces) {
      const pages = await confluence.getPages(space.key);
      for (const page of pages) {
        resources.push({
          uri: `confluence://space/${space.key}/page/${page.id}`,
          name: page.title,
        });
      }
    }
    
    return { resources };
  },
})
```

#### Pattern 2: Query-based Resources

```typescript
// confluence://search?query={query}&limit={limit}
new ResourceTemplate('confluence://search', {
  list: undefined, // No predefined instances
})
```

#### Pattern 3: Versioned Resources

```typescript
// confluence://page/{pageId}/version/{versionNumber}
new ResourceTemplate('confluence://page/{pageId}/version/{version}', {
  list: async (uri) => {
    const pageId = uri.pathname.split('/')[2];
    const versions = await confluence.getPageVersions(pageId);
    
    return {
      resources: versions.map(v => ({
        uri: `confluence://page/${pageId}/version/${v.number}`,
        name: `Version ${v.number}`,
      })),
    };
  },
})
```

### Resource MIME Types

Common MIME types for Confluence resources:

- `text/markdown` - Page content in markdown
- `text/html` - Page content in HTML
- `application/json` - Structured data (metadata, lists)
- `application/pdf` - Exported documents
- `image/png`, `image/jpeg` - Attachments

---

## 5. Prompt Definitions

### Basic Prompts

```typescript
server.registerPrompt(
  'code-review',
  {
    title: 'Code Review',
    description: 'Review code changes and provide feedback',
    argsSchema: z.object({
      code: z.string().describe('The code to review'),
      language: z.string().default('typescript').describe('Programming language'),
    }),
  },
  ({ code, language }) => ({
    messages: [{
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `Please review the following ${language} code and provide feedback on:\n` +
              '1. Code quality and best practices\n' +
              '2. Potential bugs or issues\n' +
              '3. Performance considerations\n' +
              '4. Security concerns\n\n' +
              `Code:\n\`\`\`${language}\n${code}\n\`\`\``,
      },
    }],
  })
);
```

### Prompts with Completions

```typescript
import { completable } from '@modelcontextprotocol/server';

server.registerPrompt(
  'summarize-space',
  {
    title: 'Summarize Space',
    description: 'Generate a summary of a Confluence space',
    argsSchema: z.object({
      spaceKey: completable(
        z.string().describe('Confluence space key'),
        async (value) => {
          const spaces = await confluence.getSpaces();
          return spaces
            .filter(s => s.key.startsWith(value))
            .map(s => ({ value: s.key, label: s.name }));
        }
      ),
      includePages: z.boolean().default(true),
    }),
  },
  async ({ spaceKey, includePages }) => {
    const space = await confluence.getSpace(spaceKey);
    const pages = includePages ? await confluence.getPages(spaceKey) : [];
    
    return {
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Summarize the Confluence space "${space.name}" (${space.key}).\n` +
                `Description: ${space.description}\n` +
                `Total pages: ${pages.length}\n\n` +
                'Provide an overview of the main topics covered.',
        },
      }],
    };
  }
);
```

### Python Prompt Example

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("confluence-server")

@mcp.prompt()
def document_review(
    page_id: str,
    review_type: str = "technical"
) -> str:
    """
    Generate a prompt for reviewing a Confluence document.
    
    Args:
        page_id: Confluence page ID
        review_type: Type of review (technical, editorial, compliance)
    """
    page = confluence_client.get_page(page_id)
    
    review_instructions = {
        "technical": "Review for technical accuracy and completeness",
        "editorial": "Review for clarity, grammar, and style",
        "compliance": "Review for compliance with documentation standards",
    }
    
    return f"""
    Please review the following document:
    
    Title: {page['title']}
    Content: {page['content']}
    
    {review_instructions.get(review_type, review_instructions['technical'])}
    
    Provide specific feedback and suggestions for improvement.
    """
```

---

## 6. Transport Setup

### stdio Transport (Local)

For local integrations (Claude Desktop, CLI tools):

```typescript
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';

async function main() {
  const server = new McpServer({
    name: 'confluence-server',
    version: '1.0.0',
  });
  
  // Register tools, resources, prompts...
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Confluence MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
```

**Critical**: Never write to stdout except for valid MCP messages. Use stderr for logging.

### Streamable HTTP Transport (Remote)

For remote deployments with session management:

```typescript
import { randomUUID } from 'node:crypto';
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import express from 'express';
import cors from 'cors';

const server = new McpServer({
  name: 'confluence-server',
  version: '1.0.0',
});

// Session storage
const transports = new Map<string, NodeStreamableHTTPServerTransport>();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: NodeStreamableHTTPServerTransport;
  
  if (sessionId && transports.has(sessionId)) {
    // Existing session
    transport = transports.get(sessionId)!;
  } else if (!sessionId) {
    // New session (initialize request)
    transport = new NodeStreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newSessionId) => {
        transports.set(newSessionId, transport);
      },
    });
    
    transport.onclose = () => {
      if (transport.sessionId) {
        transports.delete(transport.sessionId);
      }
    };
    
    await server.connect(transport);
  } else {
    // Invalid session
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Invalid or expired session ID',
      },
      id: null,
    });
    return;
  }
  
  await transport.handleRequest(req, res, req.body);
});

// Optional: GET endpoint for SSE streaming
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).send('Invalid session ID');
    return;
  }
  
  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

// Session cleanup
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  
  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.close();
    transports.delete(sessionId);
  }
  
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.error(`Confluence MCP server listening on port ${PORT}`);
});
```

### Python Streamable HTTP

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("confluence-server")

# Run with HTTP transport
if __name__ == "__main__":
    mcp.run(
        transport="streamable-http",
        host="0.0.0.0",
        port=3000,
        path="/mcp",
        stateless_http=True,  # For serverless deployments
        json_response=True,   # Return JSON instead of SSE
    )
```

### Transport Selection Guide

| Transport | Use Case | Pros | Cons |
|-----------|----------|------|------|
| **stdio** | Local development, desktop apps | Simple, no network setup | Local only, single client |
| **Streamable HTTP** | Remote deployments, web apps | Network accessible, multiple clients, session management | More complex setup, requires HTTP server |
| **SSE** | Real-time updates | Efficient streaming, server-initiated messages | Requires HTTP, more complex |

---

## 7. Error Handling Patterns

### JSON-RPC Error Codes

```typescript
// Standard JSON-RPC error codes
const PARSE_ERROR = -32700;      // Invalid JSON
const INVALID_REQUEST = -32600;  // Invalid Request object
const METHOD_NOT_FOUND = -32601; // Unknown method
const INVALID_PARAMS = -32602;   // Invalid method parameters
const INTERNAL_ERROR = -32603;   // Internal server error

// MCP-specific errors
const SERVER_ERROR_START = -32000; // Server error range
const TIMEOUT_ERROR = -32001;      // Request timeout
```

### Two-Tier Error Strategy

**Protocol Errors** (JSON-RPC errors): For structural issues
- Unknown tools/methods
- Malformed requests
- Authentication failures
- Server errors

**Tool Execution Errors** (isError: true): For runtime issues
- API failures
- Input validation errors
- Business logic errors
- External service errors

### TypeScript Error Handling

```typescript
server.registerTool(
  'get-page',
  {
    description: 'Get a Confluence page',
    inputSchema: z.object({
      pageId: z.string(),
    }),
  },
  async ({ pageId }) => {
    try {
      // Validate input
      if (!pageId || pageId.trim() === '') {
        return {
          content: [{
            type: 'text',
            text: 'Error: pageId is required and cannot be empty',
          }],
          isError: true,
        };
      }
      
      const page = await confluence.getPage(pageId);
      
      if (!page) {
        return {
          content: [{
            type: 'text',
            text: `Page not found: ${pageId}`,
          }],
          isError: true,
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(page, null, 2),
        }],
      };
      
    } catch (error) {
      // Log to stderr (not stdout!)
      console.error(`Error fetching page ${pageId}:`, error);
      
      return {
        content: [{
          type: 'text',
          text: `Failed to fetch page: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  }
);
```

### Python Error Handling

```python
from mcp.server.fastmcp import FastMCP
from mcp.types import ErrorData

mcp = FastMCP("confluence-server")

@mcp.tool()
async def get_page(page_id: str) -> str:
    """Get a Confluence page by ID."""
    try:
        if not page_id or not page_id.strip():
            return "Error: page_id is required and cannot be empty"
        
        page = await confluence_client.get_page(page_id)
        
        if not page:
            return f"Page not found: {page_id}"
        
        return json.dumps(page, indent=2)
        
    except ConfluenceAPIError as e:
        # Log error
        print(f"API error fetching page {page_id}: {e}", file=sys.stderr)
        return f"Confluence API error: {str(e)}"
        
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return f"Internal error: {str(e)}"
```

### Error Middleware (HTTP Transport)

```typescript
// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    jsonrpc: '2.0',
    error: {
      code: INTERNAL_ERROR,
      message: 'Internal server error',
      data: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
    id: null,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    jsonrpc: '2.0',
    error: {
      code: METHOD_NOT_FOUND,
      message: 'Endpoint not found',
    },
    id: null,
  });
});
```

### Retry Logic with Exponential Backoff

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      
      console.error(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Usage in tool
server.registerTool(
  'search-pages',
  {
    description: 'Search Confluence pages',
    inputSchema: z.object({ query: z.string() }),
  },
  async ({ query }) => {
    try {
      const results = await withRetry(
        () => confluence.search(query),
        { maxRetries: 3, baseDelay: 500 }
      );
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(results, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Search failed after retries: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  }
);
```

---

## 8. Official SDKs and Reference Implementations

### SDK Availability

| Language | SDK | Repository | Tier |
|----------|-----|------------|------|
| TypeScript | `@modelcontextprotocol/sdk` | modelcontextprotocol/typescript-sdk | Tier 1 |
| Python | `mcp` | modelcontextprotocol/python-sdk | Tier 1 |
| C# | `ModelContextProtocol` | modelcontextprotocol/csharp-sdk | Tier 1 |
| Go | `mcp-go` | modelcontextprotocol/go-sdk | Tier 1 |
| Java | `mcp-java` | modelcontextprotocol/java-sdk | Tier 2 |
| Rust | `mcp-rust` | modelcontextprotocol/rust-sdk | Tier 2 |
| Swift | `mcp-swift` | modelcontextprotocol/swift-sdk | Tier 3 |
| Ruby | `mcp-ruby` | modelcontextprotocol/ruby-sdk | Tier 3 |
| PHP | `mcp-php` | modelcontextprotocol/php-sdk | Tier 3 |

### Installation

#### TypeScript

```bash
npm install @modelcontextprotocol/server @modelcontextprotocol/client zod
# or
pnpm add @modelcontextprotocol/server @modelcontextprotocol/client zod
# or
yarn add @modelcontextprotocol/server @modelcontextprotocol/client zod
```

#### Python

```bash
# Using uv (recommended)
uv add mcp

# Using pip
pip install mcp
```

### Reference Implementations

#### TypeScript Weather Server

```typescript
// server.ts
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';

const NWS_API_BASE = 'https://api.weather.gov';

const server = new McpServer({
  name: 'weather-server',
  version: '1.0.0',
});

server.registerTool(
  'get-alerts',
  {
    title: 'Get Weather Alerts',
    description: 'Get weather alerts for a state',
    inputSchema: z.object({
      state: z.string().length(2).describe('Two-letter state code (e.g. CA, NY)'),
    }),
  },
  async ({ state }) => {
    const stateCode = state.toUpperCase();
    const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
    
    try {
      const response = await fetch(alertsUrl);
      const data = await response.json();
      
      const features = data.features || [];
      if (features.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No active alerts for ${stateCode}`,
          }],
        };
      }
      
      const formattedAlerts = features.map((f: any) => 
        `${f.properties.event}: ${f.properties.description}`
      );
      
      return {
        content: [{
          type: 'text',
          text: `Active alerts for ${stateCode}:\n\n${formattedAlerts.join('\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Failed to fetch alerts: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Weather server running on stdio');
}

main().catch(console.error);
```

#### Python Calculator Server

```python
# server.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Calculator")

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b

@mcp.tool()
def multiply(a: int, b: int) -> int:
    """Multiply two numbers."""
    return a * b

@mcp.resource("greeting://{name}")
def get_greeting(name: str) -> str:
    """Get a personalized greeting."""
    return f"Hello, {name}!"

@mcp.prompt()
def calculate_expression(expression: str) -> str:
    """Generate a prompt for evaluating a mathematical expression."""
    return f"Please evaluate this mathematical expression: {expression}"

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

---

## 9. Best Practices for MCP Server Design

### 1. Tool Design

**DO:**
- Use clear, descriptive names (snake_case or kebab-case)
- Write comprehensive descriptions that explain purpose and side effects
- Validate inputs with strict schemas
- Return actionable error messages
- Use annotations for destructive operations
- Keep tools focused and atomic

**DON'T:**
- Create overly broad tools that do too much
- Omit parameter descriptions
- Return vague error messages
- Hide side effects in tool behavior

```typescript
// GOOD: Clear, focused tool
server.registerTool(
  'create-page',
  {
    title: 'Create Confluence Page',
    description: 'Create a new page in a Confluence space. Returns the new page ID.',
    inputSchema: z.object({
      spaceKey: z.string().describe('Target space key (e.g., DEV, DOC)'),
      title: z.string().describe('Page title'),
      content: z.string().describe('Page content in Confluence storage format (HTML)'),
      parentId: z.string().optional().describe('Parent page ID for nested pages'),
    }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
    },
  },
  async ({ spaceKey, title, content, parentId }) => {
    // Implementation
  }
);

// BAD: Overly broad, unclear tool
server.registerTool(
  'handle-content',
  {
    description: 'Do stuff with content',
    inputSchema: z.object({
      data: z.any(),
    }),
  },
  async ({ data }) => {
    // Unclear what this does
  }
);
```

### 2. Resource Design

**DO:**
- Use consistent URI schemes (`confluence://...`)
- Provide meaningful titles and descriptions
- Implement list callbacks for discoverability
- Use appropriate MIME types
- Support completion for better UX

```typescript
server.registerResource(
  'page-content',
  new ResourceTemplate('confluence://page/{pageId}', {
    list: async () => {
      const pages = await confluence.getRecentPages();
      return {
        resources: pages.map(p => ({
          uri: `confluence://page/${p.id}`,
          name: p.title,
          description: `Last modified: ${p.lastModified}`,
        })),
      };
    },
    complete: {
      pageId: async (value) => {
        const pages = await confluence.search(value);
        return pages.map(p => ({
          value: p.id,
          label: `${p.title} (${p.spaceKey})`,
        }));
      },
    },
  }),
  {
    title: 'Confluence Page Content',
    mimeType: 'text/markdown',
  },
  async (uri, { pageId }) => {
    // Implementation
  }
);
```

### 3. Prompt Design

**DO:**
- Create prompts for common workflows
- Provide clear argument descriptions
- Use completions for complex arguments
- Return structured message arrays

```typescript
server.registerPrompt(
  'pr-summary',
  {
    title: 'Pull Request Summary',
    description: 'Generate a summary of changes for a pull request',
    argsSchema: z.object({
      prNumber: completable(
        z.number().describe('Pull request number'),
        async (value) => {
          const prs = await github.getOpenPRs();
          return prs
            .filter(pr => pr.number.toString().startsWith(value))
            .map(pr => ({
              value: pr.number.toString(),
              label: `#${pr.number}: ${pr.title}`,
            }));
        }
      ),
    }),
  },
  async ({ prNumber }) => {
    const pr = await github.getPR(prNumber);
    const changes = await github.getPRChanges(prNumber);
    
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Summarize the changes in PR #${prNumber}: ${pr.title}\n\n` +
                `Description: ${pr.description}\n\n` +
                `Files changed: ${changes.files.length}\n` +
                `Additions: ${changes.additions}\n` +
                `Deletions: ${changes.deletions}\n\n` +
                'Provide a concise summary suitable for release notes.',
        },
      }],
    };
  }
);
```

### 4. Security Best Practices

#### Authentication

```typescript
// Environment variables for credentials
const config = {
  confluenceBaseUrl: process.env.CONFLUENCE_BASE_URL!,
  username: process.env.CONFLUENCE_USERNAME!,
  apiToken: process.env.CONFLUENCE_API_TOKEN!,
};

// Validate required credentials
if (!config.confluenceBaseUrl || !config.username || !config.apiToken) {
  console.error('Missing required Confluence credentials');
  process.exit(1);
}

// HTTP transport with authentication middleware
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Unauthorized: Missing or invalid authorization',
      },
      id: null,
    });
    return;
  }
  
  const token = authHeader.substring(7);
  
  // Validate token (implement your own validation)
  if (!isValidToken(token)) {
    res.status(401).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Unauthorized: Invalid token',
      },
      id: null,
    });
    return;
  }
  
  next();
};

app.post('/mcp', authMiddleware, mcpPostHandler);
```

#### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Too many requests, please try again later',
    },
    id: null,
  },
});

app.use('/mcp', limiter);
```

#### Input Validation

```typescript
// Strict Zod schemas
const pageIdSchema = z.string()
  .regex(/^\d+$/, 'Page ID must be numeric')
  .max(20, 'Page ID too long');

const searchQuerySchema = z.string()
  .min(1, 'Query cannot be empty')
  .max(500, 'Query too long')
  .transform(s => s.trim());

server.registerTool(
  'get-page',
  {
    description: 'Get a Confluence page',
    inputSchema: z.object({
      pageId: pageIdSchema,
    }),
  },
  async ({ pageId }) => {
    // Input already validated by Zod
  }
);
```

#### Sandbox External Code Execution

```typescript
// NEVER execute LLM-controlled code without sandboxing
server.registerTool(
  'run-script',
  {
    description: 'Execute a script in a sandboxed environment',
    inputSchema: z.object({
      code: z.string(),
      language: z.enum(['javascript', 'python']),
    }),
  },
  async ({ code, language }) => {
    // Use isolated container/sandbox
    // Never run directly on host
    const result = await sandboxedExecutor.execute(code, {
      language,
      timeout: 5000,
      memoryLimit: '128MB',
      networkAccess: false,
    });
    
    return {
      content: [{
        type: 'text',
        text: result.output,
      }],
    };
  }
);
```

### 5. Logging and Debugging

```typescript
// Log to stderr, never stdout
console.error('[INFO] Server started');
console.error('[DEBUG] Fetching page:', pageId);
console.error('[ERROR] API failure:', error);

// Structured logging
const logger = {
  info: (message: string, data?: unknown) => {
    console.error(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      data,
    }));
  },
  error: (message: string, error?: unknown) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: error instanceof Error ? error.message : String(error),
    }));
  },
};
```

### 6. Performance Optimization

```typescript
// Caching
import NodeCache from 'node-cache';

const pageCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

server.registerTool(
  'get-page',
  {
    description: 'Get a Confluence page (cached)',
    inputSchema: z.object({
      pageId: z.string(),
      forceRefresh: z.boolean().default(false),
    }),
  },
  async ({ pageId, forceRefresh }) => {
    const cacheKey = `page:${pageId}`;
    
    if (!forceRefresh) {
      const cached = pageCache.get(cacheKey);
      if (cached) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(cached, null, 2),
          }],
        };
      }
    }
    
    const page = await confluence.getPage(pageId);
    pageCache.set(cacheKey, page);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(page, null, 2),
      }],
    };
  }
);

// Pagination for large result sets
server.registerTool(
  'search-pages',
  {
    description: 'Search Confluence pages with pagination',
    inputSchema: z.object({
      query: z.string(),
      limit: z.number().min(1).max(50).default(10),
      offset: z.number().min(0).default(0),
    }),
  },
  async ({ query, limit, offset }) => {
    const results = await confluence.search(query, { limit, offset });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          total: results.total,
          limit,
          offset,
          hasMore: offset + limit < results.total,
          results: results.items,
        }, null, 2),
      }],
    };
  }
);
```

### 7. Testing

```typescript
// server.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/server';
import { registerConfluenceTools } from '../src/tools';

describe('Confluence MCP Server', () => {
  let server: McpServer;
  
  beforeEach(() => {
    server = new McpServer({
      name: 'test-confluence-server',
      version: '1.0.0',
    });
    registerConfluenceTools(server, mockConfluenceClient);
  });
  
  it('should register get-page tool', async () => {
    const tools = await server.listTools();
    expect(tools.tools).toContainEqual(
      expect.objectContaining({
        name: 'get-page',
      })
    );
  });
  
  it('should validate pageId parameter', async () => {
    const result = await server.callTool('get-page', { pageId: '' });
    expect(result.isError).toBe(true);
  });
});
```

### 8. Deployment Checklist

- [ ] Environment variables configured (credentials, base URLs)
- [ ] Error handling implemented for all tools
- [ ] Input validation with strict schemas
- [ ] Logging to stderr (not stdout)
- [ ] Rate limiting configured (HTTP transport)
- [ ] Authentication middleware (if remote)
- [ ] Session management (HTTP transport)
- [ ] Health check endpoint (HTTP transport)
- [ ] CORS configured (if accessed from browser)
- [ ] Monitoring and alerting setup
- [ ] Documentation for tools/resources/prompts

---

## 10. Example: Complete Confluence MCP Server

### Project Structure

```
confluence-mcp-server/
├── src/
│   ├── index.ts              # Server entry point
│   ├── server.ts             # Server configuration
│   ├── tools/
│   │   ├── index.ts          # Tool registration
│   │   ├── pages.ts          # Page-related tools
│   │   ├── spaces.ts         # Space-related tools
│   │   └── search.ts         # Search tools
│   ├── resources/
│   │   ├── index.ts          # Resource registration
│   │   └── pages.ts          # Page resources
│   ├── prompts/
│   │   ├── index.ts          # Prompt registration
│   │   └── review.ts         # Review prompts
│   ├── client/
│   │   └── confluence.ts     # Confluence API client
│   ├── config/
│   │   └── index.ts          # Configuration
│   └── utils/
│       └── logger.ts         # Logging utilities
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Implementation

```typescript
// src/index.ts
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { registerTools } from './tools';
import { registerResources } from './resources';
import { registerPrompts } from './prompts';
import { ConfluenceClient } from './client/confluence';
import { config } from './config';
import { logger } from './utils/logger';

async function main() {
  logger.info('Starting Confluence MCP Server');
  
  // Initialize Confluence client
  const confluence = new ConfluenceClient({
    baseUrl: config.confluenceBaseUrl,
    username: config.confluenceUsername,
    apiToken: config.confluenceApiToken,
  });
  
  // Create server
  const server = new McpServer(
    {
      name: 'confluence-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );
  
  // Register capabilities
  registerTools(server, confluence);
  registerResources(server, confluence);
  registerPrompts(server, confluence);
  
  // Connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('Confluence MCP Server running on stdio');
}

main().catch((error) => {
  logger.error('Server failed to start', error);
  process.exit(1);
});
```

```typescript
// src/tools/pages.ts
import type { McpServer } from '@modelcontextprotocol/server';
import type { ConfluenceClient } from '../client/confluence';
import { z } from 'zod';

export function registerPageTools(server: McpServer, confluence: ConfluenceClient) {
  server.registerTool(
    'get-page',
    {
      title: 'Get Confluence Page',
      description: 'Retrieve a Confluence page by ID or content key',
      inputSchema: z.object({
        pageId: z.string().describe('Page ID or content key'),
        version: z.number().optional().describe('Specific version number'),
        expand: z.array(z.string()).optional().describe('Fields to expand'),
      }),
    },
    async ({ pageId, version, expand }) => {
      try {
        const page = await confluence.getPage(pageId, { version, expand });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: page.id,
              title: page.title,
              space: page.space?.key,
              version: page.version?.number,
              content: page.body?.storage?.value,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Failed to get page: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    }
  );
  
  server.registerTool(
    'create-page',
    {
      title: 'Create Confluence Page',
      description: 'Create a new page in a Confluence space',
      inputSchema: z.object({
        spaceKey: z.string().describe('Target space key'),
        title: z.string().describe('Page title'),
        content: z.string().describe('Page content in HTML storage format'),
        parentId: z.string().optional().describe('Parent page ID for hierarchy'),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ spaceKey, title, content, parentId }) => {
      try {
        const page = await confluence.createPage({
          spaceKey,
          title,
          content,
          parentId,
        });
        
        return {
          content: [{
            type: 'text',
            text: `Page created successfully:\n` +
                  `ID: ${page.id}\n` +
                  `URL: ${page._links.webui}`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Failed to create page: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    }
  );
  
  server.registerTool(
    'update-page',
    {
      title: 'Update Confluence Page',
      description: 'Update an existing Confluence page',
      inputSchema: z.object({
        pageId: z.string().describe('Page ID to update'),
        title: z.string().optional().describe('New title'),
        content: z.string().optional().describe('New content in HTML'),
        minorEdit: z.boolean().default(false).describe('Mark as minor edit'),
        message: z.string().optional().describe('Edit message'),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ pageId, title, content, minorEdit, message }) => {
      try {
        const page = await confluence.updatePage(pageId, {
          title,
          content,
          minorEdit,
          message,
        });
        
        return {
          content: [{
            type: 'text',
            text: `Page updated successfully:\n` +
                  `Version: ${page.version?.number}\n` +
                  `URL: ${page._links.webui}`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Failed to update page: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    }
  );
  
  server.registerTool(
    'delete-page',
    {
      title: 'Delete Confluence Page',
      description: 'Permanently delete a Confluence page',
      inputSchema: z.object({
        pageId: z.string().describe('Page ID to delete'),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
      },
    },
    async ({ pageId }) => {
      try {
        await confluence.deletePage(pageId);
        
        return {
          content: [{
            type: 'text',
            text: `Page ${pageId} deleted successfully`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Failed to delete page: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    }
  );
}
```

```typescript
// src/resources/pages.ts
import type { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import type { ConfluenceClient } from '../client/confluence';

export function registerPageResources(
  server: McpServer,
  confluence: ConfluenceClient
) {
  server.registerResource(
    'page-content',
    new ResourceTemplate('confluence://page/{pageId}', {
      list: async () => {
        const pages = await confluence.getRecentPages(20);
        return {
          resources: pages.map(page => ({
            uri: `confluence://page/${page.id}`,
            name: page.title,
            description: `Space: ${page.space?.key}`,
          })),
        };
      },
      complete: {
        pageId: async (value) => {
          const pages = await confluence.search(value);
          return pages.map(page => ({
            value: page.id,
            label: `${page.title} (${page.space?.key})`,
          }));
        },
      },
    }),
    {
      title: 'Confluence Page Content',
      description: 'Access Confluence page content',
      mimeType: 'text/markdown',
    },
    async (uri, { pageId }) => {
      const page = await confluence.getPage(pageId);
      
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/markdown',
          text: page.body?.export_view?.value || page.body?.storage?.value || '',
        }],
      };
    }
  );
}
```

```typescript
// src/prompts/review.ts
import type { McpServer } from '@modelcontextprotocol/server';
import type { ConfluenceClient } from '../client/confluence';
import { z } from 'zod';

export function registerReviewPrompts(
  server: McpServer,
  confluence: ConfluenceClient
) {
  server.registerPrompt(
    'technical-review',
    {
      title: 'Technical Review',
      description: 'Generate a technical review prompt for a Confluence page',
      argsSchema: z.object({
        pageId: z.string().describe('Page ID to review'),
        focus: z.enum(['accuracy', 'completeness', 'clarity', 'all'])
          .default('all')
          .describe('Review focus area'),
      }),
    },
    async ({ pageId, focus }) => {
      const page = await confluence.getPage(pageId);
      
      const focusInstructions = {
        accuracy: 'Review for technical accuracy and correctness',
        completeness: 'Review for completeness and missing information',
        clarity: 'Review for clarity and readability',
        all: 'Review for technical accuracy, completeness, and clarity',
      };
      
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Please perform a technical review of the following Confluence page:\n\n` +
                  `Title: ${page.title}\n` +
                  `Space: ${page.space?.name}\n\n` +
                  `Content:\n${page.body?.storage?.value}\n\n` +
                  `${focusInstructions[focus]}.\n\n` +
                  `Provide specific feedback on:\n` +
                  `1. Issues found\n` +
                  `2. Suggestions for improvement\n` +
                  `3. Missing information (if any)`,
          },
        }],
      };
    }
  );
}
```

---

## Summary

### Key Takeaways

1. **Architecture**: MCP uses JSON-RPC 2.0 over stdio (local) or Streamable HTTP (remote)
2. **Capabilities**: Declare tools, resources, and prompts during server initialization
3. **Tools**: Use strict Zod schemas, clear descriptions, and proper error handling
4. **Resources**: Implement URI templates with list and completion callbacks
5. **Prompts**: Create reusable templates for common workflows
6. **Error Handling**: Use JSON-RPC errors for protocol issues, `isError: true` for tool execution errors
7. **Security**: Validate inputs, use environment variables for credentials, implement rate limiting
8. **SDKs**: Official SDKs available for TypeScript, Python, C#, Go (Tier 1), and more

### Next Steps

1. Set up project with TypeScript SDK
2. Implement Confluence API client
3. Register tools for CRUD operations
4. Add resources for page access
5. Create prompts for common workflows
6. Test with MCP Inspector
7. Deploy with appropriate transport
