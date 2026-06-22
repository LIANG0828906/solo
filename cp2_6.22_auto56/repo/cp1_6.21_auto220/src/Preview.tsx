import { memo, useState } from 'react';
import { ColorTheme } from './types';
import { adjustBrightness, setOpacity } from './themeEngine';

interface PreviewProps {
  theme: ColorTheme;
}

function Preview({ theme }: PreviewProps) {
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);

  const cardBg = adjustBrightness(theme.background, 8);
  const cardBorder = setOpacity(theme.text, 0.1);
  const cardShadow = `0 4px 24px ${setOpacity(theme.primary, 0.15)}`;
  const navBg = theme.secondary;
  const inputBorder = isInputFocused ? theme.primary : setOpacity(theme.text, 0.2);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: theme.background,
        borderRadius: 12,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'background-color 0.2s ease-out',
      }}
    >
      <div
        style={{
          height: 64,
          background: navBg,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          marginBottom: 32,
          gap: 32,
          transition: 'background-color 0.2s ease-out',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: theme.text,
            fontWeight: 600,
            fontSize: 16,
            transition: 'color 0.2s ease-out',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: theme.accent,
              transition: 'background-color 0.2s ease-out',
            }}
          />
          <span>{theme.name || '主题预览'}</span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'center',
          }}
        >
          {['首页', '产品', '文档', '关于'].map((item, idx) => (
            <span
              key={item}
              style={{
                fontSize: 13,
                color: idx === 0 ? theme.accent : theme.text,
                opacity: idx === 0 ? 1 : 0.7,
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
              }}
            >
              {item}
            </span>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: `1px solid ${setOpacity(theme.text, 0.2)}`,
            background: 'transparent',
            color: theme.text,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s ease-out',
          }}
        >
          登录
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: 360,
            width: '100%',
            borderRadius: 16,
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: cardShadow,
            padding: 28,
            transition: 'all 0.2s ease-out',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: setOpacity(theme.primary, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              transition: 'background-color 0.2s ease-out',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: theme.primary,
                transition: 'background-color 0.2s ease-out',
              }}
            />
          </div>

          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: theme.text,
              marginBottom: 8,
              transition: 'color 0.2s ease-out',
            }}
          >
            欢迎使用主题系统
          </h2>
          <p
            style={{
              fontSize: 14,
              color: theme.text,
              opacity: 0.7,
              lineHeight: 1.6,
              marginBottom: 24,
              transition: 'color 0.2s ease-out',
            }}
          >
            通过调整左侧颜色变量，您可以实时预览主题效果。所有组件会立即响应颜色变化。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              type="text"
              placeholder="请输入内容..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: `2px solid ${inputBorder}`,
                background: setOpacity(theme.background, 0.6),
                color: theme.text,
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s ease-out',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: theme.primary,
                  color: theme.text,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    adjustBrightness(theme.primary, -10);
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    'translateY(-1px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    `0 4px 12px ${setOpacity(theme.primary, 0.4)}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    theme.primary;
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    'none';
                }}
              >
                主要按钮
              </button>
              <button
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: `1px solid ${setOpacity(theme.text, 0.2)}`,
                  background: 'transparent',
                  color: theme.text,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    theme.accent;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    theme.accent;
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    setOpacity(theme.text, 0.2);
                  (e.currentTarget as HTMLButtonElement).style.color =
                    theme.text;
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    'translateY(0)';
                }}
              >
                取消
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: `1px solid ${setOpacity(theme.text, 0.1)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: theme.accent,
                transition: 'background-color 0.2s ease-out',
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: theme.text,
                  transition: 'color 0.2s ease-out',
                }}
              >
                主题配色方案
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: theme.text,
                  opacity: 0.6,
                  transition: 'color 0.2s ease-out',
                }}
              >
                实时预览 · 即时生效
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: theme.primary,
                transition: 'background-color 0.2s ease-out',
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginTop: 16,
          flexShrink: 0,
        }}
      >
        {[
          { label: '主色', color: theme.primary },
          { label: '辅色', color: theme.secondary },
          { label: '强调', color: theme.accent },
          { label: '背景', color: theme.background },
          { label: '文字', color: theme.text },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              background: setOpacity(theme.text, 0.05),
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                background: item.color,
                border: `1px solid ${setOpacity(theme.text, 0.2)}`,
                transition: 'background-color 0.2s ease-out',
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: theme.text,
                opacity: 0.7,
                transition: 'color 0.2s ease-out',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(Preview);
