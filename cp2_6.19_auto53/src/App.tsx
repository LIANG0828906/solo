import { useState, useCallback, useRef, useEffect } from 'react';
import Editor from './modules/code-editor/Editor';
import Visualizer from './modules/code-visualizer/Visualizer';
import { executeCode, ExecutionResult } from './modules/code-executor/Executor';
import './App.css';

function App() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightLine, setHighlightLine] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [editorWidth, setEditorWidth] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setCurrentStep(0);
    setHighlightLine(0);

    setTimeout(() => {
      const execResult = executeCode(code);
      setResult(execResult);
      setHasRun(true);
      setIsRunning(false);

      if (execResult.steps.length > 0) {
        setHighlightLine(execResult.steps[0].line);
      }

      if (execResult.error) {
        setHighlightLine(execResult.error.line);
      }
    }, 50);
  }, [code]);

  const handleStepChange = useCallback((step: number) => {
    if (result && step >= 0 && step < result.steps.length) {
      setCurrentStep(step);
      setHighlightLine(result.steps[step].line);
    }
  }, [result]);

  const handleLineSelect = useCallback((line: number) => {
    setHighlightLine(line);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const percentage = (relativeX / containerRect.width) * 100;
      const clamped = Math.min(Math.max(percentage, 30), 75);
      setEditorWidth(clamped);
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

  const errorLine = result?.error?.line || 0;

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="header-left">
          <div className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <div className="header-title">
            <h1>代码可视化学习平台</h1>
            <p>JavaScript 交互式代码执行与调试工具</p>
          </div>
        </div>
        <div className="header-right">
          <div className="status-indicator">
            <span className={`status-dot ${hasRun ? (result?.error ? 'error' : 'success') : 'idle'}`} />
            <span className="status-text">
              {isRunning ? '执行中...' : hasRun ? (result?.error ? '执行出错' : '执行完成') : '等待运行'}
            </span>
          </div>
        </div>
      </div>

      <div className="app-content" ref={containerRef}>
        <div className="editor-panel" style={{ width: `${editorWidth}%` }}>
          <Editor
            code={code}
            onChange={setCode}
            onRun={handleRun}
            isRunning={isRunning}
            hasRun={hasRun}
            highlightLine={highlightLine}
            errorLine={errorLine}
          />
        </div>

        <div
          className={`divider ${isDragging ? 'dragging' : ''}`}
          onMouseDown={() => setIsDragging(true)}
          title="拖拽调整大小"
        >
          <div className="divider-handle">
            <div className="divider-line" />
            <div className="divider-line" />
            <div className="divider-line" />
          </div>
        </div>

        <div className="visualizer-panel" style={{ width: `${100 - editorWidth}%` }}>
          <Visualizer
            result={result}
            currentStep={currentStep}
            onStepChange={handleStepChange}
            onLineSelect={handleLineSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
