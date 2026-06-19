import { ParsedStatement, splitStatements } from '../utils/parserHelper';

export interface VariableState {
  name: string;
  value: string;
  type: string;
}

export interface ExecutionStep {
  step: number;
  line: number;
  variables: VariableState[];
  changedVariables: string[];
  callStack: string[];
  description: string;
}

export interface ExecutionResult {
  steps: ExecutionStep[];
  error?: {
    type: string;
    message: string;
    line: number;
  };
  limitReached?: boolean;
}

interface ExecutionContext {
  variables: Map<string, { value: unknown; type: string; kind: string }>;
  callStack: string[];
  stepCount: number;
  maxSteps: number;
  result: ExecutionResult;
  functions: Map<string, { params: string[]; body: ParsedStatement[] }>;
  returnValue: unknown;
  shouldReturn: boolean;
}

const MAX_STEPS = 100;

export function executeCode(code: string): ExecutionResult {
  const parseResult = splitStatements(code);

  if (parseResult.error) {
    return {
      steps: [],
      error: {
        type: 'SyntaxError',
        message: parseResult.error.message,
        line: parseResult.error.line,
      },
    };
  }

  const context: ExecutionContext = {
    variables: new Map(),
    callStack: ['<global>'],
    stepCount: 0,
    maxSteps: MAX_STEPS,
    result: { steps: [] },
    functions: new Map(),
    returnValue: undefined,
    shouldReturn: false,
  };

  try {
    executeStatements(parseResult.statements, context);
  } catch (e) {
    const err = e as { message?: string; type?: string; line?: number };
    if (!context.result.error) {
      context.result.error = {
        type: err.type || 'RuntimeError',
        message: err.message || String(e),
        line: err.line || 1,
      };
    }
  }

  return context.result;
}

function snapshotVariables(context: ExecutionContext): VariableState[] {
  const vars: VariableState[] = [];
  for (const [name, info] of context.variables) {
    vars.push({
      name,
      value: stringifyValue(info.value),
      type: info.type,
    });
  }
  return vars;
}

function stringifyValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'function') return '[Function]';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function addStep(context: ExecutionContext, line: number, description: string, prevVarNames: Set<string>): boolean {
  if (context.stepCount >= context.maxSteps) {
    context.result.limitReached = true;
    context.result.error = {
      type: 'ExecutionLimit',
      message: '执行超限：超过最大步数限制（100步）',
      line,
    };
    return false;
  }

  const allVars = snapshotVariables(context);
  const changedVariables: string[] = [];

  for (const v of allVars) {
    if (!prevVarNames.has(v.name)) {
      changedVariables.push(v.name);
    } else {
      const prev = context.result.steps[context.result.steps.length - 1]?.variables.find(pv => pv.name === v.name);
      if (prev && prev.value !== v.value) {
        changedVariables.push(v.name);
      }
    }
  }

  context.stepCount++;
  context.result.steps.push({
    step: context.stepCount,
    line,
    variables: allVars,
    changedVariables,
    callStack: [...context.callStack],
    description,
  });

  return true;
}

function executeStatements(statements: ParsedStatement[], context: ExecutionContext): void {
  for (const stmt of statements) {
    if (context.shouldReturn) return;
    executeStatement(stmt, context);
    if (context.result.error) return;
  }
}

function executeStatement(stmt: ParsedStatement, context: ExecutionContext): void {
  const prevVarNames = new Set(context.variables.keys());

  switch (stmt.type) {
    case 'declaration':
      executeDeclaration(stmt, context, prevVarNames);
      break;
    case 'expression':
      executeExpressionStatement(stmt, context, prevVarNames);
      break;
    case 'if':
      executeIf(stmt, context, prevVarNames);
      break;
    case 'else':
      break;
    case 'while':
      executeWhile(stmt, context, prevVarNames);
      break;
    case 'for':
      executeFor(stmt, context, prevVarNames);
      break;
    case 'function':
      executeFunctionDeclaration(stmt, context, prevVarNames);
      break;
    case 'return':
      executeReturn(stmt, context, prevVarNames);
      break;
    default:
      if (!addStep(context, stmt.line, `执行: ${stmt.type}`, prevVarNames)) return;
  }
}

