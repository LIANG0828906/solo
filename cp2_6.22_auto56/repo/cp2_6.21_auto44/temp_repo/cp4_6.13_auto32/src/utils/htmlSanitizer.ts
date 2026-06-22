const ALLOWED_TAGS = new Set([
  'p', 'br', 'span', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'figure', 'figcaption', 'hr'
]);

const ALLOWED_ATTRIBUTES = new Set([
  'href', 'src', 'alt', 'title', 'target',
  'class', 'id', 'name',
  'colspan', 'rowspan', 'headers',
  'rel'
]);

const DANGEROUS_PROTOCOLS = new Set([
  'javascript:', 'vbscript:', 'data:', 'expression:'
]);

function isSafeUrl(url: string): boolean {
  try {
    const decoded = decodeURIComponent(url).toLowerCase();
    for (const protocol of DANGEROUS_PROTOCOLS) {
      if (decoded.startsWith(protocol)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function cleanElement(element: Element): void {
  const childNodes = Array.from(element.childNodes);
  
  childNodes.forEach((node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      element.removeChild(node);
      return;
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tagName = el.tagName.toLowerCase();
      
      if (!ALLOWED_TAGS.has(tagName) || tagName === 'script' || tagName === 'style') {
        const textContent = el.textContent || '';
        const textNode = document.createTextNode(textContent);
        element.replaceChild(textNode, el);
        return;
      }
      
      const attributes = Array.from(el.attributes);
      attributes.forEach((attr) => {
        if (!ALLOWED_ATTRIBUTES.has(attr.name.toLowerCase())) {
          el.removeAttribute(attr.name);
          return;
        }
        
        if ((attr.name === 'href' || attr.name === 'src') && !isSafeUrl(attr.value)) {
          el.removeAttribute(attr.name);
          return;
        }
        
        if (attr.name === 'href') {
          el.setAttribute('rel', 'noopener noreferrer');
          el.setAttribute('target', '_blank');
        }
      });
      
      cleanElement(el);
    }
  });
}

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.body.firstChild as Element;
    
    if (!container) return '';
    
    cleanElement(container);
    
    const scripts = container.querySelectorAll('script, style, iframe');
    scripts.forEach(s => s.remove());
    
    return container.innerHTML;
  } catch (e) {
    console.error('HTML sanitization error:', e);
    return '';
  }
}
