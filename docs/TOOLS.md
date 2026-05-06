# MCP Tools

## Introduction

MCP Tools are functions that the MCP Confluence Server exposes to AI assistants. Tools allow you to interact with Confluence Cloud programmatically - reading pages, creating content, managing spaces, and more.

Each tool has:
- **Name**: Unique identifier for the tool
- **Description**: What the tool does
- **Input Schema**: Required and optional parameters with types
- **Hints**: Metadata about the tool's behavior (read-only, destructive, etc.)

## Tool Overview

| Tool | Description | ReadOnly | Destructive |
|------|-------------|----------|-------------|
| `getSpace` | Get space information by ID or key | ✅ | ❌ |
| `listSpaces` | List all spaces with pagination | ✅ | ❌ |
| `getPage` | Get page content by ID | ✅ | ❌ |
| `listPages` | List pages in a space | ✅ | ❌ |
| `createPage` | Create a new page | ❌ | ❌ |
| `updatePage` | Update an existing page | ❌ | ❌ |
| `deletePage` | Delete a page | ❌ | ✅ |
| `getAttachments` | Get page attachments | ✅ | ❌ |

---

## Tools Reference

### getSpace

Get information about a Confluence space by ID or key.

**Description**: Retrieve detailed information about a specific space including its key, name, type, status, and metadata.

**Input Schema**:
```typescript
{
  spaceId: string  // Required: Space ID or key (e.g., "DEV" or "12345")
}
```

**Field Details**:
- `spaceId` (string, required): The space identifier. Can be either the space key (e.g., "DEV", "TEAM") or the numeric space ID.

**Example Request**:
```json
{
  "tool": "getSpace",
  "arguments": {
    "spaceId": "DEV"
  }
}
```

**Example Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"id\": \"12345\",\n  \"key\": \"DEV\",\n  \"name\": \"Development Team\",\n  \"type\": \"global\",\n  \"status\": \"current\",\n  \"createdAt\": \"2024-01-15T10:30:00.000Z\",\n  \"webUrl\": \"https://your-company.atlassian.net/wiki/spaces/DEV\"\n}"
    }
  ]
}
```

**Error Handling**:
- Returns error if space ID is invalid or space doesn't exist
- Returns error if user lacks permission to view the space
- Error format: `Error getting space: <error message>`

---

### listSpaces

Get a list of all Confluence spaces with cursor-based pagination.

**Description**: Retrieve a paginated list of spaces. Use the cursor from the response to fetch the next page of results.

**Input Schema**:
```typescript
{
  limit?: number,    // Optional: Max results (1-100), default 25
  cursor?: string    // Optional: Pagination token from previous request
}
```

**Field Details**:
- `limit` (number, optional): Maximum number of spaces to return. Must be between 1 and 100. Defaults to 25.
- `cursor` (string, optional): Pagination token returned from a previous request. Omit for the first request.

**Example Request**:
```json
{
  "tool": "listSpaces",
  "arguments": {
    "limit": 10
  }
}
```

**Example Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"spaces\": [\n    {\n      \"id\": \"12345\",\n      \"key\": \"DEV\",\n      \"name\": \"Development Team\",\n      \"type\": \"global\",\n      \"status\": \"current\",\n      \"webUrl\": \"https://your-company.atlassian.net/wiki/spaces/DEV\"\n    },\n    {\n      \"id\": \"12346\",\n      \"key\": \"TEAM\",\n      \"name\": \"Team Documentation\",\n      \"type\": \"global\",\n      \"status\": \"current\",\n      \"webUrl\": \"https://your-company.atlassian.net/wiki/spaces/TEAM\"\n    }\n  ],\n  \"pagination\": {\n    \"hasNext\": true,\n    \"nextCursor\": \"eyJpZCI6MTIzNDZ9\"\n  }\n}"
    }
  ]
}
```

**Error Handling**:
- Returns error if limit is outside valid range (1-100)
- Returns error if cursor is invalid
- Error format: `Error listing spaces: <error message>`

---

### getPage

Get information about a Confluence page by ID.

**Description**: Retrieve page metadata and optionally the body content and labels.

