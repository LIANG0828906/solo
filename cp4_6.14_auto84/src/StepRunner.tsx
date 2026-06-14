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
  | 'loop'
  | 'function-call'
  | 'return'
  | 'other'

export interface ExecStep {
  lineNumber: number
  lineContent: string
  type: StepType
  rawCode: string
  meta?: Record<string, unknown>
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

function classifyLine(line: string): StepType {
  const t = line.trim()
  if (!t) return 'other'
  if (/^(let|const|var)\s/.test(t)) return 'declaration'
  if (/^function\s/.test(t) || /^const\s+\w+\s*=\s*(async\s*)?\(/.test(t) || /^let\s+\w+\s*=\s*(async\s*)?function/.test(t)) return 'declaration'
  if (/^if\s*\(|^else\s*if\s*\(|^else\b/.test(t)) return 'condition'
  if (/^for\s*\(|^while\s*\(|^do\b/.test(t)) return 'loop'
  if (/^return\b/.test(t)) return 'return'
  if (/^\w[\w$]*\s*\(/.test(t) || /^\w[\w$]*\.[\w$]+\s*\(/.test(t)) return 'function-call'
  if (/^\w[\w$]*(\.\w+)*\s*[+\-*/%&|^]?=/.test(t) && !/^const\s|^let\s|^var\s/.test(t)) return 'assignment'
  return 'other'
}

function parseCode(code: string): ExecStep[] {
  const rawLines = code.split('\n')
  const steps: ExecStep[] = []
  const braceStack: number[] = []

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i]
    const trimmed = raw.trim()
    if (!trimmed || /^\/\//.test(trimmed)) continue

    const openBraces = (raw.match(/\{/g) || []).length
    const closeBraces = (raw.match(/\}/g) || []).length
    for (let o = 0; o < openBraces; o++) braceStack.push(i)
    for (let c = 0; c < closeBraces; c++) braceStack.pop()

    const type = classifyLine(trimmed)
    steps.push({
      lineNumber: i + 1,
      lineContent: trimmed,
      type,
      rawCode: raw,
    })
  }

  return steps
}

function deepValueToString(v: VarValue): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'string') return `"${v}"`
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) {
    try { return JSON.stringify(v) } catch { return '[Array]' }
  }
  if (typeof v === 'object') {
    try { return JSON.stringify(v) } catch { return '[Object]' }
  }
  return String(v)
}

function buildScopeExpression(scope: Map<string, VarValue>): string {
  const parts: string[] = []
  scope.forEach((v, k) => {
    if (/^[a-zA-Z_$][\w$]*$/.test(k)) {
      const serialized = deepValueToString(v)
      parts.push(`let ${k} = ${serialized};`)
    }
  })
  return parts.join('\n')
}

function extractAssignmentTarget(line: string): string | null {
  const m = line.match(/^(?:let|const|var)\s+([a-zA-Z_$][\w$]*)/)
  if (m) return m[1]
  const m2 = line.match(/^([a-zA-Z_$][\w$]*(?:\.[\w$]+)*)\s*[+\-*/%&|^]?=/)
  if (m2) return m2[1].split('.')[0]
  return null
}

function extractFunctionName(line: string): string {
  const m1 = line.match(/^function\s+([a-zA-Z_$][\w$]*)/)
  if (m1) return m1[1]
  const m2 = line.match(/^const\s+([a-zA-Z_$][\w$]*)\s*=/)
  if (m2) return m2[1]
  const m3 = line.match(/^let\s+([a-zA-Z_$][\w$]*)\s*=/)
  if (m3) return m3[1]
  return 'anonymous'
}

function extractCallInfo(line: string): { name: string; args: string } {
  const m = line.match(/([a-zA-Z_$][\w$]*(?:\.[\w$]+)*)\s*\((.*)\)\s*;?\s*$/)
  if (m) {
    const argsPart = m[2].trim()
    const argsSummary = argsPart.length > 20 ? argsPart.slice(0, 17) + '...' : argsPart
    return { name: m[1], args: argsSummary }
  }
  return { name: 'call', args: '' }
}

function collectVariables(scope: Map<string, VarValue>, prev: Map<string, string>): VariableEntry[] {
  const entries: VariableEntry[] = []
  const now = Date.now()
  scope.forEach((value, name) => {
    const strValue = deepValueToString(value)
    const prevStr = prev.get(name)
    const isChanged = prevStr === undefined || prevStr !== strValue
    const type = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value
    let children: VariableEntry[] | undefined
    if (type === 'object' || type === 'array') {
      try {
        const obj = value as Record<string, VarValue> | VarValue[]
        const entriesInner: VariableEntry[] = []
        if (Array.isArray(obj)) {
          obj.forEach((item, idx) => {
            entriesInner.push({
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
            entriesInner.push({
              name: k,
              type: Array.isArray(item) ? 'array' : item === null ? 'null' : typeof item,
              value: item,
              isNewlyChanged: false,
              changeTimestamp: now,
            })
          })
        }
        if (entriesInner.length > 0) children = entriesInner
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
  }
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
      const steps = parseCode(state.code)
      let logs = state.logs
      if (steps.length === 0) {
        logs = appendLog(logs, makeLog('warn', '无可执行的代码语句'))
      } else {
        logs = appendLog(logs, makeLog('info', `解析完成，共 ${steps.length} 个可执行步骤`))
      }
      return {
        ...state,
        steps,
        isParsed: true,
        logs,
      }
    }
    case 'STEP': {
      let s: RunnerState = { ...state }
      if (!s.isParsed) {
        const steps = parseCode(s.code)
        s = { ...s, steps, isParsed: true }
        s.logs = appendLog(s.logs, makeLog('info', `解析完成，共 ${steps.length} 个可执行步骤`))
      }
      if (s.isFinished || s.currentStepIndex >= s.steps.length) {
        if (!s.isFinished) {
          s.logs = appendLog(s.logs, makeLog('info', '执行完毕'))
          s.isFinished = true
          s.isAutoRunning = false
        }
        return s
      }

      const step = s.steps[s.currentStepIndex]
      const scope = new Map(s.globalScope)
      const newLogs: LogEntry[] = []

      newLogs.push(makeLog('info', `[行${step.lineNumber}] ${step.type.toUpperCase()}: ${step.lineContent.slice(0, 80)}`))

      const setupBlock = buildScopeExpression(scope)
      let executeCode = ''

      if (step.type === 'declaration') {
        executeCode = step.rawCode
      } else if (step.type === 'assignment') {
        executeCode = step.rawCode
      } else if (step.type === 'condition') {
        const m = step.rawCode.match(/if\s*\(([^)]+)\)/)
        if (m) {
          executeCode = `const __cond__ = (${m[1]});`
        }
      } else if (step.type === 'loop') {
        const m1 = step.rawCode.match(/while\s*\(([^)]+)\)/)
        const m2 = step.rawCode.match(/for\s*\([^)]*\)/)
        if (m1) executeCode = `const __cond__ = (${m1[1]});`
        else if (m2) executeCode = step.rawCode.replace(/^for\s*\(/, 'for (let __i__=0;__i__<1;__i__++){ (function(){') + ';})(); break; }'
      } else if (step.type === 'return') {
        executeCode = step.rawCode
      } else if (step.type === 'function-call') {
        executeCode = `const __ret__ = (${step.rawCode.trim().replace(/;$/, '')});`
      } else {
        executeCode = step.rawCode
      }

      try {
        const forbidden = ['window', 'document', 'eval', 'globalThis', 'fetch', 'XMLHttpRequest']
        const forbiddenBlock = forbidden.map(k => `const ${k} = undefined;`).join('\n')
        const body = `
          "use strict";
          ${forbiddenBlock}
          ${setupBlock}
          ${executeCode}
          const __result__ = {};
          for (const __k__ of Object.keys(this || {})) {
            if (!${JSON.stringify(forbidden)}.includes(__k__)) __result__[__k__] = this[__k__];
          }
          (function(){
            const names = Object.keys(__result__);
            let idx = 0;
            try {
              // eval in scope
            } catch(e){}
          })();
          return __result__;
        `
        // Simpler approach: collect all existing vars as locals, then run
        const locals = Array.from(scope.keys()).filter(k => /^[a-zA-Z_$][\w$]*$/.test(k))
        const paramNames = [...locals]
        const paramValues = paramNames.map(k => scope.get(k))
        const functionBody = `
          "use strict";
          ${forbiddenBlock}
          ${executeCode}
          const __out = {};
          ${locals.map(k => `try { __out["${k}"] = (typeof ${k} !== "undefined") ? ${k} : undefined; } catch(e) { __out["${k}"] = undefined; }`).join('\n')}
          try { __out["__cond__"] = typeof __cond__ !== "undefined" ? __cond__ : undefined; } catch(e){}
          try { __out["__ret__"] = typeof __ret__ !== "undefined" ? __ret__ : undefined; } catch(e){}
          return __out;
        `
        const fn = new Function(...paramNames, functionBody)
        const result = fn(...paramValues) as Record<string, VarValue>

        for (const k of locals) {
          if (k in result) {
            scope.set(k, result[k])
          }
        }

        // Handle new variables from declaration
        if (step.type === 'declaration') {
          const targetMatch = step.lineContent.match(/^(?:let|const|var)\s+([a-zA-Z_$][\w$]*)\s*(?:=|;|$)/)
          if (targetMatch && !(targetMatch[1] in scope)) {
            // Extract initializer and execute again with output
            const varName = targetMatch[1]
            const initFn = new Function(...paramNames, ...forbidden.map(() => ''),
              `${forbiddenBlock}; ${setupBlock}; ${step.rawCode}; return (typeof ${varName} !== 'undefined') ? ${varName} : undefined;`
            )
            try {
              const val = initFn(...paramValues, ...forbidden.map(() => undefined))
              scope.set(varName, val)
            } catch (e) {
              // fallback: default undefined
              if (!scope.has(varName)) scope.set(varName, undefined)
            }
          }

          // Function declaration
          const fnNameMatch = step.lineContent.match(/^function\s+([a-zA-Z_$][\w$]*)\s*\(/)
          if (fnNameMatch) {
            const fnName = fnNameMatch[1]
            if (!scope.has(fnName)) {
              // stub the function: can't fully execute arbitrary nested in step model
              scope.set(fnName, `[Function: ${fnName}]`)
            }
          }
        }

        // Function call - push frame
        if (step.type === 'function-call') {
          const info = extractCallInfo(step.lineContent)
          const frame: StackFrame = {
            id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            functionName: info.name,
            argsSummary: info.args,
            lineNumber: step.lineNumber,
            isCurrent: true,
            timestamp: Date.now(),
          }
          s.callStack = [...s.callStack.map(f => ({ ...f, isCurrent: false })), frame]
          const ret = result['__ret__']
          if (ret !== undefined) {
            newLogs.push(makeLog('info', `${info.name}() 返回值 = ${deepValueToString(ret)}`))
          }
          // auto-pop frame after short time (in step model, simplify)
          setTimeout(() => { /* visual pop handled by next steps */ }, 0)
        }

        // Function declaration record
        if (step.type === 'declaration' && (step.lineContent.startsWith('function ') || /=\s*(async\s*)?(function|\()/.test(step.lineContent))) {
          const fnName = extractFunctionName(step.lineContent)
          const frame: StackFrame = {
            id: `f-decl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            functionName: `声明 ${fnName}`,
            argsSummary: '',
            lineNumber: step.lineNumber,
            isCurrent: false,
            timestamp: Date.now(),
          }
          s.callStack = [...s.callStack, frame]
        }

        // Return statement
        if (step.type === 'return') {
          if (s.callStack.length > 0) {
            const newStack = s.callStack.slice(0, -1)
            if (newStack.length > 0) newStack[newStack.length - 1].isCurrent = true
            s.callStack = newStack
            newLogs.push(makeLog('info', '函数返回，弹出栈帧'))
          }
        }

        // Condition result log
        if (step.type === 'condition' && '__cond__' in result) {
          const cond = result['__cond__']
          newLogs.push(makeLog('info', `条件判断结果: ${String(cond)}`))
        }

        // Assignment/declaration log of changed value
        if (step.type === 'assignment' || step.type === 'declaration') {
          const target = extractAssignmentTarget(step.lineContent)
          if (target && scope.has(target)) {
            const val = scope.get(target)
            newLogs.push(makeLog('info', `${target} = ${deepValueToString(val)}`))
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        newLogs.push(makeLog('error', `执行错误: ${msg}`))
        s.error = msg
        s.isAutoRunning = false
      }

      // Build previous snapshot before updating
      const prevSnapshot = new Map<string, string>()
      s.globalScope.forEach((v, k) => { prevSnapshot.set(k, deepValueToString(v)) })

      // Merge new log entries
      let logs = s.logs
      for (const l of newLogs) logs = appendLog(logs, l)

      return {
        ...s,
        globalScope: scope,
        currentStepIndex: s.currentStepIndex + 1,
        isFinished: s.currentStepIndex + 1 >= s.steps.length ? false : s.isFinished,
        prevVariables: prevSnapshot,
        logs,
        error: s.error,
        callStack: s.callStack.length === 0 ? [] : s.callStack,
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
      return {
        ...state,
        isAutoRunning: willRun,
        logs,
      }
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
      return {
        ...createInitialState(),
        code: state.code,
      }
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
  const dispatchedRef = useRef(false)

  const setCode = useCallback((code: string) => dispatch({ type: 'SET_CODE', code }), [])
  const parse = useCallback(() => dispatch({ type: 'PARSE' }), [])
  const step = useCallback(() => dispatch({ type: 'STEP' }), [])
  const toggleAuto = useCallback(() => dispatch({ type: 'AUTO_TOGGLE' }), [])
  const stopAuto = useCallback(() => dispatch({ type: 'AUTO_STOP' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  useEffect(() => {
    if (!state.isAutoRunning) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      dispatchedRef.current = false
      return
    }

    if (!dispatchedRef.current) {
      dispatchedRef.current = true
      targetTickRef.current = performance.now() + AUTO_INTERVAL
    }

    const tick = () => {
      dispatch({ type: 'STEP' })
      const now = performance.now()
      targetTickRef.current += AUTO_INTERVAL
      const nextDelay = Math.max(0, targetTickRef.current - now)
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
