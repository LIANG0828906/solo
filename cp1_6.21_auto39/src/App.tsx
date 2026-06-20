import { useState, useCallback, useEffect, useRef } from 'react';
import type { ColorGroup, ExportFormat } from './types';
import { PRESET_COLORS, isValidHex, normalizeHex } from './utils/colorUtils';
import ColorGrid from './components/ColorGrid';
import TokenPanel from './components/TokenPanel';

interface ToastState {
  message: string;
  id: number;
}

const DEFAULT_HEX = '#6750A4';

export default function App() {
  const [inputHex, setInputHex] = useState(DEFAULT_HEX);
  const [displayHex, setDisplayHex] = useState(DEFAULT_HEX);
  const [validError, setValidError] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('css');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showBackTop, setShowBackTop] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const id = Date.now();
    setToast({ message, id });
    toastTimerRef.current = setTimeout(() => {
      setToast((t) => (t && t.id === id ? null : t));
    }, 2000);
  }, []);

  const fetchPalette = useCallback(async (hex: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/tonal-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hex }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '请求失败');
      }
      setPalette(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '加载失败';
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPalette(DEFAULT_HEX);
  }, [fetchPalette]);

  const tryTriggerFetch = useCallback((rawHex: string) => {
    if (!isValidHex(rawHex)) {
      setValidError('请输入有效的十六进制颜色');
      return;
    }
    setValidError(null);
    const normalized = normalizeHex(rawHex);
    setDisplayHex(normalized);
    fetchPalette(normalized);
  }, [fetchPalette]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputHex(val);
    if (isValidHex(val)) {
      setValidError(null);
      setDisplayHex(normalizeHex(val));
    }
  };

  const handleColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputHex(val);
    setDisplayHex(val);
    setValidError(null);
    fetchPalette(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      tryTriggerFetch(inputHex);
    }
  };

  const handleBlur = () => {
    tryTriggerFetch(inputHex);
  };

  const handlePresetClick = (hex: string) => {
    setInputHex(hex);
    setDisplayHex(hex);
    setValidError(null);
    fetchPalette(hex);
  };

  const handleCopyNotice = useCallback((hex: string) => {
    showToast(`已复制 ${hex}`);
  }, [showToast]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputBgColor = isValidHex(displayHex) ? displayHex : '#E0E0E0';

  return (
    <div className="app-root" ref={mainRef}>
      {toast && (
        <div key={toast.id} className="toast-container">
          <div className="toast">{toast.message}</div>
        </div>
      )}

      <header className="app-header">
        <h1 className="app-title">
          <span className="title-dot" style={{ background: displayHex }} />
          Material Design 3 配色方案生成器
        </h1>
        <p className="app-subtitle">输入主色，快速生成完整 M3 色板与设计 Token</p>
      </header>

      <main className="app-main">
        <section className="left-panel">
          <div className="input-section">
            <div className="input-label">主色输入</div>
            <div className={`input-wrapper ${validError ? 'error' : ''}`}>
              <div className="color-picker-wrap">
                <input
                  type="color"
                  className="color-picker"
                  value={isValidHex(displayHex) ? displayHex : DEFAULT_HEX}
                  onChange={handleColorPicker}
                  aria-label="颜色选择器"
                />
              </div>
              <div
                className="color-preview"
                style={{ backgroundColor: inputBgColor }}
              />
              <input
                type="text"
                className="hex-input"
                value={inputHex}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder="#6750A4"
                spellCheck={false}
                autoComplete="off"
                aria-label="Hex颜色输入"
              />
            </div>
            {validError && <div className="error-text">{validError}</div>}

            <div className="preset-label">预设色板</div>
            <div className="preset-row">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  className="preset-btn"
                  style={{ backgroundColor: preset.hex }}
                  onClick={() => handlePresetClick(preset.hex)}
                  title={`${preset.name} ${preset.hex}`}
                />
              ))}
            </div>
            {fetchError && (
              <div className="error-box">错误：{fetchError}</div>
            )}
          </div>

          <ColorGrid
            palette={palette}
            loading={loading}
            onCopy={handleCopyNotice}
          />
        </section>

        <div className="divider" />

        <section className="right-panel">
          <TokenPanel
            palette={palette}
            format={exportFormat}
            onFormatChange={setExportFormat}
            onCopy={handleCopyNotice}
          />
        </section>
      </main>

      {showBackTop && (
        <button
          type="button"
          className="back-top"
          onClick={scrollToTop}
          aria-label="回到顶部"
        >
          ↑
        </button>
      )}
    </div>
  );
}
