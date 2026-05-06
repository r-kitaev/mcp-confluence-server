# MCP Prompts

## Introduction

MCP Prompts are pre-defined templates that generate structured prompts for AI assistants. They combine data retrieval from Confluence with carefully crafted instructions to help AI perform specific tasks like content review, audit, or analysis.

### Prompts vs Tools vs Resources

| Aspect | Tools | Resources | Prompts |
|--------|-------|-----------|---------|
| **Purpose** | Perform actions | Access content | Generate AI instructions |
| **Return** | Structured data | Raw content | AI prompt messages |
| **Use Case** | CRUD operations | Reading content | AI-assisted tasks |
| **Example** | `createPage()` | `confluence://page/123` | `pageReview({ pageId: "123" })` |

Prompts are ideal for:
- AI-assisted content review
- Automated content audits
- Structured analysis tasks
- Quality assurance workflows

## Prompt Overview

| Prompt | Arguments | Description |
|--------|-----------|-------------|
| `pageReview` | `pageId` (required), `limit` (optional) | AI-assisted page content review |
| `contentAudit` | `spaceId` (required), `limit` (optional) | AI-assisted space content audit |

---

## Prompts Reference

### pageReview

Generate a structured prompt for reviewing a Confluence page's content.

**Prompt Name**: `pageReview`

**Description**: Creates a comprehensive review prompt that asks an AI to analyze a page's content for clarity, accuracy, completeness, and improvement opportunities.

**Arguments**:

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `pageId` | string | ✅ Yes | - | ID of the page to review |

**Usage**:
```typescript
const result = await callPrompt('pageReview', {
  pageId: '987654'
});
```

**Generated Prompt Structure**:

The prompt returns a message object with the following structure:

```typescript
{
  messages: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Please review the following Confluence page and provide feedback on:
1. Clarity and structure
2. Technical accuracy
3. Missing information
4. Suggestions for improvement

Page: ${pageTitle}
Space ID: ${spaceId}
Last Updated: ${lastUpdated} (version ${versionNumber})

---

${pageContent}

Please provide detailed feedback on each of the four areas above.`
      }
    }
  ]
}
```

**Example Usage**:

**Request**:
```json
{
  "prompt": "pageReview",
  "arguments": {
    "pageId": "987654"
  }
}
```

**Returned Prompt** (what the AI sees):
```
Please review the following Confluence page and provide feedback on:
1. Clarity and structure
2. Technical accuracy
3. Missing information
4. Suggestions for improvement

Page: API Integration Guide
Space ID: DEV
Last Updated: 2024-03-15T14:30:00.000Z (version 3)

---

<h1>API Integration Guide</h1>
<h2>Overview</h2>
<p>This guide explains how to integrate with our REST API...</p>
<h2>Authentication</h2>
<p>All requests require Bearer token authentication...</p>

Please provide detailed feedback on each of the four areas above.
```

**Example AI Response**:
```markdown
## Review Feedback for "API Integration Guide"

### 1. Clarity and Structure
✅ **Strengths:**
- Clear hierarchical structure with proper headings
- Logical flow from overview to specific endpoints

⚠️ **Issues:**
- Introduction is too brief - should include use cases
- Missing table of contents for long document
- Code examples lack syntax highlighting

### 2. Technical Accuracy
✅ **Strengths:**
- Authentication flow is correctly described
- Rate limits are accurate

⚠️ **Issues:**
- Endpoint URL format is outdated (uses v1, should be v2)
- Missing required header `Content-Type: application/json`
- Error response format example is incomplete

### 3. Missing Information
❌ **Gaps:**
- No troubleshooting section
- Missing SDK examples (Python, JavaScript)
- No information about pagination
- Webhook documentation referenced but not linked
- Missing rate limit headers explanation

### 4. Suggestions for Improvement
💡 **Recommendations:**
1. Add interactive API explorer (Swagger/OpenAPI)
2. Include curl examples for each endpoint
3. Add "Common Issues" troubleshooting section
4. Create quickstart guide for first-time users
5. Add versioning policy documentation
6. Include Postman collection link
7. Add code samples in multiple languages

