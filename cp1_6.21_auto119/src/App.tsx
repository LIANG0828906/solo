import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { highlightCode, Language } from './CodeParser';
import { captureScreenshot } from './ScreenshotRenderer';

interface ThemeConfig {
  id: string;
  name: string;
  background: string;
  keywordColor: string;
  toolbarColor: string;
  accentColor: string;
  isDark: boolean;
}

interface HistoryRecord {
  id: string;
  fileName: string;
  code: string;
  language: string;
  theme: string;
  thumbnail: string;
  createdAt: string;
}

const DEFAULT_THEMES: ThemeConfig[] = [
  { id: 'dracula', name: 'Dracula', background: '#282A36', keywordColor: '#FF79C6', toolbarColor: '#2D2D2D', accentColor: '#FF79C6', isDark: true },
  { id: 'monokai', name: 'Monokai', background: '#272822', keywordColor: '#F92672', toolbarColor: '#2D2D2D', accentColor: '#F92672', isDark: true },
  { id: 'nord', name: 'Nord', background: '#2E3440', keywordColor: '#88C0D0', toolbarColor: '#2D2D2D', accentColor: '#88C0D0', isDark: true },
  { id: 'solarized-light', name: 'Solarized Light', background: '#FDF6E3', keywordColor: '#859900', toolbarColor: '#EEE8D5', accentColor: '#859900', isDark: false },
];

const LANGUAGE_OPTIONS: { value: Language; label: string; defaultFile: string }[] = [
  { value: 'javascript', label: 'JavaScript', defaultFile: 'untitled.js' },
  { value: 'python', label: 'Python', defaultFile: 'untitled.py' },
  { value: 'html', label: 'HTML/CSS', defaultFile: 'untitled.html' },
];

