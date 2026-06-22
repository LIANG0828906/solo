import { useReducer, useEffect, useRef, useCallback } from 'react'

export type VarValue = string | number | boolean | null | undefined | object | VarValue[]

export interface VariableEntry {
  name: string
  type: string
  value: VarValue
  isNewlyChanged: boolean
  changeTimestamp: number
  children?: VariableEntry[]
}

export interface StackFrame {
  id: string
  functionName: string
  argsSummary: string
  lineNumber: number
  isCurrent: boolean
  timestamp: number
}

export interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
}

export type StepType =
  | 'declaration'
  | 'assignment'
  | 'condition'
  | 'condition-enter'
  | 'condition-skip'
  | 'loop'
  | 'loop-condition'
  | 'loop-enter'
  | 'loop-exit'
  | 'function-call'
  | 'function-declare'
  | 'return'
  | 'block-enter'
  | 'block-exit'
  | 'expr'
  | 'other'

export interface ExecStep {
  id: string
  lineNumber: number
  lineContent: string
  type: StepType
  rawCode: string
  sourceText: string
  meta?: {
    condition?: string
    loopVar?: string
    branchId?: string
    frameId?: string
    funcName?: string
    funcArgs?: string
  }
}

export interface RunnerState {
  code: string
  steps: ExecStep[]
  currentStepIndex: number
  globalScope: Map<string, VarValue>
  callStack: StackFrame[]
  logs: LogEntry[]
  prevVariables: Map<string, string>
  isAutoRunning: boolean
  isFinished: boolean
  isParsed: boolean
  error: string | null
  currentLineHighlight: number | null
}

type Action =
  | { type: 'SET_CODE'; code: string }
  | { type: 'PARSE' }
  | { type: 'STEP' }
  | { type: 'AUTO_TOGGLE' }
  | { type: 'AUTO_STOP' }
  | { type: 'RESET' }

const MAX_LOGS = 100
const AUTO_INTERVAL = 500

function formatTimestamp(date: Date = new Date()): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  const ss = pad(date.getSeconds())
  const ms = pad(date.getMilliseconds(), 3)
  return `${hh}:${mm}:${ss}.${ms}`
}

function makeLog(level: LogEntry['level'], message: string): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: formatTimestamp(),
    level,
    message,
  }
}

function appendLog(logs: LogEntry[], entry: LogEntry): LogEntry[] {
  const next = [...logs, entry]
  if (next.length > MAX_LOGS) next.splice(0, next.length - MAX_LOGS)
  return next
}

const JS_KEYWORDS = /\b(function|let|const|var|if|else|for|while|do|return|new|typeof|instanceof|in|of|break|continue|switch|case|default|throw|try|catch|finally|async|await|class|extends|super|import|export|from|void|null|undefined|true|false|this)\b/g

export function highlightKeywords(code: string): string {
  let result = code
  result = result.replace(JS_KEYWORDS, '<span class="ced-keyword">$1</span>')
  result = result.replace(/(\/\/[^\n]*)/g, '<span class="ced-comment">$1</span>')
  result = result.replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, '<span class="ced-string">$1</span>')
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="ced-number">$1</span>')
  return result
}

function deepValueToString(v: VarValue): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'string') {
    try { return JSON.stringify(v) } catch { return `"${v}"` }
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (typeof v === 'function') return '[Function]'
  if (Array.isArray(v)) {
    try { return JSON.stringify(v) } catch { return '[Array]' }
  }
  if (typeof v === 'object') {
    try { return JSON.stringify(v) } catch { return '[Object]' }
  }
  return String(v)
}

function collectVariables(scope: Map<string, VarValue>, prev: Map<string, string>): VariableEntry[] {
  const entries: VariableEntry[] = []
  const now = Date.now()
  scope.forEach((value, name) => {
    if (name.startsWith('__')) return
    const strValue = deepValueToString(value)
    const prevStr = prev.get(name)
    const isChanged = prevStr === undefined || prevStr !== strValue
    const type = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value
    let children: VariableEntry[] | undefined
    if (type === 'object' || type === 'array') {
      try {
        const obj = value as Record<string, VarValue> | VarValue[]
        const inner: VariableEntry[] = []
        if (Array.isArray(obj)) {
          obj.forEach((item, idx) => {
            inner.push({
              name: String(idx),
              type: Array.isArray(item) ? 'array' : item === null ? 'null' : typeof item,
              value: item,
              isNewlyChanged: false,
              changeTimestamp: now,
            })
          })
        } else if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(k => {
            const item = (obj as Record<string, VarValue>)[k]
            inner.push({
              name: k,
              type: Array.isArray(item) ? 'array' : item === null ? 'null' : typeof item,
              value: item,
              isNewlyChanged: false,
              changeTimestamp: now,
            })
          })
        }
        if (inner.length > 0) children = inner
      } catch { /* noop */ }
    }
    entries.push({
      name,
      type,
      value,
      isNewlyChanged: isChanged,
      changeTimestamp: isChanged ? now : 0,
      children,
    })
  })
  return entries.sort((a, b) => a.name.localeCompare(b.name))
}

