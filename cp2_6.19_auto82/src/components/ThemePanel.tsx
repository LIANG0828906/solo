import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  FileJson,
  Copy,
  Search,
  X,
  Palette,
  RefreshCw,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ColorEntry } from '../parser/colorExtractor';
import {
  isValidCssColor,
  parseColor,
  ColorFamily,
  COLOR_FAMILY_LABELS,
  throttle,
  ParsedColor,
} from '../utils/colorUtils';

type SortMode = 'count-desc' | 'count-asc' | 'color-asc' | 'color-desc' | 'name-asc';

interface ColorGroup {
  color: string;
  count: number;
  selectors: string[];
  parsed: ParsedColor | null;
}

interface ThemePanelProps {
  entries: ColorEntry[];
  onReplace: (replacements: { oldColor: string; newColor: string }[]) => void;
  onExport: () => void;
  onExportReport: () => void;
}

export default function ThemePanel({ entries, onReplace, onExport, onExportReport }: ThemePanelProps) {
  const colorGroups = useMemo(() => {
    const map = new Map<string, { count: number; selectors: Set<string> }>();
    for (const entry of entries) {
      const key = entry.color.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { count: 0, selectors: new Set() });
      }
      const g = map.get(key)!;
      g.count++;
      g.selectors.add(entry.selector);
    }
    const arr = Array.from(map.entries()).map(([color, data]) => ({
      color,
      count: data.count,
      selectors: Array.from(data.selectors),
      parsed: parseColor(color),
    }));
    return arr;
  }, [entries]);

  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('count-desc');
  const [familyFilter, setFamilyFilter] = useState<ColorFamily | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [newColors, setNewColors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [batchNewColor, setBatchNewColor] = useState('');
  const [replacing, setReplacing] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  const listRef = useRef<HTMLDivElement>(null);
  const listHeightRef = useRef(0);
  const replaceInProgressRef = useRef(false);
  const ITEM_HEIGHT = 96;

  const toSortMode = (val: string): SortMode => {
    const valid: SortMode[] = ['count-desc', 'count-asc', 'color-asc', 'color-desc', 'name-asc'];
    return valid.includes(val as SortMode) ? (val as SortMode) : 'count-desc';
  };

  const toColorFamily = (key: string): ColorFamily => {
    const valid: ColorFamily[] = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'brown', 'gray', 'white', 'black'];
    return valid.includes(key as ColorFamily) ? (key as ColorFamily) : 'gray';
  };

  const filteredGroups = useMemo(() => {
    let result = colorGroups;

    if (familyFilter !== 'all') {
      result = result.filter(
        (cg) => cg.parsed && cg.parsed.family === familyFilter
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (cg) =>
          cg.color.toLowerCase().includes(q) ||
          cg.parsed?.hex.toLowerCase().includes(q) ||
          cg.selectors.some((s) => s.toLowerCase().includes(q))
      );
    }

    const sorted = [...result];
    switch (sortMode) {
      case 'count-desc':
        sorted.sort((a, b) => b.count - a.count);
        break;
      case 'count-asc':
        sorted.sort((a, b) => a.count - b.count);
        break;
      case 'color-asc':
        sorted.sort((a, b) => {
          const la = a.parsed?.luminance ?? 0;
          const lb = b.parsed?.luminance ?? 0;
          return la - lb;
        });
        break;
      case 'color-desc':
        sorted.sort((a, b) => {
          const la = a.parsed?.luminance ?? 0;
          const lb = b.parsed?.luminance ?? 0;
          return lb - la;
        });
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.color.localeCompare(b.color));
        break;
    }

    return sorted;
  }, [colorGroups, search, sortMode, familyFilter]);

  const totalItems = filteredGroups.length;
  const estimatedTotalHeight = totalItems * ITEM_HEIGHT;

  useEffect(() => {
    if (listHeightRef.current === 0) return;
    const containerHeight = listHeightRef.current;
    const buffer = 4;
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - buffer);
    const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + buffer * 2;
    const end = Math.min(totalItems, start + visibleCount);
    setVisibleRange({ start, end });
  }, [scrollTop, totalItems]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    listHeightRef.current = el.clientHeight;
    setScrollTop(el.scrollTop);
  }, []);

  const checkedColors = useMemo(
    () => Object.entries(checks).filter(([, v]) => v).map(([k]) => k),
    [checks]
  );

  const hasValidReplacements = useMemo(() => {
    if (replacing) return false;
    return checkedColors.some((c) => {
      const nc = newColors[c] || batchNewColor;
      return nc && isValidCssColor(nc.trim());
    });
  }, [checkedColors, newColors, batchNewColor, replacing]);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 2500);
  }, []);

  const toggleCheck = useCallback((color: string) => {
    setChecks((prev) => ({ ...prev, [color]: !prev[color] }));
  }, []);

  const toggleExpand = useCallback((color: string) => {
    setExpanded((prev) => ({ ...prev, [color]: !prev[color] }));
  }, []);

  const handleCopy = useCallback(async (color: string) => {
    const parsed = parseColor(color);
    const hex = parsed?.hex || color;
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      showToast(`已复制 ${hex} 到剪贴板`, 'success');
      setTimeout(() => {
        setCopied((current) => (current === hex ? null : current));
      }, 1200);
    } catch {
      showToast('复制失败，请手动复制', 'error');
    }
  }, [showToast]);

  const selectAll = useCallback(() => {
    const next: Record<string, boolean> = {};
    filteredGroups.forEach((g) => (next[g.color] = true));
    setChecks(next);
  }, [filteredGroups]);

  const clearSelection = useCallback(() => {
    setChecks({});
    setNewColors({});
    setBatchNewColor('');
  }, []);

  const applyReplacements = useCallback(() => {
    if (replaceInProgressRef.current) return;

    const replacements: { oldColor: string; newColor: string }[] = [];
    for (const cg of filteredGroups) {
      if (!checks[cg.color]) continue;
      const newColor = (newColors[cg.color] || batchNewColor).trim();
      if (!newColor || !isValidCssColor(newColor)) continue;
      replacements.push({ oldColor: cg.color, newColor });
    }

    if (replacements.length === 0) {
      showToast('请选择颜色并填写有效的新颜色值', 'error');
      return;
    }

    replaceInProgressRef.current = true;
    setReplacing(true);

    try {
      onReplace(replacements);
      showToast(`已替换 ${replacements.length} 个颜色，依赖图已更新`, 'success');
    } catch (e) {
      showToast('替换失败，请重试', 'error');
    } finally {
      setTimeout(() => {
        replaceInProgressRef.current = false;
        setReplacing(false);
        setChecks({});
        setNewColors({});
        setBatchNewColor('');
      }, 500);
    }
  }, [filteredGroups, checks, newColors, batchNewColor, onReplace, showToast]);

  const throttledApply = useMemo(
    () => throttle(applyReplacements, 1000),
    [applyReplacements]
  );

  const handleExport = useCallback(() => {
    if (exporting) return;
    setExporting(true);
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setExporting(false);
            onExport();
            showToast('CSS 文件导出成功', 'success');
          }, 200);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  }, [exporting, onExport, showToast]);

  const getInputBorderColor = useCallback((val: string) => {
    const v = val.trim();
    if (!v) return '1px solid #444';
    return isValidCssColor(v) ? '1px solid #00c878' : '1px solid #ff6b6b';
  }, []);

  const visibleItems = filteredGroups.slice(visibleRange.start, visibleRange.end);
  const offsetY = visibleRange.start * ITEM_HEIGHT;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={16} style={{ color: '#00bfff' }} />
            <h2 style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#e0e0e0',
              margin: 0,
              fontFamily: '"Outfit", sans-serif',
            }}>
              颜色调色板
            </h2>
            <span style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '10px',
              background: 'rgba(0,191,255,0.15)',
              color: '#00bfff',
            }}>
              {colorGroups.length}
            </span>
          </div>
          {checkedColors.length > 0 && (
            <button
              onClick={clearSelection}
              style={{
                background: 'none',
                border: 'none',
                color: '#777',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = '#ff6b6b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#777';
              }}
            >
              <X size={11} />
              清空 ({checkedColors.length})
            </button>
          )}
        </div>

        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <Search size={13} style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666',
            pointerEvents: 'none',
          }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索颜色值或选择器..."
            style={{
              width: '100%',
              padding: '7px 12px 7px 30px',
              borderRadius: '8px',
              border: '1px solid #333',
              background: 'rgba(0,0,0,0.25)',
              color: '#e0e0e0',
              fontSize: '12px',
              fontFamily: '"Outfit", sans-serif',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#00bfff';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(0,191,255,0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#333';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                padding: '0',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
        }}>
          <button
            onClick={() => setShowFilters((v) => !v)}
            style={{
              flex: 1,
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid #333',
              background: 'rgba(0,0,0,0.2)',
              color: familyFilter !== 'all' ? '#ffd700' : '#ccc',
              cursor: 'pointer',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s',
            }}
          >
            <Filter size={11} />
            {familyFilter === 'all' ? '色系过滤' : COLOR_FAMILY_LABELS[familyFilter].label}
          </button>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(toSortMode(e.target.value))}
            style={{
              flex: 1.5,
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid #333',
              background: 'rgba(0,0,0,0.2)',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '11px',
              outline: 'none',
            }}
          >
            <option value="count-desc">使用次数 (多→少)</option>
            <option value="count-asc">使用次数 (少→多)</option>
            <option value="color-desc">亮度 (亮→暗)</option>
            <option value="color-asc">亮度 (暗→亮)</option>
            <option value="name-asc">名称排序</option>
          </select>
        </div>

        {showFilters && (
          <div style={{
            marginTop: '8px',
            padding: '8px',
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
          }}>
            <button
              onClick={() => { setFamilyFilter('all'); setShowFilters(false); }}
              style={{
                padding: '3px 8px',
                borderRadius: '10px',
                border: familyFilter === 'all' ? '1px solid #00bfff' : '1px solid #444',
                background: familyFilter === 'all' ? 'rgba(0,191,255,0.15)' : 'transparent',
                color: familyFilter === 'all' ? '#00bfff' : '#999',
                cursor: 'pointer',
                fontSize: '10px',
              }}
            >
              全部
            </button>
            {Object.entries(COLOR_FAMILY_LABELS).map(([key, info]) => (
              <button
                key={key}
                onClick={() => { setFamilyFilter(toColorFamily(key)); setShowFilters(false); }}
                style={{
                  padding: '3px 8px',
                  borderRadius: '10px',
                  border: familyFilter === key ? `1px solid ${info.color}` : '1px solid #444',
                  background: familyFilter === key ? `${info.color}22` : 'transparent',
                  color: familyFilter === key ? info.color : '#999',
                  cursor: 'pointer',
                  fontSize: '10px',
                }}
              >
                {info.label}
              </button>
            ))}
          </div>
        )}

        {search && (
          <div style={{ marginTop: '6px', fontSize: '10px', color: '#777' }}>
            找到 {filteredGroups.length} / {colorGroups.length} 个匹配
          </div>
        )}
      </div>

      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 12px 4px 12px',
          position: 'relative',
        }}
      >
        {filteredGroups.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#555',
            fontSize: '13px',
          }}>
            <Search size={24} style={{ opacity: 0.4, marginBottom: '10px' }} />
            <div>{search ? '没有找到匹配的颜色' : '暂无解析出的颜色'}</div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 4px 10px 4px',
            position: 'sticky',
            top: 0,
            background: 'linear-gradient(to bottom, rgba(26,26,46,0.95) 60%, transparent)',
            zIndex: 2,
          }}>
            <button
              onClick={selectAll}
              style={{
                background: 'none',
                border: 'none',
                color: '#00bfff',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '0',
                fontFamily: '"Outfit", sans-serif',
              }}
            >
              全选当前列表
            </button>
            <span style={{ fontSize: '10px', color: '#555' }}>
              {sortMode.includes('count') ? '按使用次数' : sortMode.includes('color') ? '按亮度' : '按名称'}排序
            </span>
          </div>
        )}

        <div
          style={{
            position: 'relative',
            height: estimatedTotalHeight,
          }}
        >
          {visibleItems.map((cg, idx) => {
            const isChecked = !!checks[cg.color];
            const hex = cg.parsed?.hex || cg.color;
            const hasIndividual = !!newColors[cg.color];
            const actualIdx = visibleRange.start + idx;

            return (
              <div
                key={cg.color}
                className="color-item"
                style={{
                  position: 'absolute',
                  top: actualIdx * ITEM_HEIGHT,
                  left: 0,
                  right: 0,
                  padding: '10px 12px',
                  marginBottom: '7px',
                  borderRadius: '10px',
                  background: isChecked
                    ? 'rgba(0,191,255,0.08)'
                    : 'rgba(255,255,255,0.03)',
                  border: isChecked
                    ? '1px solid rgba(0,191,255,0.25)'
                    : '1px solid transparent',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                  height: ITEM_HEIGHT - 7,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: isChecked ? '1px solid #00bfff' : '1px solid #555',
                      background: isChecked ? '#00bfff' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.15s, border-color 0.15s, background 0.15s',
                      transform: isChecked ? 'scale(1.08)' : 'scale(1)',
                    }}>
                      {isChecked && <Check size={11} style={{ color: '#fff' }} />}
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheck(cg.color)}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <div
                    onClick={() => toggleExpand(cg.color)}
                    className="color-swatch"
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '7px',
                      backgroundColor: cg.color,
                      border: '2px solid rgba(255,255,255,0.12)',
                      flexShrink: 0,
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      position: 'relative',
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '12px',
                      fontFamily: '"Fira Code", monospace',
                      color: '#e0e0e0',
                      fontWeight: 500,
                      letterSpacing: '0.3px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <span>{hex}</span>
                      {cg.parsed && familyFilter === 'all' && (
                        <span style={{
                          fontSize: '9px',
                          padding: '1px 5px',
                          borderRadius: '6px',
                          background: `${COLOR_FAMILY_LABELS[cg.parsed.family].color}22`,
                          color: COLOR_FAMILY_LABELS[cg.parsed.family].color,
                          fontFamily: '"Outfit", sans-serif',
                        }}>
                          {COLOR_FAMILY_LABELS[cg.parsed.family].label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: '#777', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '1px 6px',
                        borderRadius: '8px',
                        background: 'rgba(255,215,0,0.08)',
                        color: '#ffd700',
                        fontWeight: 500,
                      }}>
                        ×{cg.count}
                      </span>
                      <span style={{ color: '#555' }}>
                        {cg.selectors.length} 个选择器
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(cg.color)}
                    title={`复制 ${hex}`}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: copied === hex
                        ? 'rgba(0,200,120,0.18)'
                        : 'rgba(255,255,255,0.05)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: copied === hex ? '#00c878' : '#888',
                      transition: 'all 0.15s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (copied !== hex) {
                        e.currentTarget.style.background = 'rgba(0,191,255,0.15)';
                        e.currentTarget.style.color = '#00bfff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (copied !== hex) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = '#888';
                      }
                    }}
                  >
                    {copied === hex ? <Check size={13} /> : <Copy size={12} />}
                  </button>
                </div>

                <div style={{
                  marginTop: '5px',
                  paddingLeft: '36px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '3px',
                }}>
                  {cg.selectors.slice(0, expanded[cg.color] ? undefined : 2).map((s) => (
                    <span key={s} style={{
                      display: 'inline-block',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#aaa',
                      fontSize: '10px',
                      fontFamily: '"Fira Code", monospace',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{s}</span>
                  ))}
                  {cg.selectors.length > 2 && (
                    <button
                      onClick={() => toggleExpand(cg.color)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        fontSize: '10px',
                        padding: '1px 4px',
                        fontFamily: '"Outfit", sans-serif',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '1px',
                      }}
                    >
                      {expanded[cg.color] ? (
                        <>收起 <ChevronUp size={9} /></>
                      ) : (
                        <>更多 +{cg.selectors.length - 2} <ChevronDown size={9} /></>
                      )}
                    </button>
                  )}
                </div>

                {isChecked && (
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    marginTop: '6px',
                    paddingLeft: '36px',
                    alignItems: 'center',
                    animation: 'fadeInUp 0.2s ease',
                  }}>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        backgroundColor: newColors[cg.color] || cg.color,
                        border: '1px solid rgba(255,255,255,0.15)',
                        flexShrink: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={newColors[cg.color] || ''}
                      onChange={(e) => setNewColors((p) => ({ ...p, [cg.color]: e.target.value }))}
                      placeholder="新颜色 # / rgb() / hsl()"
                      style={{
                        flex: 1,
                        padding: '4px 7px',
                        borderRadius: '5px',
                        border: getInputBorderColor(newColors[cg.color] || ''),
                        background: 'rgba(0,0,0,0.3)',
                        color: '#e0e0e0',
                        fontSize: '11px',
                        fontFamily: '"Fira Code", monospace',
                        outline: 'none',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 8px rgba(0,191,255,0.2)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    {hasIndividual && (
                      <span style={{ fontSize: '9px', color: '#888', whiteSpace: 'nowrap' }}>
                        单独设置
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        padding: '12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.25)',
        flexShrink: 0,
      }}>
        {checkedColors.length > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'rgba(255,215,0,0.06)',
            marginBottom: '10px',
            border: '1px solid rgba(255,215,0,0.1)',
          }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              backgroundColor: batchNewColor || 'rgba(255,215,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)',
              flexShrink: 0,
            }} />
            <input
              type="text"
              value={batchNewColor}
              onChange={(e) => setBatchNewColor(e.target.value)}
              placeholder={`统一替换 ${checkedColors.length} 个选中颜色为...`}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: getInputBorderColor(batchNewColor),
                background: 'rgba(0,0,0,0.3)',
                color: '#e0e0e0',
                fontSize: '11px',
                fontFamily: '"Fira Code", monospace',
                outline: 'none',
              }}
            />
          </div>
        )}

        <button
          onClick={throttledApply}
          disabled={!hasValidReplacements}
          style={{
            width: '100%',
            padding: '11px 16px',
            borderRadius: '10px',
            border: 'none',
            background: hasValidReplacements
              ? 'linear-gradient(135deg, rgba(0,191,255,0.4), rgba(0,150,255,0.25))'
              : 'rgba(255,255,255,0.04)',
            color: hasValidReplacements ? '#fff' : '#555',
            cursor: hasValidReplacements ? 'pointer' : 'not-allowed',
            fontSize: '13px',
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 600,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            letterSpacing: '0.3px',
          }}
          onMouseEnter={(e) => {
            if (hasValidReplacements) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,191,255,0.55), rgba(0,150,255,0.4))';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0,191,255,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            if (hasValidReplacements) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,191,255,0.4), rgba(0,150,255,0.25))';
            }
          }}
          onMouseDown={(e) => {
            if (hasValidReplacements) e.currentTarget.style.transform = 'scale(0.96)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <RefreshCw size={14} style={{
            animation: replacing ? 'spin 1s linear infinite' : 'none',
            opacity: replacing ? 0.6 : 1,
          }} />
          {replacing ? '更新中...' : '应用颜色替换'}
          {checkedColors.length > 0 && (
            <span style={{
              padding: '1px 7px',
              borderRadius: '9px',
              background: 'rgba(255,255,255,0.15)',
              fontSize: '11px',
              fontWeight: 500,
            }}>
              {checkedColors.length}
            </span>
          )}
        </button>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              background: exporting ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.05)',
              color: exporting ? '#ffd700' : '#ccc',
              cursor: exporting ? 'wait' : 'pointer',
              fontSize: '12px',
              fontFamily: '"Outfit", sans-serif',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
            onMouseEnter={(e) => {
              if (!exporting) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              if (!exporting) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
          >
            <Download size={12} />
            {exporting ? `${exportProgress}%` : '导出CSS'}
          </button>

          <button
            onClick={onExportReport}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255,255,255,0.05)',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: '"Outfit", sans-serif',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <FileJson size={12} />
            报告JSON
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          position: 'absolute',
          top: '65px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 18px',
          borderRadius: '8px',
          background: message.type === 'success'
            ? 'rgba(0,200,120,0.9)'
            : 'rgba(255,80,80,0.9)',
          color: '#fff',
          fontSize: '12px',
          fontFamily: '"Outfit", sans-serif',
          boxShadow: message.type === 'success'
            ? '0 4px 20px rgba(0,200,120,0.35)'
            : '0 4px 20px rgba(255,80,80,0.35)',
          zIndex: 100,
          animation: 'toastIn 0.3s ease',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          {message.type === 'success' ? (
            <CheckCircle2 size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          {message.text}
        </div>
      )}

      <style>{`
        .color-item:hover .color-swatch {
          transform: scale(1.18);
          box-shadow: 0 0 14px currentColor;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
