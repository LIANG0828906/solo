import type { Theme } from './themes';

interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'text' | 'tag' | 'punctuation';
  value: string;
}

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'default', 'class', 'extends',
  'new', 'this', 'super', 'import', 'export', 'from', 'as', 'type', 'interface',
  'implements', 'private', 'protected', 'public', 'static', 'readonly', 'void',
  'null', 'undefined', 'true', 'false', 'typeof', 'instanceof', 'in', 'of',
  'async', 'await', 'try', 'catch', 'finally', 'throw', 'debugger', 'with'
]);

const patterns: Array<{ regex: RegExp; type: Token['type'] }> = [
  { regex: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)/g, type: 'comment' },
  { regex: /(`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g, type: 'string' },
  { regex: /(<\/?[a-zA-Z][a-zA-Z0-9-]*)/g, type: 'tag' },
  { regex: /\b([0-9]+\.?[0-9]*)\b/g, type: 'number' },
  { regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/g, type: 'function' },
  { regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, type: 'keyword' },
  { regex: /([{}()[\];,.:=+\-*/<>!&|?])/g, type: 'punctuation' }
];

interface CacheEntry {
  code: string;
  themeName: string;
  result: string;
}

let cache: CacheEntry | null = null;

export function highlight(code: string, theme: Theme): string {
  if (cache && cache.code === code && cache.themeName === theme.name) {
    return cache.result;
  }

  const tokens: Token[] = [];
  let lastIndex = 0;
  const matches: Array<{ index: number; length: number; type: Token['type']; value: string }> = [];

  patterns.forEach(({ regex, type }) => {
    let match;
    const r = new RegExp(regex.source, regex.flags);
    while ((match = r.exec(code)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type,
        value: match[0]
      });
    }
  });

  matches.sort((a, b) => a.index - b.index);

  const used = new Set<number>();
  for (const m of matches) {
    if (used.has(m.index)) continue;
    for (let i = m.index; i < m.index + m.length; i++) {
      used.add(i);
    }
  }

  for (const m of matches) {
    if (m.index > lastIndex) {
      tokens.push({ type: 'text', value: code.slice(lastIndex, m.index) });
    }
    let finalType: Token['type'] = m.type;
    if (m.type === 'keyword' && !KEYWORDS.has(m.value)) {
      finalType = 'text';
    }
    if (m.type === 'tag') {
      finalType = 'keyword';
    }
    tokens.push({ type: finalType, value: m.value });
    lastIndex = m.index + m.length;
  }

  if (lastIndex < code.length) {
    tokens.push({ type: 'text', value: code.slice(lastIndex) });
  }

  const result = tokens
    .map(({ type, value }) => {
      const escaped = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      let color: string;
      switch (type) {
        case 'keyword':
        case 'tag':
          color = theme.keyword;
          break;
        case 'string':
          color = theme.string;
          break;
        case 'comment':
          color = theme.comment;
          break;
        case 'number':
          color = theme.number;
          break;
        case 'function':
          color = theme.function;
          break;
        case 'punctuation':
        case 'text':
        default:
          color = theme.text;
      }

      if (type === 'text' || type === 'punctuation') {
        return `<span style="color:${color}">${escaped}</span>`;
      }

      return `<span style="color:${color}" class="token-${type}">${escaped}</span>`;
    })
    .join('');

  cache = { code, themeName: theme.name, result };
  return result;
}

export function clearCache(): void {
  cache = null;
}
