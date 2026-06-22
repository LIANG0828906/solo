const KEYWORDS: Record<string, string[]> = {
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends',
    'super', 'import', 'export', 'from', 'default', 'try', 'catch', 'finally',
    'throw', 'typeof', 'instanceof', 'in', 'of', 'void', 'delete', 'async', 'await',
    'yield', 'static', 'public', 'private', 'protected', 'true', 'false', 'null',
    'undefined', 'NaN', 'Infinity',
  ],
  typescript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends',
    'super', 'import', 'export', 'from', 'default', 'try', 'catch', 'finally',
    'throw', 'typeof', 'instanceof', 'in', 'of', 'void', 'delete', 'async', 'await',
    'yield', 'static', 'public', 'private', 'protected', 'true', 'false', 'null',
    'undefined', 'NaN', 'Infinity',
    'interface', 'type', 'enum', 'implements', 'readonly', 'as', 'is', 'keyof',
    'never', 'unknown', 'any', 'number', 'string', 'boolean', 'object', 'symbol',
    'Record', 'Partial', 'Pick', 'Omit', 'Exclude', 'Extract', 'ReturnType',
  ],
  python: [
    'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break',
    'continue', 'pass', 'import', 'from', 'as', 'try', 'except', 'finally',
    'raise', 'with', 'lambda', 'yield', 'global', 'nonlocal', 'assert', 'del',
    'in', 'is', 'not', 'and', 'or', 'True', 'False', 'None', 'self', 'async',
    'await', 'async', 'property', 'staticmethod', 'classmethod',
  ],
  html: [
    'DOCTYPE', 'html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'br',
    'hr', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'ul', 'ol', 'li', 'form',
    'input', 'button', 'textarea', 'select', 'option', 'label', 'h1', 'h2', 'h3',
    'h4', 'h5', 'h6', 'section', 'article', 'header', 'footer', 'nav', 'main',
    'aside', 'figure', 'figcaption', 'video', 'audio', 'source', 'canvas',
    'script', 'style', 'link', 'meta', 'title',
  ],
  css: [
    'margin', 'padding', 'border', 'width', 'height', 'background', 'color',
    'font-size', 'font-family', 'font-weight', 'display', 'flex', 'grid',
    'position', 'top', 'bottom', 'left', 'right', 'z-index', 'overflow',
    'float', 'clear', 'opacity', 'transform', 'transition', 'animation',
    'box-shadow', 'text-shadow', 'border-radius', 'cursor', 'outline',
  ],
  java: [
    'public', 'private', 'protected', 'class', 'interface', 'extends',
    'implements', 'static', 'final', 'abstract', 'new', 'return', 'if', 'else',
    'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'throw',
    'throws', 'try', 'catch', 'finally', 'import', 'package', 'this', 'super',
    'void', 'int', 'long', 'float', 'double', 'boolean', 'char', 'byte',
    'short', 'String', 'true', 'false', 'null',
  ],
  go: [
    'package', 'import', 'func', 'var', 'const', 'type', 'struct', 'interface',
    'map', 'chan', 'go', 'defer', 'return', 'if', 'else', 'for', 'range',
    'switch', 'case', 'select', 'break', 'continue', 'goto', 'fallthrough',
    'true', 'false', 'nil', 'int', 'string', 'bool', 'float32', 'float64',
  ],
  rust: [
    'fn', 'let', 'mut', 'const', 'struct', 'enum', 'impl', 'trait', 'pub',
    'use', 'mod', 'crate', 'self', 'Self', 'super', 'where', 'for', 'if',
    'else', 'match', 'loop', 'while', 'in', 'break', 'continue', 'return',
    'move', 'ref', 'as', 'true', 'false', 'None', 'Some', 'Ok', 'Err',
    'Box', 'Vec', 'String', 'Option', 'Result',
  ],
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function highlightCode(code: string, language: string): string {
  const lang = (language || 'text').toLowerCase();
  const escaped = escapeHtml(code);

  if (lang === 'text' || lang === 'plain' || !KEYWORDS[lang]) {
    return escaped;
  }

  const keywords = KEYWORDS[lang];
  let result = escaped;

  const tokens: Array<{ type: string; value: string; index: number }> = [];

  const stringRegex = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g;
  let match;
  while ((match = stringRegex.exec(escaped)) !== null) {
    tokens.push({ type: 'string', value: match[0], index: match.index });
  }

  const commentRegex = lang === 'python' || lang === 'rust'
    ? /#[^\n]*/g
    : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g;
  while ((match = commentRegex.exec(escaped)) !== null) {
    tokens.push({ type: 'comment', value: match[0], index: match.index });
  }

  const numberRegex = /\b(\d+\.?\d*[eE][+-]?\d+|\d+\.\d+|\d+)\b/g;
  while ((match = numberRegex.exec(escaped)) !== null) {
    tokens.push({ type: 'number', value: match[0], index: match.index });
  }

  if (keywords) {
    const kwPattern = new RegExp('\\b(' + keywords.map(k => escapeRegex(k)).join('|') + ')\\b', 'g');
    while ((match = kwPattern.exec(escaped)) !== null) {
      tokens.push({ type: 'keyword', value: match[0], index: match.index });
    }
  }

  if (lang === 'html') {
    const attrRegex = /([a-zA-Z-]+)=("[^"]*"|'[^']*')/g;
    while ((match = attrRegex.exec(escaped)) !== null) {
      tokens.push({ type: 'attr', value: match[0], index: match.index });
    }
    const tagRegex = /&lt;\/?([a-zA-Z0-9-]+)[^&]*?&gt;/g;
    while ((match = tagRegex.exec(escaped)) !== null) {
      tokens.push({ type: 'tag', value: match[0], index: match.index });
    }
  }

  const functionRegex = /([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/g;
  while ((match = functionRegex.exec(escaped)) !== null) {
    const isKeyword = keywords?.includes(match[1]);
    if (!isKeyword) {
      tokens.push({ type: 'function', value: match[0], index: match.index });
    }
  }

  tokens.sort((a, b) => a.index - b.index);

  const finalTokens: typeof tokens = [];
  let lastEnd = 0;
  for (const token of tokens) {
    if (token.index >= lastEnd) {
      let overlap = false;
      for (const ft of finalTokens) {
        const ftEnd = ft.index + ft.value.length;
        if (token.index < ftEnd && token.index + token.value.length > ft.index) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        finalTokens.push(token);
        lastEnd = token.index + token.value.length;
      }
    }
  }

  let output = '';
  let cursor = 0;
  for (const token of finalTokens) {
    if (token.index > cursor) {
      output += escaped.slice(cursor, token.index);
    }
    const classes: Record<string, string> = {
      keyword: 'hl-keyword',
      string: 'hl-string',
      comment: 'hl-comment',
      number: 'hl-number',
      function: 'hl-function',
      tag: 'hl-tag',
      attr: 'hl-attr',
    };
    const cls = classes[token.type] || '';
    if (cls) {
      output += `<span class="${cls}">${token.value}</span>`;
    } else {
      output += token.value;
    }
    cursor = token.index + token.value.length;
  }
  if (cursor < escaped.length) {
    output += escaped.slice(cursor);
  }

  return output || escaped;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function supportedLanguages(): string[] {
  return ['text', 'javascript', 'typescript', 'python', 'html', 'css', 'java', 'go', 'rust'];
}
