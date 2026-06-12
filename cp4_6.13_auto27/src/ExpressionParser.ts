export interface ParseError {
  message: string;
  position: number;
  length?: number;
}

export type Evaluator = (x: number) => number;

interface Token {
  type: TokenType;
  value: string;
  position: number;
  length: number;
}

type TokenType =
  | 'NUMBER'
  | 'VARIABLE'
  | 'FUNCTION'
  | 'CONSTANT'
  | 'OP_PLUS'
  | 'OP_MINUS'
  | 'OP_MULTIPLY'
  | 'OP_DIVIDE'
  | 'OP_POWER'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'EOF';

const FUNCTIONS = new Set([
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'sinh',
  'cosh',
  'tanh',
  'log',
  'ln',
  'log10',
  'log2',
  'exp',
  'sqrt',
  'abs',
  'floor',
  'ceil',
  'round',
  'sign',
]);

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  PI: Math.PI,
  e: Math.E,
  E: Math.E,
};

const OP_PRECEDENCE: Record<string, number> = {
  OP_PLUS: 1,
  OP_MINUS: 1,
  OP_MULTIPLY: 2,
  OP_DIVIDE: 2,
  OP_POWER: 4,
  UNARY_MINUS: 5,
  UNARY_PLUS: 5,
  FUNCTION: 6,
};

const OP_ASSOC: Record<string, 'L' | 'R'> = {
  OP_PLUS: 'L',
  OP_MINUS: 'L',
  OP_MULTIPLY: 'L',
  OP_DIVIDE: 'L',
  OP_POWER: 'R',
  UNARY_MINUS: 'R',
  UNARY_PLUS: 'R',
};

const parseCache = new Map<string, Evaluator | ParseError>();

function normalizeExpression(raw: string): string {
  let expr = raw.trim();
  const eqMatch = expr.match(/^y\s*=\s*(.+)$/i);
  if (eqMatch) {
    expr = eqMatch[1];
  }
  return expr;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  const len = input.length;

  while (pos < len) {
    const ch = input[pos];

    if (/\s/.test(ch)) {
      pos++;
      continue;
    }

    if (/\d/.test(ch) || (ch === '.' && pos + 1 < len && /\d/.test(input[pos + 1]))) {
      const start = pos;
      let hasDot = false;
      while (pos < len && (/\d/.test(input[pos]) || (input[pos] === '.' && !hasDot))) {
        if (input[pos] === '.') hasDot = true;
        pos++;
      }
      if (pos < len && (input[pos] === 'e' || input[pos] === 'E')) {
        pos++;
        if (pos < len && (input[pos] === '+' || input[pos] === '-')) pos++;
        while (pos < len && /\d/.test(input[pos])) pos++;
      }
      tokens.push({
        type: 'NUMBER',
        value: input.substring(start, pos),
        position: start,
        length: pos - start,
      });
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      const start = pos;
      while (pos < len && /[a-zA-Z0-9_]/.test(input[pos])) pos++;
      const word = input.substring(start, pos);
      const type: TokenType = FUNCTIONS.has(word.toLowerCase())
        ? 'FUNCTION'
        : word in CONSTANTS
          ? 'CONSTANT'
          : 'VARIABLE';
      tokens.push({
        type,
        value: word,
        position: start,
        length: pos - start,
      });
      continue;
    }

    switch (ch) {
      case '+':
        tokens.push({ type: 'OP_PLUS', value: ch, position: pos, length: 1 });
        break;
      case '-':
        tokens.push({ type: 'OP_MINUS', value: ch, position: pos, length: 1 });
        break;
      case '*':
        tokens.push({ type: 'OP_MULTIPLY', value: ch, position: pos, length: 1 });
        break;
      case '/':
        tokens.push({ type: 'OP_DIVIDE', value: ch, position: pos, length: 1 });
        break;
      case '^':
        tokens.push({ type: 'OP_POWER', value: ch, position: pos, length: 1 });
        break;
      case '(':
        tokens.push({ type: 'LPAREN', value: ch, position: pos, length: 1 });
        break;
      case ')':
        tokens.push({ type: 'RPAREN', value: ch, position: pos, length: 1 });
        break;
      case ',':
        tokens.push({ type: 'COMMA', value: ch, position: pos, length: 1 });
        break;
      default:
        throw {
          message: `非法字符 "${ch}"`,
          position: pos,
          length: 1,
        } satisfies ParseError;
    }
    pos++;
  }

  tokens.push({ type: 'EOF', value: '', position: len, length: 0 });
  return tokens;
}

