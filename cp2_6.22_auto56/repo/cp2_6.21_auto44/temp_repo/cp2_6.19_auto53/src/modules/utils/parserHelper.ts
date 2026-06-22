export interface Token {
  type: 'keyword' | 'identifier' | 'string' | 'number' | 'operator' | 'punctuation' | 'comment' | 'whitespace';
  value: string;
  line: number;
  column: number;
}

export interface ParsedStatement {
  type: string;
  line: number;
  endLine: number;
  raw: string;
  body?: ParsedStatement[];
}

const KEYWORDS = new Set([
  'let', 'const', 'var', 'if', 'else', 'for', 'while', 'do',
  'function', 'return', 'break', 'continue', 'true', 'false',
  'null', 'undefined', 'typeof', 'new', 'this'
]);

export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let line = 1;
  let column = 1;
  let i = 0;

  while (i < code.length) {
    const char = code[i];
    const startLine = line;
    const startColumn = column;

    if (char === '\n') {
      line++;
      column = 1;
      i++;
      tokens.push({ type: 'whitespace', value: '\n', line: startLine, column: startColumn });
      continue;
    }

    if (/\s/.test(char)) {
      let ws = '';
      while (i < code.length && /\s/.test(code[i]) && code[i] !== '\n') {
        ws += code[i];
        column++;
        i++;
      }
      tokens.push({ type: 'whitespace', value: ws, line: startLine, column: startColumn });
      continue;
    }

    if (char === '/' && code[i + 1] === '/') {
      let comment = '';
      while (i < code.length && code[i] !== '\n') {
        comment += code[i];
        column++;
        i++;
      }
      tokens.push({ type: 'comment', value: comment, line: startLine, column: startColumn });
      continue;
    }

    if (char === '/' && code[i + 1] === '*') {
      let comment = '/*';
      column += 2;
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        if (code[i] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        comment += code[i];
        i++;
      }
      if (i < code.length) {
        comment += '*/';
        column += 2;
        i += 2;
      }
      tokens.push({ type: 'comment', value: comment, line: startLine, column: startColumn });
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      let str = char;
      column++;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\' && i + 1 < code.length) {
          str += code[i] + code[i + 1];
          column += 2;
          i += 2;
        } else {
          if (code[i] === '\n') {
            line++;
            column = 1;
          } else {
            column++;
          }
          str += code[i];
          i++;
        }
      }
      if (i < code.length) {
        str += quote;
        column++;
        i++;
      }
      tokens.push({ type: 'string', value: str, line: startLine, column: startColumn });
      continue;
    }

    if (/[0-9]/.test(char)) {
      let num = '';
      while (i < code.length && /[0-9.]/.test(code[i])) {
        num += code[i];
        column++;
        i++;
      }
      tokens.push({ type: 'number', value: num, line: startLine, column: startColumn });
      continue;
    }

    if (/[a-zA-Z_$]/.test(char)) {
      let ident = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        ident += code[i];
        column++;
        i++;
      }
      const type = KEYWORDS.has(ident) ? 'keyword' : 'identifier';
      tokens.push({ type, value: ident, line: startLine, column: startColumn });
      continue;
    }

    if (/[+\-*/%=<>!&|^~?:]/.test(char)) {
      let op = char;
      column++;
      i++;
      if (i < code.length && /[=|&|]/.test(code[i])) {
        op += code[i];
        column++;
        i++;
      }
      tokens.push({ type: 'operator', value: op, line: startLine, column: startColumn });
      continue;
    }

    if (/[{}()\[\];,.]/.test(char)) {
      tokens.push({ type: 'punctuation', value: char, line: startLine, column: startColumn });
      column++;
      i++;
      continue;
    }

    tokens.push({ type: 'punctuation', value: char, line: startLine, column: startColumn });
    column++;
    i++;
  }

  return tokens;
}

