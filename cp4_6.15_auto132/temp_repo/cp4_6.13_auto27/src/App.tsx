import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { parseExpression, isParseError, ParseError, Evaluator } from './ExpressionParser';
import {
  CoordinateCanvas,
  CoordinateCanvasHandle,
  CurveData,
  ViewState,
} from './CoordinateCanvas';

interface CurveState {
  id: string;
  expression: string;
  color: string;
  colorEnd: string;
  visible: boolean;
  opacityAnim: number;
}

const DEFAULT_COLORS: Array<{ start: string; end: string }> = [
  { start: '#3b82f6', end: '#8b5cf6' },
  { start: '#f97316', end: '#ef4444' },
  { start: '#10b981', end: '#06b6d4' },
  { start: '#f59e0b', end: '#f43f5e' },
  { start: '#8b5cf6', end: '#ec4899' },
  { start: '#0ea5e9', end: '#6366f1' },
  { start: '#22c55e', end: '#84cc16' },
  { start: '#ec4899', end: '#a855f7' },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function interpolateColor(c1: string, c2: string, t: number): string {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

const DEFAULT_VIEW: ViewState = {
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
};

let idCounter = 0;
const nextId = () => `curve-${Date.now()}-${++idCounter}`;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [value, delay]);
  return debounced;
}

interface ParsedCurve {
  curveId: string;
  evaluator?: Evaluator;
  error?: ParseError;
}

function parseCurves(curves: CurveState[]): Map<string, ParsedCurve> {
  const result = new Map<string, ParsedCurve>();
  for (const c of curves) {
    if (!c.expression.trim()) {
      result.set(c.id, { curveId: c.id });
      continue;
    }
    const parsed = parseExpression(c.expression);
    if (isParseError(parsed)) {
      result.set(c.id, { curveId: c.id, error: parsed });
    } else {
      result.set(c.id, { curveId: c.id, evaluator: parsed });
    }
  }
  return result;
}

