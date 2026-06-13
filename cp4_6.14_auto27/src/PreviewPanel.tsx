import React, { useState } from 'react';
import { ThemeColors } from './utils';

interface PreviewPanelProps {
  colors: ThemeColors;
  derivedHover: string;
  derivedActive: string;
  derivedBorder: string;
  derivedShadow: string;
  derivedDisabled: string;
  derivedSelected: string;
  derivedAccent: string;
  derivedTextSecondary: string;
  derivedBgLight: string;
}

const PreviewPanel = React.memo(function PreviewPanel({
  colors,
  derivedHover,
  derivedActive,
  derivedBorder,
  derivedShadow,
  derivedDisabled,
  derivedSelected,
  derivedAccent,
  derivedTextSecondary,
  derivedBgLight,
}: PreviewPanelProps) {
  const [buttonState, setButtonState] = useState<'default' | 'hover' | 'active'>('default');
  const [inputValue, setInputValue] = useState('');
  const [navActive, setNavActive] = useState(0);

  const transitionStyle = 'background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{
        color: '#e0e0e0',
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 4,
        letterSpacing: '0.5px',
      }}>
        组件预览
      </h3>

      {/* Glassmorphism Card */}
      <div style={{
        padding: 24,
        borderRadius: 16,
        backgroundColor: `${colors.background}cc`,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: `1px solid ${derivedBorder}`,
        boxShadow: `0 8px 32px ${derivedShadow}`,
        transition: transitionStyle,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.primary}20, transparent)`,
          pointerEvents: 'none',
        }} />
        <h4 style={{
          color: colors.text,
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 8,
          transition: transitionStyle,
        }}>
          毛玻璃卡片
        </h4>
        <p style={{
          color: derivedTextSecondary,
          fontSize: 13,
          lineHeight: 1.6,
          marginBottom: 16,
          transition: transitionStyle,
        }}>
          这是一张毛玻璃风格的卡片组件，使用了 backdrop-filter: blur(6px) 和半透明背景色，
          实时应用您选择的配色方案。
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 11,
            backgroundColor: `${colors.primary}25`,
            color: colors.primary,
            transition: transitionStyle,
          }}>
            标签一
          </span>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 11,
            backgroundColor: `${derivedAccent}25`,
            color: derivedAccent,
            transition: transitionStyle,
          }}>
            标签二
          </span>
        </div>
      </div>

      {/* Button */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onMouseEnter={() => setButtonState('hover')}
          onMouseLeave={() => setButtonState('default')}
          onMouseDown={() => setButtonState('active')}
          onMouseUp={() => setButtonState('hover')}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: buttonState === 'active' ? derivedActive
              : buttonState === 'hover' ? derivedHover
              : colors.primary,
            color: colors.text,
            transition: 'background-color 0.4s ease, transform 0.15s ease, box-shadow 0.4s ease',
            transform: buttonState === 'active' ? 'scale(0.96)' : 'scale(1)',
            boxShadow: buttonState === 'hover'
              ? `0 4px 16px ${colors.primary}40`
              : `0 2px 8px ${derivedShadow}`,
          }}
        >
          主按钮
        </button>
        <button style={{
          padding: '10px 24px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          backgroundColor: 'transparent',
          color: colors.primary,
          border: `1.5px solid ${colors.primary}`,
          transition: transitionStyle,
        }}>
          边框按钮
        </button>
        <button style={{
          padding: '10px 24px',
          borderRadius: 8,
          border: 'none',
          fontSize: 14,
          cursor: 'not-allowed',
          backgroundColor: derivedDisabled,
          color: derivedTextSecondary,
          transition: transitionStyle,
        }}>
          禁用按钮
        </button>
      </div>

      {/* Input */}
      <div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="请输入内容..."
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: 8,
            border: `1.5px solid ${derivedBorder}`,
            backgroundColor: derivedBgLight,
            color: colors.text,
            fontSize: 14,
            outline: 'none',
            transition: transitionStyle,
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = colors.primary;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}25`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = derivedBorder;
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Navigation Bar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        height: 48,
        borderRadius: 10,
        backgroundColor: `${colors.background}ee`,
        border: `1px solid ${derivedBorder}`,
        boxShadow: `0 2px 12px ${derivedShadow}`,
        transition: transitionStyle,
        gap: 4,
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: 15,
          color: colors.primary,
          marginRight: 24,
          transition: transitionStyle,
        }}>
          Logo
        </div>
        {['首页', '产品', '关于', '联系'].map((item, idx) => (
          <div
            key={item}
            onClick={() => setNavActive(idx)}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: 13,
              cursor: 'pointer',
              backgroundColor: navActive === idx ? `${derivedSelected}30` : 'transparent',
              color: navActive === idx ? colors.primary : derivedTextSecondary,
              fontWeight: navActive === idx ? 600 : 400,
              transition: transitionStyle,
            }}
          >
            {item}
          </div>
        ))}
      </nav>
    </div>
  );
});

export default PreviewPanel;
