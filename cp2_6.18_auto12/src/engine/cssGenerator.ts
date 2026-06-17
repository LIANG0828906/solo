import type { ParsedTypography } from './parser';

function formatValue(value: string): string {
  if (value.includes(' ')) {
    return `"${value}"`;
  }
  return value;
}

function objectToCss(obj: Record<string, string>, indent: number = 2): string {
  const spaces = ' '.repeat(indent);
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    lines.push(`${spaces}${key}: ${formatValue(value)};`);
  }
  return lines.join('\n');
}

export function generateCss(parsed: ParsedTypography): string {
  const blocks: string[] = [];

  blocks.push(`/* Global Typography Styles */\n`);

  blocks.push(`body {`);
  blocks.push(objectToCss(parsed.body));
  blocks.push(`}\n`);

  blocks.push(`h1 {`);
  blocks.push(objectToCss(parsed.h1));
  blocks.push(`}\n`);

  blocks.push(`h2 {`);
  blocks.push(objectToCss(parsed.h2));
  blocks.push(`}\n`);

  blocks.push(`h3 {`);
  blocks.push(objectToCss(parsed.h3));
  blocks.push(`}\n`);

  blocks.push(`p {`);
  blocks.push(objectToCss(parsed.p));
  blocks.push(`}\n`);

  blocks.push(`blockquote {`);
  blocks.push(objectToCss(parsed.blockquote));
  blocks.push(`}\n`);

  blocks.push(`a {`);
  blocks.push(objectToCss(parsed.a));
  blocks.push(`}`);

  return blocks.join('\n');
}

export interface HighlightedCss {
  selector: string;
  property: string;
  value: string;
  comment: string;
  punctuation: string;
}

export function tokenizeCss(css: string): Array<{ type: string; value: string }> {
  const tokens: Array<{ type: string; value: string }> = [];
  let i = 0;

  while (i < css.length) {
    if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i + 2);
      if (end !== -1) {
        tokens.push({ type: 'comment', value: css.slice(i, end + 2) });
        i = end + 2;
        continue;
      }
    }

    if (css[i] === '{') {
      tokens.push({ type: 'punctuation', value: '{' });
      i++;
      continue;
    }

    if (css[i] === '}') {
      tokens.push({ type: 'punctuation', value: '}' });
      i++;
      continue;
    }

    if (css[i] === ':') {
      tokens.push({ type: 'punctuation', value: ':' });
      i++;
      continue;
    }

    if (css[i] === ';') {
      tokens.push({ type: 'punctuation', value: ';' });
      i++;
      continue;
    }

    if (/\s/.test(css[i])) {
      let ws = '';
      while (i < css.length && /\s/.test(css[i])) {
        ws += css[i];
        i++;
      }
      tokens.push({ type: 'whitespace', value: ws });
      continue;
    }

    const colonIndex = css.indexOf(':', i);
    const braceIndex = css.indexOf('{', i);
    const nextBreak = Math.min(
      colonIndex !== -1 ? colonIndex : Infinity,
      braceIndex !== -1 ? braceIndex : Infinity
    );

    if (colonIndex !== -1 && (braceIndex === -1 || colonIndex < braceIndex)) {
      const prop = css.slice(i, colonIndex).trim();
      if (prop && !prop.includes('\n')) {
        tokens.push({ type: 'property', value: prop });
        i = colonIndex;
        continue;
      }
    }

    if (braceIndex !== -1 && (colonIndex === -1 || braceIndex < colonIndex)) {
      const selector = css.slice(i, braceIndex).trim();
      if (selector) {
        tokens.push({ type: 'selector', value: selector });
        i = braceIndex;
        continue;
      }
    }

    const semicolonIndex = css.indexOf(';', i);
    const endBraceIndex = css.indexOf('}', i);
    const valueEnd = Math.min(
      semicolonIndex !== -1 ? semicolonIndex : Infinity,
      endBraceIndex !== -1 ? endBraceIndex : Infinity
    );

    if (valueEnd !== Infinity) {
      const value = css.slice(i, valueEnd).trim();
      if (value) {
        tokens.push({ type: 'value', value });
        i = valueEnd;
        continue;
      }
    }

    tokens.push({ type: 'text', value: css[i] });
    i++;
  }

  return tokens;
}
