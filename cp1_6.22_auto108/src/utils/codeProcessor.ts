export type Language = 'javascript' | 'typescript' | 'css' | 'html';

export interface FormatResult {
  code: string;
  charReduction: number;
  indentCount: number;
}

function minifyJavaScript(code: string): string {
  let result = code;
  result = result.replace(/\/\/.*$/gm, '');
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/\s*([{}();,:+\-*/=<>!&|?])\s*/g, '$1');
  result = result.trim();
  return result;
}

function minifyCSS(code: string): string {
  let result = code;
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/\s*([{};:,])\s*/g, '$1');
  result = result.replace(/;}/g, '}');
  result = result.trim();
  return result;
}

function minifyHTML(code: string): string {
  let result = code;
  result = result.replace(/<!--[\s\S]*?-->/g, '');
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/>\s+</g, '><');
  result = result.trim();
  return result;
}

export function minifyCode(code: string, language: Language): string {
  if (!code.trim()) return code;

  switch (language) {
    case 'javascript':
    case 'typescript':
      return minifyJavaScript(code);
    case 'css':
      return minifyCSS(code);
    case 'html':
      return minifyHTML(code);
    default:
      return code;
  }
}

function formatJavaScript(code: string): { code: string; indentCount: number } {
  let indentLevel = 0;
  const indentSize = 2;
  let result = '';
  let inString = false;
  let stringChar = '';
  let indentCount = 0;

  const trimmed = code.trim();
  let i = 0;

  while (i < trimmed.length) {
    const char = trimmed[i];
    const nextChar = trimmed[i + 1] || '';

    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true;
      stringChar = char;
      result += char;
      i++;
      continue;
    }

    if (inString) {
      if (char === '\\' && nextChar) {
        result += char + nextChar;
        i += 2;
        continue;
      }
      if (char === stringChar) {
        inString = false;
      }
      result += char;
      i++;
      continue;
    }

    if (char === '{' || char === '[' || char === '(') {
      result += char;
      indentLevel++;
      indentCount++;
      if (nextChar && nextChar !== '}' && nextChar !== ']' && nextChar !== ')') {
        result += '\n' + ' '.repeat(indentLevel * indentSize);
      }
      i++;
      continue;
    }

    if (char === '}' || char === ']' || char === ')') {
      if (result.slice(-1) !== '\n' && result.length > 0) {
        result += '\n';
      }
      indentLevel = Math.max(0, indentLevel - 1);
      result += ' '.repeat(indentLevel * indentSize) + char;
      i++;
      continue;
    }

    if (char === ';' || char === ',') {
      result += char;
      if (nextChar && nextChar !== '\n' && nextChar !== '}' && nextChar !== ']' && nextChar !== ')') {
        result += '\n' + ' '.repeat(indentLevel * indentSize);
      }
      i++;
      continue;
    }

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      if (result.length > 0 && result.slice(-1) !== '\n' && result.slice(-1) !== ' ') {
        result += ' ';
      }
      i++;
      continue;
    }

    if (result.length === 0 || result.slice(-1) === '\n') {
      result += ' '.repeat(indentLevel * indentSize);
    }

    result += char;
    i++;
  }

  result = result.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

  return { code: result, indentCount };
}

function formatCSS(code: string): { code: string; indentCount: number } {
  let indentLevel = 0;
  const indentSize = 2;
  let result = '';
  let indentCount = 0;
  let i = 0;
  const trimmed = code.trim();

  while (i < trimmed.length) {
    const char = trimmed[i];

    if (char === '{') {
      result += ' ' + char + '\n';
      indentLevel++;
      indentCount++;
      i++;
      continue;
    }

    if (char === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
      if (result.slice(-1) !== '\n') {
        result += '\n';
      }
      result += ' '.repeat(indentLevel * indentSize) + char + '\n';
      i++;
      continue;
    }

    if (char === ';') {
      result += char + '\n';
      if (trimmed[i + 1] && trimmed[i + 1] !== '}') {
        result += ' '.repeat(indentLevel * indentSize);
      }
      i++;
      continue;
    }

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      i++;
      continue;
    }

    if (result.slice(-1) === '\n') {
      result += ' '.repeat(indentLevel * indentSize);
    }

    result += char;
    i++;
  }

  result = result.trim();
  return { code: result, indentCount };
}

function formatHTML(code: string): { code: string; indentCount: number } {
  let indentLevel = 0;
  const indentSize = 2;
  let result = '';
  let indentCount = 0;
  let i = 0;
  const trimmed = code.trim();

  const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];

  while (i < trimmed.length) {
    if (trimmed[i] === '<') {
      const tagEnd = trimmed.indexOf('>', i);
      if (tagEnd === -1) {
        result += trimmed.slice(i);
        break;
      }

      const tagContent = trimmed.slice(i, tagEnd + 1);
      const tagMatch = tagContent.match(/<\/?([a-zA-Z0-9]+)/);
      const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
      const isClosing = tagContent.startsWith('</');
      const isSelfClosing = selfClosingTags.includes(tagName) || tagContent.endsWith('/>');

      if (isClosing) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      if (result.length > 0 && result.slice(-1) !== '\n') {
        result += '\n';
      }
      result += ' '.repeat(indentLevel * indentSize) + tagContent;

      if (!isClosing && !isSelfClosing && tagName) {
        indentLevel++;
        indentCount++;
      }

      i = tagEnd + 1;
      continue;
    }

    const nextTag = trimmed.indexOf('<', i);
    const textContent = nextTag === -1 ? trimmed.slice(i) : trimmed.slice(i, nextTag);
    const trimmedText = textContent.trim();

    if (trimmedText) {
      if (result.slice(-1) !== '\n') {
        result += '\n';
      }
      result += ' '.repeat(indentLevel * indentSize) + trimmedText;
    }

    if (nextTag === -1) break;
    i = nextTag;
  }

  result = result.trim();
  return { code: result, indentCount };
}

export function formatCode(code: string, language: Language): FormatResult {
  if (!code.trim()) {
    return { code: '', charReduction: 0, indentCount: 0 };
  }

  const originalLength = code.length;
  let formattedCode: string;
  let indentCount = 0;

  switch (language) {
    case 'javascript':
    case 'typescript': {
      const result = formatJavaScript(code);
      formattedCode = result.code;
      indentCount = result.indentCount;
      break;
    }
    case 'css': {
      const result = formatCSS(code);
      formattedCode = result.code;
      indentCount = result.indentCount;
      break;
    }
    case 'html': {
      const result = formatHTML(code);
      formattedCode = result.code;
      indentCount = result.indentCount;
      break;
    }
    default:
      formattedCode = code;
  }

  const charReduction = originalLength - formattedCode.length;

  return {
    code: formattedCode,
    charReduction: Math.max(0, charReduction),
    indentCount
  };
}

export function detectLanguage(code: string): Language {
  if (/<(!DOCTYPE|html|head|body|div|span|p|a|script|style)/i.test(code)) {
    return 'html';
  }
  if (/^[\s\S]*\{[\s\S]*:[\s\S]*;[\s\S]*\}/.test(code) && !/(function|const|let|var|=>)/.test(code)) {
    return 'css';
  }
  if (/(const|let|var|function|=>|interface|type\s|export\s+default)/.test(code)) {
    if (/(interface|type\s\w+|:\s*\w+<|:\s*string|:\s*number|:\s*boolean)/.test(code)) {
      return 'typescript';
    }
    return 'javascript';
  }
  return 'javascript';
}
