import { useRef, useCallback } from 'react';
import { useSandboxStore } from '@/stores/useSandboxStore';
import { Play, RotateCcw } from 'lucide-react';

const JS_KEYWORDS = new Set([
  'let', 'const', 'var', 'function', 'return', 'if', 'else',
  'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
  'new', 'typeof', 'instanceof', 'true', 'false', 'null', 'undefined',
  'class', 'extends', 'import', 'export', 'default', 'try', 'catch',
  'finally', 'throw', 'async', 'await', 'yield', 'of', 'in'
]);

function highlightCode(code: string): string {
  const lines = code.split('\n');
  return lines.map(line => {
    let result = '';
    let i = 0;
    while (i < line.length) {
      if (line[i] === '/' && line[i + 1] === '/') {
        result += `<span style="color:#6B7280">${escapeHtml(line.slice(i))}</span>`;
        i = line.length;
        continue;
      }
      if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
        const q = line[i];
        let s = line[i]; i++;
        while (i < line.length && line[i] !== q) {
          if (line[i] === '\\' && i + 1 < line.length) { s += line[i] + line[i + 1]; i += 2; }
          else { s += line[i]; i++; }
        }
        if (i < line.length) { s += line[i]; i++; }
        result += `<span style="color:#FBBF24">${escapeHtml(s)}</span>`;
        continue;
      }
      if (/[0-9]/.test(line[i]) || (line[i] === '.' && i + 1 < line.length && /[0-9]/.test(line[i + 1]))) {
        let s = '';
        while (i < line.length && /[0-9.xXa-fA-FeE]/.test(line[i])) { s += line[i]; i++; }
        result += `<span style="color:#34D399">${escapeHtml(s)}</span>`;
        continue;
      }
      if (/[a-zA-Z_$]/.test(line[i])) {
        let s = '';
        while (i < line.length && /[a-zA-Z0-9_$]/.test(line[i])) { s += line[i]; i++; }
        if (JS_KEYWORDS.has(s)) {
          result += `<span style="color:#C084FC">${escapeHtml(s)}</span>`;
        } else {
          result += escapeHtml(s);
        }
        continue;
      }
      result += escapeHtml(line[i]);
      i++;
    }
    return result;
  }).join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function CodeEditor() {
  const { code, setCode, runCode, reset, isRunning, steps } = useSandboxStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
  }, [code, setCode, runCode]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D3A5C]">
        <span className="text-[#94A3B8] text-sm font-medium tracking-wide">JavaScript Editor</span>
        <span className="text-[#64748B] text-xs">Ctrl+Enter to run</span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <pre
          ref={preRef}
          className="absolute inset-0 p-4 m-0 overflow-auto font-mono text-sm leading-6 whitespace-pre pointer-events-none"
          style={{ color: '#E2E8F0', tabSize: 2 }}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightCode(code) + '\n' }}
        />
        <textarea
          ref={textareaRef}
          value={code}
          onChange={e => setCode(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full p-4 m-0 font-mono text-sm leading-6 whitespace-pre bg-transparent text-transparent caret-white resize-none outline-none"
          style={{ tabSize: 2 }}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
        />
      </div>
      <div className="p-3 space-y-2 border-t border-[#2D3A5C]">
        <button
          onClick={runCode}
          disabled={isRunning}
          className="w-full py-2.5 rounded-lg font-semibold text-sm text-[#0F172A] active:scale-95 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: isRunning ? '#2D4A6C' : 'linear-gradient(135deg, #4ECDC4, #3BA6A0)',
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Play size={16} />
            {isRunning ? 'Running...' : steps.length > 0 ? 'Re-run' : 'Run'}
          </span>
        </button>
        <button
          onClick={reset}
          className="w-full py-2 rounded-lg text-sm text-[#94A3B8] border border-[#2D3A5C] hover:bg-[#1E293B] active:scale-95 transition-all duration-100"
        >
          <span className="flex items-center justify-center gap-2">
            <RotateCcw size={14} />
            Reset
          </span>
        </button>
      </div>
    </div>
  );
}
