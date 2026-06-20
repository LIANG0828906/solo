import { fork, ChildProcess } from 'child_process';
import path from 'path';
import { TestCase, TestResult } from '../types';

const SANDBOX_TIMEOUT = 2000;

export function runCodeInSandbox(
  code: string,
  testCases: TestCase[]
): Promise<TestResult[]> {
  return new Promise((resolve) => {
    const workerPath = path.join(__dirname, 'sandboxWorker.js');
    let child: ChildProcess | null = null;
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      if (child) {
        child.kill('SIGKILL');
      }
      resolve(
        testCases.map((tc) => ({
          input: tc.input,
          expected: tc.expected,
          actual: 'Execution timed out',
          passed: false,
        }))
      );
    }, SANDBOX_TIMEOUT);

    try {
      child = fork(workerPath, [], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        execArgv: [],
      });

      child.on('message', (results: TestResult[]) => {
        if (!timedOut) {
          clearTimeout(timeout);
          resolve(results);
        }
      });

      child.on('error', () => {
        if (!timedOut) {
          clearTimeout(timeout);
          resolve(
            testCases.map((tc) => ({
              input: tc.input,
              expected: tc.expected,
              actual: 'Sandbox error',
              passed: false,
            }))
          );
        }
      });

      child.on('exit', (code) => {
        if (!timedOut && code !== 0) {
          clearTimeout(timeout);
          resolve(
            testCases.map((tc) => ({
              input: tc.input,
              expected: tc.expected,
              actual: 'Process exited with error',
              passed: false,
            }))
          );
        }
      });

      child.send({ code, testCases });
    } catch (e) {
      clearTimeout(timeout);
      resolve(
        testCases.map((tc) => ({
          input: tc.input,
          expected: tc.expected,
          actual: 'Failed to start sandbox',
          passed: false,
        }))
      );
    }
  });
}
