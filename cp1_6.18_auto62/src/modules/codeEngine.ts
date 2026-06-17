export interface VariableInfo {
  type: string;
  value: string;
}

export interface ConsoleEntry {
  timestamp: string;
  text: string;
}

export interface StepSnapshot {
  lineNumber: number;
  variables: Record<string, VariableInfo>;
  consoleOutput: ConsoleEntry[];
}

const enum TType {
  Num, Str, Bool, Null, Undef, Ident, Kw, Op, Punc, EOF
}

interface Token {
  t: TType;
  v: string;
  ln: number;
}

const KW = new Set([
  'let', 'const', 'var', 'for', 'while', 'if', 'else',
  'function', 'return', 'true', 'false', 'null', 'undefined',
  'typeof', 'break', 'continue', 'new', 'do'
]);

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let ln = 1;
  const len = src.length;

  while (i < len) {
    if (src[i] === '\n') { ln++; i++; continue; }
    if (src[i] === '\r') { i++; continue; }
    if (/\s/.test(src[i])) { i++; continue; }

    if (src[i] === '/' && src[i + 1] === '/') {
      while (i < len && src[i] !== '\n') i++;
      continue;
    }
    if (src[i] === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < len - 1 && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') ln++;
        i++;
      }
      i += 2;
      continue;
    }

    if (/[0-9]/.test(src[i]) || (src[i] === '.' && /[0-9]/.test(src[i + 1]))) {
      let s = '';
      if (src[i] === '0' && (src[i + 1] === 'x' || src[i + 1] === 'X')) {
        s = src[i] + src[i + 1]; i += 2;
        while (i < len && /[0-9a-fA-F]/.test(src[i])) { s += src[i]; i++; }
      } else {
        while (i < len && /[0-9.]/.test(src[i])) { s += src[i]; i++; }
        if (i < len && (src[i] === 'e' || src[i] === 'E')) {
          s += src[i]; i++;
          if (i < len && (src[i] === '+' || src[i] === '-')) { s += src[i]; i++; }
          while (i < len && /[0-9]/.test(src[i])) { s += src[i]; i++; }
        }
      }
      tokens.push({ t: TType.Num, v: s, ln }); continue;
    }

    if (src[i] === '"' || src[i] === "'" || src[i] === '`') {
      const q = src[i]; i++;
      let s = '';
      while (i < len && src[i] !== q) {
        if (src[i] === '\\' && i + 1 < len) { s += src[i] + src[i + 1]; i += 2; }
        else { if (src[i] === '\n') ln++; s += src[i]; i++; }
      }
      i++;
      tokens.push({ t: TType.Str, v: q + s + q, ln }); continue;
    }

    if (/[a-zA-Z_$]/.test(src[i])) {
      let s = '';
      while (i < len && /[a-zA-Z0-9_$]/.test(src[i])) { s += src[i]; i++; }
      if (s === 'true' || s === 'false') tokens.push({ t: TType.Bool, v: s, ln });
      else if (s === 'null') tokens.push({ t: TType.Null, v: s, ln });
      else if (s === 'undefined') tokens.push({ t: TType.Undef, v: s, ln });
      else if (KW.has(s)) tokens.push({ t: TType.Kw, v: s, ln });
      else tokens.push({ t: TType.Ident, v: s, ln });
      continue;
    }

    const ops2 = src.substring(i, i + 3);
    if (['===', '!==', '...', '<<=', '>>='].includes(ops2)) {
      tokens.push({ t: TType.Op, v: ops2, ln }); i += 3; continue;
    }
    const ops = src.substring(i, i + 2);
    if (['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '=>', '**'].includes(ops)) {
      tokens.push({ t: TType.Op, v: ops, ln }); i += 2; continue;
    }
    const c = src[i];
    if ('+-*/%=<>!&|^~?'.includes(c)) {
      tokens.push({ t: TType.Op, v: c, ln }); i++; continue;
    }
    if ('(){}[];,.:'.includes(c)) {
      tokens.push({ t: TType.Punc, v: c, ln }); i++; continue;
    }
    i++;
  }
  tokens.push({ t: TType.EOF, v: '', ln });
  return tokens;
}