function insertImplicitMultiplication(tokens: Token[]): Token[] {
  const result: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    result.push(tokens[i]);
    if (i === tokens.length - 1) break;
    const curr = tokens[i];
    const next = tokens[i + 1];
    const needsMult =
      (curr.type === 'NUMBER' || curr.type === 'VARIABLE' || curr.type === 'CONSTANT' || curr.type === 'RPAREN') &&
      (next.type === 'VARIABLE' || next.type === 'FUNCTION' || next.type === 'CONSTANT' || next.type === 'LPAREN');
    if (needsMult) {
      result.push({
        type: 'OP_MULTIPLY',
        value: '*',
        position: next.position,
        length: 0,
      });
    }
  }
  return result;
}

function toRPN(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];
  let depth = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prev = i > 0 ? tokens[i - 1] : null;

    if (token.type === 'NUMBER' || token.type === 'VARIABLE' || token.type === 'CONSTANT') {
      output.push(token);
    } else if (token.type === 'FUNCTION') {
      stack.push(token);
    } else if (token.type === 'COMMA') {
      while (stack.length > 0 && stack[stack.length - 1].type !== 'LPAREN') {
        output.push(stack.pop()!);
      }
      if (stack.length === 0) {
        throw {
          message: '函数参数分隔符位置错误或括号不匹配',
          position: token.position,
          length: token.length,
        } satisfies ParseError;
      }
    } else if (
      token.type === 'OP_PLUS' ||
      token.type === 'OP_MINUS' ||
      token.type === 'OP_MULTIPLY' ||
      token.type === 'OP_DIVIDE' ||
      token.type === 'OP_POWER'
    ) {
      let opType = token.type;
      const isUnary =
        (opType === 'OP_PLUS' || opType === 'OP_MINUS') &&
        (prev === null ||
          prev.type === 'OP_PLUS' ||
          prev.type === 'OP_MINUS' ||
          prev.type === 'OP_MULTIPLY' ||
          prev.type === 'OP_DIVIDE' ||
          prev.type === 'OP_POWER' ||
          prev.type === 'LPAREN' ||
          prev.type === 'COMMA');

      const precKey = isUnary ? (opType === 'OP_MINUS' ? 'UNARY_MINUS' : 'UNARY_PLUS') : opType;

      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type === 'FUNCTION') {
          output.push(stack.pop()!);
          continue;
        }
        if (
          top.type === 'OP_PLUS' ||
          top.type === 'OP_MINUS' ||
          top.type === 'OP_MULTIPLY' ||
          top.type === 'OP_DIVIDE' ||
          top.type === 'OP_POWER'
        ) {
          const topKey = (top as Token & { unary?: boolean }).unary
            ? top.type === 'OP_MINUS'
              ? 'UNARY_MINUS'
              : 'UNARY_PLUS'
            : top.type;

          if (
            OP_PRECEDENCE[topKey] > OP_PRECEDENCE[precKey] ||
            (OP_PRECEDENCE[topKey] === OP_PRECEDENCE[precKey] && OP_ASSOC[precKey] === 'L')
          ) {
            output.push(stack.pop()!);
            continue;
          }
        }
        break;
      }

      const tok = { ...token };
      if (isUnary) {
        (tok as Token & { unary: boolean }).unary = true;
      }
      stack.push(tok);
    } else if (token.type === 'LPAREN') {
      stack.push(token);
      depth++;
    } else if (token.type === 'RPAREN') {
      depth--;
      while (stack.length > 0 && stack[stack.length - 1].type !== 'LPAREN') {
        output.push(stack.pop()!);
      }
      if (stack.length === 0) {
        throw {
          message: '多余的右括号',
          position: token.position,
          length: token.length,
        } satisfies ParseError;
      }
      stack.pop();
      if (stack.length > 0 && stack[stack.length - 1].type === 'FUNCTION') {
        output.push(stack.pop()!);
      }
    } else if (token.type === 'EOF') {
      break;
    }
  }

  if (depth > 0) {
    const openParen = tokens.findIndex((t) => t.type === 'LPAREN');
    throw {
      message: '括号不匹配：缺少右括号',
      position: openParen >= 0 ? tokens[openParen].position : 0,
      length: 1,
    } satisfies ParseError;
  }

  while (stack.length > 0) {
    const top = stack.pop()!;
    if (top.type === 'LPAREN' || top.type === 'RPAREN') {
      throw {
        message: '括号不匹配',
        position: top.position,
        length: top.length,
      } satisfies ParseError;
    }
    output.push(top);
  }

  return output;
}

