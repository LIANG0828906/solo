import { useRef, useEffect, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import type { Language } from '../types';
import styles from './Editor.module.css';

interface EditorProps {
  code: string;
  language: Language;
  onChange: (code: string) => void;
}

const languageMap: Record<Language, string> = {
  javascript: 'javascript',
  python: 'python',
  html: 'markup',
  css: 'css',
};

export function Editor({ code, language, onChange }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [debouncedCode, setDebouncedCode] = useState<string>(code);
  const [highlightedCode, setHighlightedCode] = useState<string>(() => {
    const grammar = Prism.languages[languageMap[language]];
    if (grammar) {
      return Prism.highlight(code, grammar, languageMap[language]);
    }
    return code;
  });
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedCode(code);
    }, 300);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [code]);

  useEffect(() => {
    const grammar = Prism.languages[languageMap[language]];
    if (grammar) {
      const highlighted = Prism.highlight(debouncedCode, grammar, languageMap[language]);
      setHighlightedCode(highlighted);
    } else {
      setHighlightedCode(debouncedCode);
    }
  }, [debouncedCode, language]);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.lineNumbers} onScroll={handleScroll}>
        {lineNumbers.map((num) => (
          <div key={num} className={styles.lineNumber}>
            {num}
          </div>
        ))}
      </div>
      <div className={styles.codeArea}>
        <pre
          ref={preRef}
          className={`${styles.codePre} language-${languageMap[language]}`}
          aria-hidden="true"
        >
          <code dangerouslySetInnerHTML={{ __html: highlightedCode || ' ' }} />
        </pre>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={code}
          onChange={handleChange}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