type N =
  | { t: 'Prog'; body: N[] }
  | { t: 'VarDecl'; kind: string; decls: { id: string; init: N | null }[]; ln: number }
  | { t: 'ExprStmt'; expr: N; ln: number }
  | { t: 'Assign'; op: string; left: N; right: N }
  | { t: 'Bin'; op: string; left: N; right: N }
  | { t: 'Logic'; op: string; left: N; right: N }
  | { t: 'Unary'; op: string; arg: N; pre: boolean }
  | { t: 'Update'; op: string; arg: N; pre: boolean }
  | { t: 'Cond'; test: N; cons: N; alt: N }
  | { t: 'Ident'; name: string }
  | { t: 'Lit'; value: unknown }
  | { t: 'Arr'; elems: N[] }
  | { t: 'Obj'; props: { key: string; value: N; computed: boolean }[] }
  | { t: 'Member'; obj: N; prop: N; comp: boolean }
  | { t: 'Call'; callee: N; args: N[] }
  | { t: 'For'; init: N | null; test: N; update: N | null; body: N; ln: number }
  | { t: 'While'; test: N; body: N; ln: number }
  | { t: 'If'; test: N; cons: N; alt: N | null; ln: number }
  | { t: 'Block'; body: N[] }
  | { t: 'FnDecl'; id: string; params: string[]; body: N; ln: number }
  | { t: 'Ret'; arg: N | null; ln: number }
  | { t: 'Break'; ln: number }
  | { t: 'Continue'; ln: number }
  ;

class Parser {
  private pos = 0;
  constructor(private tk: Token[]) {}

  private peek(): Token { return this.tk[this.pos]; }
  private at(): Token { return this.tk[this.pos]; }
  private eat(): Token { return this.tk[this.pos++]; }
  private expect(v: string): Token {
    const t = this.eat();
    if (t.v !== v) throw new Error(`Expected '${v}' got '${t.v}' at line ${t.ln}`);
    return t;
  }
  private is(v: string): boolean { return this.at().v === v; }
  private isType(tt: TType): boolean { return this.at().t === tt; }

  parse(): N {
    const body: N[] = [];
    while (this.at().t !== TType.EOF) {
      body.push(this.stmt());
    }
    return { t: 'Prog', body };
  }

  private stmt(): N {
    const a = this.at();
    if (a.t === TType.Kw && (a.v === 'let' || a.v === 'const' || a.v === 'var')) return this.varDecl();
    if (a.t === TType.Kw && a.v === 'for') return this.forStmt();
    if (a.t === TType.Kw && a.v === 'while') return this.whileStmt();
    if (a.t === TType.Kw && a.v === 'if') return this.ifStmt();
    if (a.t === TType.Kw && a.v === 'function') return this.fnDecl();
    if (a.t === TType.Kw && a.v === 'return') return this.retStmt();
    if (a.t === TType.Kw && a.v === 'break') { const ln = this.eat().ln; return { t: 'Break', ln }; }
    if (a.t === TType.Kw && a.v === 'continue') { const ln = this.eat().ln; return { t: 'Continue', ln }; }
    if (a.v === '{') return this.block();
    const ln = a.ln;
    const expr = this.expr();
    if (this.is(';')) this.eat();
    return { t: 'ExprStmt', expr, ln };
  }

  private varDecl(): N {
    const kind = this.eat().v;
    const decls: { id: string; init: N | null }[] = [];
    const ln = this.at().ln;
    do {
      const id = this.expectIdent();
      let init: N | null = null;
      if (this.is('=')) { this.eat(); init = this.assignExpr(); }
      decls.push({ id, init });
    } while (this.is(',') && this.eat());
    if (this.is(';')) this.eat();
    return { t: 'VarDecl', kind, decls, ln };
  }

  private expectIdent(): string {
    const t = this.eat();
    if (t.t !== TType.Ident) throw new Error(`Expected identifier at line ${t.ln}`);
    return t.v;
  }

  private forStmt(): N {
    const ln = this.eat().ln;
    this.expect('(');
    let init: N | null = null;
    if (!this.is(';')) {
      if (this.at().t === TType.Kw && ['let', 'const', 'var'].includes(this.at().v)) {
        init = this.varDecl();
      } else {
        init = this.expr();
        if (this.is(';')) this.eat();
      }
    } else {
      this.eat();
    }
    const test = this.is(';') ? { t: 'Lit', value: true } as N : this.expr();
    this.expect(';');
    const update = this.is(')') ? null : this.expr();
    this.expect(')');
    const body = this.stmt();
    return { t: 'For', init, test, update, body, ln };
  }

  private whileStmt(): N {
    const ln = this.eat().ln;
    this.expect('(');
    const test = this.expr();
    this.expect(')');
    const body = this.stmt();
    return { t: 'While', test, body, ln };
  }

