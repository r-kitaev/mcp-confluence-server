import type { ConfluenceConfig } from '../types.js';
import { ConfluenceAPIError } from '../types.js';

export class ConfluenceClient {
  protected baseUrl: string;
  protected apiToken: string;
  private rateLimitRemaining: number = 65000;
  private rateLimitReset: number = 0;

  constructor(config: ConfluenceConfig) {
    const cleanUrl = config.baseUrl.replace(/\/$/, '');
    // Use /rest/api for on-premise Confluence, /api/v2 for Cloud
    this.baseUrl = `${cleanUrl}/rest/api`;
    this.apiToken = config.apiToken;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async request<T>(method: string, endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
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

        const requestHeaders: Record<string, string> = {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json'
        };

        if (headers) {
          Object.assign(requestHeaders, headers);
        } else if (data) {
          requestHeaders['Content-Type'] = 'application/json';
        }

        let body: ArrayBuffer | string | null = null;
        if (data) {
          if (data instanceof Buffer) {
            body = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
          } else {
            body = JSON.stringify(data);
          }
        }

        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body
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

        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json() as T;
        }

        return {} as T;
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

  async downloadBinary(endpoint: string): Promise<Buffer> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ConfluenceAPIError(
        errorBody || `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
