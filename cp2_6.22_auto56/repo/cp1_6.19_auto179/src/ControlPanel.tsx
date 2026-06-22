import { useState } from 'react';
import { EmotionInfo, EmotionKey, ParticleConfig } from './types';
import { getEmotionConfig, parseEmotionInput } from './emotionMapper';

interface ControlPanelProps {
  onEmotionChange: (config: ParticleConfig, emotionKey: EmotionKey) => void;
  currentEmotion: EmotionKey;
}

const emotions: EmotionInfo[] = [
  { key: 'excited', label: '兴奋', color: '#FF6B35' },
  { key: 'calm', label: '平静', color: '#4FC3F7' },
  { key: 'anxious', label: '焦虑', color: '#CE93D8' },
  { key: 'sad', label: '悲伤', color: '#78909C' },
  { key: 'happy', label: '快乐', color: '#FFD54F' },
];

export default function ControlPanel({ onEmotionChange, currentEmotion }: ControlPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [clickedButton, setClickedButton] = useState<EmotionKey | null>(null);

  const handleEmotionClick = (emotion: EmotionInfo) => {
    setClickedButton(emotion.key);
    setTimeout(() => setClickedButton(null), 200);
    const config = getEmotionConfig(emotion.key);
    onEmotionChange(config, emotion.key);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const config = parseEmotionInput(inputValue);
      let matchedEmotion: EmotionKey = 'calm';
      for (const emotion of emotions) {
        const emotionConfig = getEmotionConfig(emotion.key);
        if (emotionConfig.primaryColor === config.primaryColor) {
          matchedEmotion = emotion.key;
          break;
        }
      }
      onEmotionChange(config, matchedEmotion);
    }
  };

  const currentConfig = getEmotionConfig(currentEmotion);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '280px',
    backgroundColor: '#0D1B2ACC',
    borderRadius: '12px',
    padding: '20px',
    zIndex: 100,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  };

  const titleStyle: React.CSSProperties = {
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    textAlign: 'center',
    letterSpacing: '1px',
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'center',
  };

  const buttonStyle = (emotion: EmotionInfo): React.CSSProperties => {
    const isActive = currentEmotion === emotion.key;
    const isClicked = clickedButton === emotion.key;
    return {
      width: '200px',
      height: '44px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      color: '#FFFFFF',
      backgroundColor: emotion.color,
      opacity: isActive ? 1 : 0.85,
      transition: 'transform 0.2s ease-out, opacity 0.2s',
      transform: isClicked ? 'scale(0.95)' : 'scale(1.0)',
      boxShadow: isActive ? `0 0 15px ${emotion.color}80` : 'none',
    };
  };

  const previewBarStyle: React.CSSProperties = {
    width: '200px',
    height: '8px',
    borderRadius: '4px',
    margin: '14px auto 0',
    background: `linear-gradient(90deg, ${currentConfig.primaryColor}, ${currentConfig.secondaryColor})`,
    boxShadow: `0 0 10px ${currentConfig.primaryColor}60`,
    transition: 'background 0.5s ease, box-shadow 0.5s ease',
  };

  const previewLabelStyle: React.CSSProperties = {
    color: '#FFFFFFB0',
    fontSize: '12px',
    textAlign: 'center',
    marginTop: '10px',
    marginBottom: '4px',
  };

  const dividerStyle: React.CSSProperties = {
    height: '1px',
    backgroundColor: '#FFFFFF20',
    margin: '16px 0',
  };

  const inputLabelStyle: React.CSSProperties = {
    color: '#FFFFFFB0',
    fontSize: '12px',
    marginBottom: '8px',
    textAlign: 'center',
  };

  const inputStyle: React.CSSProperties = {
    width: '200px',
    height: '36px',
    borderRadius: '6px',
    border: isFocused ? '2px solid #4FC3F7' : '2px solid transparent',
    backgroundColor: '#FFFFFF',
    padding: '0 12px',
    fontSize: '13px',
    color: '#333333',
    outline: 'none',
    margin: '0 auto',
    display: 'block',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  };

  const hintStyle: React.CSSProperties = {
    color: '#FFFFFF60',
    fontSize: '10px',
    textAlign: 'center',
    marginTop: '6px',
  };

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>情绪选择器</div>
      
      <div style={buttonContainerStyle}>
        {emotions.map((emotion) => (
          <button
            key={emotion.key}
            style={buttonStyle(emotion)}
            onClick={() => handleEmotionClick(emotion)}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
          >
            {emotion.label}
          </button>
        ))}
      </div>

      <div style={previewLabelStyle}>当前情绪色彩</div>
      <div style={previewBarStyle} />

      <div style={dividerStyle} />

      <div style={inputLabelStyle}>自定义情绪关键词</div>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="输入形容词，用逗号分隔"
        style={inputStyle}
      />
      <div style={hintStyle}>按 Enter 应用 · 支持多个关键词</div>
    </div>
  );
}