  private ifStmt(): N {
    const ln = this.eat().ln;
    this.expect('(');
    const test = this.expr();
    this.expect(')');
    const cons = this.stmt();
    let alt: N | null = null;
    if (this.at().t === TType.Kw && this.at().v === 'else') { this.eat(); alt = this.stmt(); }
    return { t: 'If', test, cons, alt, ln };
  }

  private fnDecl(): N {
    const ln = this.eat().ln;
    const id = this.expectIdent();
    this.expect('(');
    const params: string[] = [];
    if (!this.is(')')) {
      do { params.push(this.expectIdent()); } while (this.is(',') && this.eat());
    }
    this.expect(')');
    const body = this.stmt();
    return { t: 'FnDecl', id, params, body, ln };
  }

  private retStmt(): N {
    const ln = this.eat().ln;
    let arg: N | null = null;
    if (!this.is(';') && this.at().t !== TType.EOF && this.at().v !== '}') {
      arg = this.expr();
    }
    if (this.is(';')) this.eat();
    return { t: 'Ret', arg, ln };
  }

  private block(): N {
    this.expect('{');
    const body: N[] = [];
    while (!this.is('}') && this.at().t !== TType.EOF) body.push(this.stmt());
    this.expect('}');
    return { t: 'Block', body };
  }

  private expr(): N { return this.assignExpr(); }

  private assignExpr(): N {
    const left = this.condExpr();
    if (['=', '+=', '-=', '*=', '/=', '%='].includes(this.at().v)) {
      const op = this.eat().v;
      const right = this.assignExpr();
      return { t: 'Assign', op, left, right };
    }
    return left;
  }

  private condExpr(): N {
    const test = this.orExpr();
    if (this.is('?')) {
      this.eat();
      const cons = this.assignExpr();
      this.expect(':');
      const alt = this.assignExpr();
      return { t: 'Cond', test, cons, alt };
    }
    return test;
  }

  private orExpr(): N {
    let left = this.andExpr();
    while (this.is('||')) { this.eat(); left = { t: 'Logic', op: '||', left, right: this.andExpr() }; }
    return left;
  }

  private andExpr(): N {
    let left = this.eqExpr();
    while (this.is('&&')) { this.eat(); left = { t: 'Logic', op: '&&', left, right: this.eqExpr() }; }
    return left;
  }

  private eqExpr(): N {
    let left = this.cmpExpr();
    while (['==', '!=', '===', '!=='].includes(this.at().v)) {
      const op = this.eat().v; left = { t: 'Bin', op, left, right: this.cmpExpr() };
    }
    return left;
  }

  private cmpExpr(): N {
    let left = this.addExpr();
    while (['<', '>', '<=', '>='].includes(this.at().v)) {
      const op = this.eat().v; left = { t: 'Bin', op, left, right: this.addExpr() };
    }
    return left;
  }

  private addExpr(): N {
    let left = this.mulExpr();
    while (['+', '-'].includes(this.at().v)) {
      const op = this.eat().v; left = { t: 'Bin', op, left, right: this.mulExpr() };
    }
    return left;
  }

  private mulExpr(): N {
    let left = this.unaryExpr();
    while (['*', '/', '%'].includes(this.at().v)) {
      const op = this.eat().v; left = { t: 'Bin', op, left, right: this.unaryExpr() };
    }
    return left;
  }

  private unaryExpr(): N {
    if (['-', '+', '!', 'typeof'].includes(this.at().v)) {
      const op = this.eat().v; return { t: 'Unary', op, arg: this.unaryExpr(), pre: true };
    }
    if (['++', '--'].includes(this.at().v)) {
      const op = this.eat().v; return { t: 'Update', op, arg: this.postfixExpr(), pre: true };
    }
    return this.postfixExpr();
  }

  private postfixExpr(): N {
    let node = this.primary();
    while (true) {
      if (this.is('++') || this.is('--')) {
        const op = this.eat().v; node = { t: 'Update', op, arg: node, pre: false };
      } else if (this.is('.')) {
        this.eat();
        const prop = this.expectIdent();
        node = { t: 'Member', obj: node, prop: { t: 'Ident', name: prop }, comp: false };
      } else if (this.is('[')) {
        this.eat();
        const prop = this.expr();
        this.expect(']');
        node = { t: 'Member', obj: node, prop, comp: true };
      } else if (this.is('(')) {
        this.eat();
        const args: N[] = [];
        if (!this.is(')')) {
          do { args.push(this.assignExpr()); } while (this.is(',') && this.eat());
        }
        this.expect(')');
        node = { t: 'Call', callee: node, args };
      } else break;
    }
    return node;
  }