function executeDeclaration(stmt: ParsedStatement, context: ExecutionContext, prevVarNames: Set<string>): void {
  const raw = stmt.raw.trim();
  const match = raw.match(/^(let|const|var)\s+([^=]+?)(?:\s*=\s*(.+))?\s*;?$/);

  if (!match) {
    if (!addStep(context, stmt.line, `声明变量`, prevVarNames)) return;
    return;
  }

  const kind = match[1];
  const namePart = match[2].trim();
  const valuePart = match[3]?.trim().replace(/;$/, '').trim();

  const names = namePart.split(',').map(n => {
    const m = n.trim().match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\s*=\s*(.+))?$/);
    return m ? { name: m[1], initValue: m[2]?.replace(/;$/, '').trim() } : null;
  }).filter(Boolean) as { name: string; initValue?: string }[];

  for (const { name, initValue } of names) {
    let value: unknown = undefined;
    if (initValue !== undefined) {
      value = evaluateExpression(initValue, context);
    } else if (valuePart !== undefined) {
      value = evaluateExpression(valuePart, context);
    }

    context.variables.set(name, {
      value,
      type: getValueType(value),
      kind,
    });
  }

  const desc = names.length === 1
    ? `声明 ${kind} ${names[0].name} = ${stringifyValue(context.variables.get(names[0].name)?.value)}`
    : `声明多个变量: ${names.map(n => n.name).join(', ')}`;

  if (!addStep(context, stmt.line, desc, prevVarNames)) return;
}

function executeExpressionStatement(stmt: ParsedStatement, context: ExecutionContext, prevVarNames: Set<string>): void {
  let raw = stmt.raw.trim();
  raw = raw.replace(/\/\/[^\n]*$/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
  raw = raw.replace(/;$/, '').trim();

  if (raw === '') {
    return;
  }

  const assignMatch = raw.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([+\-*/%]?=)\s*(.+?)\s*;?$/);
  if (assignMatch) {
    const name = assignMatch[1];
    const op = assignMatch[2];
    const expr = assignMatch[3];

    if (!context.variables.has(name)) {
      throw { type: 'ReferenceError', message: `${name} is not defined`, line: stmt.line };
    }

    const currentValue = context.variables.get(name)!.value as number;
    const newValue = evaluateExpression(expr, context);

    let result: unknown;
    switch (op) {
      case '=':
        result = newValue;
        break;
      case '+=':
        result = (currentValue as number) + (newValue as number);
        break;
      case '-=':
        result = (currentValue as number) - (newValue as number);
        break;
      case '*=':
        result = (currentValue as number) * (newValue as number);
        break;
      case '/=':
        result = (currentValue as number) / (newValue as number);
        break;
      case '%=':
        result = (currentValue as number) % (newValue as number);
        break;
      default:
        result = newValue;
    }

    context.variables.set(name, {
      value: result,
      type: getValueType(result),
      kind: context.variables.get(name)!.kind,
    });

    if (!addStep(context, stmt.line, `${name} ${op} ${stringifyValue(newValue)} → ${stringifyValue(result)}`, prevVarNames)) return;
    return;
  }

  const funcCallMatch = raw.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\((.*)\)\s*;?$/);
  if (funcCallMatch) {
    const funcName = funcCallMatch[1];
    const argsStr = funcCallMatch[2];
    const args = parseArguments(argsStr, context);

    if (context.functions.has(funcName)) {
      const func = context.functions.get(funcName)!;
      const prevVars = new Map(context.variables);

      func.params.forEach((param, idx) => {
        context.variables.set(param, {
          value: args[idx],
          type: getValueType(args[idx]),
          kind: 'let',
        });
      });

      context.callStack.push(funcName);

      if (!addStep(context, stmt.line, `调用函数 ${funcName}(${args.map(stringifyValue).join(', ')})`, prevVarNames)) return;

      for (const bodyStmt of func.body) {
        if (context.shouldReturn) break;
        executeStatement(bodyStmt, context);
        if (context.result.error) break;
      }

      context.shouldReturn = false;
      context.callStack.pop();

      const newPrevVars = new Set(context.variables.keys());
      context.variables = prevVars;

      if (!addStep(context, stmt.line, `函数 ${funcName} 返回`, newPrevVars)) return;
      return;
    }
  }

  const result = evaluateExpression(raw.replace(/;$/, ''), context);
  if (!addStep(context, stmt.line, `计算表达式 → ${stringifyValue(result)}`, prevVarNames)) return;
}

