import { useState, useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { saveAs } from 'file-saver';
import type { Language } from '../utils/codeProcessor';
import './ResultPreview.css';

interface ResultPreviewProps {
  code: string;
  language: Language;
  stats?: { charReduction: number; indentCount: number };
  isMinified?: boolean;
}

export default function ResultPreview({ code, language, stats, isMinified }: ResultPreviewProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isDownloadPulse, setDownloadPulse] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const prevCodeRef = useRef('');

  useEffect(() => {
    if (!editorRef.current) return;

    monacoEditorRef.current = monaco.editor.create(editorRef.current, {
      value: code,
      language,
      theme: 'vs-dark',
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      readOnly: true,
      domReadOnly: true,
    });

    monaco.editor.defineTheme('preview-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#252526',
        'editor.foreground': '#CCCCCC',
        'editor.lineHighlightBackground': '#2A2D2E',
        'editor.selectionBackground': '#264F78',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#C6C6C6',
      },
    });

    monaco.editor.setTheme('preview-dark');

    return () => {
      monacoEditorRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (monacoEditorRef.current && code !== prevCodeRef.current) {
      monacoEditorRef.current.setValue(code);
      prevCodeRef.current = code;
      setFadeIn(false);
      requestAnimationFrame(() => {
        setFadeIn(true);
      });
    }
  }, [code]);

  useEffect(() => {
    if (monacoEditorRef.current) {
      const model = monacoEditorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 1500);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleDownload = () => {
    setDownloadPulse(true);
    setTimeout(() => setDownloadPulse(false), 300);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const fileName = `code_formatted_${year}${month}${day}_${hours}${minutes}${seconds}.txt`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, fileName);
  };

  return (
    <div className="result-preview">
      {stats && !isMinified && (
        <div className="stats-bar">
          格式化后：减少了 {stats.charReduction} 个字符，缩进 {stats.indentCount} 处
        </div>
      )}
      {isMinified && code && (
        <div className="stats-bar minify-stats">
          压缩后：共 {code.length} 字符
        </div>
      )}
      <div
        ref={editorRef}
        className={`preview-editor ${fadeIn ? 'fade-in' : ''}`}
      />
      <div className="preview-actions">
        <button
          className={`action-btn copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          disabled={!code}
        >
          {copied ? '已复制' : '复制'}
        </button>
        <button
          className={`action-btn download-btn ${isDownloadPulse ? 'pulse' : ''}`}
          onClick={handleDownload}
          disabled={!code}
        >
          下载
        </button>
      </div>
      {showToast && (
        <div className="toast">
          已复制到剪贴板
        </div>
      )}
    </div>
  );
}
