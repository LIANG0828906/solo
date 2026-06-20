import { useState, useEffect, useRef, useMemo } from 'react';
import { useBatchStore } from '@/stores/batchStore';
import { postTasteNote, listPublicBatches } from '@/api/communityApi';
import type { PublicBatch } from '@/types';

interface FlavorCategory {
  name: string;
  color: string;
  subFlavors: string[];
}

const CATEGORY_COUNT = 12;
const startColor = { r: 0xff, g: 0xd7, b: 0x00 };
const endColor = { r: 0x8b, g: 0x45, b: 0x13 };

const hexColor = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

const gradientColors = Array.from({ length: CATEGORY_COUNT }, (_, i) => {
  const t = i / (CATEGORY_COUNT - 1);
  return hexColor(
    startColor.r + (endColor.r - startColor.r) * t,
    startColor.g + (endColor.g - startColor.g) * t,
    startColor.b + (endColor.b - startColor.b) * t,
  );
});

const FLAVOR_CATEGORIES: FlavorCategory[] = [
  { name: '花香', color: gradientColors[0], subFlavors: ['茉莉', '玫瑰', '橙花', '薰衣草', '洋甘菊', '百合'] },
  { name: '果香', color: gradientColors[1], subFlavors: ['草莓', '蓝莓', '柑橘', '苹果', '桃子', '樱桃'] },
  { name: '甜香', color: gradientColors[2], subFlavors: ['蜂蜜', '焦糖', '红糖', '枫糖', '香草', '棉花糖'] },
  { name: '坚果', color: gradientColors[3], subFlavors: ['杏仁', '榛子', '核桃', '花生', '腰果', '开心果'] },
  { name: '巧克力', color: gradientColors[4], subFlavors: ['黑巧克力', '牛奶巧克力', '可可', '摩卡', '白巧克力'] },
  { name: '焦糖', color: gradientColors[5], subFlavors: ['太妃糖', '焦香', '枫糖', '黄油', '烤榛子'] },
  { name: '香料', color: gradientColors[6], subFlavors: ['肉桂', '丁香', '胡椒', '姜', '豆蔻', '八角'] },
  { name: '草本', color: gradientColors[7], subFlavors: ['绿茶', '红茶', '薄荷', '艾草', '青草', '乌龙'] },
  { name: '酒香', color: gradientColors[8], subFlavors: ['红酒', '白酒', '白兰地', '雪莉', '威士忌'] },
  { name: '木质', color: gradientColors[9], subFlavors: ['雪松', '檀香', '松木', '橡木', '檀木'] },
  { name: '泥土', color: gradientColors[10], subFlavors: ['土壤', '蘑菇', '松露', '苔藓', '湿木'] },
  { name: '发酵', color: gradientColors[11], subFlavors: ['酸奶', '芝士', '酵母', '酱油', '味噌'] },
];

