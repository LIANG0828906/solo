import { exec } from 'child_process';

export interface ExecResult {
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export function executeCode(
  language: 'python' | 'javascript',
  code: string,
  input: string,
  timeout = 5000
): Promise<ExecResult> {
  return new Promise((resolve) => {
    let cmd: string;

    if (language === 'python') {
      const escaped = code.replace(/'/g, "'\\''");
      cmd = `echo '${input.replace(/'/g, "'\\''")}' | python3 -c '${escaped}'`;
    } else {
      const escaped = code.replace(/'/g, "'\\''");
      cmd = `echo '${input.replace(/'/g, "'\\''")}' | node -e '${escaped}'`;
    }

    exec(cmd, { timeout }, (error, stdout, stderr) => {
      const timedOut = !!error && (error as any).killed === true;
      resolve({
        stdout: stdout || '',
        stderr: stderr || (error && !timedOut ? error.message : ''),
        timedOut,
      });
    });
  });
}
