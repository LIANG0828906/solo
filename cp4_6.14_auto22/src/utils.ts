const ALLOWED_TAGS = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'];
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {};

const WORD_NAMESPACE_TAGS = /<(\/)?(w|o|m|v):[^>]*>/gi;
const WORD_CONDITIONAL_COMMENTS = /<!--\[if[^>]*>[\s\S]*?<!\[endif\]-->/gi;
const EMPTY_TAGS = /<([a-z][a-z0-9]*)\s*><\/\1>/gi;

export function sanitizeHtml(html: string): string {
  if (!html) return '';

  let cleaned = html;
  cleaned = cleaned.replace(WORD_CONDITIONAL_COMMENTS, '');
  cleaned = cleaned.replace(WORD_NAMESPACE_TAGS, '');

  const div = document.createElement('div');
  div.innerHTML = cleaned;

  const normalizeNode = (node: Node) => {
    const childNodes = Array.from(node.childNodes);

    childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        let tagName = element.tagName.toLowerCase();

        if (tagName === 'strong') {
          const b = document.createElement('b');
          b.innerHTML = element.innerHTML;
          node.replaceChild(b, element);
          normalizeNode(b);
          return;
        }
        if (tagName === 'em') {
          const i = document.createElement('i');
          i.innerHTML = element.innerHTML;
          node.replaceChild(i, element);
          normalizeNode(i);
          return;
        }

        const style = element.getAttribute('style') || '';
        const fontWeight = element.style.fontWeight;
        const fontStyle = element.style.fontStyle;
        const textDecoration = element.style.textDecoration;

        if (!ALLOWED_TAGS.includes(tagName)) {
          let shouldReplaceWithFormatTag: string | null = null;

          if (fontWeight === 'bold' || fontWeight === '700' || fontWeight === 'bolder') {
            shouldReplaceWithFormatTag = 'b';
          } else if (fontStyle === 'italic') {
            shouldReplaceWithFormatTag = 'i';
          } else if (textDecoration.includes('underline')) {
            shouldReplaceWithFormatTag = 'u';
          }

          if (shouldReplaceWithFormatTag) {
            const newEl = document.createElement(shouldReplaceWithFormatTag);
            newEl.innerHTML = element.innerHTML;
            node.replaceChild(newEl, element);
            normalizeNode(newEl);
          } else {
            const parent = element.parentNode;
            if (parent) {
              while (element.firstChild) {
                parent.insertBefore(element.firstChild, element);
              }
              parent.removeChild(element);
            }
          }
          return;
        }

        const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] || [];
        const attrs = Array.from(element.attributes);
        attrs.forEach((attr) => {
          if (!allowedAttrs.includes(attr.name.toLowerCase())) {
            element.removeAttribute(attr.name);
          }
        });
        element.removeAttribute('style');
        element.removeAttribute('class');

        if (tagName === 'li') {
          const parent = element.parentElement;
          if (parent && !['ul', 'ol'].includes(parent.tagName.toLowerCase())) {
            const textNode = document.createTextNode(element.textContent || '');
            node.replaceChild(textNode, element);
            return;
          }
        }

        if (tagName === 'div' || tagName === 'span') {
          const p = document.createElement('p');
          p.innerHTML = element.innerHTML;
          node.replaceChild(p, element);
          normalizeNode(p);
          return;
        }

        normalizeNode(element);
      } else if (child.nodeType === Node.TEXT_NODE) {
        return;
      } else if (child.nodeType === Node.COMMENT_NODE) {
        node.removeChild(child);
      } else {
        node.removeChild(child);
      }
    });
  };

  normalizeNode(div);

  let result = div.innerHTML;
  result = result.replace(EMPTY_TAGS, '');
  result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  result = result.replace(/javascript:/gi, '');
  result = result.replace(/on\w+="[^"]*"/gi, '');
  result = result.replace(/on\w+='[^']*'/gi, '');
  result = result.replace(/\n{2,}/g, '\n');

  return result;
}

export function htmlToPlainText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export function generateUserId(): string {
  return 'user-' + Math.random().toString(36).substring(2, 9);
}

export function getRandomColor(): string {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getRandomUserName(): string {
  const names = ['小明', '小红', '小刚', '小丽', '小华', '小芳', '小军', '小燕'];
  return names[Math.floor(Math.random() * names.length)];
}

export interface ExportProgressEvent {
  progress: number;
  stage: 'init' | 'processing' | 'formatting' | 'done';
  chapterIndex?: number;
  totalChapters?: number;
}

export async function generateExportContent(
  title: string,
  chapters: Array<{ title: string; content: string }>,
  onProgress: (event: ExportProgressEvent) => void
): Promise<string> {
  const emit = (progress: number, stage: ExportProgressEvent['stage'], chapterIndex?: number) => {
    onProgress({ progress, stage, chapterIndex, totalChapters: chapters.length });
  };

  await new Promise((resolve) => setTimeout(resolve, 20));
  emit(5, 'init');

  let content = `${title}\n${'='.repeat(title.length * 2)}\n\n`;

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    await new Promise((resolve) => setTimeout(resolve, 15));
    emit(Math.round(10 + (i / chapters.length) * 70), 'processing', i);

    content += `\n---\n\n`;
    content += `${chapter.title}\n`;
    content += `${'-'.repeat(chapter.title.length)}\n\n`;

    const textContent = chapter.content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '$1\n')
      .replace(/<b>(.*?)<\/b>/gi, '$1')
      .replace(/<strong>(.*?)<\/strong>/gi, '$1')
      .replace(/<i>(.*?)<\/i>/gi, '$1')
      .replace(/<em>(.*?)<\/em>/gi, '$1')
      .replace(/<u>(.*?)<\/u>/gi, '$1')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, inner) => {
        return inner.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');
      })
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, inner) => {
        let count = 1;
        return inner.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
          return `${count++}. ` + arguments[1] + '\n';
        });
      })
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '$1\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    content += textContent + '\n';
  }

  await new Promise((resolve) => setTimeout(resolve, 20));
  emit(85, 'formatting');

  await new Promise((resolve) => setTimeout(resolve, 30));
  emit(100, 'done');

  return content;
}
