const ctx = self as unknown as Worker;

interface RunMessage {
  type: 'run';
  code: string;
  language: 'javascript' | 'python';
}

interface TestMessage {
  type: 'test';
  code: string;
  functionName: string;
  testCases: { input: string; expectedOutput: string }[];
  language: 'javascript' | 'python';
}

type WorkerMessage = RunMessage | TestMessage;

function executeCode(code: string): { output: string; error: string | null } {
  const logs: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const mockConsole = {
    log: (...args: unknown[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    },
    error: (...args: unknown[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    },
    warn: (...args: unknown[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    },
  };

  try {
    const wrappedCode = `
      (function(console) {
        ${code}
      })
    `;
    const fn = eval(wrappedCode);
    fn(mockConsole);
    return { output: logs.join('\n'), error: null };
  } catch (e) {
    return { output: logs.join('\n'), error: (e as Error).message };
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  }
}

function runTests(
  code: string,
  functionName: string,
  testCases: { input: string; expectedOutput: string }[]
): { passed: boolean; input: string; expected: string; actual: string }[] {
  const results: { passed: boolean; input: string; expected: string; actual: string }[] = [];

  for (const tc of testCases) {
    try {
      const wrappedCode = `
        (function() {
          ${code}
          return ${functionName};
        })()
      `;
      const fn = eval(wrappedCode);

      const inputParts = parseInput(tc.input);
      const result = fn(...inputParts);
      const actualStr = normalizeOutput(result);

      results.push({
        passed: actualStr === tc.expectedOutput,
        input: tc.input,
        expected: tc.expectedOutput,
        actual: actualStr,
      });
    } catch (e) {
      results.push({
        passed: false,
        input: tc.input,
        expected: tc.expectedOutput,
        actual: `Error: ${(e as Error).message}`,
      });
    }
  }

  return results;
}

function parseInput(input: string): unknown[] {
  const parts: unknown[] = [];
  let depth = 0;
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inString) {
      current += ch;
      if (ch === stringChar && input[i - 1] !== '\\') {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      current += ch;
      continue;
    }

    if (ch === '[' || ch === '{') {
      depth++;
      current += ch;
      continue;
    }

    if (ch === ']' || ch === '}') {
      depth--;
      current += ch;
      continue;
    }

    if (ch === ',' && depth === 0) {
      parts.push(parseValue(current.trim()));
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim()) {
    parts.push(parseValue(current.trim()));
  }

  return parts;
}

function parseValue(val: string): unknown {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;
  if (val === 'undefined') return undefined;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

function normalizeOutput(result: unknown): string {
  if (result === true) return 'true';
  if (result === false) return 'false';
  if (result === null) return 'null';
  if (result === undefined) return 'undefined';
  if (Array.isArray(result)) {
    return JSON.stringify(result);
  }
  if (typeof result === 'object') {
    return JSON.stringify(result);
  }
  return String(result);
}

ctx.addEventListener('message', (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  if (msg.language === 'python') {
    if (msg.type === 'run') {
      ctx.postMessage({
        type: 'run_result',
        output: '',
        error: 'Python 执行暂不支持浏览器沙箱模式，请切换到 JavaScript',
      });
    } else if (msg.type === 'test') {
      ctx.postMessage({
        type: 'test_result',
        results: msg.testCases.map(tc => ({
          passed: false,
          input: tc.input,
          expected: tc.expectedOutput,
          actual: 'Python 执行暂不支持浏览器沙箱模式',
        })),
      });
    }
    return;
  }

  if (msg.type === 'run') {
    const result = executeCode(msg.code);
    ctx.postMessage({
      type: 'run_result',
      output: result.output,
      error: result.error,
    });
  } else if (msg.type === 'test') {
    const results = runTests(msg.code, msg.functionName, msg.testCases);
    ctx.postMessage({
      type: 'test_result',
      results,
    });
  }
});