  private primary(): N {
    const a = this.at();
    if (a.t === TType.Num) { this.eat(); return { t: 'Lit', value: Number(a.v) }; }
    if (a.t === TType.Str) {
      this.eat();
      const inner = a.v.slice(1, -1).replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      return { t: 'Lit', value: inner };
    }
    if (a.t === TType.Bool) { this.eat(); return { t: 'Lit', value: a.v === 'true' }; }
    if (a.t === TType.Null) { this.eat(); return { t: 'Lit', value: null }; }
    if (a.t === TType.Undef) { this.eat(); return { t: 'Lit', value: undefined }; }
    if (a.t === TType.Ident) { this.eat(); return { t: 'Ident', name: a.v }; }
    if (a.v === '(') {
      this.eat();
      const e = this.expr();
      this.expect(')');
      return e;
    }
    if (a.v === '[') { this.eat(); return this.parseArray(); }
    if (a.v === '{') { this.eat(); return this.parseObj(); }
    if (a.t === TType.Kw && a.v === 'function') {
      this.eat();
      this.expect('(');
      const params: string[] = [];
      if (!this.is(')')) {
        do { params.push(this.expectIdent()); } while (this.is(',') && this.eat());
      }
      this.expect(')');
      const body = this.stmt();
      return { t: 'FnDecl', id: '', params, body, ln: a.ln };
    }
    if (a.t === TType.Kw && a.v === 'new') {
      this.eat();
      const callee = this.primary();
      const args: N[] = [];
      if (this.is('(')) {
        this.eat();
        if (!this.is(')')) {
          do { args.push(this.assignExpr()); } while (this.is(',') && this.eat());
        }
        this.expect(')');
      }
      return { t: 'Call', callee, args };
    }
    throw new Error(`Unexpected token '${a.v}' at line ${a.ln}`);
  }

  private parseArray(): N {
    const elems: N[] = [];
    while (!this.is(']') && this.at().t !== TType.EOF) {
      elems.push(this.assignExpr());
      if (this.is(',')) this.eat();
    }
    this.expect(']');
    return { t: 'Arr', elems };
  }

  private parseObj(): N {
    const props: { key: string; value: N; computed: boolean }[] = [];
    while (!this.is('}') && this.at().t !== TType.EOF) {
      let key: string;
      let computed = false;
      if (this.at().t === TType.Str) {
        key = this.eat().v.slice(1, -1);
      } else if (this.at().t === TType.Num) {
        key = this.eat().v;
      } else {
        key = this.expectIdent();
      }
      if (this.is(':')) { this.eat(); props.push({ key, value: this.assignExpr(), computed }); }
      else { props.push({ key, value: { t: 'Ident', name: key }, computed }); }
      if (this.is(',')) this.eat();
    }
    this.expect('}');
    return { t: 'Obj', props };
  }
}

class BreakSignal { constructor(public ln: number) {} }
class ContinueSignal { constructor(public ln: number) {} }
class ReturnSignal { constructor(public value: unknown) {} }

type Env = Map<string, unknown>;

class Interpreter {
  private envStack: Env[] = [];
  private steps: StepSnapshot[] = [];
  private consoleEntries: ConsoleEntry[] = [];
  private startTime: number;
  private maxSteps = 5000;
  private stepCount = 0;

  constructor() {
    this.startTime = Date.now();
    this.envStack.push(new Map());
  }

  private env(): Env { return this.envStack[this.envStack.length - 1]; }

  private pushEnv() { this.envStack.push(new Map(this.env())); }
  private popEnv() { this.envStack.pop(); }

  private lookup(name: string): unknown {
    for (let i = this.envStack.length - 1; i >= 0; i--) {
      if (this.envStack[i].has(name)) return this.envStack[i].get(name);
    }
    return undefined;
  }

  private assign(name: string, val: unknown) {
    for (let i = this.envStack.length - 1; i >= 0; i--) {
      if (this.envStack[i].has(name)) { this.envStack[i].set(name, val); return; }
    }
    this.env().set(name, val);
  }

  private declare(name: string, val: unknown) {
    this.env().set(name, val);
  }

