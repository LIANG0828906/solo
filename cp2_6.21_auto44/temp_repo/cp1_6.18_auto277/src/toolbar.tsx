import { usePotteryStore, Step } from './store';

export function Toolbar(): JSX.Element {
  const {
    currentStep,
    potteryHeight,
    potteryWeight,
    glazeCoverage,
    isFiring,
    firingProgress,
    setCurrentStep,
    startFiring,
  } = usePotteryStore();

  const stepNames: Record<Step, string> = {
    shaping: '塑形',
    glazing: '施釉',
    firing: '烧制',
  };

  const tools: { step: Step; icon: string }[] = [
    { step: 'shaping', icon: '✋' },
    { step: 'glazing', icon: '🧴' },
    { step: 'firing', icon: '🔥' },
  ];

  const handleToolClick = (step: Step) => {
    if (isFiring) return;
    if (step === 'firing') {
      startFiring();
    } else {
      setCurrentStep(step);
    }
  };

  const handleStepClick = (step: Step) => {
    if (isFiring) return;
    if (step === 'firing') {
      startFiring();
    } else {
      setCurrentStep(step);
    }
  };

  return (
    <>
      <div className="tool-rack">
        {tools.map((tool) => (
          <div
            key={tool.step}
            className={`tool-icon ${currentStep === tool.step ? 'active' : ''}`}
            onClick={() => handleToolClick(tool.step)}
          >
            {tool.icon}
          </div>
        ))}
      </div>

      <div className="step-panel">
        {(['shaping', 'glazing', 'firing'] as Step[]).map((step) => (
          <button
            key={step}
            className={`step-button ${currentStep === step ? 'active' : ''}`}
            onClick={() => handleStepClick(step)}
            disabled={isFiring && step !== 'firing'}
          >
            {step === 'firing' && isFiring
              ? `烧制中 ${Math.round(firingProgress * 100)}%`
              : stepNames[step]}
          </button>
        ))}
        {isFiring && (
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${firingProgress * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="info-panel">
        <div>当前步骤：{stepNames[currentStep]}</div>
        <div>高度：{potteryHeight.toFixed(2)} 单位</div>
        <div>重量：{potteryWeight.toFixed(2)} kg</div>
        <div>施釉覆盖率：{(glazeCoverage * 100).toFixed(0)}%</div>
      </div>

      <style>{`
        .tool-rack {
          position: fixed;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 100;
        }

        .tool-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #333;
          color: #B0B0B0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 20px;
          transition: all 0.2s ease;
        }

        .tool-icon.active {
          background: #8B4513;
          color: #FFE4B5;
        }

        .step-panel {
          position: fixed;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 100;
        }

        .step-button {
          padding: 10px 20px;
          background: #333;
          color: #B0B0B0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .step-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .step-button.active {
          background: #8B4513;
          color: #FFE4B5;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #FF6B35, #FF4500);
          transition: width 0.1s ease;
        }

        .info-panel {
          position: fixed;
          right: 20px;
          bottom: 20px;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          padding: 16px 20px;
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 14px;
          line-height: 1.8;
          z-index: 100;
        }
      `}</style>
    </>
  );
}
