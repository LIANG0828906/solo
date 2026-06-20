const ALLOWED_TAGS = new Set([
  'p', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'br', 'div', 'span'
]);

const DANGEROUS_TAGS = new Set([
  'script', 'style', 'iframe', 'link', 'img', 'video', 'audio',
  'form', 'input', 'button', 'textarea', 'select', 'option',
  'base', 'meta', 'head', 'body', 'html', 'frame', 'frameset',
  'embed', 'object', 'param', 'svg', 'math', 'canvas'
]);

const EVENT_HANDLER_PATTERN = /^on/i;

function sanitizeAttributeValue(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith('javascript:')) return false;
  if (trimmed.startsWith('vbscript:')) return false;
  if (trimmed.startsWith('data:text/html')) return false;
  if (trimmed.includes('expression(')) return false;
  return true;
}

function sanitizeElement(element: Element): void {
  const tagName = element.tagName.toLowerCase();

  if (DANGEROUS_TAGS.has(tagName)) {
    element.remove();
    return;
  }

  if (!ALLOWED_TAGS.has(tagName)) {
    const parent = element.parentNode;
    if (parent) {
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
    }
    return;
  }

  const attributes = Array.from(element.attributes);
  for (const attr of attributes) {
    if (EVENT_HANDLER_PATTERN.test(attr.name)) {
      element.removeAttribute(attr.name);
      continue;
    }

    if (!sanitizeAttributeValue(attr.value)) {
      element.removeAttribute(attr.name);
      continue;
    }

    if (attr.name !== 'style') {
      element.removeAttribute(attr.name);
    }
  }

  const children = Array.from(element.children);
  for (const child of children) {
    sanitizeElement(child);
  }
}

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const body = doc.body;

  const elements = Array.from(body.querySelectorAll('*'));
  for (const el of elements) {
    sanitizeElement(el);
  }

  const remainingElements = Array.from(body.children);
  for (const el of remainingElements) {
    sanitizeElement(el);
  }

  return body.innerHTML;
}