function executeIf(stmt: ParsedStatement, context: ExecutionContext, prevVarNames: Set<string>): void {
  const raw = stmt.raw.trim();
  const conditionMatch = raw.match(/^if\s*\((.+)\)\s*\{?/s);

  if (!conditionMatch) {
    if (!addStep(context, stmt.line, 'if 语句', prevVarNames)) return;
    return;
  }

  const condition = conditionMatch[1].trim();
  const conditionResult = evaluateExpression(condition, context);
  const isTrue = Boolean(conditionResult);

  if (!addStep(context, stmt.line, `判断条件 (${condition}) → ${isTrue}`, prevVarNames)) return;
  if (context.result.error) return;

  if (isTrue && stmt.body) {
    executeStatements(stmt.body, context);
  }
}

function executeWhile(stmt: ParsedStatement, context: ExecutionContext, prevVarNames: Set<string>): void {
  const raw = stmt.raw.trim();
  const conditionMatch = raw.match(/^while\s*\((.+)\)\s*\{?/s);

  if (!conditionMatch) {
    if (!addStep(context, stmt.line, 'while 语句', prevVarNames)) return;
    return;
  }

  const condition = conditionMatch[1].trim();
  let iteration = 0;

  while (true) {
    if (context.result.error) return;
    if (context.shouldReturn) return;

    const loopPrevVars = new Set(context.variables.keys());
    const conditionResult = evaluateExpression(condition, context);
    const isTrue = Boolean(conditionResult);

    if (!addStep(context, stmt.line, `while 迭代 ${iteration + 1}: 条件 (${condition}) → ${isTrue}`, loopPrevVars)) return;
    if (context.result.error) return;

    if (!isTrue) break;

    if (stmt.body) {
      executeStatements(stmt.body, context);
    }
    iteration++;
  }
}

function executeFor(stmt: ParsedStatement, context: ExecutionContext, prevVarNames: Set<string>): void {
  const raw = stmt.raw.trim();
  const forMatch = raw.match(/^for\s*\(([^;]*);([^;]*);([^)]*)\)\s*\{?/s);

  if (!forMatch) {
    if (!addStep(context, stmt.line, 'for 语句', prevVarNames)) return;
    return;
  }

  const initStr = forMatch[1].trim();
  const conditionStr = forMatch[2].trim();
  const updateStr = forMatch[3].trim();

  if (initStr) {
    const initMatch = initStr.match(/^(let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+)$/);
    if (initMatch) {
      const kind = initMatch[1];
      const name = initMatch[2];
      const value = evaluateExpression(initMatch[3], context);
      context.variables.set(name, { value, type: getValueType(value), kind });
    }
  }

  const initVars = new Set(context.variables.keys());
  if (!addStep(context, stmt.line, `for 初始化: ${initStr || '无'}`, initVars)) return;

  let iteration = 0;
  while (true) {
    if (context.result.error) return;
    if (context.shouldReturn) return;

    const condPrevVars = new Set(context.variables.keys());
    const conditionResult = conditionStr ? evaluateExpression(conditionStr, context) : true;
    const isTrue = Boolean(conditionResult);

    if (!addStep(context, stmt.line, `for 迭代 ${iteration + 1}: 条件 (${conditionStr || 'true'}) → ${isTrue}`, condPrevVars)) return;
    if (context.result.error) return;

    if (!isTrue) break;

    if (stmt.body) {
      executeStatements(stmt.body, context);
    }
    if (context.result.error) return;

    if (updateStr) {
      const updatePrevVars = new Set(context.variables.keys());
      const updateMatch = updateStr.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([+\-]{2}|[+\-*/%]=)\s*(.*)$/);
      if (updateMatch) {
        const varName = updateMatch[1];
        const op = updateMatch[2];
        const currentValue = context.variables.get(varName)?.value as number;

        let result: number;
        if (op === '++') result = currentValue + 1;
        else if (op === '--') result = currentValue - 1;
        else {
          const rightVal = evaluateExpression(updateMatch[3], context) as number;
          switch (op) {
            case '+=': result = currentValue + rightVal; break;
            case '-=': result = currentValue - rightVal; break;
            case '*=': result = currentValue * rightVal; break;
            case '/=': result = currentValue / rightVal; break;
            case '%=': result = currentValue % rightVal; break;
            default: result = rightVal;
          }
        }

        context.variables.set(varName, {
          value: result,
          type: 'number',
          kind: context.variables.get(varName)?.kind || 'let',
        });
      }

      if (!addStep(context, stmt.line, `for 更新: ${updateStr}`, updatePrevVars)) return;
      if (context.result.error) return;
    }

    iteration++;
  }
}

function executeFunctionDeclaration(stmt: ParsedStatement, context: ExecutionContext, prevVarNames: Set<string>): void {
  const raw = stmt.raw.trim();
  const funcMatch = raw.match(/^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*\{?/s);

  if (!funcMatch) {
    if (!addStep(context, stmt.line, '函数声明', prevVarNames)) return;
    return;
  }

  const name = funcMatch[1];
  const paramsStr = funcMatch[2].trim();
  const params = paramsStr ? paramsStr.split(',').map(p => p.trim()) : [];

  context.functions.set(name, {
    params,
    body: stmt.body || [],
  });

  context.variables.set(name, {
    value: `[Function: ${name}]`,
    type: 'function',
    kind: 'function',
  });

  if (!addStep(context, stmt.line, `定义函数 ${name}(${params.join(', ')})`, prevVarNames)) return;
}

function executeReturn(stmt: ParsedStatement, context: ExecutionContext, prevVarNames: Set<string>): void {
  const raw = stmt.raw.trim();
  const returnMatch = raw.match(/^return\s*(.*?)\s*;?$/);

  let returnValue: unknown = undefined;
  if (returnMatch && returnMatch[1]) {
    returnValue = evaluateExpression(returnMatch[1].trim(), context);
  }

  context.returnValue = returnValue;
  context.shouldReturn = true;

  if (!addStep(context, stmt.line, `return ${stringifyValue(returnValue)}`, prevVarNames)) return;
}

function parseArguments(argsStr: string, context: ExecutionContext): unknown[] {
  if (!argsStr.trim()) return [];

  const args: unknown[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];

    if (inString) {
      current += char;
      if (char === stringChar && argsStr[i - 1] !== '\\') {
        inString = false;
      }
    } else if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      current += char;
    } else if (char === '(' || char === '[' || char === '{') {
      depth++;
      current += char;
    } else if (char === ')' || char === ']' || char === '}') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      args.push(evaluateExpression(current.trim(), context));
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    args.push(evaluateExpression(current.trim(), context));
  }

  return args;
}