// ================= 真正的语句级解析器 =================

export interface Token {
  type: 'keyword' | 'identifier' | 'punct' | 'string' | 'number' | 'op' | 'eof'
  value: string
  line: number
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  const lines = source.split('\n')
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]
    let i = 0
    while (i < line.length) {
      const c = line[i]
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue }
      if (c === '/' && line[i + 1] === '/') break
      if (c === '"' || c === "'" || c === '`') {
        const quote = c
        let j = i + 1
        let val = quote
        while (j < line.length && line[j] !== quote) {
          if (line[j] === '\\') { val += line[j]; j++ }
          if (j < line.length) { val += line[j]; j++ }
        }
        if (j < line.length) val += line[j]
        tokens.push({ type: 'string', value: val, line: lineIdx + 1 })
        i = j + 1
        continue
      }
      if (/[0-9]/.test(c)) {
        let j = i
        while (j < line.length && /[0-9.]/.test(line[j])) j++
        tokens.push({ type: 'number', value: line.slice(i, j), line: lineIdx + 1 })
        i = j
        continue
      }
      if (/[a-zA-Z_$]/.test(c)) {
        let j = i
        while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++
        const word = line.slice(i, j)
        const keywords = ['function','let','const','var','if','else','for','while','do','return','break','continue','switch','case','default','throw','try','catch','finally','new','typeof','instanceof','in','of','true','false','null','undefined','this','void','async','await','class','extends','super']
        tokens.push({ type: keywords.includes(word) ? 'keyword' : 'identifier', value: word, line: lineIdx + 1 })
        i = j
        continue
      }
      if ('{}()[];,.:'.includes(c)) {
        tokens.push({ type: 'punct', value: c, line: lineIdx + 1 })
        i++
        continue
      }
      if ('+-*/%=<>!&|^~?'.includes(c)) {
        let j = i
        while (j < line.length && '+-*/%=<>!&|^~?'.includes(line[j])) j++
        tokens.push({ type: 'op', value: line.slice(i, j), line: lineIdx + 1 })
        i = j
        continue
      }
      i++
    }
  }
  tokens.push({ type: 'eof', value: '', line: lines.length })
  return tokens
}

class Parser {
  tokens: Token[]
  pos = 0
  stepCounter = 0
  steps: ExecStep[] = []

  constructor(tokens: Token[]) { this.tokens = tokens }

  peek(offset = 0): Token { return this.tokens[this.pos + offset] || { type: 'eof', value: '', line: 0 } }
  consume(): Token { return this.tokens[this.pos++] }
  expect(value: string): Token {
    const t = this.consume()
    if (t.value !== value) throw new Error(`期望 ${value}，实际 ${t.value} 在第 ${t.line} 行`)
    return t
  }
  check(value: string, offset = 0): boolean { return this.peek(offset).value === value }
  checkType(type: Token['type'], offset = 0): boolean { return this.peek(offset).type === type }

  addStep(partial: Omit<ExecStep, 'id' | 'lineNumber' | 'lineContent' | 'rawCode' | 'sourceText' | 'type'> & { type: StepType; lineNumber: number; rawCode?: string; sourceText: string }): ExecStep {
    this.stepCounter++
    const step: ExecStep = {
      id: `s-${this.stepCounter}-${Math.random().toString(36).slice(2, 6)}`,
      lineNumber: partial.lineNumber,
      lineContent: partial.sourceText.trim().slice(0, 100),
      type: partial.type,
      rawCode: partial.rawCode ?? partial.sourceText,
      sourceText: partial.sourceText,
      meta: partial.meta,
    }
    this.steps.push(step)
    return step
  }

  parseProgram(): ExecStep[] {
    while (!this.checkType('eof')) {
      this.parseStatement()
    }
    return this.steps
  }