const DEFAULT_CODE = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function getThemeById(themes: ThemeConfig[], id: string): ThemeConfig {
  return themes.find(t => t.id === id) || themes[0];
}

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState<Language>('javascript');
  const [themeId, setThemeId] = useState('dracula');
  const [fileName, setFileName] = useState('untitled.js');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const themesRef = useRef(DEFAULT_THEMES);

  const currentTheme = getThemeById(themesRef.current, themeId);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    axios.get('/api/presets').then(res => {
      if (res.data && res.data.length > 0) {
        themesRef.current = res.data;
        setThemeId(prev => {
          const exists = res.data.find((t: ThemeConfig) => t.id === prev);
          return exists ? prev : res.data[0].id;
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    axios.get('/api/screenshots').then(res => {
      if (res.data) setHistory(res.data);
    }).catch(() => {});
  }, []);

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    const opt = LANGUAGE_OPTIONS.find(o => o.value === lang);
    if (opt) setFileName(opt.defaultFile);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      const newVal = val.substring(0, start) + '    ' + val.substring(end);
      setCode(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  }, []);

  const highlighted = highlightCode(code, language);
  const lines = code.split('\n');

  const handleCapture = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 500);
    await new Promise(r => setTimeout(r, 1000));
    if (editorRef.current) {
      try {
        await captureScreenshot(editorRef.current, fileName);
        const thumbEl = editorRef.current;
        const { toPng } = await import('html-to-image');
        const thumbnail = await toPng(thumbEl, { pixelRatio: 0.5, backgroundColor: currentTheme.background });
        await axios.post('/api/screenshots', {
          fileName,
          code,
          language,
          theme: themeId,
          thumbnail,
        });
        const res = await axios.get('/api/screenshots');
        if (res.data) setHistory(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    setIsCapturing(false);
  }, [isCapturing, fileName, code, language, themeId, currentTheme.background]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [code]);

  const handleHistoryClick = useCallback((record: HistoryRecord) => {
    setCode(record.code);
    setLanguage(record.language as Language);
    setThemeId(record.theme);
    setFileName(record.fileName);
    if (isMobile) setDrawerOpen(false);
  }, [isMobile]);

  const theme = currentTheme;
  const textColor = theme.isDark ? '#D4D4D4' : '#586E75';
  const lineNumberColor = theme.isDark ? '#858585' : '#A0A0A0';
  const borderColor = theme.isDark ? '#333' : '#D0D0C8';
  const editorBg = theme.isDark ? '#1E1E1E' : '#FDF6E3';

  const editorBlock = (
    <div
      ref={editorRef}
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
      }}
    >
      {showFlash && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#fff',
            opacity: 0.15,
            zIndex: 50,
            pointerEvents: 'none',
            animation: 'flashAnim 0.5s ease-out forwards',
          }}
        />
      )}
      <div
        style={{
          height: 36,
          background: theme.toolbarColor,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          transition: 'background 0.3s ease-in-out',
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F56', cursor: 'default' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E', cursor: 'default' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27C93F', cursor: 'default' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <input
            type="text"
            value={fileName}
            onChange={e => setFileName(e.target.value)}
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: 3,
              color: theme.isDark ? '#CCCCCC' : '#586E75',
              fontSize: 13,
              textAlign: 'center',
              outline: 'none',
              padding: '2px 8px',
              transition: 'border-color 0.2s',
              width: 180,
              fontFamily: 'inherit',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#007ACC'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; }}
          />
        </div>
        <div style={{ width: 68 }} />
      </div>
      <div
        style={{
          background: theme.background,
          transition: 'background 0.3s ease-in-out',
          padding: '16px 0',
          minHeight: 200,
        }}
      >
        <div style={{ display: 'flex' }}>
          <div
            style={{
              width: 40,
              flexShrink: 0,
              borderRight: `1px solid ${borderColor}`,
              paddingRight: 8,
              textAlign: 'right',
              userSelect: 'none',
              padding: '0 8px 0 0',
            }}
          >
            {lines.map((_, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  lineHeight: '1.6',
                  color: lineNumberColor,
                  fontFamily: 'Fira Code, monospace',
                  height: 'calc(14px * 1.6)',
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, overflowX: 'auto', padding: '0 16px' }}>
            <pre
              style={{
                margin: 0,
                fontFamily: 'Fira Code, monospace',
                fontSize: 14,
                lineHeight: '1.6',
                color: textColor,
                background: 'transparent',
                whiteSpace: 'pre',
              }}
              dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes flashAnim {
          0% { opacity: 0.15; }
          100% { opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#1A1A1A', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: isMobile ? 'column' : 'row',
            padding: 20,
            gap: 0,
          }}
        >
          <div style={{ flex: isMobile ? '1 1 auto' : '0 0 70%', maxWidth: isMobile ? '100%' : '70%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {LANGUAGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleLanguageChange(opt.value)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: language === opt.value ? '#007ACC' : '#555',
                    background: language === opt.value ? '#007ACC' : '#2D2D2D',
                    color: language === opt.value ? '#fff' : '#CCCCCC',
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <div style={{ width: 1, height: 24, background: '#444', margin: '0 4px' }} />
              {DEFAULT_THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: themeId === t.id ? t.accentColor : '#555',
                    background: themeId === t.id ? t.background : '#2D2D2D',
                    color: themeId === t.id ? t.accentColor : '#CCCCCC',
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', background: editorBg, borderRadius: 8, overflow: 'hidden' }}>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  color: 'transparent',
                  caretColor: theme.isDark ? '#D4D4D4' : '#586E75',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'Fira Code, monospace',
                  fontSize: 14,
                  lineHeight: '1.6',
                  padding: '16px 16px 16px 56px',
                  whiteSpace: 'pre',
                  overflow: 'auto',
                  zIndex: 10,
                  tabSize: 4,
                }}
              />
              <div style={{ pointerEvents: 'none' }}>
                {editorBlock}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center', position: 'relative' }}>
              <button
                onClick={handleCapture}
                disabled={isCapturing}
                style={{
                  width: 140,
                  height: 40,
                  borderRadius: 6,
                  border: 'none',
                  background: isCapturing ? '#005A9E' : '#007ACC',
                  color: '#fff',
                  fontSize: 14,
                  cursor: isCapturing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background 0.2s, box-shadow 0.2s',
                  fontFamily: 'inherit',
                  boxShadow: isCapturing ? '0 4px 12px rgba(0,122,204,0.3)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isCapturing) {
                    e.currentTarget.style.background = '#005A9E';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,122,204,0.3)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isCapturing) {
                    e.currentTarget.style.background = '#007ACC';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {isCapturing ? (
                  <>
                    <span style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    下载PNG
                  </>
                ) : (
                  '生成截图'
                )}
              </button>
              <button
                onClick={handleCopy}
                style={{
                  width: 120,
                  height: 40,
                  borderRadius: 6,
                  border: '1px solid #555',
                  background: '#2D2D2D',
                  color: '#CCCCCC',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#007ACC'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#555'; }}
              >
                复制代码
              </button>
              {copied && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: -28,
                    left: 156 + 16,
                    color: '#4EC9B0',
                    fontSize: 13,
                    animation: 'fadeInUp 0.3s ease-out forwards',
                  }}
                >
                  已复制
                </span>
              )}
            </div>
          </div>

          {!isMobile && (
            <>
              <div style={{ width: 1, background: '#333', flexShrink: 0 }} />
              <div style={{ flex: '0 0 calc(30% - 1px)', background: '#252526', borderRadius: '0 8px 8px 0', padding: 16, overflowY: 'auto', maxHeight: 'calc(100vh - 40px)' }}>
                <h3 style={{ color: '#CCCCCC', fontSize: 14, marginBottom: 12, fontWeight: 600 }}>历史截图</h3>
                {history.length === 0 && (
                  <p style={{ color: '#666', fontSize: 12, textAlign: 'center', marginTop: 40 }}>暂无历史记录</p>
                )}
                {history.map(record => {
                  const recTheme = DEFAULT_THEMES.find(t => t.id === record.theme) || DEFAULT_THEMES[0];
                  return (
                    <div
                      key={record.id}
                      onClick={() => handleHistoryClick(record)}
                      style={{
                        background: '#2A2A2A',
                        borderRadius: 4,
                        padding: 10,
                        marginBottom: 10,
                        cursor: 'pointer',
                        borderLeft: '2px solid transparent',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#333333';
                        e.currentTarget.style.borderLeftColor = recTheme.accentColor;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#2A2A2A';
                        e.currentTarget.style.borderLeftColor = 'transparent';
                      }}
                    >
                      {record.thumbnail && (
                        <img
                          src={record.thumbnail}
                          alt={record.fileName}
                          style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }}
                        />
                      )}
                      <div style={{ color: '#D4D4D4', fontSize: 13, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {record.fileName}
                      </div>
                      <div style={{ color: '#B0B0B0', fontSize: 12 }}>
                        {formatDate(record.createdAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {isMobile && (
          <div style={{ marginTop: 8 }}>
            <div
              onClick={() => setDrawerOpen(!drawerOpen)}
              style={{
                background: '#252526',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: '4px 4px 0 0',
                color: '#CCCCCC',
                fontSize: 13,
              }}
            >
              <span style={{ transform: drawerOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
              历史截图
            </div>
            {drawerOpen && (
              <div style={{ background: '#252526', padding: 12, maxHeight: 300, overflowY: 'auto' }}>
                {history.length === 0 && (
                  <p style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>暂无历史记录</p>
                )}
                {history.map(record => {
                  const recTheme = DEFAULT_THEMES.find(t => t.id === record.theme) || DEFAULT_THEMES[0];
                  return (
                    <div
                      key={record.id}
                      onClick={() => handleHistoryClick(record)}
                      style={{
                        background: '#2A2A2A',
                        borderRadius: 4,
                        padding: 10,
                        marginBottom: 10,
                        cursor: 'pointer',
                        borderLeft: '2px solid transparent',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#333333';
                        e.currentTarget.style.borderLeftColor = recTheme.accentColor;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#2A2A2A';
                        e.currentTarget.style.borderLeftColor = 'transparent';
                      }}
                    >
                      {record.thumbnail && (
                        <img
                          src={record.thumbnail}
                          alt={record.fileName}
                          style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }}
                        />
                      )}
                      <div style={{ color: '#D4D4D4', fontSize: 13, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {record.fileName}
                      </div>
                      <div style={{ color: '#B0B0B0', fontSize: 12 }}>
                        {formatDate(record.createdAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
