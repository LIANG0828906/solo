const ALLOWED_TAGS = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'];
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {};

export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  const cleanNode = (node: Node) => {
    const childNodes = Array.from(node.childNodes);

    childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        if (!ALLOWED_TAGS.includes(tagName)) {
          const textNode = document.createTextNode(element.textContent || '');
          node.replaceChild(textNode, element);
          return;
        }

        const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] || [];
        const attrs = Array.from(element.attributes);
        attrs.forEach((attr) => {
          if (!allowedAttrs.includes(attr.name.toLowerCase())) {
            element.removeAttribute(attr.name);
          }
        });

        if (tagName === 'li') {
          const parent = element.parentElement;
          if (parent && !['ul', 'ol'].includes(parent.tagName.toLowerCase())) {
            const textNode = document.createTextNode(element.textContent || '');
            node.replaceChild(textNode, element);
            return;
          }
        }

        cleanNode(element);
      } else if (child.nodeType === Node.TEXT_NODE) {
        return;
      } else {
        node.removeChild(child);
      }
    });
  };

  cleanNode(div);

  let result = div.innerHTML;
  result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  result = result.replace(/javascript:/gi, '');
  result = result.replace(/on\w+="[^"]*"/gi, '');
  result = result.replace(/on\w+='[^']*'/gi, '');

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

export async function generateExportContent(
  title: string,
  chapters: Array<{ title: string; content: string }>,
  onProgress: (progress: number) => void
): Promise<string> {
  const totalSteps = chapters.length + 2;
  let currentStep = 0;

  await new Promise((resolve) => setTimeout(resolve, 30));
  currentStep++;
  onProgress(Math.round((currentStep / totalSteps) * 100));

  let content = `${title}\n${'='.repeat(title.length * 2)}\n\n`;

  for (const chapter of chapters) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    currentStep++;
    onProgress(Math.round((currentStep / totalSteps) * 100));

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
  currentStep++;
  onProgress(100);

  return content;
}
