import React, { useState, useMemo, useCallback } from 'react';
import { Download, Check, ChevronDown, ChevronUp, FileJson } from 'lucide-react';
import { ColorEntry } from '../parser/colorExtractor';

interface ColorGroup {
  color: string;
  count: number;
  selectors: string[];
  checked: boolean;
  newColor: string;
  expanded: boolean;
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
    return Array.from(map.entries()).map(([color, data]) => ({
      color,
      count: data.count,
      selectors: Array.from(data.selectors),
    }));
  }, [entries]);

  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [newColors, setNewColors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [message, setMessage] = useState('');

  const checkedCount = Object.values(checks).filter(Boolean).length;

  const toggleCheck = (color: string) => {
    setChecks((prev) => ({ ...prev, [color]: !prev[color] }));
  };

  const toggleExpand = (color: string) => {
    setExpanded((prev) => ({ ...prev, [color]: !prev[color] }));
  };

  const handleNewColor = (color: string, value: string) => {
    setNewColors((prev) => ({ ...prev, [color]: value }));
  };

  const handleBatchReplace = () => {
    const replacements: { oldColor: string; newColor: string }[] = [];
    for (const cg of colorGroups) {
      if (checks[cg.color] && newColors[cg.color]) {
        replacements.push({ oldColor: cg.color, newColor: newColors[cg.color] });
      }
    }
    if (replacements.length === 0) return;
    onReplace(replacements);
    setChecks({});
    setNewColors({});
    setMessage(`已替换 ${replacements.length} 个颜色`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleExport = () => {
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
  };

  const isValidColor = useCallback((val: string) => {
    if (!val) return false;
    return /^(#[0-9a-fA-F]{3,8}|rgb(a)?\s*\([^)]+\))$/.test(val.trim());
  }, []);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      overflow: 'hidden',
    }}>
      <h2 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: '#e0e0e0',
        marginBottom: '16px',
        fontFamily: '"Outfit", sans-serif',
      }}>
        颜色列表 ({colorGroups.length})
      </h2>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '4px',
      }}>
        {colorGroups.map((cg) => (
          <div
            key={cg.color}
            className="color-item"
            style={{
              padding: '10px 12px',
              marginBottom: '6px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)',
              transition: 'background 0.2s',
              cursor: 'default',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}>
                <input
                  type="checkbox"
                  checked={!!checks[cg.color]}
                  onChange={() => toggleCheck(cg.color)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#00bfff',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    transform: checks[cg.color] ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
              </label>
              <div
                className="color-swatch"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: cg.color,
                  border: '2px solid rgba(255,255,255,0.15)',
                  flexShrink: 0,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontFamily: '"Fira Code", monospace',
                  color: '#e0e0e0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {cg.color}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  使用 {cg.count} 次
                </div>
              </div>
            </div>

            <div style={{ marginTop: '6px', paddingLeft: '42px' }}>
              <div style={{ fontSize: '11px', color: '#777', marginBottom: '4px' }}>
                {cg.selectors.slice(0, 3).map((s) => (
                  <span key={s} style={{
                    display: 'inline-block',
                    padding: '1px 6px',
                    margin: '1px 2px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#aaa',
                    fontSize: '10px',
                    fontFamily: '"Fira Code", monospace',
                  }}>{s}</span>
                ))}
                {cg.selectors.length > 3 && (
                  <button
                    onClick={() => toggleExpand(cg.color)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00bfff',
                      cursor: 'pointer',
                      fontSize: '10px',
                      padding: '1px 4px',
                      fontFamily: '"Outfit", sans-serif',
                    }}
                  >
                    {expanded[cg.color] ? '收起' : `展开更多 (${cg.selectors.length - 3})`}
                    {expanded[cg.color] ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>
                )}
              </div>
              {expanded[cg.color] && cg.selectors.length > 3 && (
                <div style={{ fontSize: '11px', color: '#777' }}>
                  {cg.selectors.slice(3).map((s) => (
                    <span key={s} style={{
                      display: 'inline-block',
                      padding: '1px 6px',
                      margin: '1px 2px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#aaa',
                      fontSize: '10px',
                      fontFamily: '"Fira Code", monospace',
                    }}>{s}</span>
                  ))}
                </div>
              )}
            </div>

            {checks[cg.color] && (
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '8px',
                paddingLeft: '42px',
                alignItems: 'center',
              }}>
                <input
                  type="text"
                  value={newColors[cg.color] || ''}
                  onChange={(e) => handleNewColor(cg.color, e.target.value)}
                  placeholder="#hex / rgb()"
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#e0e0e0',
                    fontSize: '12px',
                    fontFamily: '"Fira Code", monospace',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#00bfff';
                    e.currentTarget.style.boxShadow = '0 0 8px rgba(0,191,255,0.3)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#444';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {newColors[cg.color] && !isValidColor(newColors[cg.color]) && (
                  <span style={{ color: '#ff6b6b', fontSize: '10px' }}>格式无效</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <button
          onClick={handleBatchReplace}
          disabled={checkedCount === 0}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: checkedCount > 0 ? 'rgba(0,191,255,0.2)' : 'rgba(255,255,255,0.05)',
            color: checkedCount > 0 ? '#00bfff' : '#555',
            cursor: checkedCount > 0 ? 'pointer' : 'not-allowed',
            fontSize: '13px',
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 500,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            if (checkedCount > 0) e.currentTarget.style.background = 'rgba(0,191,255,0.35)';
          }}
          onMouseLeave={(e) => {
            if (checkedCount > 0) e.currentTarget.style.background = 'rgba(0,191,255,0.2)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Check size={14} />
          批量替换 ({checkedCount})
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              background: exporting ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.06)',
              color: exporting ? '#ffd700' : '#e0e0e0',
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
              if (!exporting) e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              if (!exporting) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
          >
            <Download size={13} />
            {exporting ? `${exportProgress}%` : '导出CSS'}
          </button>

          <button
            onClick={onExportReport}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255,255,255,0.06)',
              color: '#e0e0e0',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: '"Outfit", sans-serif',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
          >
            <FileJson size={13} />
            导出报告
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 20px',
          borderRadius: '8px',
          background: 'rgba(0,191,255,0.25)',
          color: '#00bfff',
          fontSize: '13px',
          fontFamily: '"Outfit", sans-serif',
          backdropFilter: 'blur(8px)',
          animation: 'fadeInUp 0.3s ease',
          zIndex: 100,
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
