import React, { useMemo } from 'react';
import { EmotionResult } from './EmotionAnalyzer';

interface SpectrumViewProps {
  emotions: EmotionResult[];
}

export default function SpectrumView({ emotions }: SpectrumViewProps) {
  const gradientStops = useMemo(() => {
    if (emotions.length === 0) {
      return 'linear-gradient(to bottom, #E8E0F0, #FAF4F8, #FFF0F5)';
    }
    const uniqueEmotions = emotions.filter(
      (e, i, arr) => arr.findIndex((x) => x.keyword === e.keyword) === i
    );
    if (uniqueEmotions.length === 1) {
      const c = uniqueEmotions[0].color;
      return `linear-gradient(to bottom, ${c}88, ${c}44, #FAF4F8)`;
    }
    const stops = uniqueEmotions.map((e, i) => {
      const pct = (i / (uniqueEmotions.length - 1)) * 100;
      return `${e.color} ${pct}%`;
    });
    return `linear-gradient(to bottom, ${stops.join(', ')})`;
  }, [emotions]);

  const emotionSummary = useMemo(() => {
    const countMap: Record<string, number> = {};
    emotions.forEach((e) => {
      countMap[e.keyword] = (countMap[e.keyword] || 0) + 1;
    });
    return Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [emotions]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: '12px',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: 300,
          color: '#6B5B73',
          textAlign: 'center',
        }}
      >
        情感光谱
      </div>

      <div
        style={{
          flex: 1,
          width: '80px',
          margin: '0 auto',
          borderRadius: '12px',
          background: gradientStops,
          transition: 'background 1.2s ease',
          minHeight: '200px',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
        {emotionSummary.map(([keyword, count]) => {
          const emotion = emotions.find((e) => e.keyword === keyword);
          return (
            <div
              key={keyword}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#6B5B73',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: emotion?.color || '#E8E0F0',
                  flexShrink: 0,
                }}
              />
              <span>{keyword}</span>
              <span style={{ color: '#B0A0B8', marginLeft: 'auto' }}>×{count}</span>
            </div>
          );
        })}
      </div>

      {emotions.length === 0 && (
        <div
          style={{
            fontSize: '12px',
            color: '#B0A0B8',
            textAlign: 'center',
            marginTop: '12px',
          }}
        >
          发送诗行后
          <br />
          光谱将在此呈现
        </div>
      )}
    </div>
  );
}
