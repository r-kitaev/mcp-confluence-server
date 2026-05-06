import { describe, it, expect } from 'vitest';
import { htmlToMarkdown } from '../../src/utils/htmlToMarkdown.js';

describe('htmlToMarkdown', () => {
  it('converts headers (h1 → #)', () => {
    const html = '<h1>Title</h1>';
    const markdown = htmlToMarkdown(html);
    expect(markdown).toBe('# Title');
  });

  it('converts paragraphs', () => {
    const html = '<p>Text content</p>';
    const markdown = htmlToMarkdown(html);
    expect(markdown).toBe('Text content');
  });

  it('converts strong and em', () => {
    const html = '<p>Text with <strong>bold</strong> and <em>italic</em></p>';
    const markdown = htmlToMarkdown(html);
    expect(markdown).toContain('**bold**');
    expect(markdown).toContain('*italic*');
  });

  it('converts links', () => {
    const html = '<p>Visit <a href="https://example.com">Example</a></p>';
    const markdown = htmlToMarkdown(html);
    expect(markdown).toContain('[Example](https://example.com)');
  });

  it('converts lists', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const markdown = htmlToMarkdown(html);
    expect(markdown).toContain('- Item 1');
    expect(markdown).toContain('- Item 2');
  });

  it('removes unknown tags', () => {
    const html = '<div><span>Text</span></div>';
    const markdown = htmlToMarkdown(html);
    expect(markdown).toBe('Text');
  });

  it('converts code blocks', () => {
    const html = '<code>inline code</code>';
    const markdown = htmlToMarkdown(html);
    expect(markdown).toBe('`inline code`');
  });

  it('converts pre blocks', () => {
    const html = '<pre>code block</pre>';
    const markdown = htmlToMarkdown(html);
    expect(markdown).toContain('```\ncode block\n```');
  });

  it('decodes HTML entities', () => {
    const html = '<p>&amp; &lt; &gt; &quot; &#39;</p>';
    const markdown = htmlToMarkdown(html);
    expect(markdown).toContain('& < > " \'');
  });

  it('handles empty input', () => {
    expect(htmlToMarkdown('')).toBe('');
  });

  it('handles complex HTML', () => {
    const html = '<h1>Title</h1><p>Text with <strong>bold</strong>, <em>italic</em>, and <a href="url">link</a>.</p><ul><li>Item 1</li><li>Item 2</li></ul>';
    const markdown = htmlToMarkdown(html);
    expect(markdown).toContain('# Title');
    expect(markdown).toContain('**bold**');
    expect(markdown).toContain('*italic*');
    expect(markdown).toContain('[link](url)');
    expect(markdown).toContain('- Item 1');
    expect(markdown).toContain('- Item 2');
  });
});
