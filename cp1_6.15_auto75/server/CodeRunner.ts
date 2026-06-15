import vm from 'vm';

export interface TestCase {
  input: any[];
  expected: any;
}

export interface CodeResult {
  passed: boolean;
  passedCount: number;
  totalCount: number;
  execTime: number;
  error?: string;
}

const BLOCKED_GLOBALS = [
  'require', 'process', 'global', 'globalThis',
  '__dirname', '__filename', 'module', 'exports',
  'setTimeout', 'setInterval', 'setImmediate',
  'clearTimeout', 'clearInterval', 'clearImmediate',
  'Buffer', 'URL', 'URLSearchParams',
  'fetch', 'XMLHttpRequest', 'WebSocket',
  'Worker', 'SharedArrayBuffer', 'Atomics',
  'Proxy', 'Reflect', 'WeakRef', 'FinalizationRegistry',
  'eval', 'Function',
];

function createSandbox(testCases: TestCase[]): Record<string, any> {
  const sandbox: Record<string, any> = {
    Math,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    String,
    Number,
    Boolean,
    Array,
    Object,
    Date,
    RegExp,
    Error,
    TypeError,
    RangeError,
    SyntaxError,
    ReferenceError,
    Map,
    Set,
    Symbol,
    Infinity,
    NaN,
    undefined,
    NaN,
    __testCases: testCases,
    __results: [] as Array<{ result?: any; expected?: any; error?: string }>,
    __passedCount: 0,
    __error: undefined as string | undefined,
    __solutionCalled: false,
    console: {
      log: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
    },
  };

  for (const name of BLOCKED_GLOBALS) {
    sandbox[name] = undefined;
  }

  return sandbox;
}

function freezePrototype(obj: any): void {
  try {
    if (obj && typeof obj === 'function' && obj.prototype) {
      Object.getOwnPropertyNames(obj.prototype).forEach((prop) => {
        if (prop !== 'constructor') {
          try {
            Object.defineProperty(obj.prototype, prop, { configurable: false });
          } catch {}
        }
      });
    }
  } catch {}
}

const CODE_PLACEHOLDER = '/*__USER_CODE__*/';

const RUNNER_CODE = `
"use strict";
var __blocked = ['require','process','global','globalThis','__dirname','__filename','module','exports','setTimeout','setInterval','setImmediate','clearTimeout','clearInterval','clearImmediate','Buffer','URL','URLSearchParams','fetch','XMLHttpRequest','WebSocket','Worker','SharedArrayBuffer','Atomics','Proxy','Reflect','WeakRef','FinalizationRegistry','eval','Function'];
for (var __i = 0; __i < __blocked.length; __i++) {
  try { this[__blocked[__i]] = undefined; } catch(e) {}
}
try {
  Object.defineProperty(this, 'constructor', { value: undefined, writable: false, configurable: false });
} catch(e) {}

${CODE_PLACEHOLDER}

;

if (typeof solution !== 'function') {
  __error = 'solution is not defined or not a function';
} else {
  for (var __j = 0; __j < __testCases.length; __j++) {
    try {
      var __r = solution.apply(null, __testCases[__j].input);
      __results.push({ result: __r, expected: __testCases[__j].expected });
    } catch(__e) {
      __error = __e.message || String(__e);
      break;
    }
  }
}
`;

export class CodeRunner {
  static run(code: string, testCases: TestCase[]): CodeResult {
    const startTime = Date.now();

    try {
      const fullCode = RUNNER_CODE.replace(CODE_PLACEHOLDER, code);
      const script = new vm.Script(fullCode, {
        filename: 'solution.js',
        timeout: 3000,
      });

      const sandbox = createSandbox(testCases);

      const safeTypes = [
        String, Number, Boolean, Array, Object, Date, RegExp,
        Error, TypeError, RangeError, SyntaxError, ReferenceError,
        Map, Set, Symbol,
      ];
      for (const T of safeTypes) {
        freezePrototype(T);
      }

      const context = vm.createContext(sandbox, {
        name: 'codeSandbox',
        codeGeneration: {
          strings: false,
          wasm: false,
        },
      });

      script.runInContext(context, {
        timeout: 3000,
        microtaskMode: 'afterEvaluate',
      });

      if (sandbox.__error) {
        return {
          passed: false,
          passedCount: 0,
          totalCount: testCases.length,
          execTime: Date.now() - startTime,
          error: sandbox.__error,
        };
      }

      let passedCount = 0;
      for (const r of sandbox.__results) {
        if (r.error) {
          return {
            passed: false,
            passedCount,
            totalCount: testCases.length,
            execTime: Date.now() - startTime,
            error: r.error,
          };
        }
        if (CodeRunner.deepEqual(r.result, r.expected)) {
          passedCount++;
        }
      }

      const execTime = Date.now() - startTime;
      console.log(`[CodeRunner] Execution time: ${execTime}ms, Passed: ${passedCount}/${testCases.length}`);

      return {
        passed: passedCount === testCases.length,
        passedCount,
        totalCount: testCases.length,
        execTime,
      };
    } catch (err: any) {
      const execTime = Date.now() - startTime;
      const message = err.message || String(err);
      console.log(`[CodeRunner] Error after ${execTime}ms: ${message}`);

      if (message.includes('timeout') || message.includes('Script execution timed out')) {
        return {
          passed: false,
          passedCount: 0,
          totalCount: testCases.length,
          execTime,
          error: 'Code execution timed out (3s limit)',
        };
      }

      return {
        passed: false,
        passedCount: 0,
        totalCount: testCases.length,
        execTime,
        error: message,
      };
    }
  }

  private static deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
      return false;
    }

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!CodeRunner.deepEqual(a[key], b[key])) return false;
    }

    return true;
  }
}
