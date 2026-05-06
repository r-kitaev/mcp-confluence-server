import { z } from 'zod';

const ConfigSchema = z.object({
  confluenceBaseUrl: z.string().url(),
  confluenceEmail: z.string().email(),
  confluenceApiToken: z.string().min(1),
  mcpServerToken: z.string().optional(),
  port: z.string().transform(Number).default('3000'),
  allowedOrigins: z.string().optional()
});

export function loadConfig(): z.infer<typeof ConfigSchema> {
  const envVars = {
    confluenceBaseUrl: process.env.CONFLUENCE_BASE_URL,
    confluenceEmail: process.env.CONFLUENCE_EMAIL,
    confluenceApiToken: process.env.CONFLUENCE_API_TOKEN,
    mcpServerToken: process.env.MCP_SERVER_TOKEN,
    port: process.env.PORT,
    allowedOrigins: process.env.ALLOWED_ORIGINS
  };

  try {
    return ConfigSchema.parse(envVars);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors
        .filter(e => e.code === 'invalid_type' && e.received === 'undefined')
        .map(e => e.path[0]);

      if (missingFields.length > 0) {
        throw new Error(
          `Missing required environment variables: ${missingFields.join(', ')}. ` +
          'Please check your .env file or environment configuration.'
        );
      }

      throw new Error(
        `Invalid environment variable configuration: ${error.message}`
      );
    }
    throw error;
  }
}
