import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { HexColorPicker } from 'react-colorful';
import { AiOutlinePlus, AiOutlineClose, AiFillStar, AiOutlineStar, AiOutlineTags, AiFillFileText, AiFillPicture } from 'react-icons/ai';
import { MdColorLens } from 'react-icons/md';
import { usePalette } from './PaletteContext';
import {
  hexToRgb,
  getDominantColor,
  getContrastColor,
  isValidHex,
  normalizeHex,
  generateId,
} from './types';
import { renderScene, sceneNames, sceneIcons } from './PreviewRenderer';
import type { ColorSwatch, SceneType } from './types';

const RIPPLE_KEYS = new Set<string>();

const ColorCard: React.FC<{
  color: ColorSwatch;
  index: number;
  onRemove: () => void;
}> = ({ color, onRemove }) => {
  const rgb = hexToRgb(color.hex);
  const textColor =
    (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 > 150 ? '#1A1A1A' : '#FFFFFF';
  const [rippleKey, setRippleKey] = useState<string>('');

  useEffect(() => {
    if (!RIPPLE_KEYS.has(color.id)) {
      RIPPLE_KEYS.add(color.id);
      setRippleKey(color.id + '-' + Date.now());
    }
  }, [color.id]);

  return (
    <Reorder.Item value={color} className="swatch-card" whileDrag={{ scale: 1.05 }}>
      <motion.div
        className="swatch-color"
        style={{ backgroundColor: color.hex, color: textColor }}
      >
        <AnimatePresence>
          {rippleKey && (
            <motion.span
              key={rippleKey}
              className="swatch-ripple"
              initial={{ width: 0, height: 0, opacity: 0.6 }}
              animate={{ width: 300, height: 300, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                backgroundColor: textColor,
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>
        <button
          className="swatch-delete"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="删除"
          style={{ color: textColor }}
        >
          <AiOutlineClose size={14} />
        </button>
      </motion.div>
      <div className="swatch-info">
        <div className="swatch-hex">{color.hex}</div>
        <div className="swatch-rgb">
          rgb({rgb.r}, {rgb.g}, {rgb.b})
        </div>
      </div>
    </Reorder.Item>
  );
};

const StarRating: React.FC<{
  value: number;
  onChange: (n: number) => void;
}> = ({ value, onChange }) => (
  <div className="star-row star-row-lg">
    {Array.from({ length: 5 }).map((_, i) => {
      const filled = i < value;
      return (
        <motion.button
          key={i}
          className="star-btn"
          whileTap={{ scale: 1.4 }}
          animate={{ scale: filled ? [1, 1.25, 1] : 1 }}
          transition={{ duration: 0.2 }}
          onClick={() => onChange(filled && value === i + 1 ? 0 : i + 1)}
        >
          {filled ? (
            <AiFillStar size={22} color="#F5B301" />
          ) : (
            <AiOutlineStar size={22} color="#C8BEB4" />
          )}
        </motion.button>
      );
    })}
  </div>
);

const SceneTypeList: SceneType[] = ['poster', 'ui', 'illustration'];

const PaletteDetail: React.FC = () => {
  const {
    selectedPalette,
    updateName,
    setRating,
    addTag,
    removeTag,
    addColor,
    removeColor,
    reorderColors,
  } = usePalette();

  const [showPicker, setShowPicker] = useState(false);
  const [pickerColor, setPickerColor] = useState('#FF6B6B');
  const [hexInput, setHexInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [scene, setScene] = useState<SceneType>('poster');
  const [sceneVisible, setSceneVisible] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const [derivedTick, setDerivedTick] = useState(0);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDerivedTick((t) => t + 1), 500);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [selectedPalette?.colors, derivedTick]);

  const { dominant, contrast } = useMemo(() => {
    void derivedTick;
    if (!selectedPalette) return { dominant: '#CCCCCC', contrast: '#FFFFFF' };
    const dom = getDominantColor(selectedPalette.colors);
    return { dominant: dom, contrast: getContrastColor(dom) };
  }, [selectedPalette, derivedTick]);

  if (!selectedPalette) {
    return (
      <div className="detail-empty">
        <MdColorLens size={64} color="#D4C9BE" />
        <h2>请选择或创建一个色板</h2>
        <p>在左侧列表中选择色板，或点击「新建色板」开始创作</p>
      </div>
    );
  }

  const pal = selectedPalette;

  const handleAddHex = () => {
    if (!isValidHex(hexInput)) {
      toast.error('请输入有效的 HEX 颜色（如 #FF6B6B）');
      return;
    }
    if (pal.colors.length >= 10) {
      toast.error('色板最多容纳 10 个色块');
      return;
    }
    addColor(pal.id, hexInput);
    setHexInput('');
    toast.success('色块已添加');
  };

  const handleAddPicker = () => {
    if (pal.colors.length >= 10) {
      toast.error('色板最多容纳 10 个色块');
      return;
    }
    addColor(pal.id, pickerColor);
    toast.success('色块已添加');
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (pal.tags.includes(t)) {
      toast('该标签已存在', { icon: 'ℹ️' });
      return;
    }
    addTag(pal.id, t);
    setTagInput('');
  };

  const handleReorder = (next: ColorSwatch[]) => {
    const fromId = pal.colors.find((c, i) => c.id !== next[i].id);
    if (!fromId) return;
    const fromIdx = pal.colors.findIndex((c) => c.id === fromId.id);
    const toIdx = next.findIndex((c) => c.id === fromId.id);
    if (fromIdx !== -1 && toIdx !== -1) {
      reorderColors(pal.id, fromIdx, toIdx);
    }
  };

  const exportCss = async () => {
    const names = [
      '--color-primary',
      '--color-secondary',
      '--color-tertiary',
      '--color-accent',
      '--color-muted',
      '--color-highlight',
      '--color-surface',
      '--color-border',
      '--color-link',
      '--color-success',
    ];
    const lines = pal.colors
      .map((c, i) => `  ${names[i] || `--color-${i + 1}`}: ${c.hex};`)
      .join('\n');
    const code = `:root {\n  /* ${pal.name} */\n  --color-dominant: ${dominant};\n  --color-contrast: ${contrast};\n${lines}\n}`;
    try {
      await navigator.clipboard.writeText(code);
      toast('CSS 变量代码已复制到剪贴板 🎉', { icon: '✨' });
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

  const exportSvg = async () => {
    const cols = Math.min(pal.colors.length, 5);
    const rows = Math.ceil(pal.colors.length / cols);
    const cardW = 180;
    const cardH = 140;
    const gap = 20;
    const padX = 24;
    const padY = 60;
    const totalW = padX * 2 + cardW * cols + gap * (cols - 1);
    const totalH = padY * 2 + cardH * rows + gap * (rows - 1) + 40;
    const cells = pal.colors.map((c, i) => {
      const r = Math.floor(i / cols);
      const col = i % cols;
      const x = padX + col * (cardW + gap);
      const y = padY + r * (cardH + gap);
      const rgb = hexToRgb(c.hex);
      const textColor =
        (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 > 150 ? '#1A1A1A' : '#FFFFFF';
      return `
  <g>
    <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="12" fill="${c.hex}"/>
    <text x="${x + 16}" y="${y + 28}" font-family="sans-serif" font-size="14" font-weight="700" fill="${textColor}">Color ${i + 1}</text>
    <text x="${x + 16}" y="${y + cardH - 36}" font-family="monospace" font-size="13" font-weight="600" fill="${textColor}">${c.hex}</text>
    <text x="${x + 16}" y="${y + cardH - 16}" font-family="sans-serif" font-size="11" fill="${textColor}" opacity="0.85">rgb(${rgb.r},${rgb.g},${rgb.b})</text>
  </g>`;
    }).join('');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FCF7F0"/>
      <stop offset="100%" stop-color="#F1E6D8"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="${padX}" y="32" font-family="sans-serif" font-size="20" font-weight="700" fill="#3A3028">${pal.name}</text>
  <text x="${padX}" y="52" font-family="sans-serif" font-size="12" fill="#6B5E54">${pal.colors.length} colors</text>
${cells}
  <text x="${padX}" y="${totalH - 18}" font-family="sans-serif" font-size="10" fill="#9A8E84">Generated by Palette Manager</text>
</svg>`;
    try {
      await navigator.clipboard.writeText(svg);
      toast('SVG 色板卡片已复制到剪贴板 🖼️', { icon: '✨' });
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

  return (
    <div className="detail-wrapper">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: '#FFFFFF',
            color: '#3A3028',
            boxShadow: '0 8px 24px rgba(58,48,40,0.15)',
            padding: '12px 18px',
            fontSize: '14px',
          },
        }}
      />

      <div className="derived-colors">
        <motion.div
          key={dominant + derivedTick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="derived-main"
          style={{ backgroundColor: dominant }}
        >
          <div
            className="derived-label"
            style={{
              color:
                (hexToRgb(dominant).r * 299 +
                  hexToRgb(dominant).g * 587 +
                  hexToRgb(dominant).b * 114) /
                    1000 >
                150
                  ? '#1A1A1A'
                  : '#FFFFFF',
            }}
          >
            <div className="derived-title">主色（出现频率最高）</div>
            <div className="derived-hex">{dominant}</div>
          </div>
        </motion.div>
        <div className="derived-divider" />
        <motion.div
          key={contrast + derivedTick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="derived-contrast"
          style={{ backgroundColor: contrast }}
        >
          <div
            className="derived-label"
            style={{
              color:
                (hexToRgb(contrast).r * 299 +
                  hexToRgb(contrast).g * 587 +
                  hexToRgb(contrast).b * 114) /
                    1000 >
                150
                  ? '#1A1A1A'
                  : '#FFFFFF',
            }}
          >
            <div className="derived-title">对比色（色相互补）</div>
            <div className="derived-hex">{contrast}</div>
          </div>
        </motion.div>
      </div>

      <div className="detail-section">
        <div className="detail-header">
          <div className="title-group">
            <input
              className="palette-name-input"
              value={pal.name}
              onChange={(e) => updateName(pal.id, e.target.value)}
            />
            <div className="meta-group">
              <div className="meta-item">
                <AiOutlineTags size={14} /> 标签 · {pal.tags.length}
              </div>
              <div className="meta-item">
                <MdColorLens size={14} /> 色块 · {pal.colors.length}/10
              </div>
            </div>
          </div>
          <div className="rating-group">
            <div className="rating-label">评分</div>
            <StarRating value={pal.rating} onChange={(n) => setRating(pal.id, n)} />
          </div>
        </div>
      </div>

      <div className="detail-section">
        <div className="section-title">
          <span>🎨 色块管理</span>
          <div className="add-color-bar">
            <button
              className="btn-picker"
              onClick={() => setShowPicker((s) => !s)}
            >
              <AiOutlinePlus size={14} /> 拾色器添加
            </button>
            {showPicker && (
              <div className="picker-popup">
                <HexColorPicker
                  color={pickerColor}
                  onChange={setPickerColor}
                />
                <div className="picker-actions">
                  <div className="picker-preview" style={{ backgroundColor: pickerColor }}>
                    <span>{pickerColor.toUpperCase()}</span>
                  </div>
                  <button className="btn-primary-sm" onClick={handleAddPicker}>
                    添加
                  </button>
                </div>
              </div>
            )}
            <div className="hex-input-group">
              <input
                className="hex-input"
                placeholder="#RRGGBB"
                value={hexInput}
                maxLength={7}
                onChange={(e) => {
                  setHexInput(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddHex()}
              />
              <button className="btn-primary-sm" onClick={handleAddHex}>
                添加
              </button>
            </div>
          </div>
        </div>

        {pal.colors.length === 0 ? (
          <div className="empty-switches">
            <div>色板暂无色块</div>
            <p className="sub">使用拾色器或直接输入 HEX 添加颜色</p>
          </div>
        ) : (
          <div className="swatches-grid">
            <Reorder.Group
              as="div"
              axis="x"
              values={pal.colors}
              onReorder={handleReorder}
              className="swatches-flex"
            >
              {pal.colors.map((c, idx) => (
                <ColorCard
                  key={c.id}
                  color={c}
                  index={idx}
                  onRemove={() => removeColor(pal.id, c.id)}
                />
              ))}
            </Reorder.Group>
          </div>
        )}
      </div>

      <div className="detail-section">
        <div className="section-title">
          <span>🏷️ 标签</span>
          <div className="tag-add-bar">
            <input
              className="tag-input"
              placeholder="输入标签后回车添加"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <button className="btn-primary-sm" onClick={handleAddTag}>
              <AiOutlinePlus size={14} />
            </button>
          </div>
        </div>
        <div className="tag-manage">
          {pal.tags.length === 0 ? (
            <div className="empty-tags">暂无标签，添加后可用于筛选</div>
          ) : (
            pal.tags.map((t) => (
              <motion.div
                key={t}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="tag-managed"
              >
                <span>#{t}</span>
                <button
                  className="tag-remove"
                  onClick={() => removeTag(pal.id, t)}
                >
                  <AiOutlineClose size={12} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="detail-section">
        <div className="section-title">
          <span>🔍 场景预览</span>
          <button
            className="btn-preview-toggle"
            onClick={() => setSceneVisible((s) => !s)}
          >
            {sceneVisible ? '关闭预览' : '应用预览'}
          </button>
        </div>
        {sceneVisible && (
          <div className="preview-wrapper">
            <div className="scene-switcher">
              {SceneTypeList.map((s) => (
                <button
                  key={s}
                  className={`scene-btn ${scene === s ? 'active' : ''}`}
                  onClick={() => setScene(s)}
                >
                  <span className="scene-icon">{sceneIcons[s]}</span>
                  <span>{sceneNames[s]}</span>
                </button>
              ))}
            </div>
            <div className="scene-canvas-wrap">
              <AnimatePresence mode="wait">
                <motion.div
                  key={scene + pal.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="scene-canvas"
                >
                  {renderScene({ colors: pal.colors, scene })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <div className="detail-section">
        <div className="section-title">
          <span>📤 导出</span>
        </div>
        <div className="export-buttons">
          <button className="btn-export" onClick={exportCss}>
            <AiFillFileText size={18} />
            <div>
              <div className="export-name">CSS 变量</div>
              <div className="export-desc">复制 :root 变量代码</div>
            </div>
          </button>
          <button className="btn-export" onClick={exportSvg}>
            <AiFillPicture size={18} />
            <div>
              <div className="export-name">SVG 卡片</div>
              <div className="export-desc">复制可编辑的 SVG 色板</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaletteDetail;
