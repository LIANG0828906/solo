import React, { useState, useEffect, useRef } from 'react';
import { useColorBoardStore } from './store';
import { getContrastRatio, getTemperatureLabel } from './utils/colorUtils';

const PreviewPanel: React.FC = () => {
  const { colors, analysis } = useColorBoardStore();
  const [isFilledHovered, setIsFilledHovered] = useState(false);
  const [isOutlinedHovered, setIsOutlinedHovered] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const prevColorsRef = useRef<string>('');

  useEffect(() => {
    const colorsStr = colors.map((c) => c.color).join(',');
    if (colorsStr !== prevColorsRef.current) {
      setShowAnimation(false);
      const rafId = requestAnimationFrame(() => {
        setShowAnimation(true);
      });
      prevColorsRef.current = colorsStr;
      return () => cancelAnimationFrame(rafId);
    }
  }, [colors]);

  const textColor = (bgColor: string) => {
    return getContrastRatio(bgColor, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#333333';
  };

  const primary = analysis.primary;
  const secondary = analysis.secondary;
  const tempLabel = getTemperatureLabel(analysis.warmCoolIndex);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 20,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: '#333333' }}>搭配预览</div>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          padding: 12,
          transition: 'all 0.3s ease-in-out',
          opacity: showAnimation ? 1 : 0,
          transform: showAnimation ? 'translateY(0)' : 'translateY(-8px)',
        }}
      >
        <div style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>色彩分析</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span>主色：</span>
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                borderRadius: 4,
                backgroundColor: primary,
                border: '1px solid #E5E7EB',
              }}
            />
            <span style={{ fontFamily: 'monospace' }}>{primary}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span>辅色：</span>
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                borderRadius: 4,
                backgroundColor: secondary,
                border: '1px solid #E5E7EB',
              }}
            />
            <span style={{ fontFamily: 'monospace' }}>{secondary}</span>
          </div>
          <div style={{ marginBottom: 6 }}>色相夹角：{analysis.hueAngle}°</div>
          <div style={{ marginBottom: 6 }}>
            冷暖指数：{analysis.warmCoolIndex > 0 ? '+' : ''}
            {analysis.warmCoolIndex}（{tempLabel}）
          </div>
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              background: `linear-gradient(135deg, ${primary}20, ${secondary}20)`,
              borderRadius: 6,
              fontWeight: 600,
              color: '#1F2937',
            }}
          >
            情感标签：{analysis.emotionTag}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>渐变色卡</div>
        <div
          style={{
            width: 200,
            height: 80,
            borderRadius: 12,
            background: `linear-gradient(80deg, ${primary}, ${secondary})`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease-in-out',
            opacity: showAnimation ? 1 : 0,
            transform: showAnimation ? 'translateX(0)' : 'translateX(-12px)',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>按钮样式</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onMouseEnter={() => setIsFilledHovered(true)}
            onMouseLeave={() => setIsFilledHovered(false)}
            style={{
              width: 120,
              height: 40,
              borderRadius: 6,
              border: isFilledHovered ? `2px solid ${primary}` : 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: isFilledHovered ? textColor(primary) : primary,
              color: isFilledHovered ? primary : textColor(primary),
              transition: 'all 0.2s ease',
              transitionTimingFunction: 'ease',
            }}
          >
            填充按钮
          </button>
          <button
            onMouseEnter={() => setIsOutlinedHovered(true)}
            onMouseLeave={() => setIsOutlinedHovered(false)}
            style={{
              width: 120,
              height: 40,
              borderRadius: 6,
              border: `2px solid ${primary}`,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: isOutlinedHovered ? primary : 'transparent',
              color: isOutlinedHovered ? textColor(primary) : primary,
              transition: 'all 0.2s ease',
              transitionTimingFunction: 'ease',
            }}
          >
            描边按钮
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>卡片组件</div>
        <div
          style={{
            width: 200,
            borderRadius: 16,
            backgroundColor: '#F9FAFB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
            opacity: showAnimation ? 1 : 0,
            transform: showAnimation ? 'scale(1)' : 'scale(0.95)',
          }}
        >
          <div
            style={{
              height: 8,
              backgroundColor: primary,
            }}
          />
          <div style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#1F2937',
                marginBottom: 8,
              }}
            >
              卡片标题
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#6B7280',
                lineHeight: 1.5,
                marginBottom: 12,
              }}
            >
              这是一段示例卡片内容，展示品牌主色在卡片组件中的应用效果。
            </div>
            <div
              style={{
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: 4,
                backgroundColor: `${primary}15`,
                color: primary,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              标签文字
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
