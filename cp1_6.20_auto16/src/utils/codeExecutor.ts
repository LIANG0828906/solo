import vm from 'vm';
import { Problem, TestResult } from '../types/index.js';

export async function evaluateCode(code: string, problem: Problem): Promise<TestResult[]> {
  const results: TestResult[] = [];

  let syntaxError: Error | null = null;
  let syntaxErrorLine: number | undefined;

  try {
    new vm.Script(code, {
      filename: 'user-code.js',
      displayErrors: true
    });
  } catch (err: any) {
    syntaxError = err;
    syntaxErrorLine = extractErrorLine(err);
  }

  if (syntaxError) {
    return problem.testCases.map(testCase => ({
      passed: false,
      input: testCase.input,
      expected: testCase.expected,
      actual: null,
      executionTime: 0,
      error: syntaxError.message,
      errorLine: syntaxErrorLine
    }));
  }

  for (const testCase of problem.testCases) {
    const startTime = Date.now();
    let actual: any;
    let error: string | undefined;
    let errorLine: number | undefined;

    const testCode = `
      ${code}
      ;
      const __result = ${problem.functionName}(...${JSON.stringify(testCase.input)});
      __result;
    `;

    const sandbox: any = {};

    try {
      const script = new vm.Script(testCode, {
        filename: 'user-code.js',
        displayErrors: true
      });

      actual = script.runInNewContext(sandbox, {
        timeout: 500
      });
    } catch (err: any) {
      if (err.message.includes('Script execution timed out')) {
        error = 'Time Limit Exceeded (500ms)';
      } else {
        error = err.message;
        errorLine = extractErrorLine(err);
      }
    }

    const executionTime = Date.now() - startTime;
    const passed = error ? false : JSON.stringify(actual) === JSON.stringify(testCase.expected);

    results.push({
      passed,
      input: testCase.input,
      expected: testCase.expected,
      actual,
      executionTime,
      error,
      errorLine
    });
  }

  return results;
}

function extractErrorLine(err: Error): number | undefined {
  const stack = err.stack || '';
  const match = stack.match(/user-code\.js:(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return undefined;
}
