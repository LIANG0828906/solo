import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { LintIssue } from '../types';
import { lintCode } from '../utils/lint';

interface CodeEditorProps {
  initialCode: string;
  language: 'python' | 'javascript' | 'java';
  onChange: (code: string) => void;
  lintIssues?: LintIssue[];
}

const LANGUAGE_MAP: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
};

const FILE_EXTENSIONS: Record<string, string> = {
  python: '.py',
  javascript: '.js',
  java: '.java',
};

const TAB_SIZE: Record<string, number> = {
  python: 4,
  javascript: 2,
  java: 4,
};

const LINT_DEBOUNCE_MS = 300;
const CHANGE_DEBOUNCE_MS = 150;

export default function CodeEditor({ initialCode, language, onChange, lintIssues: externalLintIssues = [] }: CodeEditorProps) {
  const codeRef = useRef<string>(initialCode);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const lintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [internalLintIssues, setInternalLintIssues] = useState<LintIssue[]>([]);

  useEffect(() => {
    codeRef.current = initialCode;
  }, [initialCode]);

  const stats = useMemo(() => {
    const code = codeRef.current;
    const lines = code.split('\n');
    return { lineCount: lines.length, charCount: code.length };
  }, [internalLintIssues, externalLintIssues]);

  const allLintIssues = useMemo(() => {
    return [...internalLintIssues, ...externalLintIssues];
  }, [internalLintIssues, externalLintIssues]);

  const runLint = useCallback((code: string, lang: string) => {
    const issues = lintCode(code, lang);
    setInternalLintIssues(issues);
  }, []);

  const handleChange = useCallback((value: string | undefined) => {
    const newValue = value ?? '';
    codeRef.current = newValue;

    if (lintTimerRef.current) {
      clearTimeout(lintTimerRef.current);
    }
    lintTimerRef.current = setTimeout(() => {
      runLint(newValue, language);
    }, LINT_DEBOUNCE_MS);

    if (changeTimerRef.current) {
      clearTimeout(changeTimerRef.current);
    }
    changeTimerRef.current = setTimeout(() => {
      onChange(newValue);
    }, CHANGE_DEBOUNCE_MS);
  }, [onChange, language, runLint]);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    runLint(editor.getValue() || initialCode, language);
  }, [initialCode, language, runLint]);

  useEffect(() => {
    if (!editorRef.current) return;
    const monacoEditor = editorRef.current;

    const decorations = allLintIssues.map((issue) => ({
      range: {
        startLineNumber: issue.line,
        startColumn: issue.column,
        endLineNumber: issue.line,
        endColumn: issue.column + 1,
      },
      options: {
        isWholeLine: false,
        className: issue.severity === 'error' ? 'lint-error-line' : 'lint-warning-line',
        glyphMarginClassName: issue.severity === 'error' ? 'lint-error-glyph' : 'lint-warning-glyph',
        glyphMarginHoverMessage: { value: `**${issue.rule}**: ${issue.message}` },
        hoverMessage: { value: `**${issue.rule}**: ${issue.message}` },
        overviewRuler: {
          color: issue.severity === 'error' ? '#ef4444' : '#f59e0b',
          position: 2,
        },
      },
    }));

    const model = monacoEditor.getModel();
    if (!model) return;

    const oldDecorations = model.getAllDecorations()
      .filter((d: any) => {
        const cls = d.options?.className || '';
        return cls === 'lint-warning-line' || cls === 'lint-error-line';
      })
      .map((d: any) => d.id);

    monacoEditor.deltaDecorations(oldDecorations, decorations);
  }, [allLintIssues]);

  useEffect(() => {
    return () => {
      if (lintTimerRef.current) clearTimeout(lintTimerRef.current);
      if (changeTimerRef.current) clearTimeout(changeTimerRef.current);
    };
  }, []);

  const filename = `solution${FILE_EXTENSIONS[language] ?? '.txt'}`;

  return (
    <div className="code-editor">
      <div className="code-editor-topbar">
        <span className="code-editor-filename">{filename}</span>
        <span className="code-editor-lang-badge">{language}</span>
      </div>
      <Editor
        height="400px"
        language={LANGUAGE_MAP[language]}
        defaultValue={initialCode}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          folding: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: TAB_SIZE[language] ?? 4,
          glyphMargin: true,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
        }}
      />
      <div className="code-editor-bottombar">
        <span>Lines: {stats.lineCount}</span>
        <span>Characters: {stats.charCount}</span>
        {internalLintIssues.length > 0 && (
          <span className="lint-count-badge">
            ⚠️ {internalLintIssues.length} 个警告
          </span>
        )}
      </div>
    </div>
  );
}
