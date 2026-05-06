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

export interface BlogPost {
  id: string;
  title: string;
  spaceId: string;
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

export interface Attachment {
  id: string;
  title: string;
  mediaType: string;
  fileSize: number;
  downloadLink: string;
  version: {
    number: number;
  };
  _links: {
    webui: string;
    base: string;
  };
}

export interface Comment {
  id: string;
  body: {
    storage: {
      value: string;
    };
  };
  createdAt: string;
  authorId: string;
  _links: {
    webui: string;
    base: string;
  };
}

export interface User {
  accountId: string;
  email: string;
  displayName: string;
  active: boolean;
  _links: {
    base: string;
  };
}

export interface SearchResults {
  totalSize: number;
  results: Array<{
    content: Page;
    excerpt: string;
    highlight?: any;
  }>;
  _links: {
    next?: string;
    base: string;
  };
}
