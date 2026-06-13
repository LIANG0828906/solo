import { useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { useToast } from '../hooks/useToast';

interface CodeEditorProps {
  code: string;
  language: string;
  readOnly?: boolean;
  onChange?: (code: string) => void;
}

export default function CodeEditor({ code, language, readOnly = true, onChange }: CodeEditorProps) {
  const codeRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showToast, ToastContainer } = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current && readOnly) {
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language, readOnly]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      showToast('代码已复制到剪贴板', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('复制失败，请手动复制', 'error');
    }
  };

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
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      if (onChange) {
        onChange(newValue);
      }
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="code-editor">
      <div className="code-editor-header">
        <span className="code-language-badge">{language}</span>
        <button
          className="copy-btn"
          onClick={handleCopy}
          aria-label="复制代码"
        >
          {copied ? (
            <>
              <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              已复制
            </>
          ) : (
            <>
              <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <pre className="code-pre">
            <code ref={codeRef} className={`language-${language.toLowerCase()}`}>
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
            placeholder="在此输入代码..."
          />
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
