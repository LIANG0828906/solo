import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGradientStore } from '@/store/gradientStore';

export function CodeExport() {
  const currentCSS = useGradientStore((s) => s.currentCSS);
  const activeRegion = useGradientStore((s) => s.activeRegion);
  const nodes = useGradientStore((s) => s.nodes);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCSS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);
  const regionNode = sortedNodes[activeRegion] ?? sortedNodes[0];

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        width: 340,
        maxWidth: 'calc(100vw - 40px)',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        zIndex: 50,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, letterSpacing: 0.5 }}>
          CSS 渐变代码 · 区域 {activeRegion + 1}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: regionNode?.startColor ?? '#000',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.2)',
            }}
          />
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: regionNode?.endColor ?? '#000',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.2)',
            }}
          />
        </div>
      </div>
      <pre
        style={{
          margin: 0,
          padding: 10,
          background: 'rgba(0,0,0,0.35)',
          borderRadius: 8,
          fontSize: 11,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          lineHeight: 1.6,
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          color: '#e6e6e6',
        }}
      >
        {`background: ${currentCSS};`}
      </pre>
      <button
        onClick={handleCopy}
        style={{
          marginTop: 10,
          width: '100%',
          padding: '8px 12px',
          background: copied ? '#38EF7D' : 'rgba(255,255,255,0.12)',
          color: copied ? '#0b3d2e' : '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          letterSpacing: 0.3,
        }}
        onMouseEnter={(e) => {
          if (!copied) (e.currentTarget.style.background = 'rgba(255,255,255,0.2)');
        }}
        onMouseLeave={(e) => {
          if (!copied) (e.currentTarget.style.background = 'rgba(255,255,255,0.12)');
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={copied ? 'ok' : 'copy'}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {copied ? '✓ 已复制' : '复制代码'}
          </motion.span>
        </AnimatePresence>
      </button>
    </motion.div>
  );
}
