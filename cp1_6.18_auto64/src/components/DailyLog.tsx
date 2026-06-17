import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  type Emotion,
  allEmotions,
  emotionColors,
  emotionIcons,
  emotionLabels,
} from '../utils/emotionColors';

const DailyLog: React.FC = () => {
  const addLog = useAppStore((s) => s.addLog);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [text, setText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSubmit = () => {
    if (!selectedEmotion || !text.trim()) return;
    addLog(selectedEmotion, text.trim());
    setSelectedEmotion(null);
    setText('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        width: '320px',
        borderRadius: '16px',
        background: '#1E1E2E',
        border: '1px solid #3A3A5C',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.3)',
        zIndex: 100,
        overflow: 'hidden',
        animation: 'fadeIn 0.4s ease-in-out',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px 0',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#E0E0E0',
            margin: 0,
          }}
        >
          ✨ 记录心情
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: '#8888AA',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
            padding: '4px',
            transition: 'transform 0.3s ease, color 0.2s ease',
            transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#B0B0CC';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#8888AA';
          }}
        >
          ▲
        </button>
      </div>

      {!isCollapsed && (
        <div style={{ padding: '16px 20px 20px' }}>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '14px',
              flexWrap: 'wrap',
            }}
          >
            {allEmotions.map((emotion) => (
              <button
                key={emotion}
                onClick={() => setSelectedEmotion(emotion === selectedEmotion ? null : emotion)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border:
                    selectedEmotion === emotion
                      ? `2px solid ${emotionColors[emotion]}`
                      : '2px solid transparent',
                  background:
                    selectedEmotion === emotion
                      ? `${emotionColors[emotion]}20`
                      : '#2A2A44',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-out',
                  transform: selectedEmotion === emotion ? 'scale(1.08)' : 'scale(1)',
                  minWidth: '52px',
                }}
                onMouseEnter={(e) => {
                  if (selectedEmotion !== emotion) {
                    (e.currentTarget as HTMLElement).style.background = '#35355A';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedEmotion !== emotion) {
                    (e.currentTarget as HTMLElement).style.background = '#2A2A44';
                  }
                }}
              >
                <span style={{ fontSize: '22px', lineHeight: 1 }}>{emotionIcons[emotion]}</span>
                <span
                  style={{
                    fontSize: '11px',
                    color: selectedEmotion === emotion ? emotionColors[emotion] : '#8888AA',
                    fontWeight: selectedEmotion === emotion ? 600 : 400,
                    transition: 'color 0.3s ease',
                  }}
                >
                  {emotionLabels[emotion]}
                </span>
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= 200) setText(e.target.value);
            }}
            placeholder="今天心情怎么样？"
            maxLength={200}
            style={{
              width: '100%',
              height: '80px',
              borderRadius: '10px',
              border: '1px solid #3A3A5C',
              background: '#131528',
              color: '#E0E0E0',
              padding: '12px',
              fontSize: '14px',
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => {
              (e.target as HTMLElement).style.borderColor = '#6B6B9C';
            }}
            onBlur={(e) => {
              (e.target as HTMLElement).style.borderColor = '#3A3A5C';
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '10px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#666688' }}>
              {text.length}/200
            </span>
            <button
              onClick={handleSubmit}
              disabled={!selectedEmotion || !text.trim()}
              style={{
                padding: '8px 24px',
                borderRadius: '10px',
                border: 'none',
                background:
                  selectedEmotion && text.trim()
                    ? emotionColors[selectedEmotion]
                    : '#2A2A44',
                color:
                  selectedEmotion && text.trim() ? '#1A1A2E' : '#666688',
                fontSize: '14px',
                fontWeight: 600,
                cursor:
                  selectedEmotion && text.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                opacity: selectedEmotion && text.trim() ? 1 : 0.6,
              }}
              onMouseEnter={(e) => {
                if (selectedEmotion && text.trim()) {
                  (e.currentTarget as HTMLElement).style.filter = 'brightness(1.2)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.filter = 'brightness(1)';
              }}
            >
              提交
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLog;
