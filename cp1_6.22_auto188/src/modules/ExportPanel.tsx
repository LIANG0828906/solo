import { useState } from 'react';
import { Settings, X, Copy, Check } from 'lucide-react';
import type { GradientConfig } from './ColorEngine';
import { generateCSSCode, generateSVGExample } from './ColorEngine';

interface ExportPanelProps {
  config: GradientConfig;
}

export default function ExportPanel({ config }: ExportPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedCSS, setCopiedCSS] = useState(false);
  const [copiedSVG, setCopiedSVG] = useState(false);

  const cssCode = generateCSSCode(config);
  const svgCode = generateSVGExample(config);

  const handleCopy = async (text: string, type: 'css' | 'svg') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'css') {
        setCopiedCSS(true);
        setTimeout(() => setCopiedCSS(false), 1500);
      } else {
        setCopiedSVG(true);
        setTimeout(() => setCopiedSVG(false), 1500);
      }
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-panel-bg border border-white/10 shadow-xl flex items-center justify-center text-slate-300 hover:text-white hover:scale-105 hover:bg-white/10 z-50"
      >
        <Settings size={20} className="animate-spin-slow" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[300px] max-h-[70vh] bg-panel-bg border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">导出代码</h3>
        <button
          onClick={() => setExpanded(false)}
          className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">CSS 代码</span>
            <button
              onClick={() => handleCopy(cssCode, 'css')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white ${
                copiedCSS ? 'scale-110' : ''
              }`}
              style={{ transition: 'transform 0.3s ease' }}
            >
              {copiedCSS ? (
                <>
                  <Check size={12} className="text-green-400" />
                  <span className="text-green-400">已复制</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>复制CSS</span>
                </>
              )}
            </button>
          </div>
          <pre className="code-scroll bg-app-bg rounded-lg p-3 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed">
            <code>{cssCode}</code>
          </pre>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">SVG 代码</span>
            <button
              onClick={() => handleCopy(svgCode, 'svg')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white ${
                copiedSVG ? 'scale-110' : ''
              }`}
              style={{ transition: 'transform 0.3s ease' }}
            >
              {copiedSVG ? (
                <>
                  <Check size={12} className="text-green-400" />
                  <span className="text-green-400">已复制</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>复制SVG</span>
                </>
              )}
            </button>
          </div>
          <pre className="code-scroll bg-app-bg rounded-lg p-3 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-48">
            <code>{svgCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
