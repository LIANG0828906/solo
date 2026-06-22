import React, { useCallback, useEffect, useState } from 'react';
import ColorPicker from './ui/ColorPicker';
import GradientCanvas from './ui/GradientCanvas';
import GalleryPanel from './ui/GalleryPanel';
import { useGradientStore } from './store/useGradientStore';

const App: React.FC = () => {
  const {
    angle,
    steps,
    historyIndex,
    history,
    setAngle,
    setSteps,
    undo,
    redo,
    saveToHistory,
    addFavorite
  } = useGradientStore();

  const [angleInput, setAngleInput] = useState(angle.toString());
  const [stepsInput, setStepsInput] = useState(steps.toString());
  const [isAngleDragging, setIsAngleDragging] = useState(false);
  const angleKnobRef = React.useRef<HTMLDivElement>(null);
  const savedCss = React.useRef(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    setAngleInput(angle.toString());
  }, [angle]);

  useEffect(() => {
    setStepsInput(steps.toString());
  }, [steps]);

  const handleAngleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value);
      if (!isNaN(value)) {
        setAngle(Math.max(0, Math.min(360, value)));
        setAngleInput(e.target.value);
      }
    },
    [setAngle]
  );

  const handleAngleBlur = useCallback(() => {
    const value = parseInt(angleInput);
    if (!isNaN(value)) {
      const clamped = Math.max(0, Math.min(360, value));
      setAngle(clamped);
      setAngleInput(clamped.toString());
      saveToHistory();
    }
  }, [angleInput, setAngle, saveToHistory]);

  const handleStepsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value);
      if (!isNaN(value)) {
        setSteps(value);
        setStepsInput(e.target.value);
      }
    },
    [setSteps]
  );

  const handleStepsBlur = useCallback(() => {
    const value = parseInt(stepsInput);
    if (!isNaN(value)) {
      const clamped = Math.max(10, Math.min(100, Math.round(value)));
      setSteps(clamped);
      setStepsInput(clamped.toString());
      saveToHistory();
    }
  }, [stepsInput, setSteps, saveToHistory]);

  const handleAngleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      const newAngle = ((angle + delta) % 360 + 360) % 360;
      setAngle(newAngle);
      setAngleInput(newAngle.toString());
      if (!savedCss.current) {
        savedCss.current = false;
        setTimeout(() => {
          saveToHistory();
          savedCss.current = true;
        }, 500);
      }
    },
    [angle, setAngle, saveToHistory]
  );

  const handleAngleKnobMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsAngleDragging(true);
    },
    []
  );

  const handleAngleKnobMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isAngleDragging || !angleKnobRef.current) return;

      const rect = angleKnobRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      let newAngle = Math.round((angleRad * 180) / Math.PI + 90);
      if (newAngle < 0) newAngle += 360;

      setAngle(newAngle);
      setAngleInput(newAngle.toString());
    },
    [isAngleDragging, setAngle]
  );

  const handleAngleKnobMouseUp = useCallback(() => {
    if (isAngleDragging) {
      setIsAngleDragging(false);
      saveToHistory();
    }
  }, [isAngleDragging, saveToHistory]);

  useEffect(() => {
    if (isAngleDragging) {
      window.addEventListener('mousemove', handleAngleKnobMouseMove);
      window.addEventListener('mouseup', handleAngleKnobMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleAngleKnobMouseMove);
      window.removeEventListener('mouseup', handleAngleKnobMouseUp);
    };
  }, [isAngleDragging, handleAngleKnobMouseMove, handleAngleKnobMouseUp]);

  const handleFavorite = useCallback(() => {
    addFavorite();
  }, [addFavorite]);

  return (
    <div className="app">
      <div className="app__sidebar">
        <div className="app__panel">
          <div className="app__title">
            <h1 className="app__title-text">渐变调色盘</h1>
            <p className="app__title-desc">拖拽色标创建精美渐变</p>
          </div>

          <ColorPicker />

          <div className="app__controls">
            <div className="app__control">
              <div className="app__control-label">
                <span className="app__control-title">角度</span>
                <span className="app__control-value">{angle}°</span>
              </div>
              <div
                ref={angleKnobRef}
                className={`angle-knob ${isAngleDragging ? 'angle-knob--dragging' : ''}`}
                onMouseDown={handleAngleKnobMouseDown}
                onWheel={handleAngleWheel}
              >
                <div
                  className="angle-knob__dial"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <div className="angle-knob__arrow">↑</div>
                </div>
                <div className="angle-knob__center" />
              </div>
              <input
                type="range"
                className="app__slider"
                min="0"
                max="360"
                value={angleInput}
                onChange={handleAngleChange}
                onBlur={handleAngleBlur}
              />
              <div className="app__input-row">
                <input
                  type="number"
                  className="app__number-input"
                  value={angleInput}
                  onChange={(e) => setAngleInput(e.target.value)}
                  onBlur={handleAngleBlur}
                  min="0"
                  max="360"
                />
                <span className="app__input-unit">°</span>
              </div>
            </div>

            <div className="app__control">
              <div className="app__control-label">
                <span className="app__control-title">步长</span>
                <span className="app__control-value">{steps}</span>
              </div>
              <input
                type="range"
                className="app__slider"
                min="10"
                max="100"
                value={stepsInput}
                onChange={handleStepsChange}
                onBlur={handleStepsBlur}
              />
              <div className="app__input-row">
                <input
                  type="number"
                  className="app__number-input"
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  onBlur={handleStepsBlur}
                  min="10"
                  max="100"
                />
                <span className="app__input-unit">色</span>
              </div>
            </div>
          </div>

          <button
            className="app__favorite-btn"
            onClick={handleFavorite}
            title="收藏当前渐变"
          >
            <span className="app__favorite-icon">★</span>
            收藏渐变
          </button>
        </div>

        <div className="app__history">
          <button
            className={`app__history-btn ${!canUndo ? 'app__history-btn--disabled' : ''}`}
            onClick={undo}
            disabled={!canUndo}
            title="撤销"
          >
            ← 撤销
          </button>
          <div className="app__history-indicator">
            {historyIndex + 1} / {history.length}
          </div>
          <button
            className={`app__history-btn ${!canRedo ? 'app__history-btn--disabled' : ''}`}
            onClick={redo}
            disabled={!canRedo}
            title="重做"
          >
            重做 →
          </button>
        </div>
      </div>

      <div className="app__main">
        <div className="app__preview">
          <GradientCanvas />
        </div>
        <div className="app__gallery">
          <GalleryPanel />
        </div>
      </div>
    </div>
  );
};

export default App;
