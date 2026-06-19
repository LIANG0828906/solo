import React, { useState, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import { ColorEntry } from '../parser/colorExtractor';

interface ColorGroup {
  color: string;
  count: number;
  selectors: string[];
}

interface ThemePanelProps {
  entries: ColorEntry[];
  onReplace: (replacements: { oldColor: string; newColor: string }[]) => void;
  onExport: () => void;
  onExportReport: () => void;
}

function toHex(color: string): string {
  const c = color.trim().toLowerCase();

  if (c.startsWith('#')) {
    if (c.length === 4) {
      return ('#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]).toUpperCase();
    }
    return c.slice(0, 7).toUpperCase();
  }

  if (c.startsWith('rgb')) {
    const match = c.match(/rgba?\s*\(([^)]+)\)/);
    if (match) {
      const parts = match[1].split(',').map((s) => s.trim());
      const r = parseInt(parts[0], 10);
      const g = parseInt(parts[1], 10);
      const b = parseInt(parts[2], 10);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
      }
    }
  }

  if (c.startsWith('hsl')) {
    return c;
  }

  return c.toUpperCase();
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
    }));
    arr.sort((a, b) => b.count - a.count);
    return arr;
  }, [entries]);

  const [search, setSearch] = useState('');
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [newColors, setNewColors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [batchNewColor, setBatchNewColor] = useState('');

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return colorGroups;
    const q = search.trim().toLowerCase();
    return colorGroups.filter(
      (cg) =>
        cg.color.toLowerCase().includes(q) ||
        cg.selectors.some((s) => s.toLowerCase().includes(q))
    );
  }, [colorGroups, search]);

  const checkedColors = Object.entries(checks)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const hasValidReplacements = checkedColors.some((c) => {
    const nc = newColors[c] || batchNewColor;
    return nc && /^(#[0-9a-fA-F]{3,8}|rgb(a)?\s*\([^)]+\)|hsl(a)?\s*\([^)]+\))$/.test(nc.trim());
  });

  const toggleCheck = useCallback((color: string) => {
    setChecks((prev) => ({ ...prev, [color]: !prev[color] }));
  }, []);

  const toggleExpand = useCallback((color: string) => {
    setExpanded((prev) => ({ ...prev, [color]: !prev[color] }));
  }, []);

  const handleCopy = useCallback(async (color: string) => {
    const hex = toHex(color);
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setMessage('复制失败');
      setTimeout(() => setMessage(''), 2000);
    }
  }, []);

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
    const replacements: { oldColor: string; newColor: string }[] = [];
    for (const cg of colorGroups) {
      if (!checks[cg.color]) continue;
      const newColor = (newColors[cg.color] || batchNewColor).trim();
      if (!newColor) continue;
      if (!/^(#[0-9a-fA-F]{3,8}|rgb(a)?\s*\([^)]+\)|hsl(a)?\s*\([^)]+\))$/.test(newColor)) continue;
      replacements.push({ oldColor: cg.color, newColor });
    }
    if (replacements.length === 0) {
      setMessage('请填写有效的颜色值');
      setTimeout(() => setMessage(''), 2500);
      return;
    }
    onReplace(replacements);
    setChecks({});
    setNewColors({});
    setBatchNewColor('');
    setMessage(`已替换 ${replacements.length} 个颜色，依赖图已实时更新`);
    setTimeout(() => setMessage(''), 3500);
  }, [colorGroups, checks, newColors, batchNewColor, onReplace]);

  const handleExport = useCallback(() => {
    setExporting(true);
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setExporting(false);
          onExport();
          setMessage('导出成功');
          setTimeout(() => setMessage(''), 3000);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  }, [onExport]);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        padding: '16px 16px 12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#ff6b6b'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#777'; }}
            >
              <X size={11} />
              清空 ({checkedColors.length})
            </button>
          )}
        </div>

        <div style={{ position: 'relative' }}>
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

        {search && (
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#777' }}>
            找到 {filteredGroups.length} 个匹配的颜色
          </div>
        )}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 12px 4px 12px',
      }}>
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
            <span style={{ fontSize: '10px', color: '#555' }}>按使用次数排序</span>
          </div>
        )}

        {filteredGroups.map((cg) => {
          const isChecked = !!checks[cg.color];
          const hex = toHex(cg.color);
          const hasIndividual = !!newColors[cg.color];
          const showBatch = isChecked && checkedColors.length > 1 && batchNewColor && !hasIndividual;

          return (
            <div
              key={cg.color}
              className="color-item"
              style={{
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
                  }}>
                    {hex}
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
                  title="复制十六进制值"
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: copied === hex ? 'rgba(0,200,120,0.18)' : 'rgba(255,255,255,0.05)',
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
                marginTop: '7px',
                paddingLeft: '36px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '3px',
              }}>
                {cg.selectors.slice(0, expanded[cg.color] ? undefined : 2).map((s) => (
                  <span key={s} style={{
                    display: 'inline-block',
                    padding: '2px 7px',
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
                      padding: '2px 4px',
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
                  marginTop: '9px',
                  paddingLeft: '36px',
                  alignItems: 'center',
                  animation: 'fadeInUp 0.2s ease',
                }}>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
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
                    placeholder="新颜色 #hex / rgb()"
                    style={{
                      flex: 1,
                      padding: '5px 9px',
                      borderRadius: '6px',
                      border: (() => {
                        const v = newColors[cg.color] || '';
                        if (!v) return '1px solid #444';
                        const ok = /^(#[0-9a-fA-F]{3,8}|rgb(a)?\s*\([^)]+\)|hsl(a)?\s*\([^)]+\))$/.test(v.trim());
                        return ok ? '1px solid #00c878' : '1px solid #ff6b6b';
                      })(),
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
                  {showBatch && (
                    <span style={{ fontSize: '9px', color: '#888', whiteSpace: 'nowrap' }}>
                      或使用统一值
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        padding: '12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.2)',
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
                border: (() => {
                  if (!batchNewColor) return '1px solid #555';
                  const ok = /^(#[0-9a-fA-F]{3,8}|rgb(a)?\s*\([^)]+\)|hsl(a)?\s*\([^)]+\))$/.test(batchNewColor.trim());
                  return ok ? '1px solid #00c878' : '1px solid #ff6b6b';
                })(),
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
          onClick={applyReplacements}
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
          <RefreshCw size={14} />
          应用颜色替换
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
            {exporting ? `下载中 ${exportProgress}%` : '导出CSS'}
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
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 18px',
          borderRadius: '8px',
          background: 'rgba(0,191,255,0.9)',
          color: '#fff',
          fontSize: '12px',
          fontFamily: '"Outfit", sans-serif',
          boxShadow: '0 4px 20px rgba(0,191,255,0.35)',
          zIndex: 100,
          animation: 'toastIn 0.3s ease',
          whiteSpace: 'nowrap',
        }}>
          {message}
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
      `}</style>
    </div>
  );
}
