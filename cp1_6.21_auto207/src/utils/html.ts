import type { ContentType } from '../types';

export const htmlToPlainText = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
};

export const detectContentType = (html: string): ContentType => {
  const hasImage = /<img[^>]*src=/i.test(html);
  const stripped = html.replace(/<img[^>]*>/gi, '');
  const hasText = /[a-zA-Z\u4e00-\u9fa50-9]/.test(
    stripped.replace(/<[^>]*>/g, '')
  );

  if (hasImage && hasText) return 'mixed';
  if (hasImage) return 'image';
  return 'text';
};

const htmlToMarkdownImage = (img: Element): string => {
  const src = img.getAttribute('src') || '';
  const alt = img.getAttribute('alt') || 'image';
  return `![${alt}](${src})`;
};

const inlineStylesToMarkdown = (el: Element): string => {
  let result = '';
  const tagName = el.tagName.toLowerCase();
  const htmlContent = el.innerHTML;

  if (tagName === 'br') return '\n';

  if (tagName === 'strong' || tagName === 'b') {
    result = `**${htmlContent}**`;
  } else if (tagName === 'em' || tagName === 'i') {
    result = `*${htmlContent}*`;
  } else if (tagName === 'code') {
    result = `\`${htmlContent}\``;
  } else if (tagName === 'a') {
    const href = el.getAttribute('href') || '';
    result = `[${htmlContent}](${href})`;
  } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
    const level = parseInt(tagName.slice(1));
    result = `${'#'.repeat(level)} ${htmlContent}\n`;
  } else if (tagName === 'li') {
    result = `- ${htmlContent}\n`;
  } else if (tagName === 'p') {
    result = `${htmlContent}\n\n`;
  } else if (tagName === 'blockquote') {
    result = `> ${htmlContent}\n`;
  } else if (tagName === 'pre') {
    result = `\`\`\`\n${el.textContent}\n\`\`\`\n`;
  } else if (tagName === 'table') {
    result = htmlToMarkdownTable(el as HTMLTableElement);
  } else {
    result = htmlContent;
  }

  return result;
};

const htmlToMarkdownTable = (table: HTMLTableElement): string => {
  let result = '';
  const rows = table.querySelectorAll('tr');
  rows.forEach((row, idx) => {
    const cells = row.querySelectorAll('th, td');
    const cellTexts = Array.from(cells).map((c) => c.textContent?.trim() || '');
    result += `| ${cellTexts.join(' | ')} |\n`;
    if (idx === 0) {
      result += `| ${cellTexts.map(() => '---').join(' | ')} |\n`;
    }
  });
  return result + '\n';
};

export const htmlToMarkdown = (
  html: string,
  contentType: ContentType,
  title?: string
): string => {
  let md = '';
  if (title) {
    md = `# ${title}\n\n`;
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  if (contentType === 'image') {
    const images = doc.querySelectorAll('img');
    images.forEach((img) => {
      md += htmlToMarkdownImage(img) + '\n';
    });
    const text = (doc.body.textContent || '').trim();
    if (text) md += `\n${text}\n`;
    return md.trim();
  }

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as Element;
    const tagName = el.tagName.toLowerCase();

    if (tagName === 'img') {
      return htmlToMarkdownImage(el);
    }

    if (['script', 'style'].includes(tagName)) return '';

    let inner = '';
    el.childNodes.forEach((child) => {
      inner += walk(child);
    });

    const wrapper = el.cloneNode(false) as Element;
    wrapper.textContent = inner;
    const processed = inlineStylesToMarkdown(wrapper);
    return processed;
  };

  doc.body.childNodes.forEach((n) => {
    md += walk(n);
  });

  return md
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^ +/gm, '')
    .trim();
};

export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
};
