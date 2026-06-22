import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { extractColors, replaceColorsInCss, ColorEntry } from './parser/colorExtractor';
import { buildGraph, computeLayoutSync, LayoutResult } from './graph/forceLayout';
import { GraphCanvas, InteractionState } from './renderer/graphCanvas';
import ThemePanel from './components/ThemePanel';

type AppState = {
  cssText: string;
  entries: ColorEntry[];
  layout: LayoutResult | null;
  parsing: boolean;
  parsed: boolean;
  replacements: { oldColor: string; newColor: string }[];
  snippet: string;
  snippetVisible: boolean;
  panelOpen: boolean;
  dragOver: boolean;
  inputMode: 'upload' | 'text';
};

const initialState: AppState = {
  cssText: '',
  entries: [],
  layout: null,
  parsing: false,
  parsed: false,
  replacements: [],
  snippet: '',
  snippetVisible: false,
  panelOpen: false,
  dragOver: false,
  inputMode: 'upload',
};

export default function App() {
  const [state, setState] = useState<AppState>(initialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<GraphCanvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const gc = new GraphCanvas(canvasRef.current);
    graphRef.current = gc;

    gc.setCallback((interaction: InteractionState) => {
      if (interaction.selectedEdge && gc) {
        const snippet = gc.getCssSnippetForEdge(interaction.selectedEdge);
        setState((prev) => ({
          ...prev,
          snippet,
          snippetVisible: true,
        }));
      }
    });

    const handleResize = () => gc.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      gc.destroy();
    };
  }, []);

  useEffect(() => {
    if (graphRef.current && state.layout) {
      graphRef.current.setLayout(state.layout);
      graphRef.current.setCssText(state.cssText);
      graphRef.current.setEntries(state.entries);
    }
  }, [state.layout, state.cssText, state.entries]);

  const parseCss = useCallback((text: string) => {
    setState((prev) => ({ ...prev, parsing: true, parsed: false }));

    requestAnimationFrame(() => {
      const entries = extractColors(text);
      const graph = buildGraph(entries);
      const container = canvasRef.current?.parentElement;
      const w = container?.clientWidth || 800;
      const h = container?.clientHeight || 600;
      const layout = computeLayoutSync(graph, w, h);

      setState((prev) => ({
        ...prev,
        cssText: text,
        entries,
        layout,
        parsing: false,
        parsed: true,
      }));
    });
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState((prev) => ({ ...prev, dragOver: false }));

    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) parseCss(text);
      };
      reader.readAsText(file);
    }
  }, [parseCss]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) parseCss(text);
      };
      reader.readAsText(file);
    }
  }, [parseCss]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, dragOver: true }));
  }, []);

  const handleDragLeave = useCallback(() => {
    setState((prev) => ({ ...prev, dragOver: false }));
  }, []);

  const handleTextSubmit = useCallback(() => {
    if (textareaRef.current?.value) {
      parseCss(textareaRef.current.value);
    }
  }, [parseCss]);

  const handleReplace = useCallback((replacements: { oldColor: string; newColor: string }[]) => {
    setState((prev) => {
      const newCss = replaceColorsInCss(prev.cssText, replacements);
      const newEntries = extractColors(newCss);
      const graph = buildGraph(newEntries);
      const container = canvasRef.current?.parentElement;
      const w = container?.clientWidth || 800;
      const h = container?.clientHeight || 600;
      const layout = computeLayoutSync(graph, w, h);

      return {
        ...prev,
        cssText: newCss,
        entries: newEntries,
        layout,
        replacements: [...prev.replacements, ...replacements],
      };
    });
  }, []);

  const handleExport = useCallback(() => {
    const blob = new Blob([state.cssText], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme-new.css';
    a.click();
    URL.revokeObjectURL(url);
  }, [state.cssText]);

  const handleExportReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      replacements: state.replacements,
      colorSummary: Array.from(
        new Set(state.entries.map((e) => e.color))
      ).map((color) => ({
        color,
        selectors: state.entries.filter((e) => e.color === color).map((e) => e.selector),
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color-report.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state.replacements, state.entries]);

  const togglePanel = useCallback(() => {
    setState((prev) => ({ ...prev, panelOpen: !prev.panelOpen }));
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#1a1a2e',
      color: '#e0e0e0',
      fontFamily: '"Outfit", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {!state.parsed && !state.parsing && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '600px',
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #00bfff, #ffd700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              CSS 颜色依赖分析
            </h1>
            <p style={{
              textAlign: 'center',
              color: '#888',
              fontSize: '14px',
              marginBottom: '32px',
            }}>
              上传CSS文件或粘贴代码，可视化颜色与选择器之间的依赖关系
            </p>

            <div
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${state.dragOver ? '#ffd700' : '#444'}`,
                borderRadius: '16px',
                padding: '40px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.3s, background 0.3s',
                background: state.dragOver ? 'rgba(255,215,0,0.05)' : 'rgba(255,255,255,0.02)',
                animation: state.dragOver ? 'borderBlink 0.3s infinite alternate' : 'none',
                marginBottom: '16px',
              }}
            >
              <Upload size={36} style={{ color: state.dragOver ? '#ffd700' : '#555', marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '4px' }}>
                拖拽 .css 文件到此处，或点击上传
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                支持 .css 文件格式
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".css"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ textAlign: 'center', color: '#555', fontSize: '12px', margin: '16px 0' }}>
              — 或直接粘贴CSS代码 —
            </div>

            <textarea
              ref={textareaRef}
              placeholder={`.header {\n  color: #ffffff;\n  background: #1a1a2e;\n}\n.button {\n  color: #00bfff;\n  border: 1px solid #ffd700;\n}`}
              style={{
                width: '100%',
                height: '160px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #333',
                background: 'rgba(0,0,0,0.3)',
                color: '#e0e0e0',
                fontFamily: '"Fira Code", monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00bfff';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(0,191,255,0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            <button
              onClick={handleTextSubmit}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, rgba(0,191,255,0.3), rgba(255,215,0,0.2))',
                color: '#e0e0e0',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: '"Outfit", sans-serif',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,191,255,0.45), rgba(255,215,0,0.35))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,191,255,0.3), rgba(255,215,0,0.2))';
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              解析CSS
            </button>
          </div>
        </div>
      )}

      {state.parsing && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(0,191,255,0.2)',
            borderTopColor: '#00bfff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ color: '#aaa', fontSize: '14px' }}>解析中...</div>
        </div>
      )}

      {state.parsed && !state.parsing && (
        <div className="main-layout" style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}>
          <div style={{
            flex: '2 1 0%',
            position: 'relative',
            minWidth: 0,
          }}>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            />
          </div>

          <div className="panel-container" style={{
            flex: '1 1 0%',
            background: 'rgba(26, 26, 46, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <ThemePanel
              entries={state.entries}
              onReplace={handleReplace}
              onExport={handleExport}
              onExportReport={handleExportReport}
            />
          </div>

          <button
            className="mobile-panel-toggle"
            onClick={togglePanel}
            style={{
              display: 'none',
              position: 'fixed',
              bottom: '12px',
              right: '12px',
              width: '44px',
              height: '44px',
              borderRadius: '22px',
              border: 'none',
              background: 'rgba(0,191,255,0.3)',
              color: '#e0e0e0',
              cursor: 'pointer',
              zIndex: 200,
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            <FileText size={20} />
          </button>
        </div>
      )}

      {state.snippetVisible && state.snippet && (
        <div style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: state.parsed ? '33.33%' : '0',
          background: 'rgba(15, 15, 30, 0.95)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 20px',
          fontFamily: '"Fira Code", monospace',
          fontSize: '12px',
          lineHeight: '1.7',
          color: '#ccc',
          zIndex: 50,
          maxHeight: '180px',
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#00bfff', fontSize: '11px', fontFamily: '"Outfit", sans-serif' }}>
              引用代码片段
            </span>
            <button
              onClick={() => setState((prev) => ({ ...prev, snippetVisible: false }))}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                padding: '0',
              }}
            >
              <X size={14} />
            </button>
          </div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {state.snippet.split('\n').map((line, i) => (
              <div key={i} dangerouslySetInnerHTML={{
                __html: highlightCss(line),
              }} />
            ))}
          </pre>
        </div>
      )}

      {state.parsed && (
        <div style={{
          position: 'fixed',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '6px 16px',
          borderRadius: '8px',
          background: 'rgba(0,191,255,0.15)',
          color: '#00bfff',
          fontSize: '12px',
          fontFamily: '"Outfit", sans-serif',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          animation: 'fadeInDown 0.5s ease',
        }}>
          解析完成，共找到 {state.entries.length} 个颜色值
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes borderBlink {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .color-item:hover .color-swatch {
          transform: scale(1.2);
          box-shadow: 0 0 12px currentColor;
        }

        @media (max-width: 768px) {
          .main-layout {
            flex-direction: column !important;
          }
          .main-layout > div:first-child {
            flex: 1 !important;
            width: 100% !important;
          }
          .panel-container {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: ${state.panelOpen ? '60vh' : '0'} !important;
            max-height: 60vh !important;
            border-left: none !important;
            border-top: 1px solid rgba(255,255,255,0.1) !important;
            transition: height 0.3s ease !important;
            z-index: 150 !important;
            flex: none !important;
            overflow-y: auto !important;
          }
          .mobile-panel-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}

function highlightCss(line: string): string {
  let result = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  result = result.replace(
    /(#[0-9a-fA-F]{3,8})/g,
    '<span style="color:#ffd700">$1</span>'
  );
  result = result.replace(
    /(rgb(?:a)?\s*\([^)]+\))/gi,
    '<span style="color:#ffd700">$1</span>'
  );
  result = result.replace(
    /([{};:])/g,
    '<span style="color:#888">$1</span>'
  );
  result = result.replace(
    /(\.[\w-]+|#[\w-]+)/g,
    (match, p1) => {
      if (p1.startsWith('#') && p1.length > 1 && !/^#[0-9a-fA-F]+$/.test(p1)) {
        return `<span style="color:#00bfff">${p1}</span>`;
      }
      if (p1.startsWith('.')) {
        return `<span style="color:#00bfff">${p1}</span>`;
      }
      return match;
    }
  );

  return result;
}