function buildEvaluator(rpn: Token[]): Evaluator {
  return (x: number): number => {
    const stack: number[] = [];
    for (const tok of rpn) {
      switch (tok.type) {
        case 'NUMBER': {
          stack.push(parseFloat(tok.value));
          break;
        }
        case 'VARIABLE': {
          if (tok.value.toLowerCase() === 'x') {
            stack.push(x);
          } else {
            return NaN;
          }
          break;
        }
        case 'CONSTANT': {
          stack.push(CONSTANTS[tok.value] ?? NaN);
          break;
        }
        case 'OP_PLUS': {
          if ((tok as Token & { unary?: boolean }).unary) {
            const a = stack.pop()!;
            stack.push(a);
          } else {
            const b = stack.pop()!;
            const a = stack.pop()!;
            stack.push(a + b);
          }
          break;
        }
        case 'OP_MINUS': {
          if ((tok as Token & { unary?: boolean }).unary) {
            const a = stack.pop()!;
            stack.push(-a);
          } else {
            const b = stack.pop()!;
            const a = stack.pop()!;
            stack.push(a - b);
          }
          break;
        }
        case 'OP_MULTIPLY': {
          const b = stack.pop()!;
          const a = stack.pop()!;
          stack.push(a * b);
          break;
        }
        case 'OP_DIVIDE': {
          const b = stack.pop()!;
          const a = stack.pop()!;
          stack.push(a / b);
          break;
        }
        case 'OP_POWER': {
          const b = stack.pop()!;
          const a = stack.pop()!;
          stack.push(Math.pow(a, b));
          break;
        }
        case 'FUNCTION': {
          const a = stack.pop()!;
          switch (tok.value.toLowerCase()) {
            case 'sin':
              stack.push(Math.sin(a));
              break;
            case 'cos':
              stack.push(Math.cos(a));
              break;
            case 'tan':
              stack.push(Math.tan(a));
              break;
            case 'asin':
              stack.push(Math.asin(a));
              break;
            case 'acos':
              stack.push(Math.acos(a));
              break;
            case 'atan':
              stack.push(Math.atan(a));
              break;
            case 'sinh':
              stack.push(Math.sinh(a));
              break;
            case 'cosh':
              stack.push(Math.cosh(a));
              break;
            case 'tanh':
              stack.push(Math.tanh(a));
              break;
            case 'log':
            case 'ln':
              stack.push(Math.log(a));
              break;
            case 'log10':
              stack.push(Math.log10(a));
              break;
            case 'log2':
              stack.push(Math.log2(a));
              break;
            case 'exp':
              stack.push(Math.exp(a));
              break;
            case 'sqrt':
              stack.push(Math.sqrt(a));
              break;
            case 'abs':
              stack.push(Math.abs(a));
              break;
            case 'floor':
              stack.push(Math.floor(a));
              break;
            case 'ceil':
              stack.push(Math.ceil(a));
              break;
            case 'round':
              stack.push(Math.round(a));
              break;
            case 'sign':
              stack.push(Math.sign(a));
              break;
            default:
              stack.push(NaN);
          }
          break;
        }
      }
    }
    if (stack.length === 0) return NaN;
    return stack.pop()!;
  };
}

export function parseExpression(raw: string): Evaluator | ParseError {
  const normalized = normalizeExpression(raw);

  if (parseCache.has(normalized)) {
    const cached = parseCache.get(normalized)!;
    if (typeof cached === 'function') return cached;
    return { ...(cached as ParseError) };
  }

  try {
    if (!normalized) {
      throw { message: '表达式为空', position: 0, length: 0 } satisfies ParseError;
    }
    const tokens = tokenize(normalized);
    const withImplicit = insertImplicitMultiplication(tokens);
    const rpn = toRPN(withImplicit);
    if (rpn.length === 0) {
      throw { message: '表达式无效', position: 0, length: normalized.length } satisfies ParseError;
    }
    const evaluator = buildEvaluator(rpn);
    parseCache.set(normalized, evaluator);
    return evaluator;
  } catch (e) {
    const err = e as ParseError;
    parseCache.set(normalized, err);
    return { message: err.message, position: err.position, length: err.length ?? 1 };
  }
}

export function isParseError(result: Evaluator | ParseError): result is ParseError {
  return typeof result === 'object';
}

export function formatErrorWithCaret(expression: string, err: ParseError): string {
  const displayExpr = normalizeExpression(expression);
  const pos = Math.min(Math.max(0, err.position), displayExpr.length);
  const before = displayExpr.slice(0, pos);
  const at = displayExpr.slice(pos, pos + Math.max(1, err.length ?? 1));
  const after = displayExpr.slice(pos + Math.max(1, err.length ?? 1));
  const caret = '^'.repeat(Math.max(1, err.length ?? 1));
  return `${before}\u200B【${at}】\u200B${after}\n${' '.repeat(before.length)}${caret} ${err.message}`;
}