export function highlightCode(code: string): { html: string; lineCount: number } {
  const tokens = tokenize(code);
  let html = '';
  let currentLine = 1;
  let lineCount = 1;

  html += '<span class="line">';

  for (const token of tokens) {
    while (token.line > currentLine) {
      html += '</span><span class="line">';
      currentLine++;
      lineCount++;
    }

    let className = '';
    switch (token.type) {
      case 'keyword':
        className = 'tok-keyword';
        break;
      case 'string':
        className = 'tok-string';
        break;
      case 'number':
        className = 'tok-number';
        break;
      case 'comment':
        className = 'tok-comment';
        break;
      case 'operator':
        className = 'tok-operator';
        break;
      default:
        className = 'tok-plain';
    }

    const escaped = token.value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (token.type === 'whitespace' && token.value === '\n') {
      // handled by line logic
    } else {
      html += `<span class="${className}">${escaped}</span>`;
    }
  }

  html += '</span>';

  const lines = code.split('\n');
  lineCount = lines.length;

  return { html, lineCount };
}

export function splitStatements(code: string): { statements: ParsedStatement[]; error?: { message: string; line: number } } {
  const lines = code.split('\n');
  const preservedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return '';
    }
    return line;
  });

  const processedCode = preservedLines.join('\n');
  const tokens = tokenize(processedCode).filter(t => t.type !== 'whitespace' && t.type !== 'comment');
  const statements: ParsedStatement[] = [];
  let i = 0;

  const findMatchingBrace = (startIdx: number): number => {
    let depth = 1;
    let j = startIdx + 1;
    while (j < tokens.length && depth > 0) {
      if (tokens[j].value === '{') depth++;
      if (tokens[j].value === '}') depth--;
      if (depth === 0) return j;
      j++;
    }
    return -1;
  };

  const findMatchingParen = (startIdx: number): number => {
    let depth = 1;
    let j = startIdx + 1;
    while (j < tokens.length && depth > 0) {
      if (tokens[j].value === '(') depth++;
      if (tokens[j].value === ')') depth--;
      if (depth === 0) return j;
      j++;
    }
    return -1;
  };

  const getCodeRange = (startLine: number, endLine: number): string => {
    const lines = code.split('\n');
    return lines.slice(startLine - 1, endLine).join('\n');
  };

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.value === '}') {
      i++;
      continue;
    }

    if (token.type === 'keyword') {
      if (token.value === 'let' || token.value === 'const' || token.value === 'var') {
        let j = i;
        while (j < tokens.length && tokens[j].value !== ';' && tokens[j].value !== '}') {
          j++;
        }
        const endLine = j < tokens.length ? tokens[j].line : tokens[tokens.length - 1].line;
        statements.push({
          type: 'declaration',
          line: token.line,
          endLine,
          raw: getCodeRange(token.line, endLine),
        });
        i = j + 1;
        continue;
      }

      if (token.value === 'if' || token.value === 'while') {
        const keyword = token.value;
        const parenOpen = i + 1;
        if (tokens[parenOpen]?.value !== '(') {
          return { statements: [], error: { message: `Expected '(' after '${keyword}'`, line: token.line } };
        }
        const parenClose = findMatchingParen(parenOpen);
        if (parenClose === -1) {
          return { statements: [], error: { message: 'Unmatched parenthesis', line: token.line } };
        }

        let endLine = tokens[parenClose].line;
        const body: ParsedStatement[] = [];

        if (tokens[parenClose + 1]?.value === '{') {
          const braceClose = findMatchingBrace(parenClose + 1);
          if (braceClose === -1) {
            return { statements: [], error: { message: 'Unmatched brace', line: tokens[parenClose + 1].line } };
          }
          endLine = tokens[braceClose].line;
          const innerTokens = tokens.slice(parenClose + 2, braceClose);
          const innerResult = parseInnerStatements(innerTokens, code);
          if (innerResult.error) return { statements: [], error: innerResult.error };
          body.push(...innerResult.statements);
          i = braceClose + 1;
        } else {
          let j = parenClose + 1;
          while (j < tokens.length && tokens[j].value !== ';' && tokens[j].value !== '}' && tokens[j].line === tokens[parenClose + 1]?.line) {
            j++;
          }
          endLine = j < tokens.length ? tokens[j].line : tokens[tokens.length - 1].line;
          i = j + 1;
        }

        statements.push({
          type: keyword,
          line: token.line,
          endLine,
          raw: getCodeRange(token.line, endLine),
          body,
        });

        if (keyword === 'if' && tokens[i]?.value === 'else') {
          const elseToken = tokens[i];
          let elseEndLine = elseToken.line;
          const elseBody: ParsedStatement[] = [];

          if (tokens[i + 1]?.value === '{') {
            const braceClose = findMatchingBrace(i + 1);
            if (braceClose === -1) {
              return { statements: [], error: { message: 'Unmatched brace', line: tokens[i + 1].line } };
            }
            elseEndLine = tokens[braceClose].line;
            const innerTokens = tokens.slice(i + 2, braceClose);
            const innerResult = parseInnerStatements(innerTokens, code);
            if (innerResult.error) return { statements: [], error: innerResult.error };
            elseBody.push(...innerResult.statements);
            i = braceClose + 1;
          }

          statements.push({
            type: 'else',
            line: elseToken.line,
            endLine: elseEndLine,
            raw: getCodeRange(elseToken.line, elseEndLine),
            body: elseBody,
          });
        }
        continue;
      }

      if (token.value === 'for') {
        const parenOpen = i + 1;
        if (tokens[parenOpen]?.value !== '(') {
          return { statements: [], error: { message: "Expected '(' after 'for'", line: token.line } };
        }
        const parenClose = findMatchingParen(parenOpen);
        if (parenClose === -1) {
          return { statements: [], error: { message: 'Unmatched parenthesis', line: token.line } };
        }

        let endLine = tokens[parenClose].line;
        const body: ParsedStatement[] = [];

        if (tokens[parenClose + 1]?.value === '{') {
          const braceClose = findMatchingBrace(parenClose + 1);
          if (braceClose === -1) {
            return { statements: [], error: { message: 'Unmatched brace', line: tokens[parenClose + 1].line } };
          }
          endLine = tokens[braceClose].line;
          const innerTokens = tokens.slice(parenClose + 2, braceClose);
          const innerResult = parseInnerStatements(innerTokens, code);
          if (innerResult.error) return { statements: [], error: innerResult.error };
          body.push(...innerResult.statements);
          i = braceClose + 1;
        } else {
          i = parenClose + 2;
        }

        statements.push({
          type: 'for',
          line: token.line,
          endLine,
          raw: getCodeRange(token.line, endLine),
          body,
        });
        continue;
      }

      if (token.value === 'function') {
        const nameToken = tokens[i + 1];
        if (!nameToken || nameToken.type !== 'identifier') {
          return { statements: [], error: { message: 'Expected function name', line: token.line } };
        }
        const parenOpen = i + 2;
        if (tokens[parenOpen]?.value !== '(') {
          return { statements: [], error: { message: "Expected '(' after function name", line: token.line } };
        }
        const parenClose = findMatchingParen(parenOpen);
        if (parenClose === -1) {
          return { statements: [], error: { message: 'Unmatched parenthesis', line: token.line } };
        }

        let endLine = tokens[parenClose].line;
        const body: ParsedStatement[] = [];

        if (tokens[parenClose + 1]?.value === '{') {
          const braceClose = findMatchingBrace(parenClose + 1);
          if (braceClose === -1) {
            return { statements: [], error: { message: 'Unmatched brace', line: tokens[parenClose + 1].line } };
          }
          endLine = tokens[braceClose].line;
          const innerTokens = tokens.slice(parenClose + 2, braceClose);
          const innerResult = parseInnerStatements(innerTokens, code);
          if (innerResult.error) return { statements: [], error: innerResult.error };
          body.push(...innerResult.statements);
          i = braceClose + 1;
        } else {
          i = parenClose + 2;
        }

        statements.push({
          type: 'function',
          line: token.line,
          endLine,
          raw: getCodeRange(token.line, endLine),
          body,
        });
        continue;
      }

      if (token.value === 'return' || token.value === 'break' || token.value === 'continue') {
        let j = i;
        while (j < tokens.length && tokens[j].value !== ';' && tokens[j].value !== '}') {
          j++;
        }
        const endLine = j < tokens.length ? tokens[j].line : tokens[tokens.length - 1].line;
        statements.push({
          type: token.value,
          line: token.line,
          endLine,
          raw: getCodeRange(token.line, endLine),
        });
        i = j + 1;
        continue;
      }
    }

    let j = i;
    while (j < tokens.length && tokens[j].value !== ';' && tokens[j].value !== '}') {
      j++;
    }
    const endLine = j < tokens.length ? tokens[j].line : tokens[tokens.length - 1].line;

    if (token.value !== '}') {
      statements.push({
        type: 'expression',
        line: token.line,
        endLine,
        raw: getCodeRange(token.line, endLine),
      });
    }
    i = j + 1;
  }

  return { statements };
}

