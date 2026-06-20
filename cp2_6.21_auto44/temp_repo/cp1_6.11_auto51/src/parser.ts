export interface ParseResult {
  success: boolean;
  fn?: (x: number) => number;
  error?: string;
}

type TokenType = 'number' | 'variable' | 'op' | 'func' | 'lparen' | 'rparen' | 'eof';

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

const BUILTIN_FUNCS = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log', 'sqrt', 'abs']);
const BUILTIN_CONSTS: Record<string, number> = { 'pi': Math.PI, 'e': Math.E };

class Tokenizer {
  private src: string;
  private pos: number = 0;

  constructor(src: string) {
    this.src = src.replace(/\s+/g, '');
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.src.length) {
      const ch = this.src[this.pos];

      if (this.isDigit(ch) || ch === '.') {
        tokens.push(this.readNumber());
        continue;
      }

      if (this.isLetter(ch)) {
        tokens.push(this.readIdent());
        continue;
      }

      if ('+-*/^'.includes(ch)) {
        tokens.push({ type: 'op', value: ch, pos: this.pos });
        this.pos++;
        continue;
      }

      if (ch === '(') {
        tokens.push({ type: 'lparen', value: '(', pos: this.pos });
        this.pos++;
        continue;
      }

      if (ch === ')') {
        tokens.push({ type: 'rparen', value: ')', pos: this.pos });
        this.pos++;
        continue;
      }

      throw new Error(`位置 ${this.pos}: 意外的字符 '${ch}'`);
    }

    tokens.push({ type: 'eof', value: '', pos: this.pos });
    return tokens;
  }

  private readNumber(): Token {
    const start = this.pos;
    let hasDot = false;

    while (this.pos < this.src.length) {
      const ch = this.src[this.pos];
      if (this.isDigit(ch)) {
        this.pos++;
      } else if (ch === '.' && !hasDot) {
        hasDot = true;
        this.pos++;
      } else {
        break;
      }
    }

    if (this.pos < this.src.length && (this.src[this.pos] === 'e' || this.src[this.pos] === 'E')) {
      this.pos++;
      if (this.pos < this.src.length && (this.src[this.pos] === '+' || this.src[this.pos] === '-')) {
        this.pos++;
      }
      while (this.pos < this.src.length && this.isDigit(this.src[this.pos])) {
        this.pos++;
      }
    }

    return { type: 'number', value: this.src.slice(start, this.pos), pos: start };
  }

  private readIdent(): Token {
    const start = this.pos;
    while (this.pos < this.src.length && this.isLetterOrDigit(this.src[this.pos])) {
      this.pos++;
    }
    const name = this.src.slice(start, this.pos).toLowerCase();

    if (BUILTIN_FUNCS.has(name)) {
      return { type: 'func', value: name, pos: start };
    }

    if (name === 'x') {
      return { type: 'variable', value: 'x', pos: start };
    }

    if (BUILTIN_CONSTS[name] !== undefined) {
      return { type: 'number', value: String(BUILTIN_CONSTS[name]), pos: start };
    }

    throw new Error(`位置 ${start}: 未知的标识符 '${name}'`);
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isLetter(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
  }

  private isLetterOrDigit(ch: string): boolean {
    return this.isLetter(ch) || this.isDigit(ch);
  }
}

type ASTNode =
  | { type: 'num'; value: number }
  | { type: 'var' }
  | { type: 'bin'; op: string; left: ASTNode; right: ASTNode }
  | { type: 'neg'; arg: ASTNode }
  | { type: 'call'; name: string; arg: ASTNode };