  parseStatement() {
    const t = this.peek()
    if (t.type === 'eof') return

    if (t.value === 'function') { this.parseFunctionDeclaration(); return }
    if (t.value === 'if') { this.parseIfStatement(); return }
    if (t.value === 'while') { this.parseWhileStatement(); return }
    if (t.value === 'do') { this.parseDoWhileStatement(); return }
    if (t.value === 'for') { this.parseForStatement(); return }
    if (t.value === 'return') { this.parseReturnStatement(); return }
    if (t.value === 'break' || t.value === 'continue') { this.consume(); this.skipSemicolon(); return }
    if (t.value === '{') { this.parseBlock(); return }
    if (t.value === 'let' || t.value === 'const' || t.value === 'var') { this.parseDeclaration(); return }
    this.parseExpressionStatement()
  }

  skipSemicolon() {
    if (this.check(';')) this.consume()
  }

  collectUntilSemicolonOrBlock(): { tokens: Token[]; raw: string } {
    const start = this.pos
    const collected: Token[] = []
    let braceDepth = 0
    let parenDepth = 0
    while (this.pos < this.tokens.length) {
      const cur = this.peek()
      if (cur.type === 'eof') break
      if (cur.value === '(') parenDepth++
      if (cur.value === ')') parenDepth--
      if (cur.value === '{') braceDepth++
      if (cur.value === '}') braceDepth--
      if (cur.value === ';' && braceDepth === 0 && parenDepth === 0) break
      if ((cur.value === '{' || cur.value === '}') && braceDepth < 0) break
      collected.push(this.consume())
    }
    const raw = collected.map(x => x.value).join(' ')
    this.pos = start
    return { tokens: collected, raw }
  }

  readText(line: number, endLine?: number): string {
    // fallback: not strictly line-accurate, use token values
    return ''
  }

  parseDeclaration() {
    const startToken = this.consume() // let/const/var
    const startLine = startToken.line
    const nameToken = this.consume()
    let name = nameToken.value
    let initRaw = ''
    if (this.check('=')) {
      this.consume()
      const { raw } = this.collectUntilSemicolonOrBlock()
      initRaw = raw
    }
    this.skipSemicolon()
    const kw = startToken.value
    const source = `${kw} ${name}${initRaw ? ` = ${initRaw}` : ''};`
    this.addStep({
      type: 'declaration',
      lineNumber: startLine,
      sourceText: source,
      rawCode: source,
    })
  }

  parseExpressionStatement() {
    const startPos = this.pos
    const startLine = this.peek().line
    const { tokens: collected, raw } = this.collectUntilSemicolonOrBlock()
    this.skipSemicolon()
    if (collected.length === 0) return

    // function call?
    let isCall = false
    let callName = ''
    let callArgs = ''
    for (let i = 0; i < collected.length; i++) {
      const ct = collected[i]
      if (ct.type === 'identifier' && collected[i + 1]?.value === '(') {
        isCall = true
        callName = ct.value
        let depth = 0
        let argStr = ''
        for (let j = i + 2; j < collected.length; j++) {
          if (collected[j].value === '(') depth++
          if (collected[j].value === ')') { if (depth === 0) break; depth-- }
          argStr += (argStr ? ' ' : '') + collected[j].value
        }
        callArgs = argStr.length > 24 ? argStr.slice(0, 21) + '...' : argStr
        break
      }
    }

    // assignment?
    let isAssignment = false
    for (const ct of collected) {
      if (ct.type === 'op' && /=$/.test(ct.value) && ct.value !== '===') { isAssignment = true; break }
    }

    if (isCall) {
      this.addStep({
        type: 'function-call',
        lineNumber: startLine,
        sourceText: raw,
        rawCode: raw + ';',
        meta: { funcName: callName, funcArgs: callArgs },
      })
    } else if (isAssignment) {
      this.addStep({
        type: 'assignment',
        lineNumber: startLine,
        sourceText: raw,
        rawCode: raw + ';',
      })
    } else {
      this.addStep({
        type: 'expr',
        lineNumber: startLine,
        sourceText: raw,
        rawCode: raw + ';',
      })
    }
    this.pos = startPos + collected.length
    if (this.check(';')) this.consume()
  }

