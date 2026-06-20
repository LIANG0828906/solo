import React, { useMemo, useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import type { GradientScheme } from '@/utils/history';
import { generateFullCSSCode } from '@/utils/history';

interface CodePanelProps {
  scheme: GradientScheme;
}

const CodePanel: React.FC<CodePanelProps> = ({ scheme }) => {
  const [copied, setCopied] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  const codeLines = useMemo(() => {
    return generateFullCSSCode(scheme).split('\n');
  }, [scheme]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateFullCSSCode(scheme));
      setCopied(true);
      setShowPulse(true);
      setTimeout(() => {
        setCopied(false);
        setShowPulse(false);
      }, 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = generateFullCSSCode(scheme);
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setShowPulse(true);
      setTimeout(() => {
        setCopied(false);
        setShowPulse(false);
      }, 2000);
    }
  }, [scheme]);

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-gray-800 text-base flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          CSS 代码
        </h3>
        <button
          onClick={handleCopy}
          className="btn-gradient text-xs flex items-center gap-1.5 relative"
        >
          {showPulse && (
            <span className="absolute inset-0 rounded-xl animate-pulse-ring border-2 border-brand-400" />
          )}
          {copied ? (
            <>
              <Check size={14} />
              已复制
            </>
          ) : (
            <>
              <Copy size={14} />
              复制代码
            </>
          )}
        </button>
      </div>

      <div className="bg-gray-900/90 rounded-xl p-4 overflow-x-auto">
        <pre className="font-mono text-sm leading-relaxed">
          {codeLines.map((line, i) => (
            <div key={i} className="flex">
              <span className="text-gray-500 select-none w-8 text-right mr-4 shrink-0 text-xs leading-relaxed">
                {i + 1}
              </span>
              <span className="text-gray-300">
                {line.includes('-webkit-') ? (
                  <>
                    <span className="text-pink-400">background</span>
                    <span className="text-gray-500">: </span>
                    <span className="text-green-400">-webkit-{line.split('-webkit-')[1]?.replace('background: ', '') || ''}</span>
                    <span className="text-gray-500">;</span>
                  </>
                ) : line.includes('background:') ? (
                  <>
                    <span className="text-pink-400">background</span>
                    <span className="text-gray-500">: </span>
                    <span className="text-green-400">{line.split('background: ')[1]?.replace(';', '') || ''}</span>
                    <span className="text-gray-500">;</span>
                  </>
                ) : (
                  line
                )}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};

export default CodePanel;