function createParseHelpers(tokens: Token[], code: string) {
  const findMatchingBrace = (startIdx: number): number => {
    let depth = 1;
    let j = startIdx + 1;
    while (j < tokens.length && depth > 0) {
      if (tokens[j].value === '{') depth++;
      if (tokens[j].value === '}') depth--;
      if (depth === 0) return j;
      j++;
    }
    return -1;
  };

  const findMatchingParen = (startIdx: number): number => {
    let depth = 1;
    let j = startIdx + 1;
    while (j < tokens.length && depth > 0) {
      if (tokens[j].value === '(') depth++;
      if (tokens[j].value === ')') depth--;
      if (depth === 0) return j;
      j++;
    }
    return -1;
  };

  const getCodeRange = (startLine: number, endLine: number): string => {
    const lines = code.split('\n');
    return lines.slice(startLine - 1, endLine).join('\n');
  };

  const findEndOfStatement = (startIdx: number): number => {
    let j = startIdx;
    while (j < tokens.length && tokens[j].value !== ';' && tokens[j].value !== '}') {
      j++;
    }
    return j;
  };

  return { findMatchingBrace, findMatchingParen, getCodeRange, findEndOfStatement };
}

function parseSingleStatement(
  tokens: Token[],
  startIdx: number,
  helpers: ReturnType<typeof createParseHelpers>,
  code: string
): { statement: ParsedStatement | null; nextIdx: number; error?: { message: string; line: number } } {
  const { findMatchingBrace, findMatchingParen, getCodeRange, findEndOfStatement } = helpers;
  
  let i = startIdx;
  
  while (i < tokens.length && tokens[i].value === '}') {
    i++;
  }
  
  if (i >= tokens.length) {
    return { statement: null, nextIdx: i };
  }
  
  const token = tokens[i];
  
  if (token.type === 'keyword') {
    if (token.value === 'let' || token.value === 'const' || token.value === 'var') {
      const j = findEndOfStatement(i);
      const endLine = j < tokens.length ? tokens[j].line : tokens[tokens.length - 1].line;
      return {
        statement: {
          type: 'declaration',
          line: token.line,
          endLine,
          raw: getCodeRange(token.line, endLine),
        },
        nextIdx: j + 1,
      };
    }

    if (token.value === 'if' || token.value === 'while') {
      const keyword = token.value;
      const parenOpen = i + 1;
      const parenClose = findMatchingParen(parenOpen);
      if (parenClose === -1) {
        return { statement: null, nextIdx: i, error: { message: 'Unmatched parenthesis', line: token.line } };
      }

      let endLine = tokens[parenClose].line;
      const body: ParsedStatement[] = [];
      let nextIdx = parenClose + 2;

      if (tokens[parenClose + 1]?.value === '{') {
        const braceClose = findMatchingBrace(parenClose + 1);
        if (braceClose === -1) {
          return { statement: null, nextIdx: i, error: { message: 'Unmatched brace', line: tokens[parenClose + 1].line } };
        }
        endLine = tokens[braceClose].line;
        const innerTokens = tokens.slice(parenClose + 2, braceClose);
        const innerResult = parseInnerStatements(innerTokens, code);
        if (innerResult.error) return { statement: null, nextIdx: i, error: innerResult.error };
        body.push(...innerResult.statements);
        nextIdx = braceClose + 1;
      } else {
        const singleResult = parseSingleStatement(tokens, parenClose + 2, helpers, code);
        if (singleResult.error) return { statement: null, nextIdx: i, error: singleResult.error };
        if (singleResult.statement) {
          body.push(singleResult.statement);
          endLine = singleResult.statement.endLine;
        }
        nextIdx = singleResult.nextIdx;
      }

      const statement: ParsedStatement = {
        type: keyword,
        line: token.line,
        endLine,
        raw: getCodeRange(token.line, endLine),
        body,
      };

      if (keyword === 'if' && tokens[nextIdx]?.value === 'else') {
        const elseToken = tokens[nextIdx];
        let elseEndLine = elseToken.line;
        const elseBody: ParsedStatement[] = [];
        let elseNextIdx = nextIdx + 2;

        if (tokens[nextIdx + 1]?.value === '{') {
          const braceClose = findMatchingBrace(nextIdx + 1);
          if (braceClose === -1) {
            return { statement: null, nextIdx: i, error: { message: 'Unmatched brace', line: tokens[nextIdx + 1].line } };
          }
          elseEndLine = tokens[braceClose].line;
          const innerTokens = tokens.slice(nextIdx + 2, braceClose);
          const innerResult = parseInnerStatements(innerTokens, code);
          if (innerResult.error) return { statement: null, nextIdx: i, error: innerResult.error };
          elseBody.push(...innerResult.statements);
          elseNextIdx = braceClose + 1;
        } else {
          const singleResult = parseSingleStatement(tokens, nextIdx + 2, helpers, code);
          if (singleResult.error) return { statement: null, nextIdx: i, error: singleResult.error };
          if (singleResult.statement) {
            elseBody.push(singleResult.statement);
            elseEndLine = singleResult.statement.endLine;
          }
          elseNextIdx = singleResult.nextIdx;
        }

        (statement as any).elseStatement = {
          type: 'else',
          line: elseToken.line,
          endLine: elseEndLine,
          raw: getCodeRange(elseToken.line, elseEndLine),
          body: elseBody,
        };
        
        nextIdx = elseNextIdx;
      }

      return { statement, nextIdx };
    }

    if (token.value === 'return' || token.value === 'break' || token.value === 'continue') {
      const j = findEndOfStatement(i);
      const endLine = j < tokens.length ? tokens[j].line : tokens[tokens.length - 1].line;
      return {
        statement: {
          type: token.value,
          line: token.line,
          endLine,
          raw: getCodeRange(token.line, endLine),
        },
        nextIdx: j + 1,
      };
    }
  }

  const j = findEndOfStatement(i);
  const endLine = j < tokens.length ? tokens[j].line : tokens[tokens.length - 1].line;

  if (token.value === '}') {
    return { statement: null, nextIdx: j + 1 };
  }

  return {
    statement: {
      type: 'expression',
      line: token.line,
      endLine,
      raw: getCodeRange(token.line, endLine),
    },
    nextIdx: j + 1,
  };
}

function parseInnerStatements(tokens: Token[], code: string): { statements: ParsedStatement[]; error?: { message: string; line: number } } {
  const statements: ParsedStatement[] = [];
  const helpers = createParseHelpers(tokens, code);
  let i = 0;

  while (i < tokens.length) {
    const result = parseSingleStatement(tokens, i, helpers, code);
    if (result.error) {
      return { statements: [], error: result.error };
    }
    if (result.statement) {
      statements.push(result.statement);
    }
    i = result.nextIdx;
  }

  return { statements };
}
