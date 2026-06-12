import { TestCase, TestResult } from '../types';

interface WorkerMessage {
  code: string;
  testCases: TestCase[];
}

process.on('message', (msg: WorkerMessage) => {
  const { code, testCases } = msg;
  const results: TestResult[] = [];

  try {
    const wrappedCode = `
      "use strict";
      ${code}
      ;
      if (typeof solution === 'function') {
        solution;
      } else if (typeof main === 'function') {
        main;
      } else {
        null;
      }
    `;

    // eslint-disable-next-line no-new-func
    const fn = new Function(wrappedCode)();

    if (typeof fn !== 'function') {
      testCases.forEach((tc) => {
        results.push({
          input: tc.input,
          expected: tc.expected,
          actual: 'No solution() or main() function found',
          passed: false,
        });
      });
    } else {
      testCases.forEach((tc) => {
        try {
          const parsedInput = JSON.parse(tc.input);
          const args = Array.isArray(parsedInput) ? parsedInput : [parsedInput];
          const rawResult = fn(...args);
          const actual = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult);
          let expected = tc.expected;
          try {
            const parsedExpected = JSON.parse(tc.expected);
            expected = typeof parsedExpected === 'string' ? parsedExpected : JSON.stringify(parsedExpected);
          } catch {
            // expected remains as string
          }
          const passed = actual === expected;
          results.push({
            input: tc.input,
            expected: tc.expected,
            actual,
            passed,
          });
        } catch (err: any) {
          results.push({
            input: tc.input,
            expected: tc.expected,
            actual: err.message || 'Runtime error',
            passed: false,
          });
        }
      });
    }
  } catch (err: any) {
    testCases.forEach((tc) => {
      results.push({
        input: tc.input,
        expected: tc.expected,
        actual: err.message || 'Compilation error',
        passed: false,
      });
    });
  }

  if (process.send) {
    process.send(results);
  }
  process.exit(0);
});
