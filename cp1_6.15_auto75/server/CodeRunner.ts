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

const ALLOWED_GLOBALS = [
  'Math', 'JSON', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'String', 'Number', 'Boolean', 'Array', 'Object', 'Date', 'RegExp',
  'Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError',
  'Map', 'Set', 'Symbol', 'Infinity', 'NaN', 'undefined',
  'console',
];

function createStrictSandbox(testCases: TestCase[]): Record<string, any> {
  const sandbox: Record<string, any> = {};

  const whitelist: Record<string, any> = {
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
    console: {
      log: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
    },
  };

  for (const key of ALLOWED_GLOBALS) {
    if (Object.prototype.hasOwnProperty.call(whitelist, key)) {
      Object.defineProperty(sandbox, key, {
        value: whitelist[key],
        writable: false,
        enumerable: true,
        configurable: false,
      });
    }
  }

  Object.defineProperties(sandbox, {
    __testCases: { value: testCases, writable: false, configurable: false },
    __results: { value: [], writable: false, configurable: false },
    __error: { value: undefined, writable: true, configurable: false },
  });

  Object.freeze(sandbox.Math);
  Object.freeze(sandbox.JSON);

  Object.preventExtensions(sandbox);

  return sandbox;
}

const CODE_PLACEHOLDER = '/*__USER_CODE__*/';

const RUNNER_CODE = `
"use strict";
(function(global) {
  Object.getOwnPropertyNames(global).forEach(function(k) {
    try {
      Object.defineProperty(global, k, { configurable: false, writable: true });
    } catch(e) {}
  });

  Object.defineProperty(global, "constructor", { get: function() { throw new Error("Illegal access: constructor"); }, configurable: false });
  Object.defineProperty(global, "__proto__", { get: function() { throw new Error("Illegal access: __proto__"); }, configurable: false });
  try { delete global.constructor; } catch(e) {}

  var dangerous = [
    'require','process','global','globalThis','__dirname','__filename',
    'module','exports','setTimeout','setInterval','setImmediate',
    'clearTimeout','clearInterval','clearImmediate','Buffer','URL','URLSearchParams',
    'fetch','XMLHttpRequest','WebSocket','Worker','SharedArrayBuffer','Atomics',
    'Proxy','Reflect','WeakRef','FinalizationRegistry','eval','Function',
    'performance','queueMicrotask','structuredClone','crypto','TextEncoder','TextDecoder',
    'Promise','async','await','import','importMeta','as',
    'ArrayBuffer','Uint8Array','Uint16Array','Uint32Array','Int8Array','Int16Array','Int32Array',
    'Float32Array','Float64Array','Uint8ClampedArray','DataView','BigInt64Array','BigUint64Array',
    'BigInt'
  ];
  for (var __d = 0; __d < dangerous.length; __d++) {
    try { Object.defineProperty(global, dangerous[__d], { value: undefined, writable: false, configurable: false }); } catch(e) {}
    try {
      (function() {
        Object.defineProperty(Object.prototype, dangerous[__d], {
          get: function() { throw new Error("Blocked: " + dangerous[__d]); },
          set: function() { throw new Error("Blocked: " + dangerous[__d]); },
          configurable: false
        });
      })();
    } catch(e) {}
  }

  var __origProto = Object.prototype;
  var __origFnProto = (function(){}).__proto__ || Function.prototype;
  try {
    Object.defineProperty(__origFnProto, "constructor", {
      get: function() { throw new Error("Blocked: Function constructor"); },
      configurable: false
    });
  } catch(e) {}

  try {
    Object.defineProperty(Object.prototype, "__proto__", {
      get: function() {
        if (this === global) return undefined;
        return Object.getPrototypeOf(this);
      },
      set: function(v) { Object.setPrototypeOf(this, v); },
      configurable: false
    });
  } catch(e) {}

  var __origGetOwnPropertyNames = Object.getOwnPropertyNames;
  var __origCreate = Object.create;
  var __origDefineProp = Object.defineProperty;
  var __origGetProto = Object.getPrototypeOf;
  var __origSetProto = Object.setPrototypeOf;

  Object.getOwnPropertyNames = function(obj) {
    if (obj === global) return __origGetOwnPropertyNames(obj).filter(function(n) {
      return n.indexOf('__') !== 0;
    });
    return __origGetOwnPropertyNames(obj);
  };

})((function(){ return this; })());

${CODE_PLACEHOLDER}

;

(function() {
  if (typeof solution !== 'function') {
    __error = 'solution is not defined or not a function. Your code must define: function solution(...) { ... }';
    return;
  }
  var solutionFunc = solution;
  if (typeof solutionFunc !== 'function') {
    __error = 'solution is not a function';
    return;
  }

  for (var __j = 0; __j < __testCases.length; __j++) {
    try {
      var __args = __testCases[__j].input;
      var __r = solutionFunc.apply(null, __args);
      __results.push({ result: __r, expected: __testCases[__j].expected });
    } catch(__e) {
      __error = (__e && __e.message ? __e.message : String(__e)).toString().slice(0, 200);
      break;
    }
  }
})();
`;

const EXECUTION_TIMEOUT = 3000;