class Parser {
  private tokens: Token[];
  private idx: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    const node = this.parseExpr();
    const cur = this.current();
    if (cur.type !== 'eof') {
      throw new Error(`位置 ${cur.pos}: 期望表达式结束，遇到 '${cur.value}'`);
    }
    return node;
  }

  private parseExpr(): ASTNode {
    let left = this.parseTerm();
    while (true) {
      const cur = this.current();
      if (cur.type === 'op' && (cur.value === '+' || cur.value === '-')) {
        this.advance();
        const right = this.parseTerm();
        left = { type: 'bin', op: cur.value, left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private parseTerm(): ASTNode {
    let left = this.parsePower();
    while (true) {
      const cur = this.current();
      if (cur.type === 'op' && (cur.value === '*' || cur.value === '/')) {
        this.advance();
        const right = this.parsePower();
        left = { type: 'bin', op: cur.value, left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private parsePower(): ASTNode {
    const base = this.parseUnary();
    const cur = this.current();
    if (cur.type === 'op' && cur.value === '^') {
      this.advance();
      const exp = this.parseUnary();
      return { type: 'bin', op: '^', left: base, right: exp };
    }
    return base;
  }

  private parseUnary(): ASTNode {
    const cur = this.current();
    if (cur.type === 'op' && cur.value === '+') {
      this.advance();
      return this.parseUnary();
    }
    if (cur.type === 'op' && cur.value === '-') {
      this.advance();
      const arg = this.parseUnary();
      return { type: 'neg', arg };
    }
    return this.parseAtom();
  }

  private parseAtom(): ASTNode {
    const cur = this.current();

    if (cur.type === 'number') {
      this.advance();
      const num = parseFloat(cur.value);
      if (!isFinite(num)) {
        throw new Error(`位置 ${cur.pos}: 无效的数字 '${cur.value}'`);
      }
      return { type: 'num', value: num };
    }

    if (cur.type === 'variable') {
      this.advance();
      return { type: 'var' };
    }

    if (cur.type === 'func') {
      const name = cur.value;
      this.advance();
      const lp = this.current();
      if (lp.type !== 'lparen') {
        throw new Error(`位置 ${lp.pos}: 期望 '(' 在函数 '${name}' 之后`);
      }
      this.advance();
      const arg = this.parseExpr();
      const rp = this.current();
      if (rp.type !== 'rparen') {
        throw new Error(`位置 ${rp.pos}: 期望 ')' 闭合函数 '${name}' 的参数`);
      }
      this.advance();
      return { type: 'call', name, arg };
    }

    if (cur.type === 'lparen') {
      this.advance();
      const node = this.parseExpr();
      const rp = this.current();
      if (rp.type !== 'rparen') {
        throw new Error(`位置 ${rp.pos}: 缺少匹配的右括号 ')'`);
      }
      this.advance();
      return node;
    }

    if (cur.type === 'rparen') {
      throw new Error(`位置 ${cur.pos}: 意外的右括号 ')'`);
    }

    if (cur.type === 'eof') {
      throw new Error('表达式意外结束');
    }

    throw new Error(`位置 ${cur.pos}: 意外的 token '${cur.value}'`);
  }

  private current(): Token {
    return this.tokens[this.idx];
  }

  private advance(): void {
    this.idx++;
  }
}

function codegen(node: ASTNode): string {
  switch (node.type) {
    case 'num':
      return formatNum(node.value);
    case 'var':
      return 'x';
    case 'neg':
      return `(-(${codegen(node.arg)}))`;
    case 'bin': {
      const l = codegen(node.left);
      const r = codegen(node.right);
      if (node.op === '^') {
        return `Math.pow(${l},${r})`;
      }
      return `(${l}${node.op}${r})`;
    }
    case 'call': {
      const arg = codegen(node.arg);
      switch (node.name) {
        case 'sin': return `Math.sin(${arg})`;
        case 'cos': return `Math.cos(${arg})`;
        case 'tan': return `Math.tan(${arg})`;
        case 'asin': return `Math.asin(${arg})`;
        case 'acos': return `Math.acos(${arg})`;
        case 'atan': return `Math.atan(${arg})`;
        case 'exp': return `Math.exp(${arg})`;
        case 'log': return `Math.log(${arg})`;
        case 'sqrt': return `Math.sqrt(${arg})`;
        case 'abs': return `Math.abs(${arg})`;
        default:
          throw new Error(`未知函数: ${node.name}`);
      }
    }
  }
}

function formatNum(n: number): string {
  if (Object.is(n, -0)) return '(-0)';
  if (n < 0) return `(${n})`;
  return String(n);
}

export function parseExpression(expr: string): ParseResult {
  try {
    const trimmed = expr.trim();
    if (!trimmed) {
      return { success: false, error: '请输入函数表达式' };
    }

    const tokenizer = new Tokenizer(trimmed);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const body = codegen(ast);

    const fnStr = `
      "use strict";
      return function(x) {
        var _v = (${body});
        if (typeof _v !== "number" || !isFinite(_v)) return NaN;
        return _v;
      };
    `;

    const factory = new Function(fnStr);
    const fn = factory() as (x: number) => number;

    const testVal = fn(1);
    if (typeof testVal !== 'number') {
      return { success: false, error: '函数返回值类型异常' };
    }

    return { success: true, fn };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}
