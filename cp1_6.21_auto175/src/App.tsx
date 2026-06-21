import { useRef, useState, useCallback, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { THEMES, FONTS, type FontId } from './themes';
import { Card } from './Card';

const DEFAULT_CODE = `// 欢迎使用代码截图美化器 ✨
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(\`Fibonacci(10) = \${result}\`);

interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

function filterUsers(list: User[], query: string): User[] {
  return list.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  );
}

const found = filterUsers(users, 'ali');
console.log(found);`;

export default function App() {
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [themeId, setThemeId] = useState<string>('monokai');
  const [fontId, setFontId] = useState<FontId>('fira-code');
  const [lineHeight, setLineHeight] = useState<number>(1.6);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const theme = useMemo(() => {
    return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  }, [themeId]);

  const font = useMemo(() => {
    return FONTS.find((f) => f.id === fontId) ?? FONTS[0];
  }, [fontId]);

  const handleExport = useCallback(async () => {
    if (!cardRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: theme.previewBg,
        style: {
          transform: 'none',
          margin: '40px',
        },
      });

      const base64Data = dataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      saveAs(blob, `code-screenshot-${theme.id}-${timestamp}.png`);
    } catch (err) {
      console.error('导出图片失败:', err);
      alert('导出图片失败，请重试。');
    } finally {
      setTimeout(() => setIsExporting(false), 200);
    }
  }, [theme.id, theme.previewBg]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  }, []);

  const handleTextareaKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newValue);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  }, [code]);

  const lineCount = useMemo(() => code.split('\n').length, [code]);
  const charCount = code.length;

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 32px',
        gap: 24,
        color: '#E2E8F0',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1400,
          height: 60,
          backgroundColor: '#1E293B',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
              color: 'white',
            }}
          >
            {'</>'}
          </div>
          <span
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: '#F1F5F9',
              whiteSpace: 'nowrap',
            }}
          >
            代码截图美化器
          </span>
        </div>

        <div
          style={{
            height: 32,
            width: 1,
            backgroundColor: '#334155',
            flexShrink: 0,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 13,
              color: '#94A3B8',
              whiteSpace: 'nowrap',
              marginRight: 4,
            }}
          >
            主题
          </span>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setThemeId(t.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border:
                  themeId === t.id
                    ? `1.5px solid ${t.colors.accent}`
                    : '1.5px solid #334155',
                backgroundColor: themeId === t.id ? t.colors.headerBackground : 'transparent',
                color: themeId === t.id ? t.colors.text : '#94A3B8',
                fontSize: 13,
                fontWeight: themeId === t.id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                boxShadow: themeId === t.id ? `0 0 0 3px ${t.colors.accent}20` : 'none',
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div
          style={{
            height: 32,
            width: 1,
            backgroundColor: '#334155',
            flexShrink: 0,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 13,
              color: '#94A3B8',
              whiteSpace: 'nowrap',
              marginRight: 4,
            }}
          >
            字体
          </span>
          <select
            value={fontId}
            onChange={(e) => setFontId(e.target.value as FontId)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1.5px solid #334155',
              backgroundColor: '#0F172A',
              color: '#E2E8F0',
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              fontFamily: font.value,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id} style={{ fontFamily: f.value }}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            height: 32,
            width: 1,
            backgroundColor: '#334155',
            flexShrink: 0,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 13,
              color: '#94A3B8',
              whiteSpace: 'nowrap',
            }}
          >
            行高
          </span>
          <input
            type="range"
            min="1.2"
            max="2.4"
            step="0.1"
            value={lineHeight}
            onChange={(e) => setLineHeight(parseFloat(e.target.value))}
            style={{
              width: 80,
              cursor: 'pointer',
              accentColor: '#3B82F6',
            }}
          />
          <span
            style={{
              fontSize: 13,
              color: '#CBD5E1',
              minWidth: 30,
              textAlign: 'center',
              fontFamily: 'monospace',
            }}
          >
            {lineHeight.toFixed(1)}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: '1px solid #60A5FA',
            background: isExporting
              ? '#3B82F6'
              : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: isExporting ? 'not-allowed' : 'pointer',
            opacity: isExporting ? 0.8 : 1,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            transform: isExporting ? 'translateY(0)' : 'translateY(0)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (!isExporting) {
              e.currentTarget.style.background =
                'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)';
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow =
                '0 8px 20px rgba(59, 130, 246, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isExporting) {
              e.currentTarget.style.background =
                'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isExporting ? (
              <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 12 12"
                  to="360 12 12"
                  dur="0.8s"
                  repeatCount="indefinite"
                />
              </circle>
            ) : (
              <>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </>
            )}
          </svg>
          {isExporting ? '导出中...' : '导出 PNG'}
        </button>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 1400,
          display: 'flex',
          gap: 20,
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            width: '60%',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 4px',
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              代码输入
            </span>
            <span
              style={{
                fontSize: 12,
                color: '#64748B',
                fontFamily: 'monospace',
              }}
            >
              {lineCount} 行 · {charCount} 字符
            </span>
          </div>

          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleTextareaChange}
            onKeyDown={handleTextareaKeyDown}
            placeholder="在这里粘贴你的代码..."
            spellCheck={false}
            style={{
              flex: 1,
              minHeight: 400,
              padding: 16,
              borderRadius: 8,
              backgroundColor: '#1E293B',
              color: 'white',
              fontSize: 14,
              lineHeight: 1.5,
              fontFamily: font.value,
              border: '1.5px solid transparent',
              resize: 'none',
              outline: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              overflowX: 'auto',
              tabSize: 2,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3B82F6';
              e.currentTarget.style.boxShadow =
                '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(59, 130, 246, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
          />
        </div>

        <div
          style={{
            width: '40%',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 4px',
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              实时预览
            </span>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 400,
              padding: 20,
              borderRadius: 12,
              backgroundColor: theme.previewBg,
              transition: 'background-color 0.4s ease',
              overflow: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <Card
              ref={cardRef}
              code={code}
              theme={theme}
              fontFamily={font.value}
              lineHeight={lineHeight}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 12,
          color: '#475569',
          paddingTop: 8,
          display: 'flex',
          gap: 16,
        }}
      >
        <span>提示: 按 Tab 键可快速缩进</span>
        <span>·</span>
        <span>支持 500 行以内代码快速渲染</span>
        <span>·</span>
        <span>导出图片为 2x 高清分辨率</span>
      </div>
    </div>
  );
}
