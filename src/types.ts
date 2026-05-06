export interface ConfluenceConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export class ConfluenceAPIError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ConfluenceAPIError';
    this.statusCode = statusCode;
  }
}

export interface PaginatedResponse<T> {
  results: T[];
  _links: {
    next?: string;
    base: string;
  };
}

export interface Space {
  id: string;
  key: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  _links: {
    webui: string;
    base: string;
  };
}

export interface Page {
  id: string;
  title: string;
  spaceId: string;
  parentId?: string;
  position: number;
  createdAt: string;
  version: {
    number: number;
    createdAt: string;
    message?: string;
  };
  _links: {
    webui: string;
    editui: string;
    base: string;
  };
}
