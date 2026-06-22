import React, { useMemo } from 'react';
import { RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { useEmotionStore } from '../store/emotionStore';
import { EMOTION_COLORS } from '../utils/colors';

interface ControlPanelProps {
  isMobile?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const selectJoy = (state: { joy: number }) => state.joy;
const selectSadness = (state: { sadness: number }) => state.sadness;
const selectAnger = (state: { anger: number }) => state.anger;
const selectCalm = (state: { calm: number }) => state.calm;
const selectSetJoy = (state: { setJoy: (v: number) => void }) => state.setJoy;
const selectSetSadness = (state: { setSadness: (v: number) => void }) => state.setSadness;
const selectSetAnger = (state: { setAnger: (v: number) => void }) => state.setAnger;
const selectSetCalm = (state: { setCalm: (v: number) => void }) => state.setCalm;
const selectReset = (state: { reset: () => void }) => state.reset;
const selectGetActivity = (state: { getActivityLevel: () => number }) => state.getActivityLevel;

const ControlPanel: React.FC<ControlPanelProps> = ({
  isMobile = false,
  isExpanded = true,
  onToggleExpand,
}) => {
  const joy = useEmotionStore(selectJoy);
  const sadness = useEmotionStore(selectSadness);
  const anger = useEmotionStore(selectAnger);
  const calm = useEmotionStore(selectCalm);
  const setJoy = useEmotionStore(selectSetJoy);
  const setSadness = useEmotionStore(selectSetSadness);
  const setAnger = useEmotionStore(selectSetAnger);
  const setCalm = useEmotionStore(selectSetCalm);
  const reset = useEmotionStore(selectReset);
  const getActivityLevel = useEmotionStore(selectGetActivity);

  const activity = getActivityLevel();

  const radarData = useMemo(
    () => [joy, sadness, anger, calm, activity],
    [joy, sadness, anger, calm, activity]
  );

  const emotions = [
    { key: 'joy', label: '快乐', value: joy, setValue: setJoy, color: EMOTION_COLORS.joy },
    { key: 'sadness', label: '悲伤', value: sadness, setValue: setSadness, color: EMOTION_COLORS.sadness },
    { key: 'anger', label: '愤怒', value: anger, setValue: setAnger, color: EMOTION_COLORS.anger },
    { key: 'calm', label: '平静', value: calm, setValue: setCalm, color: EMOTION_COLORS.calm },
  ];

  const radarLabels = ['快乐', '悲伤', '愤怒', '平静', '活跃度'];

  return (
    <div
      className={`control-panel ${isMobile ? 'mobile' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}
    >
      {isMobile && (
        <button className="expand-toggle" onClick={onToggleExpand}>
          {isExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
        </button>
      )}

      <div className="panel-content">
        <h2 className="panel-title">情感控制</h2>

        <div className="emotion-sliders">
          {emotions.map((emotion) => (
            <div key={emotion.key} className="slider-group">
              <div className="slider-label">
                <span className="emotion-name">{emotion.label}</span>
                <span className="emotion-value">{Math.round(emotion.value)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={emotion.value}
                onChange={(e) => emotion.setValue(Number(e.target.value))}
                className="emotion-slider"
                style={{
                  '--slider-color': emotion.color,
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>

        <div className="radar-chart-container">
          <svg viewBox="-120 -120 240 240" className="radar-chart">
            {[...Array(5)].map((_, i) => (
              <polygon
                key={`grid-${i}`}
                points={getPolygonPoints((i + 1) * 20, 5)}
                className="radar-grid"
              />
            ))}

            {[...Array(5)].map((_, i) => {
              const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
              const x = Math.cos(angle) * 100;
              const y = Math.sin(angle) * 100;
              return (
                <line
                  key={`axis-${i}`}
                  x1="0"
                  y1="0"
                  x2={x}
                  y2={y}
                  className="radar-axis"
                />
              );
            })}

            {radarLabels.map((label, i) => {
              const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
              const x = Math.cos(angle) * 110;
              const y = Math.sin(angle) * 110;
              return (
                <text
                  key={`label-${i}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="radar-label"
                >
                  {label}
                </text>
              );
            })}

            <polygon
              points={getDataPoints(radarData, 5)}
              className="radar-data"
            />

            {radarData.map((value, i) => {
              const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
              const radius = (value / 100) * 100;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return <circle key={`point-${i}`} cx={x} cy={y} r="4" className="radar-point" />;
            })}
          </svg>
        </div>

        <button className="reset-button" onClick={reset}>
          <RotateCcw size={16} />
          <span>重置</span>
        </button>
      </div>
    </div>
  );
};

function getPolygonPoints(radius: number, sides: number): string {
  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

function getDataPoints(data: number[], sides: number): string {
  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const radius = (data[i] / 100) * 100;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

export default ControlPanel;
