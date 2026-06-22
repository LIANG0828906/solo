const { spawn } = require('child_process');

function runInSandbox(code, stdin) {
  return new Promise((resolve) => {
    const sandboxScript = `
      const Module = require('module');
      const originalRequire = Module.prototype.require;
      Module.prototype.require = function(id) {
        if (['fs', 'net', 'child_process', 'process'].includes(id)) {
          throw new Error('Module "' + id + '" is not allowed');
        }
        return originalRequire.apply(this, arguments);
      };

      const dangerousProps = ['exit', 'kill', 'chdir', 'umask', 'setuid', 'setgid', 'setgroups', 'initgroups', 'seteuid', 'setegid'];
      for (const prop of dangerousProps) {
        try { delete process[prop]; } catch (e) {}
      }

      const output = [];
      const originalLog = console.log;
      console.log = function(...args) {
        output.push(args.map(String).join(' '));
      };

      try {
        ${code}
        ${stdin !== undefined && stdin !== null ? `
          try {
            const __input__ = JSON.parse(${JSON.stringify(String(stdin))});
            if (typeof twoSum === 'function' && __input__.nums !== undefined) {
              console.log(JSON.stringify(twoSum(__input__.nums, __input__.target)));
            } else if (typeof reverseString === 'function' && __input__.s !== undefined) {
              console.log(JSON.stringify(reverseString(__input__.s)));
            } else if (typeof isValid === 'function' && __input__.s !== undefined) {
              console.log(JSON.stringify(isValid(__input__.s)));
            }
          } catch (e) {}
        ` : ''}
      } catch (e) {
        console.error(e.message || String(e));
        process.exit(1);
      }

      process.stdout.write(output.join('\\n') + (output.length ? '\\n' : ''));
    `;

    let timedOut = false;
    const child = spawn('node', ['--input-type=module'], {
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      stderr += err.message;
    });

    child.on('close', (exitCode) => {
      resolve({
        stdout,
        stderr,
        exitCode: exitCode === null ? (timedOut ? -1 : 0) : exitCode,
        timedOut
      });
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGKILL'); } catch (e) {}
    }, 5000);

    child.on('exit', () => {
      clearTimeout(timeout);
    });

    child.stdin.write(sandboxScript);
    child.stdin.end();
  });
}

async function judgeSubmission(problemId, code, testCases) {
  const results = [];
  for (const tc of testCases) {
    const res = await runInSandbox(code, tc.input);
    const actualOutput = res.stdout.trim();
    const passed = actualOutput === tc.expectedOutput;
    results.push({
      passed,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput,
      stderr: res.stderr || undefined
    });
  }
  return results;
}

module.exports = { runInSandbox, judgeSubmission };
