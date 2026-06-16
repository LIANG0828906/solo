export interface Token {
  type:
    | 'keyword'
    | 'string'
    | 'number'
    | 'comment'
    | 'functionName'
    | 'punctuation'
    | 'whitespace'
    | 'identifier'
    | 'operator'
    | 'templateLiteral'
    | 'boolean'
    | 'null';
  value: string;
  start: number;
  end: number;
}

const KEYWORDS = new Set([
  'function', 'if', 'else', 'return', 'const', 'let', 'var', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'class', 'extends', 'new',
  'this', 'super', 'import', 'export', 'default', 'from', 'as', 'type',
  'interface', 'implements', 'public', 'private', 'protected', 'readonly',
  'static', 'void', 'async', 'await', 'try', 'catch', 'finally', 'throw',
  'in', 'of', 'typeof', 'instanceof', 'debugger', 'with', 'yield', 'delete'
]);

const BOOLEAN_LITERALS = new Set(['true', 'false']);

export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let prevToken: Token | null = null;

  while (i < code.length) {
    const char = code[i];

    if (char === '/' && code[i + 1] === '/') {
      const start = i;
      let j = i;
      while (j < code.length && code[j] !== '\n') {
        j++;
      }
      tokens.push({
        type: 'comment',
        value: code.slice(start, j),
        start,
        end: j,
      });
      i = j;
      prevToken = tokens[tokens.length - 1];
      continue;
    }

    if (char === '/' && code[i + 1] === '*') {
      const start = i;
      let j = i + 2;
      while (j < code.length && !(code[j] === '*' && code[j + 1] === '/')) {
        j++;
      }
      j = Math.min(j + 2, code.length);
      tokens.push({
        type: 'comment',
        value: code.slice(start, j),
        start,
        end: j,
      });
      i = j;
      prevToken = tokens[tokens.length - 1];
      continue;
    }

    if (char === '`') {
      const start = i;
      let j = i + 1;
      while (j < code.length && code[j] !== '`') {
        if (code[j] === '\\' && j + 1 < code.length) {
          j++;
        }
        j++;
      }
      j = Math.min(j + 1, code.length);
      tokens.push({
        type: 'templateLiteral',
        value: code.slice(start, j),
        start,
        end: j,
      });
      i = j;
      prevToken = tokens[tokens.length - 1];
      continue;
    }

    if (char === '"' || char === "'") {
      const start = i;
      const quote = char;
      let j = i + 1;
      while (j < code.length && code[j] !== quote) {
        if (code[j] === '\\' && j + 1 < code.length) {
          j++;
        }
        j++;
      }
      j = Math.min(j + 1, code.length);
      tokens.push({
        type: 'string',
        value: code.slice(start, j),
        start,
        end: j,
      });
      i = j;
      prevToken = tokens[tokens.length - 1];
      continue;
    }

    if (/\d/.test(char)) {
      const start = i;
      let j = i;
      while (j < code.length) {
        const c = code[j];
        if (/[\d.]/.test(c)) {
          j++;
          continue;
        }
        if ((c === 'e' || c === 'E') && j + 1 < code.length && /[+\-\d]/.test(code[j + 1])) {
          j++;
          if (code[j] === '+' || code[j] === '-') j++;
          while (j < code.length && /\d/.test(code[j])) j++;
          continue;
        }
        if ((c === 'x' || c === 'X') && j === start + 1 && code[start] === '0') {
          j++;
          while (j < code.length && /[a-fA-F\d]/.test(code[j])) j++;
          continue;
        }
        if ((c === 'o' || c === 'O') && j === start + 1 && code[start] === '0') {
          j++;
          while (j < code.length && /[0-7]/.test(code[j])) j++;
          continue;
        }
        if ((c === 'b' || c === 'B') && j === start + 1 && code[start] === '0') {
          j++;
          while (j < code.length && /[01]/.test(code[j])) j++;
          continue;
        }
        break;
      }
      tokens.push({
        type: 'number',
        value: code.slice(start, j),
        start,
        end: j,
      });
      i = j;
      prevToken = tokens[tokens.length - 1];
      continue;
    }

    if (/[a-zA-Z_$]/.test(char)) {
      const start = i;
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) {
        j++;
      }
      const word = code.slice(start, j);

      if (KEYWORDS.has(word)) {
        tokens.push({
          type: 'keyword',
          value: word,
          start,
          end: j,
        });
        prevToken = tokens[tokens.length - 1];
        i = j;

        if (word === 'function') {
          let k = j;
          while (k < code.length && /\s/.test(code[k])) k++;
          if (k < code.length && /[a-zA-Z_$]/.test(code[k])) {
            const fnStart = k;
            while (k < code.length && /[a-zA-Z0-9_$]/.test(code[k])) k++;
            tokens.push({
              type: 'whitespace',
              value: code.slice(j, fnStart),
              start: j,
              end: fnStart,
            });
            tokens.push({
              type: 'functionName',
              value: code.slice(fnStart, k),
              start: fnStart,
              end: k,
            });
            i = k;
            prevToken = tokens[tokens.length - 1];
          }
        }
        continue;
      }

      if (BOOLEAN_LITERALS.has(word)) {
        tokens.push({
          type: 'boolean',
          value: word,
          start,
          end: j,
        });
        i = j;
        prevToken = tokens[tokens.length - 1];
        continue;
      }

      if (word === 'null' || word === 'undefined' || word === 'NaN' || word === 'Infinity') {
        tokens.push({
          type: 'null',
          value: word,
          start,
          end: j,
        });
        i = j;
        prevToken = tokens[tokens.length - 1];
        continue;
      }

      let k = j;
      while (k < code.length && /\s/.test(code[k])) k++;
      if (code[k] === '(') {
        tokens.push({
          type: 'functionName',
          value: word,
          start,
          end: j,
        });
      } else if (prevToken && prevToken.type === 'keyword' && prevToken.value === 'function') {
        tokens.push({
          type: 'functionName',
          value: word,
          start,
          end: j,
        });
      } else {
        tokens.push({
          type: 'identifier',
          value: word,
          start,
          end: j,
        });
      }
      i = j;
      prevToken = tokens[tokens.length - 1];
      continue;
    }

    if (/\s/.test(char)) {
      const start = i;
      let j = i;
      while (j < code.length && /\s/.test(code[j])) {
        j++;
      }
      tokens.push({
        type: 'whitespace',
        value: code.slice(start, j),
        start,
        end: j,
      });
      i = j;
      prevToken = tokens[tokens.length - 1];
      continue;
    }

    if (/[+\-*/%=<>!&|^~?:]/.test(char)) {
      const start = i;
      let j = i;
      while (j < code.length && /[+\-*/%=<>!&|^~?:]/.test(code[j])) {
        j++;
      }
      tokens.push({
        type: 'operator',
        value: code.slice(start, j),
        start,
        end: j,
      });
      i = j;
      prevToken = tokens[tokens.length - 1];
      continue;
    }

    if (/[{}()[\];,.]/.test(char)) {
      tokens.push({
        type: 'punctuation',
        value: char,
        start: i,
        end: i + 1,
      });
      i++;
      prevToken = tokens[tokens.length - 1];
      continue;
    }

    tokens.push({
      type: 'identifier',
      value: char,
      start: i,
      end: i + 1,
    });
    i++;
    prevToken = tokens[tokens.length - 1];
  }

  return tokens;
}

export function tokenizeLine(line: string, lineOffset: number = 0): Token[] {
  const tokens = tokenize(line);
  if (lineOffset === 0) return tokens;
  return tokens.map((t) => ({
    ...t,
    start: t.start + lineOffset,
    end: t.end + lineOffset,
  }));
}
