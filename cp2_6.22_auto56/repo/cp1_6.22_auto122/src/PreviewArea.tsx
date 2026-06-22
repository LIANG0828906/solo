import type { Token } from './types';

interface PreviewAreaProps {
  tokens: Token[];
}

function getTokenValue(tokens: Token[], name: string, defaultValue: string): string {
  const token = tokens.find((t) => t.name === name);
  return token ? token.value : defaultValue;
}

export default function PreviewArea({ tokens }: PreviewAreaProps) {
  const primaryColor = getTokenValue(tokens, 'primary', '#6366F1');
  const secondaryColor = getTokenValue(tokens, 'secondary', '#8B5CF6');
  const backgroundColor = getTokenValue(tokens, 'background', '#2A2A3E');
  const textColor = getTokenValue(tokens, 'text', '#E0E0F0');
  const borderColor = getTokenValue(tokens, 'border', '#3A3A4E');
  const successColor = getTokenValue(tokens, 'success', '#10B981');

  const spacingXs = parseInt(getTokenValue(tokens, 'xs', '4'), 10);
  const spacingSm = parseInt(getTokenValue(tokens, 'sm', '8'), 10);
  const spacingMd = parseInt(getTokenValue(tokens, 'md', '16'), 10);
  const spacingLg = parseInt(getTokenValue(tokens, 'lg', '24'), 10);

  const fontFamily = getTokenValue(tokens, 'fontFamily', 'system-ui');
  const fontSize = parseInt(getTokenValue(tokens, 'fontSize', '16'), 10);

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#2A2A3E',
        borderRadius: '12px',
        border: '1px solid #3A3A4E',
        minHeight: '100%',
        fontFamily,
      }}
    >
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#E0E0F0',
          marginBottom: '24px',
        }}
      >
        组件预览
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            padding: `${spacingLg}px`,
            backgroundColor: 'rgba(30, 30, 46, 0.5)',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#707080',
              marginBottom: `${spacingMd}px`,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            实心按钮
          </div>
          <button
            style={{
              padding: `${spacingSm}px ${spacingMd}px`,
              backgroundColor: primaryColor,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: `${fontSize}px`,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = secondaryColor;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${primaryColor}40`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = primaryColor;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            主要按钮
          </button>
        </div>

        <div
          style={{
            padding: `${spacingLg}px`,
            backgroundColor: 'rgba(30, 30, 46, 0.5)',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#707080',
              marginBottom: `${spacingMd}px`,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            卡片容器
          </div>
          <div
            style={{
              backgroundColor,
              padding: `${spacingLg}px`,
              borderRadius: '12px',
              border: `1px solid ${borderColor}`,
              boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3)`,
              transition: 'all 0.3s ease',
            }}
          >
            <h3
              style={{
                color: textColor,
                fontSize: `${fontSize + 4}px`,
                fontWeight: 600,
                marginBottom: `${spacingSm}px`,
                transition: 'all 0.3s ease',
              }}
            >
              卡片标题
            </h3>
            <p
              style={{
                color: '#A0A0B0',
                fontSize: `${fontSize - 2}px`,
                lineHeight: 1.6,
                transition: 'all 0.3s ease',
              }}
            >
              这是一个使用设计令牌样式的卡片组件。背景色、圆角、边框和阴影都由令牌控制。
            </p>
            <div
              style={{
                marginTop: `${spacingMd}px`,
                display: 'flex',
                gap: `${spacingSm}px`,
              }}
            >
              <span
                style={{
                  padding: `${spacingXs}px ${spacingSm}px`,
                  backgroundColor: `${successColor}20`,
                  color: successColor,
                  borderRadius: '4px',
                  fontSize: `${fontSize - 4}px`,
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                }}
              >
                标签 1
              </span>
              <span
                style={{
                  padding: `${spacingXs}px ${spacingSm}px`,
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                  borderRadius: '4px',
                  fontSize: `${fontSize - 4}px`,
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                }}
              >
                标签 2
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: `${spacingLg}px`,
            backgroundColor: 'rgba(30, 30, 46, 0.5)',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#707080',
              marginBottom: `${spacingMd}px`,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            标题文本
          </div>
          <h1
            style={{
              color: textColor,
              fontSize: `${fontSize + 16}px`,
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: `${spacingSm}px`,
              transition: 'all 0.3s ease',
            }}
          >
            这是一个大标题
          </h1>
          <h2
            style={{
              color: '#A0A0B0',
              fontSize: `${fontSize + 6}px`,
              fontWeight: 500,
              lineHeight: 1.5,
              transition: 'all 0.3s ease',
            }}
          >
            副标题使用稍小的字号和较浅的颜色
          </h2>
          <p
            style={{
              color: '#808090',
              fontSize: `${fontSize}px`,
              lineHeight: 1.7,
              marginTop: `${spacingMd}px`,
              transition: 'all 0.3s ease',
            }}
          >
            正文文本使用基础字号。字体族和字号都由设计令牌控制，修改令牌后所有文本样式会立即更新。
          </p>
        </div>

        <div
          style={{
            padding: `${spacingLg}px`,
            backgroundColor: 'rgba(30, 30, 46, 0.5)',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#707080',
              marginBottom: `${spacingMd}px`,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            边框输入框
          </div>
          <div style={{ marginBottom: `${spacingMd}px` }}>
            <label
              style={{
                display: 'block',
                fontSize: `${fontSize - 2}px`,
                color: '#A0A0B0',
                marginBottom: `${spacingXs}px`,
                transition: 'all 0.3s ease',
              }}
            >
              用户名
            </label>
            <input
              type="text"
              placeholder="请输入用户名"
              style={{
                width: '100%',
                padding: `${spacingSm}px ${spacingMd}px`,
                backgroundColor: '#1E1E2E',
                border: `2px solid ${borderColor}`,
                borderRadius: '8px',
                color: textColor,
                fontSize: `${fontSize}px`,
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = borderColor;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: `${fontSize - 2}px`,
                color: '#A0A0B0',
                marginBottom: `${spacingXs}px`,
                transition: 'all 0.3s ease',
              }}
            >
              密码
            </label>
            <input
              type="password"
              placeholder="请输入密码"
              style={{
                width: '100%',
                padding: `${spacingSm}px ${spacingMd}px`,
                backgroundColor: '#1E1E2E',
                border: `2px solid ${borderColor}`,
                borderRadius: '8px',
                color: textColor,
                fontSize: `${fontSize}px`,
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = borderColor;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
