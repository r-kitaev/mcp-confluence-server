# MCP Resources

## Introduction

MCP Resources provide URI-based access to Confluence content. Unlike tools (which are function calls), resources are accessed via URIs and return content in specific MIME types.

### Resources vs Tools

| Aspect | Tools | Resources |
|--------|-------|-----------|
| **Access Pattern** | Function call with arguments | URI template with parameters |
| **Return Format** | Structured response with metadata | Raw content in specified MIME type |
| **Use Case** | Actions, mutations, complex queries | Direct content access, reading |
| **Example** | `getSpace({ spaceId: "DEV" })` | `confluence://space/DEV` |

Resources are ideal for:
- Reading content without side effects
- URI-based content addressing
- Integration with systems that expect URL-like access patterns

## Resource Overview

| Resource | URI Template | MIME Type | Description |
|----------|--------------|-----------|-------------|
| `space` | `confluence://space/{spaceId}` | `application/json` | Space information |
| `page` | `confluence://page/{pageId}` | `text/markdown` | Page content in Markdown |
| `page-attachments` | `confluence://page/{pageId}/attachments` | `application/json` | Page attachments list |

---

## Resources Reference

### confluence://space/{spaceId}

Access information about a Confluence space.

**Resource Name**: `space`

**URI Template**: `confluence://space/{spaceId}`

**MIME Type**: `application/json`

**Description**: Retrieve space metadata including key, name, description, homepage ID, creation date, and web URL.

**Parameters**:
- `spaceId` (string): The space key or ID (e.g., "DEV", "TEAM", or numeric ID)

**Example URI**:
```
confluence://space/DEV
```

**Example Response**:
```json
{
  "key": "DEV",
  "name": "Development Team",
  "description": "Documentation for the development team",
  "homepageId": "12345",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "webUrl": "https://your-company.atlassian.net/wiki/spaces/DEV"
}
```

**Response Fields**:
- `key` (string): Space key (short identifier)
- `name` (string): Full space name
- `description` (string | undefined): Space description
- `homepageId` (string | undefined): ID of the homepage
- `createdAt` (string): ISO 8601 timestamp of space creation
- `webUrl` (string): Direct URL to the space in Confluence

**Error Handling**:
- Throws error if space doesn't exist
- Throws error if user lacks permission to view the space
- Error format: `Error getting space: <error message>`

---

### confluence://page/{pageId}

Access Confluence page content converted to Markdown.

**Resource Name**: `page`

**URI Template**: `confluence://page/{pageId}`

**MIME Type**: `text/markdown`

**Description**: Retrieve page content automatically converted from HTML to Markdown format. Includes the page title as a heading.

**Parameters**:
- `pageId` (string): The numeric page ID

**Example URI**:
```
confluence://page/987654
```

**Example Response**:
```markdown
# API Documentation

## Overview

This document describes the REST API endpoints available for integration.

## Authentication

All API requests require authentication using Bearer tokens.

### Obtaining a Token

1. Navigate to **Settings** > **API Tokens**
2. Click **Create Token**
3. Copy the token for use in requests

## Endpoints

### GET /api/users

Returns a list of users in the system.

**Parameters:**
- `limit` (optional): Maximum number of results (default: 25)
- `cursor` (optional): Pagination token

**Response:**
```json
{
  "users": [...],
  "pagination": {
    "hasNext": true,
    "nextCursor": "abc123"
  }
}
```

### POST /api/users

Creates a new user.

**Required Fields:**
- `email`
- `name`
- `role`
```

**Response Format**:
The response is plain Markdown text with:
- Page title as H1 heading (`# Title`)
- Content converted from HTML to Markdown
- Proper heading hierarchy (H1-H6)
- Formatted lists, links, and code blocks

**Error Handling**:
- Throws error if page doesn't exist
- Throws error if user lacks permission to view the page
- Error format: `Error getting page: <error message>`

---

### confluence://page/{pageId}/attachments

Access the list of attachments for a Confluence page.

**Resource Name**: `page-attachments`

**URI Template**: `confluence://page/{pageId}/attachments`

**MIME Type**: `application/json`

**Description**: Retrieve metadata about all attachments (images, documents, files) uploaded to a specific page.

**Parameters**:
- `pageId` (string): The numeric page ID

**Example URI**:
```
confluence://page/987654/attachments
```

**Example Response**:
```json
{
  "pageId": "987654",
  "attachments": [
    {
      "id": "att123",
      "title": "screenshot.png",
      "mediaType": "image/png",
      "fileSize": 245678,
      "downloadLink": "https://your-company.atlassian.net/wiki/download/attachments/987654/screenshot.png"
    },
    {
      "id": "att124",
      "title": "requirements.pdf",
      "mediaType": "application/pdf",
      "fileSize": 1024567,
      "downloadLink": "https://your-company.atlassian.net/wiki/download/attachments/987654/requirements.pdf"
    }
  ],
  "total": 2
}
```

