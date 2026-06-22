import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import type { Language } from '../utils/codeProcessor';

interface CodeEditorProps {
  value: string;
  language: Language;
  onChange: (value: string) => void;
}

export default function CodeEditor({ value, language, onChange }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    monacoEditorRef.current = monaco.editor.create(editorRef.current, {
      value,
      language,
      theme: 'vs-dark',
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: 'on',
    });

    monacoEditorRef.current.onDidChangeModelContent(() => {
      const currentValue = monacoEditorRef.current?.getValue() || '';
      onChange(currentValue);
    });

    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#2A2D2E',
        'editorCursor.foreground': '#AEAFAD',
        'editor.selectionBackground': '#264F78',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#C6C6C6',
      },
    });

    monaco.editor.setTheme('custom-dark');

    return () => {
      monacoEditorRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (monacoEditorRef.current) {
      const currentValue = monacoEditorRef.current.getValue();
      if (currentValue !== value) {
        monacoEditorRef.current.setValue(value);
      }
    }
  }, [value]);

  useEffect(() => {
    if (monacoEditorRef.current) {
      const model = monacoEditorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  return (
    <div
      ref={editorRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1E1E1E',
      }}
    />
  );
}
