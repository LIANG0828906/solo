import type { ParsedKeyword } from '../../types';

const JS_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
  'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new',
  'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
  'void', 'while', 'with', 'yield', 'async', 'await', 'static', 'from',
  'of', 'as',
]);

const TS_KEYWORDS = new Set([
  'interface', 'type', 'enum', 'implements', 'public', 'private', 'protected',
  'readonly', 'abstract', 'namespace', 'module', 'declare', 'never', 'unknown',
  'any', 'number', 'string', 'boolean', 'void', 'null', 'undefined', 'object',
  'symbol', 'bigint',
]);

const ALL_KEYWORDS = new Set([...JS_KEYWORDS, ...TS_KEYWORDS]);

const BUILTIN_FUNCTIONS = new Set([
  'console', 'log', 'warn', 'error', 'info', 'debug',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'eval',
  'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent',
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Math',
  'JSON', 'Date', 'RegExp', 'Map', 'Set', 'Promise',
  'document', 'window', 'navigator', 'localStorage', 'sessionStorage',
]);

function isIdentifierChar(code: number): boolean {
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    code === 95 || // _
    code === 36 // $
  );
}

function isIdentifierStart(code: number): boolean {
  return (
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    code === 95 ||
    code === 36
  );
}

export function parseCode(code: string): ParsedKeyword[] {
  const tokens: ParsedKeyword[] = [];
  let i = 0;
  const len = code.length;

  while (i < len) {
    const ch = code.charCodeAt(i);

    if (ch === 47 && code.charCodeAt(i + 1) === 47) {
      let j = i + 2;
      while (j < len && code.charCodeAt(j) !== 10) j++;
      tokens.push({
        text: code.slice(i, j),
        start: i,
        end: j,
        type: 'comment',
      });
      i = j;
      continue;
    }

    if (ch === 47 && code.charCodeAt(i + 1) === 42) {
      let j = i + 2;
      while (j < len - 1 && !(code.charCodeAt(j) === 42 && code.charCodeAt(j + 1) === 47)) j++;
      j = Math.min(j + 2, len);
      tokens.push({
        text: code.slice(i, j),
        start: i,
        end: j,
        type: 'comment',
      });
      i = j;
      continue;
    }

    if (ch === 34 || ch === 39 || ch === 96) {
      const quote = ch;
      let j = i + 1;
      while (j < len) {
        if (code.charCodeAt(j) === 92) {
          j += 2;
          continue;
        }
        if (code.charCodeAt(j) === quote) {
          j++;
          break;
        }
        if (code.charCodeAt(j) === 10 && quote !== 96) {
          break;
        }
        j++;
      }
      tokens.push({
        text: code.slice(i, j),
        start: i,
        end: j,
        type: 'string',
      });
      i = j;
      continue;
    }

    if (isIdentifierStart(ch)) {
      let j = i + 1;
      while (j < len && isIdentifierChar(code.charCodeAt(j))) j++;
      const word = code.slice(i, j);
      let type: ParsedKeyword['type'] = 'plain';

      if (ALL_KEYWORDS.has(word)) {
        type = 'keyword';
      } else if (BUILTIN_FUNCTIONS.has(word)) {
        type = 'function';
      } else if (j < len && code.charCodeAt(j) === 40) {
        type = 'function';
      } else {
        type = 'variable';
      }

      tokens.push({
        text: word,
        start: i,
        end: j,
        type,
      });
      i = j;
      continue;
    }

    if (ch >= 48 && ch <= 57) {
      let j = i + 1;
      let hasDot = false;
      while (j < len) {
        const c = code.charCodeAt(j);
        if (c >= 48 && c <= 57) {
          j++;
        } else if (c === 46 && !hasDot) {
          hasDot = true;
          j++;
        } else if ((c === 101 || c === 69) && j + 1 < len) {
          const next = code.charCodeAt(j + 1);
          if (next === 43 || next === 45) {
            j += 2;
          } else {
            j++;
          }
        } else {
          break;
        }
      }
      tokens.push({
        text: code.slice(i, j),
        start: i,
        end: j,
        type: 'number',
      });
      i = j;
      continue;
    }

    if (
      ch === 43 || ch === 45 || ch === 42 || ch === 47 || ch === 37 ||
      ch === 61 || ch === 33 || ch === 60 || ch === 62 || ch === 38 ||
      ch === 124 || ch === 94 || ch === 126 || ch === 63 || ch === 58
    ) {
      let j = i + 1;
      while (
        j < len &&
        (
          code.charCodeAt(j) === 43 || code.charCodeAt(j) === 45 ||
          code.charCodeAt(j) === 42 || code.charCodeAt(j) === 47 ||
          code.charCodeAt(j) === 61 || code.charCodeAt(j) === 33 ||
          code.charCodeAt(j) === 60 || code.charCodeAt(j) === 62 ||
          code.charCodeAt(j) === 38 || code.charCodeAt(j) === 124 ||
          code.charCodeAt(j) === 63
        )
      ) {
        j++;
      }
      tokens.push({
        text: code.slice(i, j),
        start: i,
        end: j,
        type: 'operator',
      });
      i = j;
      continue;
    }

    if (
      ch === 40 || ch === 41 || ch === 123 || ch === 125 ||
      ch === 91 || ch === 93 || ch === 44 || ch === 59 || ch === 46
    ) {
      tokens.push({
        text: code.charAt(i),
        start: i,
        end: i + 1,
        type: 'punctuation',
      });
      i++;
      continue;
    }

    let j = i + 1;
    while (j < len) {
      const c = code.charCodeAt(j);
      if (
        (c >= 48 && c <= 57) ||
        (c >= 65 && c <= 90) ||
        (c >= 97 && c <= 122) ||
        c === 34 || c === 39 || c === 96 ||
        c === 47 || c === 10 || c === 13 ||
        c === 95 || c === 36
      ) {
        break;
      }
      j++;
    }
    if (j === i + 1) {
      tokens.push({
        text: code.charAt(i),
        start: i,
        end: i + 1,
        type: 'plain',
      });
      i++;
    } else {
      tokens.push({
        text: code.slice(i, j),
        start: i,
        end: j,
        type: 'plain',
      });
      i = j;
    }
  }

  return tokens;
}

export function findKeywordAtPosition(
  parsed: ParsedKeyword[],
  position: number
): ParsedKeyword | null {
  for (const token of parsed) {
    if (position >= token.start && position < token.end) {
      return token;
    }
  }
  return null;
}

export function getKeywordRanges(code: string): ParsedKeyword[] {
  return parseCode(code).filter(
    (t) =>
      t.type === 'keyword' ||
      t.type === 'function' ||
      t.type === 'variable' ||
      t.type === 'string' ||
      t.type === 'number'
  );
}