  private snapshot(ln: number) {
    if (this.stepCount++ > this.maxSteps) throw new Error('Execution exceeded maximum steps');
    const vars: Record<string, VariableInfo> = {};
    const seen = new Set<string>();
    for (let i = this.envStack.length - 1; i >= 0; i--) {
      for (const [k, v] of this.envStack[i]) {
        if (!seen.has(k)) {
          seen.add(k);
          vars[k] = { type: typeof v === 'object' && v !== null ? 'object' : v === null ? 'object' : String(typeof v), value: v === undefined ? 'undefined' : v === null ? 'null' : typeof v === 'object' ? JSON.stringify(v) : String(v) };
        }
      }
    }
    this.steps.push({ lineNumber: ln, variables: vars, consoleOutput: [...this.consoleEntries] });
  }

  private timestamp(): string {
    const e = Date.now() - this.startTime;
    const m = Math.floor(e / 60000);
    const s = Math.floor((e % 60000) / 1000);
    const ms = e % 1000;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }

  run(ast: N): StepSnapshot[] {
    this.execNode(ast);
    return this.steps;
  }

  private execNode(node: N): unknown {
    switch (node.t) {
      case 'Prog':
        for (const s of node.body) this.execNode(s);
        return undefined;

      case 'VarDecl':
        for (const d of node.decls) {
          const val = d.init ? this.evalNode(d.init) : undefined;
          this.declare(d.id, val);
        }
        this.snapshot(node.ln);
        return undefined;

      case 'ExprStmt': {
        this.evalNode(node.expr);
        this.snapshot(node.ln);
        return undefined;
      }

      case 'If': {
        const cond = this.evalNode(node.test);
        this.snapshot(node.ln);
        if (cond) {
          this.pushEnv();
          this.execNode(node.cons);
          this.popEnv();
        } else if (node.alt) {
          this.pushEnv();
          this.execNode(node.alt);
          this.popEnv();
        }
        return undefined;
      }

      case 'For': {
        this.pushEnv();
        if (node.init) this.execNode(node.init);
        while (this.evalNode(node.test)) {
          this.snapshot(node.ln);
          try {
            this.pushEnv();
            this.execNode(node.body);
            this.popEnv();
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) { /* fall through to update */ }
            else throw e;
          }
          if (node.update) this.evalNode(node.update);
        }
        this.snapshot(node.ln);
        this.popEnv();
        return undefined;
      }

      case 'While': {
        while (this.evalNode(node.test)) {
          this.snapshot(node.ln);
          try {
            this.pushEnv();
            this.execNode(node.body);
            this.popEnv();
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) { /* continue */ }
            else throw e;
          }
        }
        this.snapshot(node.ln);
        return undefined;
      }

      case 'Block':
        for (const s of node.body) this.execNode(s);
        return undefined;

      case 'FnDecl': {
        const fn = this.createFn(node.id, node.params, node.body);
        if (node.id) this.declare(node.id, fn);
        this.snapshot(node.ln);
        return undefined;
      }

      case 'Ret': {
        const val = node.arg ? this.evalNode(node.arg) : undefined;
        throw new ReturnSignal(val);
      }

      case 'Break': throw new BreakSignal(node.ln);
      case 'Continue': throw new ContinueSignal(node.ln);

