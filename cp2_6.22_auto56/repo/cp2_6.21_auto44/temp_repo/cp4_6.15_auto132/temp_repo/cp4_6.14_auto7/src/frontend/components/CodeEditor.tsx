import { useState, useEffect, useRef, useCallback } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { useToast } from '../hooks/useToast';

interface CodeEditorProps {
  code: string;
  language: string;
  readOnly?: boolean;
  onChange?: (code: string) => void;
  minHeight?: string;
}

function fallbackCopyToClipboard(text: string): boolean {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);

    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let success = false;
    try {
      success = document.execCommand('copy');
    } catch {
      success = false;
    }

    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback
    }
  }
  return fallbackCopyToClipboard(text);
}

const HIGHLIGHTED_LANG_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  yml: 'yaml',
  sh: 'bash',
  golang: 'go',
};

function normalizeLang(lang: string): string {
  const lower = (lang || '').toLowerCase().trim();
  return HIGHLIGHTED_LANG_ALIASES[lower] || lower || 'plaintext';
}

export default function CodeEditor({
  code,
  language,
  readOnly = true,
  onChange,
  minHeight = '200px',
}: CodeEditorProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const codeRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightedRef = useRef(false);
  const { showToast, ToastContainer } = useToast();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedLang = normalizeLang(language);

  useEffect(() => {
    if (!readOnly) return;
    if (!codeRef.current) return;
    if (!preRef.current) return;

    try {
      codeRef.current.innerHTML = '';
      codeRef.current.textContent = code;
      codeRef.current.className = `language-${normalizedLang}`;
      hljs.highlightElement(codeRef.current);
      highlightedRef.current = true;
    } catch (err) {
      console.warn('highlight failed:', err);
      codeRef.current.textContent = code;
    }

    return () => {
      try {
        if (codeRef.current) {
          codeRef.current.innerHTML = '';
          codeRef.current.removeAttribute('data-highlighted');
          const highlights = codeRef.current.querySelectorAll('.hljs');
          highlights.forEach(() => {
            /* noop */
          });
        }
        highlightedRef.current = false;
      } catch {
        // ignore
      }
    };
  }, [code, normalizedLang, readOnly]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }

    const success = await copyText(code);
    if (success) {
      setCopied(true);
      showToast('代码已复制到剪贴板', 'success');
      copyTimerRef.current = setTimeout(() => {
        setCopied(false);
        copyTimerRef.current = null;
      }, 2000);
    } else {
      showToast('复制失败，请手动复制', 'error');
    }
  }, [code, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const indent = '  ';
      const newValue = value.substring(0, start) + indent + value.substring(end);
      if (onChange) {
        onChange(newValue);
      }
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const pos = start + indent.length;
          textareaRef.current.selectionStart = pos;
          textareaRef.current.selectionEnd = pos;
        }
      });
    }
  };

  return (
    <div className="code-editor" style={{ '--code-min-height': minHeight } as React.CSSProperties}>
      <div className="code-editor-header">
        <span className="code-language-badge">{language || 'PlainText'}</span>
        <button
          type="button"
          className="copy-btn"
          onClick={handleCopy}
          aria-label="复制代码"
        >
          {copied ? (
            <>
              <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              已复制
            </>
          ) : (
            <>
              <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              复制
            </>
          )}
        </button>
      </div>
      <div className="code-editor-content">
        {readOnly ? (
          <pre ref={preRef} className="code-pre">
            <code ref={codeRef} className={`language-${normalizedLang}`}>
              {code}
            </code>
          </pre>
        ) : (
          <textarea
            ref={textareaRef}
            className="code-textarea"
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="在此输入代码..."
          />
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