**Priority:** High - Document is foundational for API adoption
**Estimated Effort:** 2-3 hours for comprehensive update
```

**Use Cases**:

- **Technical Documentation Review**: Before publishing API docs, user guides, or technical specifications
- **Content Quality Assurance**: Periodic review of critical documentation
- **Pre-Publication Check**: Review new pages before making them public
- **Legacy Content Audit**: Identify outdated or inaccurate content in existing pages
- **Collaboration**: Get AI feedback before sending to human reviewers

**When to Use**:
- ✅ Technical documentation (API docs, architecture guides)
- ✅ User guides and tutorials
- ✅ Process documentation
- ✅ Knowledge base articles
- ✅ Specification documents

**When NOT to Use**:
- ❌ Simple pages with minimal content (e.g., meeting notes)
- ❌ Personal pages not intended for wide audience
- ❌ Pages under active real-time editing

---

### contentAudit

Generate a structured prompt for auditing the content structure of a Confluence space.

**Prompt Name**: `contentAudit`

**Description**: Creates a comprehensive audit prompt that analyzes a space's page hierarchy and identifies structural issues, orphaned pages, and reorganization opportunities.

**Arguments**:

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `spaceId` | string | ✅ Yes | - | ID of the space to audit |
| `limit` | number | ❌ No | 100 | Maximum pages to analyze |

**Usage**:
```typescript
const result = await callPrompt('contentAudit', {
  spaceId: 'DEV',
  limit: 150
});
```

**Generated Prompt Structure**:

```typescript
{
  messages: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Audit the content structure of Confluence space "${spaceName}" (${spaceKey}).

Space Statistics:
- Total Pages: ${totalPages}
- Homepage ID: ${homepageId}

Page Hierarchy:
${JSON.stringify(pageHierarchy, null, 2)}

Tasks:
1. Identify orphaned pages (no parent, not homepage)
2. Find deeply nested pages (>5 levels)
3. Suggest content reorganization
4. Identify outdated pages (not updated in 6+ months)

Please analyze the page structure and provide recommendations for improving the content organization.`
      }
    }
  ]
}
```

**Example Usage**:

**Request**:
```json
{
  "prompt": "contentAudit",
  "arguments": {
    "spaceId": "DEV",
    "limit": 100
  }
}
```

**Returned Prompt** (what the AI sees):
```
Audit the content structure of Confluence space "Development Team" (DEV).

Space Statistics:
- Total Pages: 52
- Homepage ID: 12345

Page Hierarchy:
[
  {
    "id": "12345",
    "title": "Development Team Home",
    "parentId": null,
    "position": 0
  },
  {
    "id": "12346",
    "title": "API Documentation",
    "parentId": "12345",
    "position": 1
  },
  {
    "id": "12347",
    "title": "Getting Started",
    "parentId": "12346",
    "position": 1
  },
  {
    "id": "12348",
    "title": "Legacy API v1",
    "parentId": null,
    "position": 2
  },
  ...
]

Tasks:
1. Identify orphaned pages (no parent, not homepage)
2. Find deeply nested pages (>5 levels)
3. Suggest content reorganization
4. Identify outdated pages (not updated in 6+ months)

Please analyze the page structure and provide recommendations for improving the content organization.
```

**Example AI Response**:
```markdown
## Content Audit Report: Development Team (DEV)

### Space Overview
- **Total Pages Analyzed**: 52
- **Homepage**: "Development Team Home" (ID: 12345)
- **Audit Date**: 2024-03-20

---

### 1. Orphaned Pages

**Found 5 orphaned pages** (no parent, not homepage):

| Page ID | Title | Last Updated | Recommendation |
|---------|-------|--------------|----------------|
| 12348 | Legacy API v1 | 2023-06-15 | Archive or delete - superseded by v2 |
| 12389 | Old Onboarding Guide | 2023-03-22 | Merge with new onboarding or archive |
| 12401 | Deprecated Features | 2023-01-10 | Delete - no longer relevant |
| 12456 | Random Notes | 2024-01-05 | Move to personal space or delete |
| 12478 | Test Page | 2024-02-28 | Delete - appears to be test content |

**Action Required**: Review and clean up orphaned pages to improve navigation.

---

### 2. Deeply Nested Pages

**Found 3 pages >5 levels deep**:

| Page ID | Title | Depth | Path |
|---------|-------|-------|------|
| 12501 | Advanced Configuration Options | 6 | Home > API > Auth > OAuth > Advanced > Config |
| 12502 | OAuth Token Refresh | 6 | Home > API > Auth > OAuth > Advanced > Refresh |
| 12503 | OAuth Error Handling | 6 | Home > API > Auth > OAuth > Advanced > Errors |

**Recommendation**: Flatten hierarchy by creating dedicated "OAuth" section page and moving these as direct children.

---

### 3. Content Reorganization Suggestions

#### Current Structure Issues:
1. **Mixed content types**: Technical docs and process docs are intermingled
2. **Unclear categorization**: Some pages could belong to multiple sections
3. **Missing section dividers**: No clear separation between major topics

#### Proposed New Structure:
```
Development Team Home
├── 📖 Documentation
│   ├── API Reference
│   ├── SDK Guides
│   └── Tutorials
├── 🏗️ Architecture
│   ├── System Design
│   ├── Database Schema
│   └── Integration Points
├── 📋 Processes
│   ├── Code Review
│   ├── Deployment
│   └── Incident Response
├── 🧪 Testing
│   ├── Test Strategy
│   ├── Test Cases
│   └── Performance Tests
└── 📦 Releases
    ├── Release Notes
    ├── Version History
    └── Rollback Procedures
```

---

### 4. Outdated Pages (Not Updated in 6+ Months)

**Found 18 pages not updated since before 2023-09-20**:

| Page ID | Title | Last Updated | Age | Action |
|---------|-------|--------------|-----|--------|
| 12348 | Legacy API v1 | 2023-06-15 | 9 months | Archive |
| 12355 | Q2 2023 Planning | 2023-06-30 | 9 months | Archive |
| 12367 | Old Sprint Retrospectives | 2023-07-15 | 8 months | Archive |
| 12389 | Old Onboarding Guide | 2023-03-22 | 12 months | Update or archive |
| ... | ... | ... | ... | ... |

**Recommendation**: Create "Archive" parent page and move outdated content there, or delete if no longer relevant.

---

### Summary & Priority Actions

**High Priority:**
1. Delete 2 obvious test/spam pages (12456, 12478)
2. Archive Legacy API v1 documentation (12348)
3. Flatten OAuth section hierarchy (reduce depth from 6 to 4)

**Medium Priority:**
4. Reorganize space structure per proposed hierarchy
5. Review and update/archive 18 outdated pages
6. Add section divider pages for better navigation

**Low Priority:**
7. Standardize page naming conventions
8. Add metadata/labels for better searchability

**Estimated Effort**: 4-6 hours for full reorganization
```

**Use Cases**:

- **Space Migration**: Before moving content to a new space, audit current structure
- **Content Cleanup**: Periodic audit to identify and remove outdated content
- **Reorganization Planning**: When space structure becomes unwieldy
- **New Team Member Onboarding**: Understand existing content landscape
- **Compliance Review**: Ensure documentation is current and accurate

**When to Use**:
- ✅ Planning a space migration or restructure
- ✅ Preparing for team audit or compliance review
- ✅ Space has grown to 50+ pages and becoming hard to navigate
- ✅ Multiple team members report difficulty finding content
- ✅ After team reorganization or project changes

**When NOT to Use**:
- ❌ Small spaces (<10 pages) - manual review is faster
- ❌ Personal spaces - structure is less critical
- ❌ Spaces under active construction - wait until stable

---

## Best Practices

### Interpreting Results

1. **Review AI recommendations critically**: AI may not understand business context
2. **Validate technical accuracy**: AI might miss domain-specific nuances
3. **Prioritize actionable items**: Focus on high-impact, low-effort changes first
4. **Get stakeholder buy-in**: Share audit results with team before making major changes

### Acting on Recommendations

**For Page Review**:
1. Address clarity issues first (structure, formatting)
2. Fix technical inaccuracies (outdated info, broken links)
3. Add missing sections identified by AI
4. Implement suggestions that align with user needs

**For Content Audit**:
1. Start with easy wins (delete obvious spam/test pages)
2. Archive outdated content before reorganizing
3. Implement structural changes incrementally
4. Communicate changes to team members

### Limitations

⚠️ **Important**: AI prompts do NOT replace human review

- **Context gaps**: AI lacks business context and team dynamics
- **Accuracy**: AI may misinterpret technical content
- **Ownership**: Final decisions should involve content owners
- **Validation**: Always verify AI recommendations with subject matter experts

**Use AI as**: Assistant, first-pass reviewer, idea generator

**NOT as**: Final authority, replacement for human judgment, automated decision-maker

---

## Example Workflow: Complete Content Review

```typescript
// Step 1: Get page content
const page = await callTool('getPage', { pageId: '987654', includeBody: true });

// Step 2: Generate review prompt
const reviewPrompt = await callPrompt('pageReview', { pageId: '987654' });

// Step 3: Send to AI assistant for review
const aiFeedback = await sendToAI(reviewPrompt.messages);

// Step 4: Parse and categorize feedback
const feedback = parseFeedback(aiFeedback);

// Step 5: Create action items
const actions = [
  { type: 'fix', priority: 'high', item: feedback.technicalIssues },
  { type: 'add', priority: 'medium', item: feedback.missingSections },
  { type: 'improve', priority: 'low', item: feedback.suggestions }
];

// Step 6: Update page based on feedback
await callTool('updatePage', {
  pageId: '987654',
  body: revisedContent,
  version: currentPage.version + 1,
  updateMessage: 'Incorporated AI review feedback'
});
```

This workflow demonstrates how prompts integrate with tools to create a complete AI-assisted content management pipeline.