export class CodeRunner {
  static run(code: string, testCases: TestCase[]): CodeResult {
    const startTime = Date.now();

    try {
      if (typeof code !== 'string' || code.length === 0) {
        return {
          passed: false,
          passedCount: 0,
          totalCount: testCases.length,
          execTime: Date.now() - startTime,
          error: 'Empty code submission',
        };
      }

      if (code.length > 10000) {
        return {
          passed: false,
          passedCount: 0,
          totalCount: testCases.length,
          execTime: Date.now() - startTime,
          error: 'Code too large (max 10KB)',
        };
      }

      const dangerousPatterns = [
        /\b(while|for)\s*\(\s*(?:true|1)\s*\)/,
        /\beval\s*\(/,
        /\.constructor\s*\(/,
        /\bnew\s+Function\b/,
        /__proto__/,
        /process\s*\./,
        /require\s*\(/,
        /\bimport\s+/,
        /`[^`]*\$\{[^}]+\}/,
      ];

      for (const pat of dangerousPatterns) {
        if (pat.test(code)) {
          return {
            passed: false,
            passedCount: 0,
            totalCount: testCases.length,
            execTime: Date.now() - startTime,
            error: 'Code contains blocked patterns',
          };
        }
      }

      const fullCode = RUNNER_CODE.replace(CODE_PLACEHOLDER, code);

      let script: vm.Script;
      try {
        script = new vm.Script(fullCode, {
          filename: 'sandbox.js',
          timeout: EXECUTION_TIMEOUT,
          displayErrors: false,
        });
      } catch (syntaxErr: any) {
        return {
          passed: false,
          passedCount: 0,
          totalCount: testCases.length,
          execTime: Date.now() - startTime,
          error: 'Syntax Error: ' + (syntaxErr.message || String(syntaxErr)).slice(0, 150),
        };
      }

      const sandbox = createStrictSandbox(testCases);

      const contextOptions: vm.CreateContextOptions = {
        name: 'codeSandbox-' + Math.random().toString(36).slice(2, 8),
        origin: 'sandbox://usercode',
        codeGeneration: {
          strings: false,
          wasm: false,
        },
      };

      const context = vm.createContext(sandbox, contextOptions);

      try {
        script.runInContext(context, {
          timeout: EXECUTION_TIMEOUT,
          displayErrors: false,
          microtaskMode: 'afterEvaluate',
          breakOnSigint: true,
        });
      } catch (runErr: any) {
        const execTime = Date.now() - startTime;
        const msg = runErr.message || String(runErr);

        if (msg.includes('timeout') || msg.includes('Script execution timed out') || msg.includes('time')) {
          console.log(`[CodeRunner] ⚠ TIMEOUT after ${execTime}ms`);
          return {
            passed: false,
            passedCount: 0,
            totalCount: testCases.length,
            execTime,
            error: `Timeout: execution exceeded ${EXECUTION_TIMEOUT}ms limit`,
          };
        }

        return {
          passed: false,
          passedCount: 0,
          totalCount: testCases.length,
          execTime,
          error: 'Runtime Error: ' + msg.slice(0, 150),
        };
      }

      const __error = (sandbox as any).__error;
      const __results = (sandbox as any).__results || [];

      if (__error) {
        return {
          passed: false,
          passedCount: 0,
          totalCount: testCases.length,
          execTime: Date.now() - startTime,
          error: String(__error).slice(0, 200),
        };
      }

      let passedCount = 0;
      for (const r of __results) {
        if (CodeRunner.deepEqual(r.result, r.expected)) {
          passedCount++;
        }
      }

      const execTime = Date.now() - startTime;
      const allPassed = passedCount === testCases.length;

      console.log(`[CodeRunner] ${allPassed ? '✅' : '❌'} ${passedCount}/${testCases.length} passed | Time: ${execTime}ms${execTime > 1500 ? ' [SLOW]' : ''}`);

      if (execTime > 2000) {
        console.warn(`[CodeRunner] ⚠ WARNING: execTime=${execTime}ms exceeds 2s performance target`);
      }

      return {
        passed: allPassed,
        passedCount,
        totalCount: testCases.length,
        execTime,
      };
    } catch (outerErr: any) {
      const execTime = Date.now() - startTime;
      console.log(`[CodeRunner] 💥 Fatal error after ${execTime}ms:`, outerErr.message);

      return {
        passed: false,
        passedCount: 0,
        totalCount: testCases.length,
        execTime,
        error: 'Sandbox Error: ' + (outerErr.message || String(outerErr)).slice(0, 150),
      };
    }
  }

  private static deepEqual(a: any, b: any): boolean {
    try {
      if (a === b) return true;

      if (Number.isNaN(a) && Number.isNaN(b)) return true;

      if (a === null || b === null) return false;
      if (a === undefined || b === undefined) return false;
      if (typeof a !== typeof b) return false;

      if (typeof a !== 'object') return false;

      if (Array.isArray(a) !== Array.isArray(b)) return false;

      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!CodeRunner.deepEqual(a[i], b[i])) return false;
        }
        return true;
      }

      const keysA = Object.keys(a).sort();
      const keysB = Object.keys(b).sort();

      if (keysA.length !== keysB.length) return false;
      for (let i = 0; i < keysA.length; i++) {
        if (keysA[i] !== keysB[i]) return false;
      }

      for (const key of keysA) {
        if (!CodeRunner.deepEqual(a[key], b[key])) return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}