**Response Fields**:
- `pageId` (string): The page ID these attachments belong to
- `attachments` (array): List of attachment objects
  - `id` (string): Attachment ID
  - `title` (string): File name
  - `mediaType` (string): MIME type of the file
  - `fileSize` (number): File size in bytes
  - `downloadLink` (string): Direct download URL
- `total` (number): Total number of attachments

**Error Handling**:
- Throws error if page doesn't exist
- Throws error if user lacks permission to view page attachments
- Error format: `Error getting attachments: <error message>`

---

## HTML to Markdown Conversion

The `confluence://page/{pageId}` resource automatically converts Confluence HTML content to Markdown. This section describes the conversion behavior.

### Supported HTML Tags

| HTML Tag | Markdown Output | Example |
|----------|----------------|---------|
| `<h1>` - `<h6>` | `#` - `######` | `<h1>Title</h1>` → `# Title` |
| `<p>` | Paragraph breaks | `<p>Text</p>` → `Text\n\n` |
| `<strong>`, `<b>` | `**bold**` | `<strong>bold</strong>` → `**bold**` |
| `<em>`, `<i>` | `*italic*` | `<em>italic</em>` → `*italic*` |
| `<a href="...">` | `[text](url)` | `<a href="https://example.com">Link</a>` → `[Link](https://example.com)` |
| `<ul>`, `<ol>` | `-` or `1.` lists | See examples below |
| `<li>` | List item | `<li>Item</li>` → `- Item` |
| `<code>` | `` `code` `` | `<code>var x</code>` → `` `var x` `` |
| `<pre>` | Code blocks | See examples below |
| `<blockquote>` | `> quote` | `<blockquote>Text</blockquote>` → `> Text` |
| `<hr>` | `---` | `<hr/>` → `---` |
| `<br>` | Line break | `<br/>` → `\n` |
| `<img>` | `![alt](src)` | `<img src="pic.png" alt="desc"/>` → `![desc](pic.png)` |
| `<table>` | Markdown tables | See examples below |

### Conversion Examples

#### Headings

**HTML**:
```html
<h1>Main Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
```

**Markdown**:
```markdown
# Main Title
## Section
### Subsection
```

#### Text Formatting

**HTML**:
```html
<p>This is <strong>bold</strong> and <em>italic</em> text with <a href="https://example.com">a link</a>.</p>
```

**Markdown**:
```markdown
This is **bold** and *italic* text with [a link](https://example.com).
```

#### Lists

**HTML**:
```html
<ul>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ul>
```

**Markdown**:
```markdown
- First item
- Second item
- Third item
```

#### Code Blocks

**HTML**:
```html
<pre><code>function hello() {
  console.log("Hello, World!");
}</code></pre>
```

**Markdown**:
```markdown
    function hello() {
      console.log("Hello, World!");
    }
```

Or with fence syntax:

````markdown
```javascript
function hello() {
  console.log("Hello, World!");
}
```
````

#### Tables

**HTML**:
```html
<table>
  <tr>
    <th>Column 1</th>
    <th>Column 2</th>
  </tr>
  <tr>
    <td>Data 1</td>
    <td>Data 2</td>
  </tr>
</table>
```

**Markdown**:
```markdown
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
```

### HTML Entity Handling

HTML entities are automatically decoded:

| Entity | Output |
|--------|--------|
| `&amp;` | `&` |
| `&lt;` | `<` |
| `&gt;` | `>` |
| `&quot;` | `"` |
| `&#39;` | `'` |
| `&nbsp;` | (space) |

**Example**:
```html
<p>5 &lt; 10 &amp; 10 &gt; 5</p>
```

Converts to:
```markdown
5 < 10 & 10 > 5
```

---

## Usage Example

Here's a complete example of using the page resource:

**Request URI**:
```
confluence://page/987654
```

**Response** (MIME type: `text/markdown`):
```markdown
# API Integration Guide

## Overview

This guide explains how to integrate with our API.

## Authentication

Use **Bearer tokens** for authentication.

### Steps

1. Generate a token in **Settings**
2. Include in request header: `Authorization: Bearer <token>`
3. Token expires after 30 days

## Rate Limits

- **Standard**: 100 requests/minute
- **Premium**: 1000 requests/minute

For more information, see [API Documentation](https://example.com/api).
```

**Parsed Result**:
- Title: `API Integration Guide`
- Format: Markdown
- Contains: Headings, bold text, numbered list, code, link
- Ready for: Display in Markdown viewers, further processing, or AI analysis

---

## Best Practices

1. **Use resources for reading**: Resources are optimized for read-only access
2. **Use tools for writing**: For create/update/delete operations, use the corresponding tools
3. **Handle errors gracefully**: Catch and handle URI resolution errors
4. **Respect MIME types**: Process responses according to their MIME type
5. **Cache when appropriate**: Resource responses can be cached for performance (respect cache headers if provided)
