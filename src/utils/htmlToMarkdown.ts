/**
 * Конвертировать HTML в markdown
 * @param html - HTML строка для конвертации
 * @returns Markdown строка
 */
export function htmlToMarkdown(html: string): string {
  if (!html) {
    return '';
  }

  let markdown = html;

  // Заголовки
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gis, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gis, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gis, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gis, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gis, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gis, '###### $1\n\n');

  // Параграфы
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n');

  // Жирный и курсив
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gis, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gis, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gis, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gis, '*$1*');

  // Ссылки
  markdown = markdown.replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gis, '[$2]($1)');

  // Списки
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n');

  // Код
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gis, '`$1`');
  markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n');

  // Переносы строк
  markdown = markdown.replace(/<br\s*\/?>/gis, '\n');
  markdown = markdown.replace(/<hr\s*\/?>/gis, '\n---\n');

  // Удалить остальные теги
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  markdown = markdown
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Очистить лишние пустые строки
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  return markdown.trim();
}
