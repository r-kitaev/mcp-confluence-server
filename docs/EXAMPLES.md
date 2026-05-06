# Usage Examples

## Introduction

This guide provides real-world scenarios for using the MCP Confluence Server. Each scenario includes prerequisites, step-by-step instructions, example requests/responses, and expected outcomes.

**Scenarios Covered**:
1. [Documentation Maintenance](#scenario-1-documentation-maintenance)
2. [Content Migration](#scenario-2-content-migration)
3. [Content Audit](#scenario-3-content-audit)
4. [New Project Setup](#scenario-4-new-project-setup)
5. [Attachment Management](#scenario-5-attachment-management)

---

## Scenario 1: Documentation Maintenance

**Task**: Keep technical documentation up-to-date by reviewing and updating pages regularly.

### Use Case
You're responsible for maintaining API documentation. You need to:
- Review existing pages for accuracy
- Update outdated information
- Ensure consistent formatting across all docs

### Tools Used
- `listSpaces` - Find the documentation space
- `listPages` - Get all pages in the space
- `getPage` - Read page content
- `updatePage` - Update pages with corrections
- `pageReview` (prompt) - Get AI feedback on content

### Workflow

#### Step 1: Find the Documentation Space

```json
{
  "tool": "listSpaces",
  "arguments": {
    "limit": 25
  }
}
```

**Response**:
```json
{
  "spaces": [
    {
      "id": "12345",
      "key": "DEV",
      "name": "Development Team",
      "type": "global",
      "status": "current",
      "webUrl": "https://your-company.atlassian.net/wiki/spaces/DEV"
    },
    {
      "id": "12346",
      "key": "DOCS",
      "name": "Product Documentation",
      "type": "global",
      "status": "current",
      "webUrl": "https://your-company.atlassian.net/wiki/spaces/DOCS"
    }
  ],
  "pagination": {
    "hasNext": false,
    "nextCursor": null
  }
}
```

#### Step 2: List All Pages in the Space

```json
{
  "tool": "listPages",
  "arguments": {
    "spaceId": "DOCS",
    "limit": 50
  }
}
```

**Response**:
```json
{
  "pages": [
    {
      "id": "111111",
      "title": "API Documentation Home",
      "spaceId": "12346",
      "parentId": null,
      "position": 0,
      "version": 5,
      "webUrl": "https://your-company.atlassian.net/wiki/spaces/DOCS/pages/111111"
    },
    {
      "id": "222222",
      "title": "Authentication Guide",
      "spaceId": "12346",
      "parentId": "111111",
      "position": 1,
      "version": 3,
      "webUrl": "https://your-company.atlassian.net/wiki/spaces/DOCS/pages/222222"
    },
    {
      "id": "333333",
      "title": "REST API Reference",
      "spaceId": "12346",
      "parentId": "111111",
      "position": 2,
      "version": 8,
      "webUrl": "https://your-company.atlassian.net/wiki/spaces/DOCS/pages/333333"
    }
  ],
  "pagination": {
    "hasNext": false,
    "nextCursor": null
  }
}
```

#### Step 3: Get AI Review for a Page

```json
{
  "prompt": "pageReview",
  "arguments": {
    "pageId": "222222"
  }
}
```

**AI Feedback** (excerpt):
```markdown
## Review: Authentication Guide

### Issues Found:
1. **Outdated**: Still references OAuth 1.0 (should be OAuth 2.0)
2. **Missing**: No information about API key rotation
3. **Unclear**: Token expiration policy not clearly stated

### Recommendations:
- Update to OAuth 2.0 flow diagrams
- Add section on API key best practices
- Clarify token lifetime (currently ambiguous)
```

#### Step 4: Update the Page

```json
{
  "tool": "updatePage",
  "arguments": {
    "pageId": "222222",
    "title": "Authentication Guide",
    "body": "<h1>Authentication Guide</h1><h2>OAuth 2.0 Flow</h2><p>Our API uses OAuth 2.0 for authentication...</p><h2>API Key Rotation</h2><p>Best practices for rotating API keys...</p><h2>Token Lifetime</h2><p>Access tokens expire after 1 hour. Refresh tokens are valid for 30 days.</p>",
    "version": 4,
    "updateMessage": "Updated to OAuth 2.0, added API key rotation section"
  }
}
```

**Response**:
```json
{
  "success": true,
  "pageId": "222222",
  "title": "Authentication Guide",
  "version": 4,
  "updatedAt": "2024-03-20T15:30:00.000Z",
  "updateMessage": "Updated to OAuth 2.0, added API key rotation section",
  "webUrl": "https://your-company.atlassian.net/wiki/spaces/DOCS/pages/222222"
}
```

### Expected Outcome
- ✅ All documentation pages reviewed
- ✅ Outdated content identified and updated
- ✅ Consistent formatting across pages
- ✅ AI-assisted quality improvements

---

## Scenario 2: Content Migration

**Task**: Migrate content from an old space to a new reorganized space structure.

### Use Case
Your team is reorganizing documentation. You need to:
- Copy pages from old space to new space
- Maintain page hierarchy
- Update internal links
- Verify all content migrated correctly

### Tools Used
- `listPages` - Get pages from old space
- `getPage` - Read page content
- `createPage` - Create pages in new space
- `updatePage` - Fix links and references

### Workflow

#### Step 1: Get Source Pages

```json
{
  "tool": "listPages",
  "arguments": {
    "spaceId": "OLD",
    "limit": 100
  }
}
```

#### Step 2: Copy Each Page

For each page in the old space:

```json
{
  "tool": "getPage",
  "arguments": {
    "pageId": "111111",
    "includeBody": true,
    "bodyFormat": "storage"
  }
}
```

**Response**:
```json
{
  "id": "111111",
  "title": "Getting Started Guide",
  "spaceId": "OLD",
  "body": "<h1>Getting Started</h1><p>Welcome to our platform...</p><h2>Prerequisites</h2><ul><li>Node.js 18+</li><li>npm or yarn</li></ul>"
}
```

#### Step 3: Create in New Space

```json
{
  "tool": "createPage",
  "arguments": {
    "spaceId": "NEW",
    "title": "Getting Started Guide",
    "body": "<h1>Getting Started</h1><p>Welcome to our platform...</p><h2>Prerequisites</h2><ul><li>Node.js 18+</li><li>npm or yarn</li></ul>",
    "parentId": "999999"
  }
}
```

**Response**:
```json
{
  "success": true,
  "pageId": "888888",
  "title": "Getting Started Guide",
  "spaceId": "NEW",
  "version": 1,
  "webUrl": "https://your-company.atlassian.net/wiki/spaces/NEW/pages/888888",
  "editUrl": "https://your-company.atlassian.net/wiki/spaces/NEW/pages/888888/_edit"
}
```

#### Step 4: Update Internal Links

After migration, update links that referenced old pages:

```json
{
  "tool": "updatePage",
  "arguments": {
    "pageId": "888888",
    "body": "<h1>Getting Started</h1><p>For more information, see <a href='https://your-company.atlassian.net/wiki/spaces/NEW/pages/777777'>Advanced Topics</a>...</p>",
    "version": 2,
    "updateMessage": "Updated internal links to new space"
  }
}
```

### Expected Outcome
- ✅ All pages copied to new space
- ✅ Hierarchy preserved
- ✅ Internal links updated
- ✅ Old space archived or deleted

---

## Scenario 3: Content Audit

**Task**: Audit a space with 50+ pages to identify outdated, orphaned, or poorly organized content.

### Use Case
Your documentation space has grown organically. You need to:
- Find orphaned pages (no parent)
- Identify outdated content (not updated in 6+ months)
- Discover deeply nested pages (>5 levels)
- Get reorganization recommendations

### Tools Used
- `listSpaces` - Get space information
- `listPages` - Get all pages with metadata
- `contentAudit` (prompt) - Get AI-powered audit report

### Workflow

#### Step 1: Get Space Info

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
  "id": "12345",
  "key": "DEV",
  "name": "Development Team",
  "type": "global",
  "status": "current",
  "createdAt": "2023-01-15T10:30:00.000Z",
  "webUrl": "https://your-company.atlassian.net/wiki/spaces/DEV"
}
```

#### Step 2: Generate Audit Report

```json
{
  "prompt": "contentAudit",
  "arguments": {
    "spaceId": "DEV",
    "limit": 100
  }
}
```

**AI Audit Report** (excerpt):
```markdown
## Content Audit: Development Team (DEV)

### Statistics
- Total Pages: 52
- Homepage: "Development Team Home"

### Findings

#### 1. Orphaned Pages (5 found)
- "Legacy API v1" - Last updated 9 months ago
- "Old Onboarding Guide" - Last updated 12 months ago
- "Random Notes" - Personal content, should be moved

#### 2. Deeply Nested Pages (3 found)
- "Advanced Config" - 6 levels deep
- "OAuth Token Refresh" - 6 levels deep
- "OAuth Error Handling" - 6 levels deep

#### 3. Outdated Content (18 pages >6 months)
- Sprint retrospectives from 2023
- Q2 2023 planning documents
- Deprecated feature documentation

### Recommendations

**High Priority:**
1. Delete test/spam pages (2 pages)
2. Archive Legacy API documentation
3. Flatten OAuth section (reduce depth from 6 to 4)

**Medium Priority:**
4. Reorganize space structure
5. Archive 18 outdated pages
6. Add section dividers

**Estimated Effort**: 4-6 hours
```

#### Step 3: Act on Recommendations

Based on the audit:

```json
{
  "tool": "deletePage",
  "arguments": {
    "pageId": "12478",
    "purge": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "pageId": "12478",
  "action": "moved_to_trash"
}
```

### Expected Outcome
- ✅ Comprehensive audit report generated
- ✅ Problem pages identified
- ✅ Clear action plan with priorities
- ✅ Space structure improved

---

## Scenario 4: New Project Setup

**Task**: Create a complete documentation structure for a new project from scratch.

### Use Case
You're starting a new project and need to:
- Create a documentation home page
- Set up section pages (API, Architecture, Testing)
- Create child pages for each section
- Establish consistent formatting

### Tools Used
- `createPage` - Create new pages
- `listPages` - Verify structure

### Workflow

#### Step 1: Create Home Page

```json
{
  "tool": "createPage",
  "arguments": {
    "spaceId": "PROJ",
    "title": "Project Phoenix Documentation",
    "body": "<h1>Project Phoenix</h1><p>Welcome to the Project Phoenix documentation hub.</p><h2>Sections</h2><ul><li><a href='#api'>API Documentation</a></li><li><a href='#architecture'>Architecture</a></li><li><a href='#testing'>Testing</a></li><li><a href='#deployment'>Deployment</a></li></ul>"
  }
}
```

**Response**:
```json
{
  "success": true,
  "pageId": "100001",
  "title": "Project Phoenix Documentation",
  "spaceId": "PROJ",
  "version": 1,
  "webUrl": "https://your-company.atlassian.net/wiki/spaces/PROJ/pages/100001"
}
```

#### Step 2: Create Section Pages

```json
{
  "tool": "createPage",
  "arguments": {
    "spaceId": "PROJ",
    "title": "API Documentation",
    "body": "<h1>API Documentation</h1><p>This section covers all API endpoints and usage examples.</p>",
    "parentId": "100001"
  }
}
```

**Response**:
```json
{
  "success": true,
  "pageId": "100002",
  "title": "API Documentation",
  "spaceId": "PROJ",
  "parentId": "100001",
  "version": 1,
  "webUrl": "https://your-company.atlassian.net/wiki/spaces/PROJ/pages/100002"
}
```

Repeat for other sections:

```json
{
  "tool": "createPage",
  "arguments": {
    "spaceId": "PROJ",
    "title": "Architecture",
    "body": "<h1>Architecture</h1><p>System architecture and design decisions.</p>",
    "parentId": "100001"
  }
}
```

```json
{
  "tool": "createPage",
  "arguments": {
    "spaceId": "PROJ",
    "title": "Testing",
    "body": "<h1>Testing</h1><p>Testing strategy, test cases, and quality assurance.</p>",
    "parentId": "100001"
  }
}
```

#### Step 3: Create Child Pages

Under API Documentation (100002):

```json
{
  "tool": "createPage",
  "arguments": {
    "spaceId": "PROJ",
    "title": "Getting Started",
    "body": "<h1>API Getting Started</h1><h2>Quick Start</h2><p>Follow these steps to make your first API call...</p>",
    "parentId": "100002"
  }
}
```

```json
{
  "tool": "createPage",
  "arguments": {
    "spaceId": "PROJ",
    "title": "Authentication",
    "body": "<h1>API Authentication</h1><h2>OAuth 2.0</h2><p>Our API uses OAuth 2.0 for secure authentication...</p>",
    "parentId": "100002"
  }
}
```

```json
{
  "tool": "createPage",
  "arguments": {
    "spaceId": "PROJ",
    "title": "Endpoints Reference",
    "body": "<h1>API Endpoints</h1><h2>Users</h2><h3>GET /api/users</h3><p>Returns list of users...</p>",
    "parentId": "100002"
  }
}
```

#### Step 4: Verify Structure

```json
{
  "tool": "listPages",
  "arguments": {
    "spaceId": "PROJ",
    "limit": 20
  }
}
```

**Response**:
```json
{
  "pages": [
    {
      "id": "100001",
      "title": "Project Phoenix Documentation",
      "parentId": null,
      "position": 0
    },
    {
      "id": "100002",
      "title": "API Documentation",
      "parentId": "100001",
      "position": 1
    },
    {
      "id": "100003",
      "title": "Architecture",
      "parentId": "100001",
      "position": 2
    },
    {
      "id": "100004",
      "title": "Testing",
      "parentId": "100001",
      "position": 3
    },
    {
      "id": "100005",
      "title": "Getting Started",
      "parentId": "100002",
      "position": 1
    },
    {
      "id": "100006",
      "title": "Authentication",
      "parentId": "100002",
      "position": 2
    },
    {
      "id": "100007",
      "title": "Endpoints Reference",
      "parentId": "100002",
      "position": 3
    }
  ]
}
```

### Expected Outcome
- ✅ Hierarchical documentation structure created
- ✅ Home page with navigation
- ✅ Section pages organized logically
- ✅ Child pages under appropriate sections
- ✅ Ready for content population

---

## Scenario 5: Attachment Management

**Task**: Manage attachments (images, documents) across pages - identify unused attachments and clean up.

### Use Case
Your Confluence space has accumulated many attachments over time. You need to:
- List all attachments on a page
- Identify large or unused files
- Document attachment usage
- Clean up unnecessary files

### Tools Used
- `getAttachments` - List attachments for a page
- `listPages` - Find pages to audit

### Workflow

#### Step 1: Find Pages with Attachments

```json
{
  "tool": "listPages",
  "arguments": {
    "spaceId": "DEV",
    "limit": 50
  }
}
```

#### Step 2: Check Attachments for Each Page

```json
{
  "tool": "getAttachments",
  "arguments": {
    "pageId": "987654",
    "limit": 50
  }
}
```

**Response**:
```json
{
  "attachments": [
    {
      "id": "att001",
      "title": "architecture-diagram.png",
      "mediaType": "image/png",
      "fileSize": 524288,
      "downloadLink": "https://your-company.atlassian.net/wiki/download/attachments/987654/architecture-diagram.png"
    },
    {
      "id": "att002",
      "title": "screenshot-2023-01.png",
      "mediaType": "image/png",
      "fileSize": 1048576,
      "downloadLink": "https://your-company.atlassian.net/wiki/download/attachments/987654/screenshot-2023-01.png"
    },
    {
      "id": "att003",
      "title": "old-requirements.pdf",
      "mediaType": "application/pdf",
      "fileSize": 2097152,
      "downloadLink": "https://your-company.atlassian.net/wiki/download/attachments/987654/old-requirements.pdf"
    },
    {
      "id": "att004",
      "title": "meeting-notes.docx",
      "mediaType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "fileSize": 32768,
      "downloadLink": "https://your-company.atlassian.net/wiki/download/attachments/987654/meeting-notes.docx"
    }
  ],
  "pagination": {
    "total": 4
  }
}
```

#### Step 3: Analyze Attachments

Based on the response:

| Attachment | Size | Type | Assessment | Action |
|------------|------|------|------------|--------|
| architecture-diagram.png | 512 KB | Image | Current, referenced in page | ✅ Keep |
| screenshot-2023-01.png | 1 MB | Image | Outdated screenshot | ⚠️ Review |
| old-requirements.pdf | 2 MB | PDF | Superseded by new requirements | ❌ Delete |
| meeting-notes.docx | 32 KB | Document | Not relevant to page topic | ❌ Delete |

#### Step 4: Document Findings

Create a summary page or report:

```markdown
## Attachment Audit Results

### Page: API Documentation (987654)

**Total Attachments**: 4
**Total Size**: 3.5 MB

### Recommendations

**Keep:**
- architecture-diagram.png (512 KB) - Referenced in "System Overview" section

**Review:**
- screenshot-2023-01.png (1 MB) - Outdated UI, consider replacing with current screenshot

**Delete:**
- old-requirements.pdf (2 MB) - Superseded by new requirements doc
- meeting-notes.docx (32 KB) - Not relevant to documentation

**Potential Savings**: 2 MB (57% reduction)
```

### Expected Outcome
- ✅ Complete inventory of attachments
- ✅ Identification of unused/outdated files
- ✅ Cleanup recommendations documented
- ✅ Storage space optimized
- ✅ Documentation quality improved

---

## Additional Tips

### Batch Operations

For operations on multiple pages, use a loop pattern:

```typescript
async function updateMultiplePages(pageIds, updateFn) {
  const results = [];
  
  for (const pageId of pageIds) {
    const page = await callTool('getPage', { pageId, includeBody: true });
    const updated = await updateFn(page);
    
    if (updated) {
      const result = await callTool('updatePage', {
        pageId,
        ...updated,
        version: page.version + 1
      });
      results.push(result);
    }
  }
  
  return results;
}
```

### Error Handling

Always handle errors gracefully:

```typescript
try {
  const result = await callTool('getPage', { pageId: '12345' });
  // Process result
} catch (error) {
  if (error.message.includes('not found')) {
    console.log('Page does not exist');
  } else if (error.message.includes('permission')) {
    console.log('Insufficient permissions');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Pagination Best Practices

When dealing with large result sets:

```typescript
async function getAllPages(spaceId) {
  let allPages = [];
  let cursor = undefined;
  
  do {
    const response = await callTool('listPages', {
      spaceId,
      limit: 100,
      cursor
    });
    
    const data = JSON.parse(response.content[0].text);
    allPages.push(...data.pages);
    cursor = data.pagination.nextCursor;
    
  } while (cursor);
  
  return allPages;
}
```

### Version Management

Always get the current version before updating:

```typescript
async function safeUpdatePage(pageId, updates) {
  // Step 1: Get current page
  const page = await callTool('getPage', { pageId });
  const pageData = JSON.parse(page.content[0].text);
  
  // Step 2: Update with correct version
  const result = await callTool('updatePage', {
    pageId,
    ...updates,
    version: pageData.version + 1  // Critical!
  });
  
  return result;
}
```

---

## Conclusion

These scenarios demonstrate common patterns for working with Confluence content programmatically. Adapt these examples to your specific use cases and combine tools as needed for complex workflows.

For more detailed information about individual tools, see [TOOLS.md](./TOOLS.md). For resources and prompts, see [RESOURCES.md](./RESOURCES.md) and [PROMPTS.md](./PROMPTS.md).