  parseFunctionDeclaration() {
    const kwToken = this.consume() // function
    const nameToken = this.checkType('identifier') ? this.consume() : { value: 'anonymous', line: kwToken.line }
    const startLine = kwToken.line
    const funcName = nameToken.value
    this.expect('(')
    const args: string[] = []
    while (!this.check(')') && !this.checkType('eof')) {
      if (this.checkType('identifier')) args.push(this.consume().value)
      if (this.check(',')) this.consume()
    }
    this.expect(')')
    // record function declare step
    this.addStep({
      type: 'function-declare',
      lineNumber: startLine,
      sourceText: `function ${funcName}(${args.join(', ')}) {...}`,
      rawCode: `function ${funcName}(${args.join(', ')}) {}`,
      meta: { funcName, funcArgs: args.join(', ') },
    })
    // skip body
    this.parseBlock(true)
  }

  parseBlock(silent = false): number {
    if (!this.check('{')) return 0
    const openToken = this.consume()
    const startLine = openToken.line
    const branchId = `b-${Math.random().toString(36).slice(2, 8)}`
    if (!silent) {
      this.addStep({
        type: 'block-enter',
        lineNumber: startLine,
        sourceText: '{',
        rawCode: '{',
        meta: { branchId },
      })
    }
    let count = 0
    while (!this.check('}') && !this.checkType('eof')) {
      this.parseStatement()
      count++
    }
    if (this.check('}')) {
      const closeToken = this.consume()
      if (!silent) {
        this.addStep({
          type: 'block-exit',
          lineNumber: closeToken.line,
          sourceText: '}',
          rawCode: '}',
          meta: { branchId },
        })
      }
    }
    return count
  }

  parseIfStatement() {
    const kwToken = this.consume() // if
    const startLine = kwToken.line
    this.expect('(')
    const condTokens: Token[] = []
    while (!this.check(')') && !this.checkType('eof')) condTokens.push(this.consume())
    this.expect(')')
    const condRaw = condTokens.map(t => t.value).join(' ')

    // Add condition evaluation step
    this.addStep({
      type: 'condition',
      lineNumber: startLine,
      sourceText: `if (${condRaw})`,
      rawCode: `if (${condRaw}) {}`,
      meta: { condition: condRaw },
    })

    // Parse then branch (keep its steps)
    const beforeThen = this.steps.length
    if (this.check('{')) this.parseBlock()
    else this.parseStatement()
    const thenSteps = this.steps.slice(beforeThen)

    // Optional else branch
    let elseSteps: ExecStep[] = []
    if (this.check('else')) {
      this.consume()
      const beforeElse = this.steps.length
      if (this.check('{')) this.parseBlock()
      else this.parseStatement()
      elseSteps = this.steps.slice(beforeElse)
    }

    // Mark then branch with branchId for runtime skippability
    const thenBranchId = `if-then-${thenSteps[0]?.id || 'x'}`
    thenSteps.forEach(s => { s.meta = { ...(s.meta || {}), branchId: thenBranchId, condition: condRaw } })
    if (elseSteps.length) {
      const elseBranchId = `if-else-${elseSteps[0]?.id || 'x'}`
      elseSteps.forEach(s => { s.meta = { ...(s.meta || {}), branchId: elseBranchId, condition: `!(${condRaw})` } })
    }
  }

  parseWhileStatement() {
    const kwToken = this.consume() // while
    const startLine = kwToken.line
    this.expect('(')
    const condTokens: Token[] = []
    while (!this.check(')') && !this.checkType('eof')) condTokens.push(this.consume())
    this.expect(')')
    const condRaw = condTokens.map(t => t.value).join(' ')

    const loopId = `loop-${Math.random().toString(36).slice(2, 8)}`

    // condition step
    this.addStep({
      type: 'loop-condition',
      lineNumber: startLine,
      sourceText: `while (${condRaw})`,
      rawCode: `while (${condRaw}) {}`,
      meta: { condition: condRaw, branchId: loopId },
    })

    // body
    const beforeBody = this.steps.length
    if (this.check('{')) this.parseBlock()
    else this.parseStatement()
    const bodySteps = this.steps.slice(beforeBody)
    bodySteps.forEach(s => { s.meta = { ...(s.meta || {}), branchId: loopId, condition: condRaw } })
  }

