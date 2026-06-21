import React from 'react';
import {
  CivilizationType,
  Civilization,
  ResourceType,
  NegotiationStrategy,
  RESOURCE_NAMES,
  STRATEGY_NAMES,
  CIVILIZATION_NAMES,
  CIVILIZATION_COLORS,
} from '../engine/types';

interface ControlPanelProps {
  civilizations: Record<CivilizationType, Civilization>;
  isRunning: boolean;
  currentRound: number;
  totalRounds: number;
  progress: number;
  onResourceChange: (civId: CivilizationType, resource: ResourceType, value: number) => void;
  onStrategyChange: (civId: CivilizationType, strategy: NegotiationStrategy) => void;
  onStart: () => void;
  onReset: () => void;
  onRandomize: () => void;
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  padding: '20px',
  backgroundColor: '#1a1a2e',
  color: '#e0e0e0',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  height: '100%',
  boxSizing: 'border-box',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#16213e',
  borderRadius: '12px',
  padding: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '14px',
  fontSize: '18px',
  fontWeight: 600,
};

const colorDotStyle = (color: string): React.CSSProperties => ({
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  backgroundColor: color,
  flexShrink: 0,
});

const resourceRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  marginBottom: '10px',
};

const resourceLabelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '13px',
  color: '#b0b0c0',
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: '6px',
  borderRadius: '3px',
  appearance: 'none',
  background: '#0f3460',
  outline: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const strategyContainerStyle: React.CSSProperties = {
  marginTop: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const strategyLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#b0b0c0',
  flexShrink: 0,
};

const selectStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 10px',
  backgroundColor: '#0f3460',
  color: '#e0e0e0',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '6px',
  fontSize: '13px',
  cursor: 'pointer',
  outline: 'none',
};

const buttonsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  marginTop: '8px',
};

const buttonStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  background: 'linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)',
  color: '#e0e0e0',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'transform 0.1s ease, filter 0.1s ease',
};

const buttonHoverStyle: React.CSSProperties = {
  filter: 'brightness(1.1)',
};

const buttonActiveStyle: React.CSSProperties = {
  transform: 'scale(1.02)',
};

const progressContainerStyle: React.CSSProperties = {
  marginBottom: '4px',
};

const progressTextStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '13px',
  color: '#b0b0c0',
  marginBottom: '6px',
};

const progressBarStyle: React.CSSProperties = {
  width: '100%',
  height: '8px',
  backgroundColor: '#16213e',
  borderRadius: '4px',
  overflow: 'hidden',
};

const progressFillStyle = (progress: number): React.CSSProperties => ({
  height: '100%',
  width: `${progress}%`,
  background: 'linear-gradient(90deg, #0f3460 0%, #e94560 100%)',
  borderRadius: '4px',
  transition: 'width 0.3s ease',
});

const civilizationTypes: CivilizationType[] = ['elf', 'dwarf', 'human'];
const resourceTypes: ResourceType[] = ['wood', 'ore', 'food', 'gold'];
const strategyTypes: NegotiationStrategy[] = ['aggressive', 'balanced', 'conservative'];

const ControlPanel: React.FC<ControlPanelProps> = ({
  civilizations,
  isRunning,
  currentRound,
  totalRounds,
  progress,
  onResourceChange,
  onStrategyChange,
  onStart,
  onReset,
  onRandomize,
}) => {
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);
  const [activeButton, setActiveButton] = React.useState<string | null>(null);

  const getButtonStyle = (buttonId: string): React.CSSProperties => {
    let style = { ...buttonStyle };
    if (hoveredButton === buttonId) {
      style = { ...style, ...buttonHoverStyle };
    }
    if (activeButton === buttonId) {
      style = { ...style, ...buttonActiveStyle };
    }
    return style;
  };

  const handleSliderChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    civId: CivilizationType,
    resource: ResourceType
  ) => {
    const value = parseInt(e.target.value, 10);
    onResourceChange(civId, resource, value);
  };

  const handleStrategyChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    civId: CivilizationType
  ) => {
    const strategy = e.target.value as NegotiationStrategy;
    onStrategyChange(civId, strategy);
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ margin: 0, fontSize: '20px', textAlign: 'center' }}>文明贸易谈判</h2>

      <div style={progressContainerStyle}>
        <div style={progressTextStyle}>
          <span>回合进度</span>
          <span>
            {currentRound} / {totalRounds}
          </span>
        </div>
        <div style={progressBarStyle}>
          <div style={progressFillStyle(progress)} />
        </div>
      </div>

      {civilizationTypes.map((civId) => {
        const civ = civilizations[civId];
        return (
          <div key={civId} style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={colorDotStyle(CIVILIZATION_COLORS[civId])} />
              <span>{CIVILIZATION_NAMES[civId]}</span>
            </div>

            {resourceTypes.map((resource) => (
              <div key={resource} style={resourceRowStyle}>
                <div style={resourceLabelStyle}>
                  <span>{RESOURCE_NAMES[resource]}</span>
                  <span>{civ.resources[resource]}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={civ.resources[resource]}
                  onChange={(e) => handleSliderChange(e, civId, resource)}
                  disabled={isRunning}
                  style={{
                    ...sliderStyle,
                    ...{
                      accentColor: CIVILIZATION_COLORS[civId],
                    },
                  }}
                />
              </div>
            ))}

            <div style={strategyContainerStyle}>
              <span style={strategyLabelStyle}>谈判策略</span>
              <select
                value={civ.strategy}
                onChange={(e) => handleStrategyChange(e, civId)}
                disabled={isRunning}
                style={selectStyle}
              >
                {strategyTypes.map((strategy) => (
                  <option key={strategy} value={strategy}>
                    {STRATEGY_NAMES[strategy]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}

      <div style={buttonsContainerStyle}>
        <button
          onMouseEnter={() => setHoveredButton('start')}
          onMouseLeave={() => setHoveredButton(null)}
          onMouseDown={() => setActiveButton('start')}
          onMouseUp={() => setActiveButton(null)}
          onClick={onStart}
          disabled={isRunning}
          style={getButtonStyle('start')}
        >
          {isRunning ? '进行中...' : '开始谈判'}
        </button>
        <button
          onMouseEnter={() => setHoveredButton('reset')}
          onMouseLeave={() => setHoveredButton(null)}
          onMouseDown={() => setActiveButton('reset')}
          onMouseUp={() => setActiveButton(null)}
          onClick={onReset}
          disabled={isRunning}
          style={getButtonStyle('reset')}
        >
          重置
        </button>
        <button
          onMouseEnter={() => setHoveredButton('randomize')}
          onMouseLeave={() => setHoveredButton(null)}
          onMouseDown={() => setActiveButton('randomize')}
          onMouseUp={() => setActiveButton(null)}
          onClick={onRandomize}
          disabled={isRunning}
          style={getButtonStyle('randomize')}
        >
          随机化
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