      default: return undefined;
    }
  }

  private evalNode(node: N): unknown {
    switch (node.t) {
      case 'Lit': return node.value;
      case 'Ident': return this.lookup(node.name);
      case 'Bin': return this.evalBin(node.op, this.evalNode(node.left), this.evalNode(node.right));
      case 'Logic': return node.op === '&&' ? this.evalNode(node.left) && this.evalNode(node.right) : this.evalNode(node.left) || this.evalNode(node.right);
      case 'Unary': {
        const v = this.evalNode(node.arg);
        if (node.op === '-') return -Number(v);
        if (node.op === '+') return +Number(v);
        if (node.op === '!') return !v;
        if (node.op === 'typeof') return v === undefined ? 'undefined' : typeof v;
        return v;
      }
      case 'Update': {
        const name = (node.arg as { t: string; name: string }).name;
        const cur = Number(this.lookup(name));
        const nv = node.op === '++' ? cur + 1 : cur - 1;
        this.assign(name, nv);
        return node.pre ? nv : cur;
      }
      case 'Assign': {
        const rv = this.evalNode(node.right);
        if (node.left.t === 'Ident') {
          let fv: unknown;
          if (node.op === '=') fv = rv;
          else {
            const cur = this.lookup(node.left.name);
            fv = this.evalBin(node.op[0], cur, rv);
          }
          this.assign(node.left.name, fv);
          return fv;
        }
        if (node.left.t === 'Member') {
          const obj = this.evalNode(node.left.obj);
          const key = node.left.comp ? this.evalNode(node.left.prop) : (node.left.prop as { name: string }).name;
          let fv: unknown;
          if (node.op === '=') fv = rv;
          else {
            const cur = (obj as Record<string, unknown>)[key as string];
            fv = this.evalBin(node.op[0], cur, rv);
          }
          if (typeof obj === 'object' && obj !== null) (obj as Record<string, unknown>)[key as string] = fv;
          return fv;
        }
        return rv;
      }
      case 'Cond': return this.evalNode(node.test) ? this.evalNode(node.cons) : this.evalNode(node.alt);
      case 'Call': return this.evalCall(node);
      case 'Member': {
        const obj = this.evalNode(node.obj);
        const key = node.comp ? this.evalNode(node.prop) : (node.prop as { name: string }).name;
        if (obj === null || obj === undefined) return undefined;
        return (obj as Record<string, unknown>)[key as string];
      }
      case 'Arr': return node.elems.map(e => this.evalNode(e));
      case 'Obj': {
        const o: Record<string, unknown> = {};
        for (const p of node.props) o[p.key] = this.evalNode(p.value);
        return o;
      }
      case 'VarDecl':
      case 'ExprStmt':
      case 'If':
      case 'For':
      case 'While':
      case 'Block':
      case 'FnDecl':
      case 'Ret':
      case 'Break':
      case 'Continue':
      case 'Prog':
        return this.execNode(node);
      default: return undefined;
    }
  }

  private evalBin(op: string, l: unknown, r: unknown): unknown {
    switch (op) {
      case '+': return typeof l === 'string' || typeof r === 'string' ? String(l) + String(r) : Number(l) + Number(r);
      case '-': return Number(l) - Number(r);
      case '*': return Number(l) * Number(r);
      case '/': return Number(l) / Number(r);
      case '%': return Number(l) % Number(r);
      case '==': return l == r;
      case '!=': return l != r;
      case '===': return l === r;
      case '!==': return l !== r;
      case '<': return Number(l) < Number(r);
      case '>': return Number(l) > Number(r);
      case '<=': return Number(l) <= Number(r);
      case '>=': return Number(l) >= Number(r);
      default: return undefined;
    }
  }

  private createFn(id: string, params: string[], body: N): (...args: unknown[]) => unknown {
    const self = this;
    return function (...args: unknown[]) {
      const savedEnv = self.envStack;
      self.envStack = [new Map()];
      for (let i = 0; i < params.length; i++) {
        self.declare(params[i], args[i]);
      }
      try {
        self.execNode(body);
      } catch (e) {
        if (e instanceof ReturnSignal) {
          self.envStack = savedEnv;
          return e.value;
        }
        self.envStack = savedEnv;
        throw e;
      }
      self.envStack = savedEnv;
      return undefined;
    };
  }

  private evalCall(node: N & { t: 'Call' }): unknown {
    const callee = node.callee;
    if (callee.t === 'Member' && callee.obj.t === 'Ident' && (callee.obj as { name: string }).name === 'console') {
      const method = (callee.prop as { name: string }).name;
      if (method === 'log') {
        const args = node.args.map(a => this.evalNode(a));
        const text = args.map(a => a === undefined ? 'undefined' : a === null ? 'null' : typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        this.consoleEntries.push({ timestamp: this.timestamp(), text });
        return undefined;
      }
    }
    if (callee.t === 'Ident') {
      const fn = this.lookup(callee.name);
      if (typeof fn === 'function') {
        const args = node.args.map(a => this.evalNode(a));
        return fn(...args);
      }
    }
    if (callee.t === 'Member') {
      const obj = this.evalNode(callee.obj);
      const key = callee.comp ? this.evalNode(callee.prop) : (callee.prop as { name: string }).name;
      const fn = (obj as Record<string, unknown>)?.[key as string];
      if (typeof fn === 'function') {
        const args = node.args.map(a => this.evalNode(a));
        return fn.apply(obj, args);
      }
    }
    const fn = this.evalNode(callee);
    if (typeof fn === 'function') {
      const args = node.args.map(a => this.evalNode(a));
      return fn(...args);
    }
    return undefined;
  }
}

export function executeCode(code: string): StepSnapshot[] {
  try {
    const tokens = tokenize(code);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const interpreter = new Interpreter();
    return interpreter.run(ast);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    return [{
      lineNumber: 1,
      variables: {},
      consoleOutput: [{ timestamp: '00:00.000', text: `Error: ${errorMsg}` }]
    }];
  }
}