  parseDoWhileStatement() {
    const kwToken = this.consume() // do
    const startLine = kwToken.line
    const loopId = `loop-${Math.random().toString(36).slice(2, 8)}`

    // enter loop body marker (just parse block)
    const beforeBody = this.steps.length
    if (this.check('{')) this.parseBlock()
    else this.parseStatement()
    const bodySteps = this.steps.slice(beforeBody)

    if (this.check('while')) {
      const wTok = this.consume()
      this.expect('(')
      const condTokens: Token[] = []
      while (!this.check(')') && !this.checkType('eof')) condTokens.push(this.consume())
      this.expect(')')
      this.skipSemicolon()
      const condRaw = condTokens.map(t => t.value).join(' ')
      this.addStep({
        type: 'loop-condition',
        lineNumber: wTok.line,
        sourceText: `while (${condRaw})`,
        rawCode: `while (${condRaw}) {}`,
        meta: { condition: condRaw, branchId: loopId },
      })
      bodySteps.forEach(s => { s.meta = { ...(s.meta || {}), branchId: loopId } })
    } else {
      void startLine
    }
  }

  parseForStatement() {
    const kwToken = this.consume() // for
    const startLine = kwToken.line
    this.expect('(')
    // init
    const initTokens: Token[] = []
    while (!this.check(';') && !this.checkType('eof')) initTokens.push(this.consume())
    if (this.check(';')) this.consume()
    const initRaw = initTokens.map(t => t.value).join(' ')

    // condition
    const condTokens: Token[] = []
    while (!this.check(';') && !this.checkType('eof')) condTokens.push(this.consume())
    if (this.check(';')) this.consume()
    const condRaw = condTokens.map(t => t.value).join(' ')

    // update
    const updateTokens: Token[] = []
    while (!this.check(')') && !this.checkType('eof')) updateTokens.push(this.consume())
    this.expect(')')
    const updateRaw = updateTokens.map(t => t.value).join(' ')

    const loopId = `for-${Math.random().toString(36).slice(2, 8)}`

    // init step
    if (initRaw) {
      this.addStep({
        type: initTokens[0]?.value === 'let' || initTokens[0]?.value === 'var' || initTokens[0]?.value === 'const' ? 'declaration' : 'assignment',
        lineNumber: startLine,
        sourceText: initRaw,
        rawCode: initRaw + ';',
        meta: { branchId: loopId },
      })
    }

    // condition step
    this.addStep({
      type: 'loop-condition',
      lineNumber: startLine,
      sourceText: condRaw || 'true',
      rawCode: `for(;;) {}`,
      meta: { condition: condRaw || 'true', branchId: loopId, loopVar: initRaw },
    })

    // body
    const beforeBody = this.steps.length
    if (this.check('{')) this.parseBlock()
    else this.parseStatement()
    const bodySteps = this.steps.slice(beforeBody)
    bodySteps.forEach(s => { s.meta = { ...(s.meta || {}), branchId: loopId } })

    // update step (implicitly marked as loop part)
    if (updateRaw) {
      this.addStep({
        type: 'assignment',
        lineNumber: startLine,
        sourceText: updateRaw,
        rawCode: updateRaw + ';',
        meta: { branchId: loopId },
      })
    }
  }

  parseReturnStatement() {
    const kwToken = this.consume() // return
    const startLine = kwToken.line
    const exprTokens: Token[] = []
    while (!this.check(';') && !this.checkType('eof') && !this.check('}')) exprTokens.push(this.consume())
    this.skipSemicolon()
    const raw = exprTokens.map(t => t.value).join(' ')
    this.addStep({
      type: 'return',
      lineNumber: startLine,
      sourceText: `return ${raw}`.trim(),
      rawCode: `return ${raw};`,
    })
  }
}

function parseCodeToSteps(code: string): ExecStep[] {
  try {
    const tokens = tokenize(code)
    const parser = new Parser(tokens)
    return parser.parseProgram()
  } catch (e) {
    console.error('Parse error:', e)
    return []
  }
}

// ================= 执行引擎核心 =================

interface RuntimeState {
  scope: Map<string, VarValue>
  logs: LogEntry[]
  callStack: StackFrame[]
  callStackJumpTo: number | null // when looping, jump back to loop-condition step
}

const FORBIDDEN = ['window', 'document', 'eval', 'globalThis', 'fetch', 'XMLHttpRequest', 'process', 'require', 'module', 'exports']

