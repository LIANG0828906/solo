import { useState, useCallback } from 'react';
import type { Palette, ExportFormat } from '../types';
import { X, Copy, Check } from 'lucide-react';

interface ExportModalProps {
  palette: Palette | null;
  onClose: () => void;
}

export function ExportModal({ palette, onClose }: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<ExportFormat>('css');
  const [copied, setCopied] = useState(false);

  const generateCSS = useCallback(
    (p: Palette) => {
      const vars = p.colors
        .map(
          (color, i) =>
            `  --color-${i + 1}: ${color.hex};${color.label ? ` /* ${color.label} */` : ''}`
        )
        .join('\n');
      return `:root {\n${vars}\n}`;
    },
    []
  );

  const generateTailwind = useCallback(
    (p: Palette) => {
      const colors = p.colors
        .map((color, i) => {
          const key = color.label || `color-${i + 1}`;
          return `      '${key}': '${color.hex}',`;
        })
        .join('\n');
      return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${colors}\n      },\n    },\n  },\n};`;
    },
    []
  );

  const generateSCSS = useCallback(
    (p: Palette) => {
      const vars = p.colors
        .map(
          (color, i) =>
            `$color-${i + 1}: ${color.hex};${color.label ? ` // ${color.label}` : ''}`
        )
        .join('\n');
      return vars;
    },
    []
  );

  const getCode = useCallback(() => {
    if (!palette) return '';
    switch (activeTab) {
      case 'css':
        return generateCSS(palette);
      case 'tailwind':
        return generateTailwind(palette);
      case 'scss':
        return generateSCSS(palette);
    }
  }, [palette, activeTab, generateCSS, generateTailwind, generateSCSS]);

  const handleCopy = useCallback(async () => {
    const code = getCode();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [getCode]);

  const tabs: { id: ExportFormat; label: string }[] = [
    { id: 'css', label: 'CSS Variables' },
    { id: 'tailwind', label: 'Tailwind' },
    { id: 'scss', label: 'SCSS' },
  ];

  if (!palette) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>导出配色方案</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          <pre className="code-block">
            <code>{getCode()}</code>
          </pre>
        </div>

        <div className="modal-footer">
          <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
            {copied ? (
              <>
                <Check size={18} />
                已复制
              </>
            ) : (
              <>
                <Copy size={18} />
                复制代码
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
