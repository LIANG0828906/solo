import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Keyframe,
  EasingType,
  CubicBezierParams,
  KEYFRAME_COLORS,
  DEFAULT_EASING,
  DEFAULT_BEZIER,
} from './types';
import { useAnimationEngine } from './hooks/useAnimationEngine';
import { Timeline } from './components/Timeline';
import { Preview } from './components/Preview';
import { KeyframeList } from './components/KeyframeList';
import { ControlBar } from './components/ControlBar';
import { ExportPanel } from './components/ExportPanel';
import './styles/app.css';

const DURATION = 2000;

const createDefaultKeyframe = (time: number, index: number): Keyframe => {
  const defaultTransforms = [
    'translate(0px, 0px) rotate(0deg) scale(1)',
    'translate(80px, -50px) rotate(90deg) scale(1.2)',
    'translate(0px, -100px) rotate(180deg) scale(1)',
    'translate(-80px, -50px) rotate(270deg) scale(1.2)',
    'translate(0px, 0px) rotate(360deg) scale(1)',
  ];

  return {
    id: uuidv4(),
    time,
    properties: [
      {
        name: 'transform',
        value: defaultTransforms[index % defaultTransforms.length],
      },
      {
        name: 'opacity',
        value: (1 - (index % 3) * 0.3).toString(),
      },
    ],
    color: KEYFRAME_COLORS[index % KEYFRAME_COLORS.length],
  };
};

const initialKeyframes: Keyframe[] = [
  createDefaultKeyframe(0, 0),
  createDefaultKeyframe(25, 1),
  createDefaultKeyframe(50, 2),
  createDefaultKeyframe(75, 3),
  createDefaultKeyframe(100, 4),
];

const App: React.FC = () => {
  const [keyframes, setKeyframes] = useState<Keyframe[]>(initialKeyframes);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [easingType, setEasingType] = useState<EasingType>(DEFAULT_EASING);
  const [bezierParams, setBezierParams] = useState<CubicBezierParams>(DEFAULT_BEZIER);
  const [showExport, setShowExport] = useState(false);
  const [hoveredFrame, setHoveredFrame] = useState<Keyframe | null>(null);

  const animationEngine = useAnimationEngine({
    keyframes,
    easingType,
    bezierParams,
    duration: DURATION,
  });

  const {
    currentTime,
    isPlaying,
    interpolatedProps,
    togglePlay,
    reset,
    setCurrentTime,
  } = animationEngine;

  const handleAddKeyframe = useCallback(() => {
    const newTime = keyframes.length > 0 ? 50 : 0;
    const newKeyframe: Keyframe = {
      id: uuidv4(),
      time: newTime,
      properties: [
        { name: 'transform', value: 'translate(0px, 0px) rotate(0deg) scale(1)' },
      ],
      color: KEYFRAME_COLORS[keyframes.length % KEYFRAME_COLORS.length],
    };
    setKeyframes((prev) => [...prev, newKeyframe]);
    setSelectedKeyframeId(newKeyframe.id);
  }, [keyframes.length]);

  const handleDeleteKeyframe = useCallback((id: string) => {
    setKeyframes((prev) => prev.filter((k) => k.id !== id));
    if (selectedKeyframeId === id) {
      setSelectedKeyframeId(null);
    }
  }, [selectedKeyframeId]);

  const handleUpdateKeyframe = useCallback(
    (id: string, updates: Partial<Keyframe>) => {
      setKeyframes((prev) =>
        prev.map((k) => (k.id === id ? { ...k, ...updates } : k))
      );
    },
    []
  );

  const handleKeyframeDrag = useCallback((id: string, newTime: number) => {
    setKeyframes((prev) =>
      prev.map((k) => (k.id === id ? { ...k, time: newTime } : k))
    );
  }, []);

  const handleTimeClick = useCallback(
    (time: number) => {
      setCurrentTime(time);
    },
    [setCurrentTime]
  );

  const handleEasingChange = useCallback((newEasing: EasingType) => {
    setEasingType(newEasing);
    reset();
  }, [reset]);

  const handleExport = useCallback(() => {
    setShowExport((prev) => !prev);
  }, []);

  const handleCurrentFrameChange = useCallback((frame: Keyframe | null) => {
    setHoveredFrame(frame);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎬 CSS 动画关键帧编辑器</h1>
      </header>

      <div className="app-main">
        <aside className="left-panel">
          <KeyframeList
            keyframes={keyframes}
            selectedKeyframeId={selectedKeyframeId}
            onAddKeyframe={handleAddKeyframe}
            onSelectKeyframe={setSelectedKeyframeId}
            onDeleteKeyframe={handleDeleteKeyframe}
            onUpdateKeyframe={handleUpdateKeyframe}
          />
        </aside>

        <main className="center-panel">
          <Timeline
            keyframes={keyframes}
            currentTime={currentTime}
            selectedKeyframeId={selectedKeyframeId}
            onKeyframeClick={setSelectedKeyframeId}
            onKeyframeDrag={handleKeyframeDrag}
            onTimeClick={handleTimeClick}
            easingType={easingType}
            bezierParams={bezierParams}
          />

          <ControlBar
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={DURATION}
            onPlayPause={togglePlay}
            onReset={reset}
            easingType={easingType}
            onEasingChange={handleEasingChange}
            bezierParams={bezierParams}
            onBezierChange={setBezierParams}
            onExport={handleExport}
          />
        </main>

        <aside className="right-panel">
          <div className="panel-header">
            <span className="panel-title">动画预览</span>
          </div>
          <Preview
            interpolatedProps={interpolatedProps}
            keyframes={keyframes}
            currentTime={currentTime}
            onCurrentFrameChange={handleCurrentFrameChange}
          />
          {showExport && (
            <ExportPanel
              keyframes={keyframes}
              easingType={easingType}
              bezierParams={bezierParams}
              duration={DURATION}
            />
          )}
          {hoveredFrame && (
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div className="form-label" style={{ marginBottom: '8px' }}>
                当前关键帧属性
              </div>
              {hoveredFrame.properties.map((prop, idx) => (
                <div key={idx} className="tooltip-property">
                  <span>{prop.name}:</span>
                  <span>{prop.value}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default App;