function sandboxedEval(
  code: string,
  scope: Map<string, VarValue>,
): { scope: Map<string, VarValue>; result: VarValue; error: string | null } {
  const newScope = new Map(scope)
  try {
    const paramNames = Array.from(newScope.keys()).filter(k => /^[a-zA-Z_$][\w$]*$/.test(k))
    const paramValues = paramNames.map(k => newScope.get(k))
    const forbiddenBlock = FORBIDDEN.map(k => `const ${k} = undefined;`).join('\n')
    const captureAll = `
      const __captured = {};
      ${paramNames.map(k => `try { if (typeof ${k} !== 'undefined') __captured["${k}"] = ${k}; } catch(e) { __captured["${k}"] = undefined; }`).join('\n')}
      // also try to detect new vars declared with var (hoisted) in sloppy mode, but we are strict so no.
      return __captured;
    `
    const body = `"use strict";\n${forbiddenBlock}\n${code}\n${captureAll}`
    const fn = new Function(...paramNames, body)
    const captured = fn(...paramValues) as Record<string, VarValue>
    for (const k of paramNames) {
      if (k in captured) newScope.set(k, captured[k])
    }
    return { scope: newScope, result: undefined, error: null }
  } catch (e) {
    return { scope: newScope, result: undefined, error: e instanceof Error ? e.message : String(e) }
  }
}

function evalCondition(expr: string, scope: Map<string, VarValue>): { value: boolean; error: string | null; scope: Map<string, VarValue> } {
  if (!expr.trim()) return { value: true, error: null, scope }
  const newScope = new Map(scope)
  try {
    const paramNames = Array.from(newScope.keys()).filter(k => /^[a-zA-Z_$][\w$]*$/.test(k))
    const paramValues = paramNames.map(k => newScope.get(k))
    const forbiddenBlock = FORBIDDEN.map(k => `const ${k} = undefined;`).join('\n')
    const body = `"use strict";\n${forbiddenBlock}\nreturn Boolean(${expr});`
    const fn = new Function(...paramNames, body)
    const v = Boolean(fn(...paramValues))
    return { value: v, error: null, scope: newScope }
  } catch (e) {
    return { value: false, error: e instanceof Error ? e.message : String(e), scope: newScope }
  }
}

function extractAssignmentVarName(raw: string): string | null {
  const m1 = raw.match(/^(?:let|const|var)\s+([a-zA-Z_$][\w$]*)/)
  if (m1) return m1[1]
  const m2 = raw.match(/^([a-zA-Z_$][\w$]*)\s*[+\-*/%&|^]?=/)
  if (m2) return m2[1]
  return null
}

function createInitialState(): RunnerState {
  return {
    code: '',
    steps: [],
    currentStepIndex: 0,
    globalScope: new Map(),
    callStack: [],
    logs: [],
    prevVariables: new Map(),
    isAutoRunning: false,
    isFinished: false,
    isParsed: false,
    error: null,
    currentLineHighlight: null,
  }
}

function findNextStepOutsideBranch(steps: ExecStep[], fromIdx: number, branchId: string): number {
  for (let i = fromIdx; i < steps.length; i++) {
    if (steps[i].meta?.branchId !== branchId) return i
  }
  return steps.length
}

function findLoopConditionStep(steps: ExecStep[], branchId: string, beforeIdx: number): number {
  for (let i = beforeIdx - 1; i >= 0; i--) {
    if (steps[i].type === 'loop-condition' && steps[i].meta?.branchId === branchId) return i
  }
  return -1
}