**Input Schema**:
```typescript
{
  pageId: string,           // Required: Page ID
  includeBody?: boolean,    // Optional: Include body content, default true
  includeLabels?: boolean,  // Optional: Include labels, default false
  bodyFormat?: 'storage' | 'view'  // Optional: Content format, default 'view'
}
```

**Field Details**:
- `pageId` (string, required): The numeric page ID.
- `includeBody` (boolean, optional): Whether to include the page body content. Defaults to `true`.
- `includeLabels` (boolean, optional): Whether to include page labels. Defaults to `false`.
- `bodyFormat` (enum, optional): Format for body content. Use `storage` for raw XHTML format, `view` for rendered HTML. Defaults to `view`.

**Example Request**:
```json
{
  "tool": "getPage",
  "arguments": {
    "pageId": "987654",
    "includeBody": true,
    "bodyFormat": "view"
  }
}
```

**Example Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"id\": \"987654\",\n  \"title\": \"API Documentation\",\n  \"spaceId\": \"12345\",\n  \"parentId\": \"111111\",\n  \"version\": 3,\n  \"createdAt\": \"2024-02-01T09:00:00.000Z\",\n  \"updatedAt\": \"2024-03-15T14:30:00.000Z\",\n  \"webUrl\": \"https://your-company.atlassian.net/wiki/spaces/DEV/pages/987654\",\n  \"editUrl\": \"https://your-company.atlassian.net/wiki/spaces/DEV/pages/987654/_edit\",\n  \"body\": \"Body content available (implement body retrieval)\"\n}"
    }
  ]
}
```

**Error Handling**:
- Returns error if page ID is invalid
- Returns error if page doesn't exist or user lacks permission
- Error format: `Error getting page: <error message>`

---

### listPages

Get a list of pages in a Confluence space with cursor-based pagination.

**Description**: Retrieve a paginated list of pages within a space. Can filter by parent page to get child pages only.

**Input Schema**:
```typescript
{
  spaceId: string,      // Required: Space ID
  parentId?: string,    // Optional: Parent page ID for child pages
  limit?: number,       // Optional: Max results (1-100), default 25
  cursor?: string       // Optional: Pagination token from previous request
}
```

**Field Details**:
- `spaceId` (string, required): The space ID to list pages from.
- `parentId` (string, optional): If provided, only returns direct child pages of this parent. Omit to get all top-level pages.
- `limit` (number, optional): Maximum number of pages to return (1-100). Defaults to 25.
- `cursor` (string, optional): Pagination token for fetching the next page.

**Example Request**:
```json
{
  "tool": "listPages",
  "arguments": {
    "spaceId": "DEV",
    "limit": 20
  }
}
```

**Example Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"pages\": [\n    {\n      \"id\": \"987654\",\n      \"title\": \"API Documentation\",\n      \"spaceId\": \"12345\",\n      \"parentId\": \"111111\",\n      \"position\": 1,\n      \"createdAt\": \"2024-02-01T09:00:00.000Z\",\n      \"version\": 3,\n      \"webUrl\": \"https://your-company.atlassian.net/wiki/spaces/DEV/pages/987654\"\n    }\n  ],\n  \"pagination\": {\n    \"hasNext\": false,\n    \"nextCursor\": null\n  }\n}"
    }
  ]
}
```

**Error Handling**:
- Returns error if space ID is invalid
- Returns error if parent page doesn't exist
- Error format: `Error listing pages: <error message>`

---

### createPage

Create a new page in Confluence.

**Description**: Create a new page with the specified title, body content, and optional parent page for hierarchy.

**Input Schema**:
```typescript
{
  spaceId: string,                          // Required: Space ID
  title: string,                            // Required: Page title (1-2000 chars)
  body: string,                             // Required: Content in Confluence storage format (XHTML)
  parentId?: string,                        // Optional: Parent page ID for hierarchy
  representation?: 'storage' | 'atlas_doc_format'  // Optional: Content format, default 'storage'
}
```

