import { useEffect, useRef, useState, useCallback } from 'react';
import { ExecutionStep, ExecutionResult } from '../code-executor/Executor';
import './Visualizer.css';

interface VisualizerProps {
  result: ExecutionResult | null;
  currentStep: number;
  onStepChange: (step: number) => void;
  onLineSelect: (line: number) => void;
}

const PLAY_INTERVAL = 800;

export default function Visualizer({
  result,
  currentStep,
  onStepChange,
  onLineSelect,
}: VisualizerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playIntervalRef = useRef<number | null>(null);

  const steps = result?.steps || [];
  const totalSteps = steps.length;
  const hasError = !!result?.error;

  useEffect(() => {
    if (hasError) {
      setErrorVisible(true);
    }
  }, [hasError]);

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = window.setInterval(() => {
        onStepChange(currentStep + 1);
      }, PLAY_INTERVAL);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, currentStep, onStepChange]);

  useEffect(() => {
    if (isPlaying && currentStep >= totalSteps - 1) {
      setIsPlaying(false);
    }
  }, [currentStep, totalSteps, isPlaying]);

  useEffect(() => {
    if (timelineRef.current) {
      const activeNode = timelineRef.current.querySelector(`[data-step="${currentStep}"]`);
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentStep]);

  const handleButtonPress = useCallback((button: string, action: () => void) => {
    setPressedButton(button);
    action();
    setTimeout(() => setPressedButton(null), 200);
  }, []);

  const handlePlay = () => {
    if (currentStep >= totalSteps - 1) {
      onStepChange(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    if (currentStep < totalSteps - 1) {
      onStepChange(currentStep + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepClick = (step: number, line: number) => {
    onStepChange(step);
    onLineSelect(line);
  };

  const closeError = () => {
    setErrorVisible(false);
  };

  const currentStepData = steps[currentStep];
  const displayStep = currentStep + 1;

  return (
    <div className="visualizer-container">
      <div className="visualizer-header">
        <div className="step-counter">
          步骤 <span className="step-number">{totalSteps > 0 ? displayStep : 0}</span>
          <span className="step-separator">/</span>
          <span className="step-total">{totalSteps}</span>
        </div>
        <div className="progress-bar-container">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`progress-segment ${idx <= currentStep ? 'completed' : ''} ${idx === currentStep ? 'current' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="timeline-container scrollbar" ref={timelineRef}>
        {steps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">▶</div>
            <p className="empty-text">点击"运行"按钮开始执行代码</p>
            <p className="empty-hint">执行过程将在这里逐步展示</p>
          </div>
        ) : (
          <div className="timeline">
            {steps.map((step, idx) => (
              <TimelineNode
                key={idx}
                step={step}
                index={idx}
                isActive={idx === currentStep}
                isPast={idx < currentStep}
                onClick={() => handleStepClick(idx, step.line)}
                flashVars={idx === currentStep}
              />
            ))}
          </div>
        )}
      </div>

      {errorVisible && result?.error && (
        <div className="error-card" style={{ animation: 'fadeIn 200ms ease-in-out' }}>
          <div className="error-header">
            <span className="error-type">{result.error.type}</span>
            <button className="error-close" onClick={closeError}>×</button>
          </div>
          <div className="error-message">{result.error.message}</div>
          <div className="error-line">位置: 第 {result.error.line} 行</div>
        </div>
      )}

      <div className="control-bar">
        <div className="controls">
          <button
            className={`control-btn ${pressedButton === 'back' ? 'pressed' : ''}`}
            onClick={() => handleButtonPress('back', handleStepBackward)}
            disabled={currentStep <= 0 || totalSteps === 0}
            title="单步后退"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" />
            </svg>
          </button>

          {isPlaying ? (
            <button
              className={`control-btn play-btn ${pressedButton === 'pause' ? 'pressed' : ''}`}
              onClick={() => handleButtonPress('pause', handlePause)}
              disabled={totalSteps === 0}
              title="暂停"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </button>
          ) : (
            <button
              className={`control-btn play-btn ${pressedButton === 'play' ? 'pressed' : ''}`}
              onClick={() => handleButtonPress('play', handlePlay)}
              disabled={totalSteps === 0}
              title="播放"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
          )}

          <button
            className={`control-btn ${pressedButton === 'forward' ? 'pressed' : ''}`}
            onClick={() => handleButtonPress('forward', handleStepForward)}
            disabled={currentStep >= totalSteps - 1 || totalSteps === 0}
            title="单步前进"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>
        </div>

        {currentStepData && (
          <div className="current-description">
            {currentStepData.description}
          </div>
        )}
      </div>
    </div>
  );
}

interface TimelineNodeProps {
  step: ExecutionStep;
  index: number;
  isActive: boolean;
  isPast: boolean;
  onClick: () => void;
  flashVars: boolean;
}

function TimelineNode({ step, index, isActive, isPast, onClick, flashVars }: TimelineNodeProps) {
  const changedVars = step.variables.filter(v => step.changedVariables.includes(v.name));

  return (
    <div
      className={`timeline-node ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
      data-step={index}
      onClick={onClick}
    >
      <div className="timeline-node-left">
        <div className={`timeline-dot ${isActive ? 'active-dot' : ''}`}>
          <div className="timeline-dot-inner" />
        </div>
        <div className="timeline-line" />
      </div>

      <div className={`timeline-node-content ${isActive ? 'active-content' : ''}`}>
        <div className="timeline-header">
          <span className="line-label">L{step.line}</span>
          <span className="step-index">#{index + 1}</span>
        </div>

        {changedVars.length > 0 && (
          <div className="variables-list">
            {changedVars.map((v) => (
              <div
                key={v.name}
                className={`variable-item ${flashVars ? 'flash' : ''}`}
              >
                <span className="var-name">{v.name}</span>
                <span className="var-separator">=</span>
                <span className="var-value" title={v.type}>
                  {v.value}
                </span>
                <span className="var-type">{v.type}</span>
              </div>
            ))}
          </div>
        )}

        {changedVars.length === 0 && (
          <div className="no-change">
            <span className="description-text">{step.description}</span>
          </div>
        )}
      </div>
    </div>
  );
}
