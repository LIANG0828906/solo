import vm from "vm";

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

export class CodeRunner {
  run(code: string, testCases: TestCase[]): CodeResult {
    const startTime = Date.now();

    try {
      const script = new vm.Script(code, { filename: "solution.js" });

      let passedCount = 0;
      let error: string | undefined;

      for (const testCase of testCases) {
        try {
          const context = vm.createContext({});
          script.runInContext(context, { timeout: 3000 });

          if (typeof context.solution !== "function") {
            return {
              passed: false,
              passedCount: 0,
              totalCount: testCases.length,
              execTime: Date.now() - startTime,
              error: "solution is not defined or not a function",
            };
          }

          const result = context.solution(...testCase.input);

          if (this.deepEqual(result, testCase.expected)) {
            passedCount++;
          }
        } catch (err: any) {
          error = err.message || String(err);
          break;
        }
      }

      const execTime = Date.now() - startTime;

      return {
        passed: passedCount === testCases.length,
        passedCount,
        totalCount: testCases.length,
        execTime,
        error,
      };
    } catch (err: any) {
      return {
        passed: false,
        passedCount: 0,
        totalCount: testCases.length,
        execTime: Date.now() - startTime,
        error: err.message || String(err),
      };
    }
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
      return false;
    }

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this.deepEqual(a[key], b[key])) return false;
    }

    return true;
  }
}