**Field Details**:
- `spaceId` (string, required): The space ID where the page will be created.
- `title` (string, required): Page title. Must be 1-2000 characters.
- `body` (string, required): Page content in Confluence storage format (XHTML). See examples below.
- `parentId` (string, optional): If provided, creates the page as a child of the specified parent page.
- `representation` (enum, optional): Content format. Use `storage` for raw XHTML, `atlas_doc_format` for Atlassian's document format. Defaults to `storage`.

**Example Request**:
```json
{
  "tool": "createPage",
  "arguments": {
    "spaceId": "DEV",
    "title": "New Feature Documentation",
    "body": "<h1>Feature Overview</h1><p>This is the new feature documentation.</p><h2>Installation</h2><p>Follow these steps to install...</p>",
    "parentId": "111111"
  }
}
```

**Example Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"success\": true,\n  \"pageId\": \"999888\",\n  \"title\": \"New Feature Documentation\",\n  \"spaceId\": \"12345\",\n  \"version\": 1,\n  \"webUrl\": \"https://your-company.atlassian.net/wiki/spaces/DEV/pages/999888\",\n  \"editUrl\": \"https://your-company.atlassian.net/wiki/spaces/DEV/pages/999888/_edit\"\n}"
    }
  ]
}
```

**Error Handling**:
- Returns error if title is empty or exceeds 2000 characters
- Returns error if space doesn't exist or user lacks permission
- Returns error if parent page doesn't exist (when parentId is provided)
- Error format: `Error creating page: <error message>`

---

### updatePage

Update an existing Confluence page.

**Description**: Update the title, body content, or both for an existing page. Requires the current version number + 1.

**Input Schema**:
```typescript
{
  pageId: string,           // Required: Page ID to update
  title?: string,           // Optional: New title (1-2000 chars)
  body?: string,            // Optional: New content in storage format
  version: number,          // Required: Current version + 1
  representation?: 'storage' | 'atlas_doc_format',  // Optional: Content format, default 'storage'
  updateMessage?: string    // Optional: Version change message
}
```

**Field Details**:
- `pageId` (string, required): The ID of the page to update.
- `title` (string, optional): New page title. If omitted, title remains unchanged.
- `body` (string, optional): New page content. If omitted, body remains unchanged.
- `version` (number, required): **Must be current version number + 1**. Confluence uses optimistic locking to prevent conflicts.
- `representation` (enum, optional): Content format. Defaults to `storage`.
- `updateMessage` (string, optional): Message describing the changes for version history.

**Example Request**:
```json
{
  "tool": "updatePage",
  "arguments": {
    "pageId": "987654",
    "title": "Updated API Documentation",
    "body": "<h1>Updated Content</h1><p>This section has been revised.</p>",
    "version": 4,
    "updateMessage": "Updated API examples"
  }
}
```

**Example Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"success\": true,\n  \"pageId\": \"987654\",\n  \"title\": \"Updated API Documentation\",\n  \"version\": 4,\n  \"updatedAt\": \"2024-03-20T11:45:00.000Z\",\n  \"updateMessage\": \"Updated API examples\",\n  \"webUrl\": \"https://your-company.atlassian.net/wiki/spaces/DEV/pages/987654\"\n}"
    }
  ]
}
```

**Error Handling**:
- Returns error if version number is incorrect (must be current + 1)
- Returns error if page doesn't exist or user lacks permission
- Returns error if title exceeds 2000 characters
- Error format: `Error updating page: <error message>. Убедитесь что version number корректен.`

---

### deletePage

Delete a Confluence page.

**Description**: Delete a page either permanently (requires admin) or move to trash.

**Input Schema**:
```typescript
{
  pageId: string,     // Required: Page ID to delete
  purge?: boolean     // Optional: True = permanent delete, false = move to trash (default)
}
```

**Field Details**:
- `pageId` (string, required): The ID of the page to delete.
- `purge` (boolean, optional): If `true`, permanently deletes the page (requires admin permissions). If `false` (default), moves the page to trash where it can be restored.

**Example Request**:
```json
{
  "tool": "deletePage",
  "arguments": {
    "pageId": "987654",
    "purge": false
  }
}
```