function App() {
  const canvasRef = useRef<CoordinateCanvasHandle>(null);
  const [view, setView] = useState<ViewState>(DEFAULT_VIEW);

  const initialCurves: CurveState[] = useMemo(
    () => [
      {
        id: nextId(),
        expression: 'sin(x) + cos(x/2)',
        color: DEFAULT_COLORS[0].start,
        colorEnd: DEFAULT_COLORS[0].end,
        visible: true,
        opacityAnim: 1,
      },
      {
        id: nextId(),
        expression: 'x^2 / 10 - 3',
        color: DEFAULT_COLORS[1].start,
        colorEnd: DEFAULT_COLORS[1].end,
        visible: true,
        opacityAnim: 1,
      },
    ],
    []
  );
  const [curves, setCurves] = useState<CurveState[]>(initialCurves);
  const [inputExpr, setInputExpr] = useState<string>('sin(x) + cos(x/2)');
  const debouncedInput = useDebouncedValue(inputExpr, 50);

  const mainCurveId = curves.length > 0 ? curves[0].id : null;

  useEffect(() => {
    if (!mainCurveId) return;
    setCurves((prev) => {
      if (prev.length === 0 || prev[0].expression === debouncedInput) return prev;
      const next = prev.slice();
      next[0] = { ...next[0], expression: debouncedInput };
      return next;
    });
  }, [debouncedInput, mainCurveId]);

  const parsed = useMemo(() => parseCurves(curves), [curves]);

  const mainParseResult = mainCurveId ? parsed.get(mainCurveId) : undefined;
  const mainError = mainParseResult?.error;

  const canvasCurves: CurveData[] = useMemo(() => {
    return curves.map((c) => {
      const p = parsed.get(c.id);
      return {
        id: c.id,
        expression: c.expression,
        color: c.color,
        colorEnd: c.colorEnd,
        visible: c.visible,
        opacityAnim: c.opacityAnim,
        evaluator: p?.evaluator,
      };
    });
  }, [curves, parsed]);

  const handleAddCurve = useCallback(() => {
    const idx = curves.length % DEFAULT_COLORS.length;
    const pal = DEFAULT_COLORS[idx];
    const newCurve: CurveState = {
      id: nextId(),
      expression: '',
      color: pal.start,
      colorEnd: pal.end,
      visible: true,
      opacityAnim: 1,
    };
    setCurves((prev) => [...prev, newCurve]);
  }, [curves.length]);

  const handleUpdateCurveExpr = useCallback((id: string, expr: string) => {
    setCurves((prev) => prev.map((c) => (c.id === id ? { ...c, expression: expr } : c)));
  }, []);

  const handleUpdateCurveColor = useCallback((id: string, colorStart: string) => {
    setCurves((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const endRgb = hexToRgb(c.colorEnd);
        const startRgb = hexToRgb(colorStart);
        const dr = endRgb.r - startRgb.r;
        const dg = endRgb.g - startRgb.g;
        const db = endRgb.b - startRgb.b;
        const avg = (Math.abs(dr) + Math.abs(dg) + Math.abs(db)) / 3;
        let newEnd = c.colorEnd;
        if (avg < 60) {
          const h = colorStart.replace('#', '');
          const r = Math.min(255, parseInt(h.substring(0, 2), 16) + 120);
          const g = Math.min(255, parseInt(h.substring(2, 4), 16) + 40);
          const b = Math.min(255, parseInt(h.substring(4, 6), 16) + 140);
          newEnd = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return { ...c, color: colorStart, colorEnd: newEnd };
      })
    );
  }, []);

  const handleDeleteCurve = useCallback((id: string) => {
    setCurves((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: nextId(),
            expression: '',
            color: DEFAULT_COLORS[0].start,
            colorEnd: DEFAULT_COLORS[0].end,
            visible: true,
            opacityAnim: 1,
          },
        ];
      }
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  const handleToggleCurve = useCallback((id: string) => {
    setCurves((prev) => prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)));
  }, []);

  const handleViewChange = useCallback((nv: ViewState) => {
    setView(nv);
  }, []);

  const handleExportSVG = useCallback(() => {
    canvasRef.current?.exportSVG();
  }, []);

  const getInputStatus = () => {
    if (!inputExpr.trim()) return 'idle';
    return mainError ? 'invalid' : 'valid';
  };

  const getCurveInputStatus = (curve: CurveState) => {
    if (!curve.expression.trim()) return 'idle';
    const p = parsed.get(curve.id);
    return p?.error ? 'invalid' : 'valid';
  };

  const status = getInputStatus();
  const errorDisplay = mainError && inputExpr.trim() ? buildErrorHighlight(inputExpr, mainError) : null;

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">ƒ</div>
          <div className="logo-title">FuncVis</div>
        </div>
        <button className="btn btn-primary" onClick={handleExportSVG}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          导出 SVG
        </button>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <div className="panel">
            <div className="panel-title">主函数表达式</div>
            <div className="input-wrap">
              <div className="input-row">
                <input
                  type="text"
                  className={`expr-input ${status}`}
                  value={inputExpr}
                  onChange={(e) => setInputExpr(e.target.value)}
                  placeholder="例如：y = sin(x) + cos(x/2)"
                  spellCheck={false}
                  autoComplete="off"
                />
                <div className={`status-indicator ${status}`}>
                  {status === 'valid' ? '✓' : status === 'invalid' ? '✗' : '…'}
                </div>
              </div>
              {errorDisplay && (
                <div className="error-message" dangerouslySetInnerHTML={{ __html: errorDisplay }} />
              )}
              {!errorDisplay && status === 'valid' && (
                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)', padding: '4px 2px' }}>
                  支持：sin cos tan log ln exp sqrt abs ^ 以及括号和隐式乘法 2x
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className="panel-title" style={{ marginBottom: 0 }}>
                曲线列表（{curves.length}）
              </div>
              <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={handleAddCurve}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                添加曲线
              </button>
            </div>
            <div className="curve-table">
              {curves.map((curve, idx) => {
                const st = idx === 0 ? null : getCurveInputStatus(curve);
                const p = parsed.get(curve.id);
                return (
                  <div key={curve.id} className="curve-row">
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: '0',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '3px',
                          height: '22px',
                          borderRadius: '2px',
                          background: `linear-gradient(180deg, ${curve.color}, ${curve.colorEnd})`,
                          opacity: curve.visible ? 1 : 0.25,
                        }}
                      />
                      <input
                        type="text"
                        className={st === 'valid' ? 'valid' : st === 'invalid' ? 'invalid' : ''}
                        value={curve.expression}
                        onChange={(e) => handleUpdateCurveExpr(curve.id, e.target.value)}
                        placeholder={idx === 0 ? '(主输入框同步)' : '输入表达式，如 x^2'}
                        style={{ paddingLeft: idx === 0 ? '10px' : '12px', paddingRight: '24px' }}
                        spellCheck={false}
                        disabled={idx === 0}
                        title={idx === 0 ? '使用上方主输入框编辑此曲线' : p?.error?.message}
                      />
                      {p?.error && curve.expression && (
                        <div
                          title={p.error.message}
                          style={{
                            position: 'absolute',
                            right: '6px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#ef4444',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'help',
                          }}
                        >
                          ✗
                        </div>
                      )}
                    </div>
                    <div className="color-picker-wrap" title="选择曲线颜色">
                      <input
                        type="color"
                        value={curve.color}
                        onChange={(e) => handleUpdateCurveColor(curve.id, e.target.value)}
                      />
                    </div>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteCurve(curve.id)}
                      title="删除曲线"
                      style={{ alignSelf: 'center', justifySelf: 'center' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">视图信息</div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: '1.8',
                color: '#94a3b8',
                background: 'var(--bg-primary)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div>
                x: <span style={{ color: interpolateColor(view.xMin < 0 ? '#ef4444' : '#22c55e', '#f1f5f9', 0.6) }}>{formatNum(view.xMin)}</span>
                <span style={{ color: '#64748b' }}> → </span>
                <span style={{ color: interpolateColor(view.xMax > 0 ? '#22c55e' : '#ef4444', '#f1f5f9', 0.6) }}>{formatNum(view.xMax)}</span>
              </div>
              <div>
                y: <span style={{ color: interpolateColor(view.yMin < 0 ? '#ef4444' : '#22c55e', '#f1f5f9', 0.6) }}>{formatNum(view.yMin)}</span>
                <span style={{ color: '#64748b' }}> → </span>
                <span style={{ color: interpolateColor(view.yMax > 0 ? '#22c55e' : '#ef4444', '#f1f5f9', 0.6) }}>{formatNum(view.yMax)}</span>
              </div>
              <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--bg-tertiary)' }}>
                <span style={{ color: '#64748b' }}>缩放: </span>
                <span style={{ color: '#a855f7' }}>×{(20 / (view.xMax - view.xMin)).toFixed(2)}</span>
                <button
                  onClick={() => {
                    setView(DEFAULT_VIEW);
                  }}
                  style={{
                    float: 'right',
                    background: 'transparent',
                    border: '1px solid var(--bg-tertiary)',
                    color: '#94a3b8',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  重置
                </button>
              </div>
            </div>
          </div>
        </aside>

        <CoordinateCanvas
          ref={canvasRef}
          curves={canvasCurves}
          view={view}
          onViewChange={handleViewChange}
          onToggleCurve={handleToggleCurve}
        />
      </div>
    </div>
  );
}

function formatNum(n: number): string {
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 0.01 || abs >= 10000)) return n.toExponential(2);
  return n.toFixed(2).replace(/\.?0+$/, '');
}

function buildErrorHighlight(raw: string, err: ParseError): string {
  let expr = raw.trim();
  const eqMatch = expr.match(/^y\s*=\s*(.+)$/i);
  let offset = 0;
  if (eqMatch) {
    offset = eqMatch.index! + eqMatch[0].length - eqMatch[1].length;
    expr = eqMatch[1];
  }
  const pos = Math.min(Math.max(0, err.position + offset), raw.length);
  const len = Math.max(1, err.length ?? 1);
  const before = escapeHtml(raw.slice(0, pos));
  const at = escapeHtml(raw.slice(pos, pos + len));
  const after = escapeHtml(raw.slice(pos + len));
  const caret = '▲'.repeat(Math.max(1, len));
  const spaces = ' '.repeat(Math.max(0, pos));
  return (
    `<div style="margin-bottom: 4px;">` +
    `<span>${before}</span>` +
    `<span style="background: rgba(239,68,68,0.22); border-bottom: 2px solid #ef4444; border-radius: 2px; padding: 0 2px;">${at}</span>` +
    `<span>${after}</span>` +
    `</div>` +
    `<div style="color: #ef4444; font-weight: 600; letter-spacing: 1px;">${spaces}${caret} ${escapeHtml(err.message)}</div>`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default App;
