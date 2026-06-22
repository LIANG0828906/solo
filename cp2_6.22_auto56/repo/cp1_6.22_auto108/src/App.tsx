import { useState, useRef, useEffect, useCallback } from 'react';
import CodeEditor from './components/CodeEditor';
import ToolBar from './components/ToolBar';
import ResultPreview from './components/ResultPreview';
import { minifyCode, formatCode, detectLanguage } from './utils/codeProcessor';
import type { Language, FormatResult } from './utils/codeProcessor';
import './App.css';

const defaultCode = `function greet(name) {
  // Say hello
  console.log("Hello, " + name + "!");
  return true;
}

const user = {
  name: "World",
  age: 25
};

greet(user.name);`;

export default function App() {
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState<Language>('javascript');
  const [resultCode, setResultCode] = useState('');
  const [formatStats, setFormatStats] = useState<FormatResult | null>(null);
  const [isMinified, setIsMinified] = useState(false);
  const [leftWidth, setLeftWidth] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAutoDetected = useRef(false);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    if (!hasAutoDetected.current && newCode.trim().length > 20) {
      const detected = detectLanguage(newCode);
      if (detected !== language) {
        setLanguage(detected);
      }
      hasAutoDetected.current = true;
    }
  }, [language]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    hasAutoDetected.current = true;
  };

  const handleMinify = () => {
    if (!code.trim()) return;
    const start = performance.now();
    const result = minifyCode(code, language);
    const elapsed = performance.now() - start;
    console.log(`Minify took ${elapsed.toFixed(2)}ms`);
    setResultCode(result);
    setFormatStats(null);
    setIsMinified(true);
  };

  const handleFormat = () => {
    if (!code.trim()) return;
    const start = performance.now();
    const result = formatCode(code, language);
    const elapsed = performance.now() - start;
    console.log(`Format took ${elapsed.toFixed(2)}ms`);
    setResultCode(result.code);
    setFormatStats(result);
    setIsMinified(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const relativeX = e.clientX - containerRect.left;
      let percentage = (relativeX / containerWidth) * 100;
      percentage = Math.max(20, Math.min(80, percentage));
      setLeftWidth(percentage);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const charCount = code.length;

  const languageLabels: Record<Language, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    css: 'CSS',
    html: 'HTML',
  };

  return (
    <div className="app-container">
      <div className="app-main" ref={containerRef}>
        <div
          className="editor-panel"
          style={{ width: `${leftWidth}%` }}
        >
          <ToolBar
            language={language}
            onLanguageChange={handleLanguageChange}
            onMinify={handleMinify}
            onFormat={handleFormat}
          />
          <div className="editor-content">
            <CodeEditor
              value={code}
              language={language}
              onChange={handleCodeChange}
            />
          </div>
          <div className="status-bar">
            <span className="status-language">{languageLabels[language]}</span>
            <span className="status-chars">{charCount} 字符</span>
          </div>
        </div>

        <div
          className={`divider ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
        />

        <div
          className="preview-panel"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div className="preview-header">
            <span className="preview-title">预览结果</span>
          </div>
          <div className="preview-content">
            <ResultPreview
              code={resultCode}
              language={language}
              stats={formatStats || undefined}
              isMinified={isMinified}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
