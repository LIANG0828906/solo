import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Color, FilterOptions, HueCategory, SavedScheme, Scheme, SchemeType, SCHEME_TYPE_LABELS } from './types';
import { PaletteManager, hslToHex, hexToHsl } from './ColorPalette';
import { generateScheme } from './SchemeGenerator';
import { PreviewCard } from './PreviewRenderer';

const STORAGE_KEY = 'color-palette-saved-schemes';
const HUE_OPTIONS: { value: HueCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'red', label: '红 0-30°' },
  { value: 'orange', label: '橙 30-60°' },
  { value: 'yellow', label: '黄 60-90°' },
  { value: 'green', label: '绿 90-150°' },
  { value: 'cyan', label: '青 150-190°' },
  { value: 'blue', label: '蓝 190-260°' },
  { value: 'purple', label: '紫 260-330°' },
  { value: 'pink', label: '粉 330-360°' },
];
const SCHEME_TYPES: SchemeType[] = ['complementary', 'analogous', 'triadic', 'split-complementary'];

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getTextColor(bgHex: string): string {
  const r = parseInt(bgHex.slice(1, 3), 16);
  const g = parseInt(bgHex.slice(3, 5), 16);
  const b = parseInt(bgHex.slice(5, 7), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.55 ? '#1F1F2A' : '#FFFFFF';
}

const App: React.FC = () => {
  const paletteManagerRef = useRef<PaletteManager>(new PaletteManager());
  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);

  const [hsl, setHsl] = useState({ h: 210, s: 70, l: 55 });
  const [hexInput, setHexInput] = useState(hslToHex(210, 70, 55));
  const [hexError, setHexError] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>({
    hueCategory: 'all',
    saturation: 'all',
    lightness: 'all',
  });

  const [schemeType, setSchemeType] = useState<SchemeType>('analogous');
  const [currentScheme, setCurrentScheme] = useState<Scheme | null>(null);

  const [savedSchemes, setSavedSchemes] = useState<SavedScheme[]>([]);
  const [saveName, setSaveName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedSchemes(JSON.parse(raw));
    } catch (_err) {
      console.warn('Failed to load saved schemes');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSchemes));
    } catch (_err) {
      console.warn('Failed to save schemes');
    }
  }, [savedSchemes]);

  const paletteColors = useMemo(
    () => paletteManagerRef.current.getColorsWithFilters(filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, paletteManagerRef.current.getColors().length]
  );

  const selectedColorId = paletteManagerRef.current.getSelectedColorId();

  const previewColor = useMemo(() => hslToHex(hsl.h, hsl.s, hsl.l), [hsl]);

  useEffect(() => {
    setHexInput(previewColor);
    setHexError(false);
  }, [previewColor]);

  const regenerateScheme = useCallback(() => {
    const base = paletteManagerRef.current.getSelectedColor();
    if (!base) {
      setCurrentScheme(null);
      return;
    }
    const s = generateScheme(paletteManagerRef.current, schemeType, base.id);
    setCurrentScheme(s);
  }, [schemeType]);

  useEffect(() => {
    regenerateScheme();
  }, [regenerateScheme, paletteManagerRef.current.getSelectedColorId()]);

  const handleHslChange = useCallback(
    (key: 'h' | 's' | 'l', value: number) => {
      setHsl((prev) => {
        const next = { ...prev, [key]: value };
        return next;
      });
    },
    []
  );

  const handleHexChange = useCallback((val: string) => {
    const normalized = val.trim();
    setHexInput(normalized);
    const regex = /^#?[0-9A-Fa-f]{6}$/;
    if (!regex.test(normalized)) {
      setHexError(true);
      return;
    }
    setHexError(false);
    try {
      const hsl = hexToHsl(normalized.startsWith('#') ? normalized : `#${normalized}`);
      setHsl(hsl);
    } catch (_e) {
      setHexError(true);
    }
  }, []);

  const handleAddColor = useCallback(() => {
    paletteManagerRef.current.addColorFromHSL(hsl);
    rerender();
  }, [hsl, rerender]);

  const handleRemoveColor = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      paletteManagerRef.current.removeColor(id);
      rerender();
    },
    [rerender]
  );

  const handleSelectColor = useCallback(
    (id: string) => {
      const current = paletteManagerRef.current.getSelectedColorId();
      paletteManagerRef.current.setSelectedColor(current === id ? null : id);
      rerender();
    },
    [rerender]
  );

  const handleSchemeTypeChange = useCallback((type: SchemeType) => {
    setSchemeType(type);
  }, []);

  const handleSaveScheme = useCallback(() => {
    if (!currentScheme) return;
    const name = saveName.trim() || `方案 ${savedSchemes.length + 1}`;
    const toSave: SavedScheme = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      type: currentScheme.type,
      colors: currentScheme.colors,
      createdAt: Date.now(),
    };
    setSavedSchemes((prev) => [toSave, ...prev]);
    setSaveName('');
  }, [currentScheme, saveName, savedSchemes.length]);

  const handleDeleteSaved = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedSchemes((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleLoadSaved = useCallback((scheme: SavedScheme) => {
    setCurrentScheme({
      ...scheme,
      baseColorId: scheme.colors[0]?.id || '',
    } as Scheme);
    setSchemeType(scheme.type);
  }, []);

  const filteredSaved = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return savedSchemes;
    return savedSchemes.filter((s) => s.name.toLowerCase().includes(q));
  }, [savedSchemes, searchQuery]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <div className="app-title">Palette Studio · 色彩调色板</div>
          <div className="app-subtitle">自定义色板管理 · 和谐配色生成 · 拟物卡片预览</div>
        </div>
      </header>

      <div className="main-layout">
        <div className="panel panel-left">
          <div className="section">
            <div className="section-title">添加颜色</div>
            <div className="color-input-row">
              <div
                className="preview-swatch"
                style={{ backgroundColor: previewColor }}
                title={`HSL(${hsl.h}, ${hsl.s}%, ${hsl.l}%) · ${previewColor}`}
              />
              <div className="sliders-container">
                <div className="slider-row">
                  <span className="slider-label">H</span>
                  <input
                    type="range"
                    className="slider slider-hue"
                    min={0}
                    max={360}
                    value={hsl.h}
                    onChange={(e) => handleHslChange('h', Number(e.target.value))}
                  />
                  <span className="slider-value">{hsl.h}°</span>
                </div>
                <div className="slider-row">
                  <span className="slider-label">S</span>
                  <input
                    type="range"
                    className="slider"
                    min={0}
                    max={100}
                    value={hsl.s}
                    onChange={(e) => handleHslChange('s', Number(e.target.value))}
                    style={{
                      background: `linear-gradient(to right, hsl(${hsl.h}, 0%, 50%), hsl(${hsl.h}, 100%, 50%))`,
                    }}
                  />
                  <span className="slider-value">{hsl.s}%</span>
                </div>
                <div className="slider-row">
                  <span className="slider-label">L</span>
                  <input
                    type="range"
                    className="slider"
                    min={0}
                    max={100}
                    value={hsl.l}
                    onChange={(e) => handleHslChange('l', Number(e.target.value))}
                    style={{
                      background: `linear-gradient(to right, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 50%), hsl(${hsl.h}, ${hsl.s}%, 100%))`,
                    }}
                  />
                  <span className="slider-value">{hsl.l}%</span>
                </div>
              </div>
            </div>
            <div className="hex-input-row">
              <input
                type="text"
                className="hex-input"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#RRGGBB"
                maxLength={7}
                style={{
                  borderColor: hexError ? 'rgba(255,82,82,0.6)' : undefined,
                }}
              />
              <button type="button" className="btn btn-primary" onClick={handleAddColor}>
                + 添加到色板
              </button>
            </div>
            {hexError && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#FF7A7A' }}>
                请输入有效的6位 HEX 颜色值，例如 #FF6BA6
              </div>
            )}
          </div>

          <div className="divider" />

          <div className="section">
            <div className="section-title">筛选与浏览</div>
            <div className="filter-row">
              <div className="filter-group">
                <span className="filter-label">色相</span>
                <select
                  className="select-input"
                  value={filters.hueCategory}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, hueCategory: e.target.value as HueCategory | 'all' }))
                  }
                >
                  {HUE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <span className="filter-label">饱和度</span>
                <div className="segmented">
                  {(['all', 'high', 'low'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`segmented-btn ${filters.saturation === lvl ? `active ${lvl === 'all' ? 'segmented-btn-all' : ''}` : ''}`}
                      onClick={() => setFilters((f) => ({ ...f, saturation: lvl }))}
                    >
                      {lvl === 'all' ? '全部' : lvl === 'high' ? '高 ≥60' : '低 <60'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">明度</span>
                <div className="segmented">
                  {(['all', 'high', 'low'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`segmented-btn ${filters.lightness === lvl ? `active ${lvl === 'all' ? 'segmented-btn-all' : ''}` : ''}`}
                      onClick={() => setFilters((f) => ({ ...f, lightness: lvl }))}
                    >
                      {lvl === 'all' ? '全部' : lvl === 'high' ? '高 ≥60' : '低 <60'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="colors-grid" style={{ marginTop: 14 }}>
              {paletteColors.length === 0 ? (
                <div className="empty-state">
                  暂无颜色
                  <br />
                  请通过上方 HSL 滑块或 HEX 输入添加颜色
                </div>
              ) : (
                paletteColors.map((c: Color) => (
                  <div
                    key={c.id}
                    className={`color-card ${selectedColorId === c.id ? 'selected' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    title={`${c.hex} · HSL(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`}
                    onClick={() => handleSelectColor(c.id)}
                  >
                    <span className="color-card-hex" style={{ color: getTextColor(c.hex) }}>
                      {c.hex.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={(e) => handleRemoveColor(c.id, e)}
                      title="删除颜色"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 14 }} className="info-hint">
              💡 单击色块选中为基准色（选中后边框变深），然后在右侧选择配色模式。
            </div>
          </div>
        </div>

        <div className="panel panel-right">
          <div className="section">
            <div className="section-title">配色模式</div>
            <div className="scheme-mode-group">
              {SCHEME_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`scheme-mode-btn ${schemeType === type ? 'active' : ''}`}
                  onClick={() => handleSchemeTypeChange(type)}
                >
                  {SCHEME_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {currentScheme ? (
              <>
                <div className="scheme-bar">
                  {currentScheme.colors.map((c: Color, i: number) => (
                    <div
                      key={`${c.id}-${i}`}
                      className="scheme-swatch"
                      style={{ backgroundColor: c.hex }}
                      title={c.hex.toUpperCase()}
                    >
                      <span className="scheme-swatch-hex" style={{ color: getTextColor(c.hex) }}>
                        {c.hex.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#8a8aa8', marginBottom: 6 }}>
                  5色 {SCHEME_TYPE_LABELS[currentScheme.type]}配色方案 · 点击色块查看 HEX
                </div>
              </>
            ) : (
              <div className="info-hint" style={{ marginBottom: 8 }}>
                请先在左侧色板中选中一个基准色，系统将自动生成 5 色和谐方案。
              </div>
            )}
          </div>

          <div className="section">
            <div className="section-title">拟物卡片预览</div>
            <div className="preview-container">
              <PreviewCard scheme={currentScheme} />
            </div>
          </div>

          <div className="section scheme-save-section">
            <div className="section-title">保存与管理方案</div>
            <div className="scheme-save-row">
              <input
                type="text"
                className="scheme-save-input"
                placeholder="为此方案命名（可选）"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                disabled={!currentScheme}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveScheme}
                disabled={!currentScheme}
                style={{
                  opacity: !currentScheme ? 0.5 : 1,
                  cursor: !currentScheme ? 'not-allowed' : 'pointer',
                }}
              >
                💾 保存方案
              </button>
            </div>

            <input
              type="text"
              className="search-input"
              placeholder="🔍 搜索已保存方案..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="saved-schemes-grid">
              {filteredSaved.length === 0 ? (
                <div
                  className="empty-state"
                  style={{ gridColumn: '1 / -1', padding: '30px 20px' }}
                >
                  {searchQuery ? '未找到匹配的方案' : '暂无保存的方案'}
                </div>
              ) : (
                filteredSaved.map((s) => (
                  <div
                    key={s.id}
                    className="saved-scheme-card"
                    onClick={() => handleLoadSaved(s)}
                    title={`点击加载：${s.name}`}
                  >
                    <button
                      type="button"
                      className="saved-scheme-delete"
                      onClick={(e) => handleDeleteSaved(s.id, e)}
                      title="删除方案"
                    >
                      ×
                    </button>
                    <div className="saved-scheme-bar">
                      {s.colors.slice(0, 5).map((c, i) => (
                        <div
                          key={`${s.id}-${i}`}
                          style={{ flex: 1, backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                    <div className="saved-scheme-name">{s.name}</div>
                    <div className="saved-scheme-date">
                      {SCHEME_TYPE_LABELS[s.type]} · {formatDate(s.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
