import type { TestCase, TestCaseResult } from '../../shared/types.js';

export async function runTests(
  userCode: string,
  testCases: TestCase[]
): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  for (const tc of testCases) {
    const start = performance.now();
    let actual: string;
    let passed = false;
    let error: string | undefined;
    let stackTrace: string | undefined;

    try {
      const result = await Promise.race([
        executeTestCase(userCode, tc.code),
        timeout(3000),
      ]);
      actual = stringifyResult(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "TIMEOUT") {
        actual = "Error: Execution timed out (3s limit)";
        error = "Execution timed out";
      } else if (err instanceof Error) {
        actual = `Error: ${err.message}`;
        error = err.message;
        stackTrace = err.stack;
      } else {
        actual = String(err);
        error = String(err);
      }
    }

    const executionTime = performance.now() - start;

    if (tc.expected.startsWith("Error:")) {
      passed = actual.startsWith("Error:");
    } else {
      passed = actual === tc.expected;
    }

    results.push({
      name: tc.name,
      input: tc.input,
      expected: tc.expected,
      actual,
      passed,
      error,
      executionTime,
      stackTrace,
    });
  }

  return results;
}

function executeTestCase(userCode: string, testCaseCode: string): unknown {
  const wrappedCode = `
    ${userCode}
    return ${testCaseCode};
  `;
  const fn = new Function(wrappedCode);
  return fn();
}

function stringifyResult(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("TIMEOUT"));
    }, ms);
  });
}