function evaluateExpression(expr: string, context: ExecutionContext): unknown {
  expr = expr.trim().replace(/;$/, '').trim();

  if (expr === 'true') return true;
  if (expr === 'false') return false;
  if (expr === 'null') return null;
  if (expr === 'undefined') return undefined;

  const stringMatch = expr.match(/^["'`](.*)["'`]$/s);
  if (stringMatch) return stringMatch[1];

  if (/^-?\d+(\.\d+)?$/.test(expr)) return parseFloat(expr);

  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(expr)) {
    if (!context.variables.has(expr)) {
      throw { type: 'ReferenceError', message: `${expr} is not defined` };
    }
    return context.variables.get(expr)!.value;
  }

  const parenMatch = expr.match(/^\((.+)\)$/s);
  if (parenMatch) {
    let depth = 0;
    for (let i = 0; i < expr.length; i++) {
      if (expr[i] === '(') depth++;
      if (expr[i] === ')') depth--;
      if (depth === 0 && i < expr.length - 1) break;
      if (i === expr.length - 1 && depth === 0) {
        return evaluateExpression(parenMatch[1], context);
      }
    }
  }

  const orMatch = splitExpression(expr, '||');
  if (orMatch) {
    const left = evaluateExpression(orMatch.left, context);
    const right = evaluateExpression(orMatch.right, context);
    return Boolean(left) || Boolean(right);
  }

  const andMatch = splitExpression(expr, '&&');
  if (andMatch) {
    const left = evaluateExpression(andMatch.left, context);
    const right = evaluateExpression(andMatch.right, context);
    return Boolean(left) && Boolean(right);
  }

  const eqMatch = splitExpression(expr, /===|!==|==|!=/);
  if (eqMatch) {
    const left = evaluateExpression(eqMatch.left, context);
    const right = evaluateExpression(eqMatch.right, context);
    switch (eqMatch.op) {
      case '===': return left === right;
      case '!==': return left !== right;
      case '==': return left == right;
      case '!=': return left != right;
    }
  }

  const compMatch = splitExpression(expr, /<=|>=|<|>/);
  if (compMatch) {
    const left = evaluateExpression(compMatch.left, context) as number;
    const right = evaluateExpression(compMatch.right, context) as number;
    switch (compMatch.op) {
      case '<=': return left <= right;
      case '>=': return left >= right;
      case '<': return left < right;
      case '>': return left > right;
    }
  }

  const addMatch = splitExpression(expr, /(?<![+\-*/%])[+\-](?!\+|\-)/);
  if (addMatch) {
    const left = evaluateExpression(addMatch.left, context) as number;
    const right = evaluateExpression(addMatch.right, context) as number;
    return addMatch.op === '+' ? left + right : left - right;
  }

  const mulMatch = splitExpression(expr, /[*/%]/);
  if (mulMatch) {
    const left = evaluateExpression(mulMatch.left, context) as number;
    const right = evaluateExpression(mulMatch.right, context) as number;
    switch (mulMatch.op) {
      case '*': return left * right;
      case '/':
        if (right === 0) throw { type: 'RuntimeError', message: 'Division by zero' };
        return left / right;
      case '%': return left % right;
    }
  }

  const funcCallMatch = expr.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\((.*)\)$/s);
  if (funcCallMatch) {
    const funcName = funcCallMatch[1];
    const args = parseArguments(funcCallMatch[2], context);

    if (funcName === 'console' && args.length > 0) {
      return undefined;
    }

    if (typeof (Math as Record<string, unknown>)[funcName as keyof Math] === 'function') {
      return (Math as Record<string, (...a: number[]) => number>)[funcName](...(args as number[]));
    }

    if (context.functions.has(funcName)) {
      const func = context.functions.get(funcName)!;
      const prevVars = new Map(context.variables);

      func.params.forEach((param, idx) => {
        context.variables.set(param, {
          value: args[idx],
          type: getValueType(args[idx]),
          kind: 'let',
        });
      });

      context.callStack.push(funcName);
      context.shouldReturn = false;
      context.returnValue = undefined;

      for (const bodyStmt of func.body) {
        if (context.shouldReturn) break;
        executeStatement(bodyStmt, context);
        if (context.result.error) break;
      }

      const returnVal = context.returnValue;
      context.shouldReturn = false;
      context.callStack.pop();
      context.variables = prevVars;

      return returnVal;
    }

    throw { type: 'ReferenceError', message: `${funcName} is not a function` };
  }

  throw { type: 'RuntimeError', message: `无法解析表达式: ${expr}` };
}

function splitExpression(expr: string, opRegex: string | RegExp): { left: string; right: string; op: string } | null {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  const regex = typeof opRegex === 'string' ? new RegExp(opRegex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : new RegExp(opRegex.source, 'g');

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];

    if (inString) {
      if (char === stringChar && expr[i - 1] !== '\\') inString = false;
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === '(' || char === '[' || char === '{') {
      depth++;
      continue;
    }

    if (char === ')' || char === ']' || char === '}') {
      depth--;
      continue;
    }

    if (depth === 0) {
      regex.lastIndex = i;
      const match = regex.exec(expr);
      if (match && match.index === i) {
        return {
          left: expr.slice(0, i).trim(),
          right: expr.slice(i + match[0].length).trim(),
          op: match[0],
        };
      }
    }
  }

  return null;
}
