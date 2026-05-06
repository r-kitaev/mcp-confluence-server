import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ConfluenceClient } from './api/client.js';
import { loadConfig } from './config.js';
import { registerAllTools } from './tools/index.js';

export function createConfluenceServer(config?: { name?: string; version?: string }): McpServer {
  const serverName = config?.name ?? 'confluence-mcp';
  const serverVersion = config?.version ?? '1.0.0';

  const server = new McpServer({
    name: serverName,
    version: serverVersion
  });

  const appConfig = loadConfig();
  const client = new ConfluenceClient({
    baseUrl: appConfig.confluenceBaseUrl,
    email: appConfig.confluenceEmail,
    apiToken: appConfig.confluenceApiToken
  });

  registerAllTools(server, client);

  return server;
}
