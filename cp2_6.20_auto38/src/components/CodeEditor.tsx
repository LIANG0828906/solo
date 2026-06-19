import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { LintIssue } from '../types';

interface CodeEditorProps {
  initialCode: string;
  language: 'python' | 'javascript' | 'java';
  onChange: (code: string) => void;
  lintIssues: LintIssue[];
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

export default function CodeEditor({ initialCode, language, onChange, lintIssues }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const stats = useMemo(() => {
    const lines = code.split('\n');
    return { lineCount: lines.length, charCount: code.length };
  }, [code]);

  const handleChange = useCallback((value: string | undefined) => {
    const newValue = value ?? '';
    setCode(newValue);
    onChange(newValue);
  }, [onChange]);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    const monacoEditor = editorRef.current;
    const decorations = lintIssues.map((issue) => ({
      range: {
        startLineNumber: issue.line,
        startColumn: issue.column,
        endLineNumber: issue.line,
        endColumn: issue.column + 1,
      },
      options: {
        isWholeLine: true,
        className: 'lint-warning-line',
        glyphMarginClassName: issue.severity === 'error' ? 'lint-error-glyph' : 'lint-warning-glyph',
        glyphMarginHoverMessage: { value: `**${issue.rule}**: ${issue.message}` },
        hoverMessage: { value: `**${issue.rule}**: ${issue.message}` },
        overviewRuler: {
          color: issue.severity === 'error' ? '#ef4444' : '#f59e0b',
          position: 2,
        },
      },
    }));
    monacoEditor.deltaDecorations(
      monacoEditor.getModel()?.getAllDecorations()
        ?.filter((d: any) => d.options?.className === 'lint-warning-line')
        ?.map((d: any) => d.id) ?? [],
      decorations,
    );
  }, [lintIssues]);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

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
        value={code}
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
        }}
      />
      <div className="code-editor-bottombar">
        <span>Lines: {stats.lineCount}</span>
        <span>Characters: {stats.charCount}</span>
      </div>
    </div>
  );
}