**Example Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"success\": true,\n  \"pageId\": \"987654\",\n  \"action\": \"moved_to_trash\"\n}"
    }
  ]
}
```

**Error Handling**:
- Returns error if page doesn't exist
- Returns error if user lacks delete permission
- Returns error if purge=true but user lacks admin permission
- Error format: `Error deleting page: <error message>`

---

### getAttachments

Get a list of attachments for a Confluence page.

**Description**: Retrieve all attachments (images, documents, etc.) uploaded to a specific page.

**Input Schema**:
```typescript
{
  pageId: string,     // Required: Page ID
  limit?: number      // Optional: Max results (1-100), default 25
}
```

**Field Details**:
- `pageId` (string, required): The ID of the page to get attachments from.
- `limit` (number, optional): Maximum number of attachments to return (1-100). Defaults to 25.

**Example Request**:
```json
{
  "tool": "getAttachments",
  "arguments": {
    "pageId": "987654",
    "limit": 10
  }
}
```

**Example Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"attachments\": [\n    {\n      \"id\": \"att123\",\n      \"title\": \"screenshot.png\",\n      \"mediaType\": \"image/png\",\n      \"fileSize\": 245678,\n      \"downloadLink\": \"https://your-company.atlassian.net/wiki/download/attachments/987654/screenshot.png\"\n    },\n    {\n      \"id\": \"att124\",\n      \"title\": \"requirements.pdf\",\n      \"mediaType\": \"application/pdf\",\n      \"fileSize\": 1024567,\n      \"downloadLink\": \"https://your-company.atlassian.net/wiki/download/attachments/987654/requirements.pdf\"\n    }\n  ],\n  \"pagination\": {\n    \"total\": 2\n  }\n}"
    }
  ]
}
```

**Error Handling**:
- Returns error if page doesn't exist
- Returns error if user lacks permission to view page attachments
- Error format: `Error getting attachments: <error message>`

---

## Pagination

Two tools support cursor-based pagination: `listSpaces` and `listPages`.

### How Cursor-Based Pagination Works

1. **First Request**: Omit the `cursor` parameter
2. **Check Response**: Look at `pagination.hasNext` - if `true`, more results exist
3. **Next Request**: Use `pagination.nextCursor` as the `cursor` parameter
4. **Repeat**: Continue until `hasNext` is `false`

### Example: Iterating Through All Spaces

```typescript
async function getAllSpaces() {
  let allSpaces = [];
  let cursor = undefined;
  
  do {
    const response = await callTool('listSpaces', {
      limit: 100,
      cursor
    });
    
    const data = JSON.parse(response.content[0].text);
    allSpaces.push(...data.spaces);
    cursor = data.pagination.nextCursor;
    
  } while (cursor);
  
  return allSpaces;
}
```

### Pagination Response Format

Both tools return a consistent pagination structure:

```json
{
  "spaces": [...],  // or "pages": [...]
  "pagination": {
    "hasNext": true,
    "nextCursor": "eyJpZCI6MTIzNDZ9"
  }
}
```

- `hasNext` (boolean): `true` if more results are available
- `nextCursor` (string | null): Token to fetch the next page, or `null` if no more results

---

## Usage Example

Here's a complete example of using `getSpace`:

**Request**:
```json
{
  "tool": "getSpace",
  "arguments": {
    "spaceId": "DEV"
  }
}
```

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"id\": \"12345\",\n  \"key\": \"DEV\",\n  \"name\": \"Development Team\",\n  \"type\": \"global\",\n  \"status\": \"current\",\n  \"createdAt\": \"2024-01-15T10:30:00.000Z\",\n  \"webUrl\": \"https://your-company.atlassian.net/wiki/spaces/DEV\"\n}"
    }
  ]
}
```

**Parsed Result**:
- Space ID: `12345`
- Key: `DEV`
- Name: `Development Team`
- Type: `global` (vs `personal`)
- Status: `current` (vs `archived`)
- Web URL: Direct link to the space in Confluence

---

## Best Practices

1. **Always check error responses**: Tools return `isError: true` on failure
2. **Use pagination for large datasets**: Don't assume a single request returns all results
3. **Handle version conflicts**: When updating pages, always get the current version first
4. **Use appropriate hints**: Tools are marked with hints (readOnly, destructive) to help AI understand their behavior
5. **Validate input**: Ensure required fields are present before calling tools