const WHEEL_RADIUS = 200;
const SEGMENT_INNER_RADIUS = 70;
const HOVER_SCALE = 1.2;
const PETAL_RADIUS = 280;
const PETAL_DOT_RADIUS = 18;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSector(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
) {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

export default function TasteWheel() {
  const { selectedFlavors, addFlavor, removeFlavor } = useBatchStore();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [batches, setBatches] = useState<PublicBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | ''>('');
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });
  const [panelAnimating, setPanelAnimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const tagContainerRef = useRef<HTMLDivElement>(null);

  const cx = WHEEL_RADIUS + 40;
  const cy = WHEEL_RADIUS + 40;
  const svgSize = (WHEEL_RADIUS + 40) * 2;
  const anglePerSegment = 360 / CATEGORY_COUNT;

  useEffect(() => {
    listPublicBatches({ page_size: 50 })
      .then((res) => setBatches(res.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCategory !== null) {
      setPanelAnimating(true);
      const t = setTimeout(() => setPanelAnimating(false), 500);
      return () => clearTimeout(t);
    }
  }, [selectedCategory]);

  const sortedSubFlavors = useMemo(() => {
    if (selectedCategory === null) return [];
    return [...FLAVOR_CATEGORIES[selectedCategory].subFlavors].sort((a, b) =>
      a.localeCompare(b, 'zh-CN'),
    );
  }, [selectedCategory]);

  const selectedBatchName = useMemo(() => {
    const b = batches.find((x) => x.id === selectedBatchId);
    return b ? `${b.bean_type} · ${b.roast_level}烘焙` : '当前批次';
  }, [batches, selectedBatchId]);

  const handleSubmit = async () => {
    if (selectedFlavors.length === 0) return;
    if (selectedBatchId === '') {
      setToast({ message: '请先选择要关联的烘焙批次', visible: true });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
      return;
    }
    try {
      setSubmitting(true);
      const grouped: Record<string, string[]> = {};
      selectedFlavors.forEach((f) => {
        if (!grouped[f.category]) grouped[f.category] = [];
        grouped[f.category].push(f.subFlavor);
      });
      for (const [cat, subs] of Object.entries(grouped)) {
        await postTasteNote({
          batch_id: selectedBatchId as number,
          category: cat,
          sub_flavors: subs,
        });
      }
      setToast({
        message: `🎉 已为【${selectedBatchName}】添加${selectedFlavors.length}个风味标签`,
        visible: true,
      });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
      useBatchStore.getState().resetBatch();
    } catch {
      setToast({ message: '提交失败，请稍后重试', visible: true });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
    } finally {
      setSubmitting(false);
    }
  };

  const scrollTags = (direction: 'left' | 'right') => {
    const el = tagContainerRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -160 : 160;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const isFlavorSelected = (cat: string, sub: string) =>
    selectedFlavors.some((f) => f.category === cat && f.subFlavor === sub);

  const categorySelectedCount = (idx: number) =>
    selectedFlavors.filter((f) => f.category === FLAVOR_CATEGORIES[idx].name).length;

  return (
    <div className="taste-page">
      <div className="taste-header">
        <h1>风味品鉴</h1>
        <p>选择关联批次：</p>
        <select
          className="batch-select"
          value={selectedBatchId}
          onChange={(e) => setSelectedBatchId(e.target.value === '' ? '' : Number(e.target.value))}
        >
          <option value="">请选择烘焙批次...</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              #{b.id} {b.bean_type} · {b.roast_level}烘焙
            </option>
          ))}
        </select>
      </div>

      <div className="taste-content">
        <div className="taste-wheel-wrapper">
          <div className="taste-wheel-container">
            <svg
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              width="100%"
              height="100%"
              className="taste-wheel-svg"
            >
              <defs>
                <radialGradient id="wheelBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F5E6D0" stopOpacity="1" />
                  <stop offset="100%" stopColor="#E8C99B" stopOpacity="0.6" />
                </radialGradient>
                <filter id="wheelGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle cx={cx} cy={cy} r={WHEEL_RADIUS + 8} fill="url(#wheelBg)" filter="url(#wheelGlow)" />
              <circle cx={cx} cy={cy} r={WHEEL_RADIUS + 4} fill="none" stroke="#C4A882" strokeWidth="2" />

              {FLAVOR_CATEGORIES.map((cat, i) => {
                const startAngle = i * anglePerSegment;
                const endAngle = (i + 1) * anglePerSegment;
                const midAngle = (startAngle + endAngle) / 2;
                const isHovered = hoveredIndex === i;
                const isSelected = selectedCategory === i;
                const scale = isHovered ? HOVER_SCALE : 1;
                const outerR = WHEEL_RADIUS * scale;
                const innerR = SEGMENT_INNER_RADIUS;
                const path = describeSector(cx, cy, innerR, outerR, startAngle + 1, endAngle - 1);
                const labelPos = polarToCartesian(cx, cy, (innerR + outerR) / 2, midAngle);

                return (
                  <g
                    key={cat.name}
                    className={`wheel-segment ${isHovered ? 'is-hovered' : ''} ${
                      isSelected ? 'is-selected' : ''
                    }`}
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => setSelectedCategory(selectedCategory === i ? null : i)}
                  >
                    <path
                      d={path}
                      fill={cat.color}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      opacity={isHovered || isSelected ? 1 : 0.88}
                      style={{
                        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="700"
                      style={{
                        pointerEvents: 'none',
                        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        transform: isHovered ? `rotate(${midAngle}deg)` : `rotate(${midAngle}deg)`,
                        transformOrigin: `${labelPos.x}px ${labelPos.y}px`,
                        writingMode: 'horizontal-tb',
                      }}
                    >
                      {cat.name}
                    </text>

                    {categorySelectedCount(i) > 0 && (() => {
                      const badgePos = polarToCartesian(cx, cy, outerR - 18, midAngle);
                      return (
                        <g style={{ pointerEvents: 'none' }}>
                          <circle cx={badgePos.x} cy={badgePos.y} r="12" fill="#4A2C2A" stroke="#FFF" strokeWidth="2" />
                          <text x={badgePos.x} y={badgePos.y} textAnchor="middle" dominantBaseline="middle"
                            fill="#FFF" fontSize="11" fontWeight="700">
                            {categorySelectedCount(i)}
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}

              <circle cx={cx} cy={cy} r={SEGMENT_INNER_RADIUS - 2} fill="#FFF8F0" stroke="#C4A882" strokeWidth="2" />
              <text x={cx} y={cy - 10} textAnchor="middle" fill="#4A2C2A" fontSize="18" fontWeight="700">
                风味轮
              </text>
              <text x={cx} y={cy + 14} textAnchor="middle" fill="#8B6914" fontSize="12">
                {selectedFlavors.length} 项已选
              </text>

              {hoveredIndex !== null && (() => {
                const cat = FLAVOR_CATEGORIES[hoveredIndex];
                const startAngle = hoveredIndex * anglePerSegment;
                const endAngle = (hoveredIndex + 1) * anglePerSegment;
                const subs = cat.subFlavors;
                const petalStep = (endAngle - startAngle) / (subs.length + 1);
                return (
                  <g className="petal-group" style={{ pointerEvents: 'none' }}>
                    {subs.map((sub, si) => {
                      const ang = startAngle + petalStep * (si + 1);
                      const pos = polarToCartesian(cx, cy, PETAL_RADIUS, ang);
                      const selected = isFlavorSelected(cat.name, sub);
                      return (
                        <g key={sub}>
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={PETAL_DOT_RADIUS}
                            fill={cat.color}
                            opacity={selected ? 1 : 0.65}
                            stroke={selected ? '#4A2C2A' : '#FFF'}
                            strokeWidth={selected ? '2.5' : '2'}
                            style={{
                              animation: `petal-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${si * 0.03}s both`,
                            }}
                          />
                          <text
                            x={pos.x}
                            y={pos.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={selected ? '#FFF' : '#4A2C2A'}
                            fontSize="9"
                            fontWeight="600"
                            style={{ pointerEvents: 'none' }}
                          >
                            {sub.length > 2 ? sub.slice(0, 2) : sub}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="wheel-legend">
            <p className="legend-hint">
              {hoveredIndex !== null
                ? `${FLAVOR_CATEGORIES[hoveredIndex].name}：将鼠标移到外圈花瓣可快速预览二级风味`
                : '提示：悬停扇形区域查看二级风味，点击展开面板选择'}
            </p>
          </div>
        </div>

        <div
          className={`sub-flavor-panel ${selectedCategory !== null ? 'is-open' : ''} ${
            panelAnimating ? 'is-animating' : ''
          }`}
        >
          {selectedCategory !== null && (
            <div className="panel-inner">
              <div className="panel-header">
                <span
                  className="panel-color-swatch"
                  style={{ backgroundColor: FLAVOR_CATEGORIES[selectedCategory].color }}
                />
                <h3>{FLAVOR_CATEGORIES[selectedCategory].name}</h3>
                <button
                  className="panel-close"
                  onClick={() => setSelectedCategory(null)}
                  aria-label="关闭"
                >
                  ×
                </button>
              </div>
              <p className="panel-subtitle">已选 {categorySelectedCount(selectedCategory)} 项</p>
              <div className="sub-flavor-list">
                {sortedSubFlavors.map((sub) => {
                  const cat = FLAVOR_CATEGORIES[selectedCategory].name;
                  const sel = isFlavorSelected(cat, sub);
                  return (
                    <button
                      key={sub}
                      className={`sub-flavor-item ${sel ? 'is-selected' : ''}`}
                      onClick={() =>
                        sel ? removeFlavor(cat, sub) : addFlavor(cat, sub)
                      }
                    >
                      <span
                        className="sub-color-dot"
                        style={{
                          backgroundColor: FLAVOR_CATEGORIES[selectedCategory].color,
                          opacity: sel ? 1 : 0.55,
                        }}
                      />
                      <span className="sub-label">{sub}</span>
                      {sel && <span className="sub-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="taste-notes-section">
        <h2>品鉴笔记</h2>
        <div className="tags-scroll-wrapper">
          <button className="scroll-arrow scroll-left" onClick={() => scrollTags('left')} aria-label="向左滚动">
            ‹
          </button>
          <div className="tags-scroll-container" ref={tagContainerRef}>
            {selectedFlavors.length === 0 ? (
              <div className="tags-empty">还没有选择风味，点击上方风味轮盘开始品鉴吧</div>
            ) : (
              selectedFlavors.map((f, i) => {
                const catData = FLAVOR_CATEGORIES.find((c) => c.name === f.category);
                return (
                  <span
                    key={`${f.category}-${f.subFlavor}-${i}`}
                    className="flavor-tag"
                    style={{
                      borderColor: catData?.color || '#C4A882',
                      backgroundColor: `${catData?.color || '#F4A460'}22`,
                    }}
                  >
                    <span
                      className="tag-color-dot"
                      style={{ backgroundColor: catData?.color || '#F4A460' }}
                    />
                    {f.category} · {f.subFlavor}
                    <button
                      className="tag-remove"
                      onClick={() => removeFlavor(f.category, f.subFlavor)}
                      aria-label="删除"
                    >
                      ×
                    </button>
                  </span>
                );
              })
            )}
          </div>
          <button className="scroll-arrow scroll-right" onClick={() => scrollTags('right')} aria-label="向右滚动">
            ›
          </button>
        </div>

        <div className="submit-row">
          <span className="flavor-count">共 {selectedFlavors.length} 个风味标签</span>
          <button
            className="btn-primary submit-btn"
            onClick={handleSubmit}
            disabled={submitting || selectedFlavors.length === 0}
          >
            {submitting ? '提交中...' : '提交品鉴笔记'}
          </button>
        </div>
      </div>

      <div className={`toast ${toast.visible ? 'toast-visible' : ''}`}>
        {toast.message}
      </div>
    </div>
  );
}
