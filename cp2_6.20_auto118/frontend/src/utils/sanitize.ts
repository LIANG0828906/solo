import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'br', 'div', 'span'
];

const ALLOWED_ATTR: string[] = [];

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOWED_PROTOCOLS: ['http', 'https', 'mailto'],
    FORBID_ATTR: ['style', 'class', 'id', 'name'],
    FORBID_TAGS: [
      'script', 'style', 'iframe', 'link', 'img', 'video', 'audio',
      'form', 'input', 'button', 'textarea', 'select', 'option',
      'base', 'meta', 'head', 'body', 'html', 'frame', 'frameset',
      'embed', 'object', 'param', 'svg', 'math', 'canvas', 'a'
    ],
    FORCE_BODY: true,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM: false,
    RETURN_TRUSTED_TYPE: false,
    WHOLE_DOCUMENT: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    IN_PLACE: false,
  });
}

export function sanitizeHtmlWithStyle(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['style'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOWED_PROTOCOLS: ['http', 'https', 'mailto'],
    ALLOWED_CSS_PROPERTIES: [
      'font-weight', 'font-style', 'text-decoration',
      'color', 'background-color', 'text-align',
      'margin', 'padding', 'line-height'
    ],
    FORBID_TAGS: [
      'script', 'style', 'iframe', 'link', 'img', 'video', 'audio',
      'form', 'input', 'button', 'textarea', 'select', 'option',
      'base', 'meta', 'head', 'body', 'html', 'frame', 'frameset',
      'embed', 'object', 'param', 'svg', 'math', 'canvas', 'a'
    ],
    FORCE_BODY: true,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM: false,
    RETURN_TRUSTED_TYPE: false,
    WHOLE_DOCUMENT: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    IN_PLACE: false,
  });
}

export function createSanitizedDocument(html: string): DocumentFragment {
  if (!html || typeof html !== 'string') {
    return document.createDocumentFragment();
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['style'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    RETURN_DOM_FRAGMENT: true,
    FORCE_BODY: true,
  }) as unknown as DocumentFragment;
}
