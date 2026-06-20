import React from 'react';
import { useFPS } from '@/hooks/useFPS';
import { useAppStore } from '@/store/useAppStore';

interface StatusBarProps {
  compact?: boolean;
}

export default function StatusBar({ compact = false }: StatusBarProps) {
  const fps = useFPS();
  const furnitureInstances = useAppStore((state) => state.furnitureInstances);

  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: compact ? 28 : 30,
        background: 'rgba(0, 0, 0, 0.55)',
        color: '#fff',
        fontSize: compact ? 11 : 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: compact ? '0 12px' : '0 24px',
        zIndex: 20,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ fontVariantNumeric: 'tabular-nums' }}>
        FPS: {fps}
      </div>
      <div
        style={{
          opacity: 0.8,
          letterSpacing: 0.5,
        }}
      >
        拖拽放置 · Shift+点击旋转45° · 滚轮缩放
      </div>
      <div style={{ fontVariantNumeric: 'tabular-nums' }}>
        模型数量: {furnitureInstances.length}
      </div>
    </footer>
  );
}
