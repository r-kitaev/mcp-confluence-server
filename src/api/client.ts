import type { ConfluenceConfig } from '../types.js';
import { ConfluenceAPIError } from '../types.js';

export class ConfluenceClient {
  private baseUrl: string;
  private authHeader: string;
  private rateLimitRemaining: number = 65000;
  private rateLimitReset: number = 0;

  constructor(config: ConfluenceConfig) {
    const cleanUrl = config.baseUrl.replace(/\/$/, '');
    this.baseUrl = `${cleanUrl}/api/v2`;

    const credentials = `${config.email}:${config.apiToken}`;
    this.authHeader = Buffer.from(credentials).toString('base64');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async request<T>(method: string, endpoint: string, data?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (this.rateLimitRemaining < 100) {
          const waitTime = Math.max(0, this.rateLimitReset - Date.now());
          if (waitTime > 0) {
            await this.sleep(waitTime);
          }
        }

        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Basic ${this.authHeader}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: data ? JSON.stringify(data) : undefined
        });

        const remaining = response.headers.get('X-RateLimit-Remaining');
        const reset = response.headers.get('X-RateLimit-Reset');

        if (remaining) {
          this.rateLimitRemaining = parseInt(remaining, 10);
        }
        if (reset) {
          this.rateLimitReset = parseInt(reset, 10) * 1000;
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter
            ? parseInt(retryAfter, 10) * 1000 * Math.pow(2, attempt)
            : 1000 * Math.pow(2, attempt);

          await this.sleep(waitTime);
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          throw new ConfluenceAPIError(
            errorBody || `HTTP ${response.status}: ${response.statusText}`,
            response.status
          );
        }

        return await response.json() as T;
      } catch (error) {
        lastError = error as Error;

        if (error instanceof ConfluenceAPIError) {
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const backoffTime = 1000 * Math.pow(2, attempt);
          await this.sleep(backoffTime);
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }
}
