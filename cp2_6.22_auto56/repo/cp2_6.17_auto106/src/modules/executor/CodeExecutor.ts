import { Language, ExecuteResponse } from '@/types';

export class CodeExecutor {
  static async execute(code: string, language: Language): Promise<ExecuteResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      if (language === 'javascript') {
        return this.executeJavaScript(code);
      }
      return this.executePython(code);
    } catch (e) {
      return {
        output: e instanceof Error ? e.message : String(e),
        error: true,
      };
    }
  }

  private static executeJavaScript(code: string): ExecuteResponse {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('sandbox', 'allow-scripts');
    document.body.appendChild(iframe);

    try {
      const output: string[] = [];
      const win = iframe.contentWindow;
      if (!win) {
        return { output: 'Failed to create sandbox iframe', error: true };
      }

      (win as any).console.log = (...args: unknown[]) => {
        output.push(
          args
            .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
            .join(' ')
        );
      };
      (win as any).console.error = (...args: unknown[]) => {
        output.push(
          args
            .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
            .join(' ')
        );
      };

      const result = (win as any).eval(code);
      if (result !== undefined && result !== null) {
        output.push(String(result));
      }

      return { output: output.join('\n'), error: false };
    } catch (e) {
      return {
        output: e instanceof Error ? e.message : String(e),
        error: true,
      };
    } finally {
      document.body.removeChild(iframe);
    }
  }

  private static executePython(code: string): ExecuteResponse {
    const brython = (window as unknown as Record<string, unknown>).__BRYTHON__ as
      | Record<string, unknown>
      | undefined;

    if (!brython) {
      return { output: 'Brython 运行时未加载，请刷新页面重试', error: true };
    }

    const output: string[] = [];
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: unknown[]) => {
      output.push(args.map((a) => String(a)).join(' '));
    };
    console.warn = (...args: unknown[]) => {
      output.push(args.map((a) => String(a)).join(' '));
    };
    console.error = (...args: unknown[]) => {
      output.push(args.map((a) => String(a)).join(' '));
    };

    try {
      const wrappedCode = `
import sys
from browser import console

class _OutputCapture:
    def __init__(self):
        self.data = []
    def write(self, text):
        if text:
            console.log(text)
    def flush(self):
        pass

sys.stdout = _OutputCapture()
sys.stderr = _OutputCapture()

${code}
`;

      const py2js = brython.$py2js as (
        code: string,
        mod: string,
        mod2: string
      ) => string;
      const jsCode = py2js(wrappedCode, '__main__', '__main__');
      // eslint-disable-next-line no-eval
      eval(jsCode);

      return { output: output.join('\n'), error: false };
    } catch (e) {
      return {
        output: e instanceof Error ? e.message : String(e),
        error: true,
      };
    } finally {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    }
  }
}
