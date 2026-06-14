import { useRef, useEffect, useState, useCallback } from 'react';
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
  const [highlightedCode, setHighlightedCode] = useState('');
  const animationFrameRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCodeRef = useRef<string>('');
  const lastLangRef = useRef<Language>('javascript');

  const highlightCode = useCallback((value: string, lang: Language) => {
    lastCodeRef.current = value;
    lastLangRef.current = lang;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(() => {
        const grammar = Prism.languages[languageMap[lastLangRef.current]];
        if (grammar) {
          const highlighted = Prism.highlight(lastCodeRef.current, grammar, languageMap[lastLangRef.current]);
          setHighlightedCode(highlighted);
        } else {
          setHighlightedCode(lastCodeRef.current);
        }
        animationFrameRef.current = null;
      });
      debounceTimerRef.current = null;
    }, 300);
  }, []);

  useEffect(() => {
    highlightCode(code, language);
  }, [code, language, highlightCode]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