function reducer(state: RunnerState, action: Action): RunnerState {
  switch (action.type) {
    case 'SET_CODE': {
      if (state.code === action.code) return state
      return {
        ...createInitialState(),
        code: action.code,
      }
    }
    case 'PARSE': {
      if (state.isParsed) return state
      const steps = parseCodeToSteps(state.code)
      let logs = state.logs
      if (steps.length === 0) {
        logs = appendLog(logs, makeLog('warn', '无可执行的代码语句'))
      } else {
        logs = appendLog(logs, makeLog('info', `解析完成，共 ${steps.length} 个可执行步骤`))
      }
      return { ...state, steps, isParsed: true, logs }
    }
    case 'STEP': {
      let s: RunnerState = { ...state }
      if (!s.isParsed) {
        const steps = parseCodeToSteps(s.code)
        s = { ...s, steps, isParsed: true }
        s.logs = appendLog(s.logs, makeLog('info', `解析完成，共 ${steps.length} 个可执行步骤`))
      }

      while (s.currentStepIndex < s.steps.length) {
        const step = s.steps[s.currentStepIndex]
        // Skip block enter/exit silently as individual execution steps - they only delimit scope
        if (step.type === 'block-enter' || step.type === 'block-exit') {
          s.currentStepIndex++
          continue
        }
        break
      }

      if (s.currentStepIndex >= s.steps.length) {
        if (!s.isFinished) {
          s.logs = appendLog(s.logs, makeLog('info', '执行完毕'))
          s.isFinished = true
          s.isAutoRunning = false
          s.currentLineHighlight = null
        }
        return s
      }

      const step = s.steps[s.currentStepIndex]
      const newLogs: LogEntry[] = []
      let scope = new Map(s.globalScope)
      let callStack = [...s.callStack]

      s.currentLineHighlight = step.lineNumber
      newLogs.push(makeLog('info', `[行${step.lineNumber}] ${step.type.toUpperCase()}: ${step.lineContent}`))

      let jumpToIndex: number | null = null

      const handleError = (msg: string) => {
        newLogs.push(makeLog('error', msg))
        s.error = msg
        s.isAutoRunning = false
      }

      switch (step.type) {
        case 'declaration':
        case 'assignment':
        case 'expr': {
          const { scope: afterScope, error } = sandboxedEval(step.rawCode, scope)
          if (error) {
            handleError(`执行错误: ${error}`)
          } else {
            scope = afterScope
            const varName = extractAssignmentVarName(step.sourceText)
            if (varName && scope.has(varName)) {
              newLogs.push(makeLog('info', `${varName} = ${deepValueToString(scope.get(varName))}`))
            }
          }
          break
        }
        case 'condition': {
          const cond = step.meta?.condition ?? ''
          const { value: condVal, error } = evalCondition(cond, scope)
          if (error) {
            handleError(`条件判断错误: ${error}`)
          } else {
            newLogs.push(makeLog('info', `条件判断 (${cond}) => ${condVal}`))
            if (!condVal) {
              // Skip current branch (if any) - find matching else
              const currentBranch = step.meta?.branchId
              if (currentBranch) {
                const nextIdx = findNextStepOutsideBranch(s.steps, s.currentStepIndex + 1, currentBranch)
                // if there's an 'else' branch right after (same outer), jump into it
                // Simplest: jump to nextIdx
                jumpToIndex = nextIdx
              }
            }
          }
          break
        }
        case 'loop-condition': {
          const cond = step.meta?.condition ?? 'true'
          const { value: condVal, error } = evalCondition(cond, scope)
          if (error) {
            handleError(`循环条件错误: ${error}`)
          } else {
            newLogs.push(makeLog('info', `循环条件 (${cond}) => ${condVal}`))
            const branchId = step.meta?.branchId
            if (!condVal && branchId) {
              // exit loop: find step outside branch
              jumpToIndex = findNextStepOutsideBranch(s.steps, s.currentStepIndex + 1, branchId)
            }
          }
          break
        }
        case 'function-declare': {
          const fnName = step.meta?.funcName || 'anonymous'
          const args = step.meta?.funcArgs || ''
          scope.set(fnName, `[Function: ${fnName}]`)
          const frame: StackFrame = {
            id: `f-decl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            functionName: `声明 ${fnName}`,
            argsSummary: args,
            lineNumber: step.lineNumber,
            isCurrent: false,
            timestamp: Date.now(),
          }
          callStack = [...callStack.map(f => ({ ...f, isCurrent: false })), frame]
          newLogs.push(makeLog('info', `声明函数 ${fnName}(${args})`))
          break
        }
        case 'function-call': {
          const name = step.meta?.funcName || 'call'
          const args = step.meta?.funcArgs || ''
          // push frame
          const frame: StackFrame = {
            id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            functionName: name,
            argsSummary: args,
            lineNumber: step.lineNumber,
            isCurrent: true,
            timestamp: Date.now(),
          }
          callStack = [...callStack.map(f => ({ ...f, isCurrent: false })), frame]

          // try to actually execute if it's a built-in-like (console.log etc.)
          const { scope: afterScope, error } = sandboxedEval(step.rawCode, scope)
          if (error) {
            // not fatal for visualization
            newLogs.push(makeLog('warn', `调用 ${name}(${args})`))
          } else {
            scope = afterScope
            newLogs.push(makeLog('info', `调用 ${name}(${args})`))
          }
          // pop frame immediately (step-by-step for external calls is not traced into)
          callStack = callStack.slice(0, -1)
          if (callStack.length > 0) callStack[callStack.length - 1].isCurrent = true
          break
        }
        case 'return': {
          newLogs.push(makeLog('info', step.sourceText || 'return'))
          if (callStack.length > 0) {
            callStack = callStack.slice(0, -1)
            if (callStack.length > 0) callStack[callStack.length - 1].isCurrent = true
            newLogs.push(makeLog('info', '函数返回，弹出栈帧'))
          }
          break
        }
        default:
          newLogs.push(makeLog('info', step.sourceText || step.type))
      }

      // Handle loop back-edge: if we're at last step of a loop body, jump back to loop-condition
      const nextStep = s.steps[s.currentStepIndex + 1]
      if (jumpToIndex === null && step.meta?.branchId) {
        const curBranch = step.meta.branchId
        // If next step is outside this branch (i.e., end of body), and this branch is a loop
        // check if there's a loop-condition step with same branchId earlier
        const nextOutside = !nextStep || nextStep.meta?.branchId !== curBranch
        if (nextOutside) {
          const condIdx = findLoopConditionStep(s.steps, curBranch, s.currentStepIndex)
          if (condIdx >= 0 && step.type !== 'loop-condition') {
            jumpToIndex = condIdx
          }
        }
      }

      // Build previous snapshot
      const prevSnapshot = new Map<string, string>()
      s.globalScope.forEach((v, k) => { prevSnapshot.set(k, deepValueToString(v)) })

      let logs = s.logs
      for (const l of newLogs) logs = appendLog(logs, l)

      let nextIdx = (jumpToIndex !== null) ? jumpToIndex : s.currentStepIndex + 1
      // skip block enter/exit markers at target as well
      while (nextIdx < s.steps.length && (s.steps[nextIdx].type === 'block-enter' || s.steps[nextIdx].type === 'block-exit')) {
        nextIdx++
      }

      return {
        ...s,
        globalScope: scope,
        currentStepIndex: nextIdx,
        prevVariables: prevSnapshot,
        logs,
        callStack,
        isFinished: nextIdx >= s.steps.length ? s.isFinished : false,
      }
    }
    case 'AUTO_TOGGLE': {
      const willRun = !state.isAutoRunning
      let logs = state.logs
      if (willRun) {
        logs = appendLog(logs, makeLog('info', '进入自动执行模式（间隔0.5s）'))
      } else {
        logs = appendLog(logs, makeLog('info', '已停止自动执行'))
      }
      return { ...state, isAutoRunning: willRun, logs }
    }
    case 'AUTO_STOP': {
      if (!state.isAutoRunning) return state
      return {
        ...state,
        isAutoRunning: false,
        logs: appendLog(state.logs, makeLog('info', '已停止自动执行')),
      }
    }
    case 'RESET': {
      return { ...createInitialState(), code: state.code }
    }
    default:
      return state
  }
}

export interface UseStepRunnerReturn {
  state: RunnerState
  variables: VariableEntry[]
  setCode: (code: string) => void
  parse: () => void
  step: () => void
  toggleAuto: () => void
  stopAuto: () => void
  reset: () => void
}

export function useStepRunner(): UseStepRunnerReturn {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)
  const targetTickRef = useRef<number>(0)
  const timerRef = useRef<number | null>(null)
  const autoStartedRef = useRef(false)

  const setCode = useCallback((code: string) => dispatch({ type: 'SET_CODE', code }), [])
  const parse = useCallback(() => dispatch({ type: 'PARSE' }), [])
  const step = useCallback(() => dispatch({ type: 'STEP' }), [])
  const toggleAuto = useCallback(() => dispatch({ type: 'AUTO_TOGGLE' }), [])
  const stopAuto = useCallback(() => dispatch({ type: 'AUTO_STOP' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  // 用setTimeout递归调度 + performance.now校准，避免间隔漂移
  useEffect(() => {
    if (!state.isAutoRunning) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      autoStartedRef.current = false
      return
    }

    if (!autoStartedRef.current) {
      autoStartedRef.current = true
      targetTickRef.current = performance.now() + AUTO_INTERVAL
    }

    const tick = () => {
      dispatch({ type: 'STEP' })
      const now = performance.now()
      targetTickRef.current += AUTO_INTERVAL
      const drift = now - targetTickRef.current
      const nextDelay = Math.max(0, AUTO_INTERVAL - drift)
      timerRef.current = window.setTimeout(tick, nextDelay)
    }

    const initialDelay = Math.max(0, targetTickRef.current - performance.now())
    timerRef.current = window.setTimeout(tick, initialDelay)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state.isAutoRunning])

  useEffect(() => {
    if (state.isFinished && state.isAutoRunning) {
      dispatch({ type: 'AUTO_STOP' })
    }
  }, [state.isFinished, state.isAutoRunning])

  const variables = collectVariables(state.globalScope, state.prevVariables)

  return { state, variables, setCode, parse, step, toggleAuto, stopAuto, reset }
}
