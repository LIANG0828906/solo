import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, COLLECT_DURATION_MS } from '@/store/gameStore';
import PixelIcon from './PixelIcon';

interface FloatingResource {
  id: string;
  itemId: string;
  x: number;
  y: number;
  count: number;
  startTime: number;
  duration: number;
}

const ResourceCollector: React.FC = () => {
  const isCollecting = useGameStore(s => s.isCollecting);
  const collectProgress = useGameStore(s => s.collectProgress);
  const cooldownRemaining = useGameStore(s => s.cooldownRemaining);
  const isInventoryFull = useGameStore(s => s.isInventoryFull());
  const startCollecting = useGameStore(s => s.startCollecting);
  const finishCollecting = useGameStore(s => s.finishCollecting);
  const updateCollectProgress = useGameStore(s => s.updateCollectProgress);
  const updateCooldown = useGameStore(s => s.updateCooldown);
  const items = useGameStore(s => s.items);

  const [floatingResources, setFloatingResources] = useState<FloatingResource[]>([]);
  const lastTsRef = useRef<number>(0);
  const collectStartTsRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    let rafId: number;
    let firstTs = 0;

    const loop = (ts: number) => {
      if (!alive) return;
      if (firstTs === 0) firstTs = ts;

      if (lastTsRef.current === 0) lastTsRef.current = ts;
      const delta = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const st = useGameStore.getState();

      if (st.isCollecting) {
        if (collectStartTsRef.current === 0) collectStartTsRef.current = ts;
        const elapsed = ts - collectStartTsRef.current;
        const progress = Math.min(100, (elapsed / COLLECT_DURATION_MS) * 100);
        st.updateCollectProgress(progress);
        if (progress >= 100) {
          collectStartTsRef.current = 0;
          st.finishCollecting();
        }
      } else {
        collectStartTsRef.current = 0;
      }

      if (st.cooldownRemaining > 0) {
        st.updateCooldown(Math.min(delta, 0.1));
      }

      setFloatingResources(prev => prev.filter(r => ts - r.startTime < r.duration));

      rafId = requestAnimationFrame(loop);
      rafIdRef.current = rafId;
    };

    rafId = requestAnimationFrame(loop);
    rafIdRef.current = rafId;

    return () => {
      alive = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const handleCollect = () => {
    const st = useGameStore.getState();
    if (st.isCollecting || st.cooldownRemaining > 0 || st.isInventoryFull()) return;
    st.startCollecting();
  };

  const isFull = isInventoryFull;
  const isDisabled = isCollecting || cooldownRemaining > 0 || isFull;

  return (
    <div className="collector-section">
      <div className="section-title" style={{ marginTop: 0 }}>资源采集</div>

      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${collectProgress}%` }}
        />
        {isCollecting && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '6px',
            color: '#2a2a3a',
          }}>
            {collectProgress.toFixed(0)}%
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          className={`pixel-button gold ${isFull ? 'danger' : ''}`}
          style={{ flex: 1 }}
          onClick={handleCollect}
          disabled={isDisabled}
        >
          {isCollecting
            ? '采集中...'
            : isFull
              ? '背包已满'
              : cooldownRemaining > 0
                ? `冷却 ${cooldownRemaining.toFixed(1)}s`
                : '采集'
          }
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '8px' }}>
        {['stone', 'wood', 'iron_ore', 'crystal_shard'].map(itemId => {
          const item = items[itemId];
          if (!item) return null;

          return (
            <div key={itemId} style={{ textAlign: 'center' }}>
              <PixelIcon
                type={item.iconType}
                color={item.color}
                accentColor={item.accentColor}
                size={24}
              />
              <div style={{ fontSize: '6px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {itemId === 'stone' ? '40%' : itemId === 'wood' ? '30%' : itemId === 'iron_ore' ? '20%' : '10%'}
              </div>
            </div>
          );
        })}
      </div>

      {floatingResources.map(resource => {
        const item = items[resource.itemId];
        if (!item) return null;
        const elapsed = (performance.now() - resource.startTime) / resource.duration;
        const progress = Math.min(1, elapsed);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentX = resource.x + (0 - resource.x) * easeProgress;
        const currentY = resource.y + (-60 - resource.y) * easeProgress;
        const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
        const opacity = 1 - progress;

        return (
          <div
            key={resource.id}
            style={{
              position: 'absolute',
              left: currentX,
              top: currentY,
              transform: `scale(${scale})`,
              opacity: opacity,
              pointerEvents: 'none',
              zIndex: 100,
            }}
          >
            <PixelIcon
              type={item.iconType}
              color={item.color}
              accentColor={item.accentColor}
              size={32}
            />
            {resource.count > 1 && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  fontSize: '8px',
                  color: 'var(--accent-gold)',
                  background: 'var(--bg-primary)',
                  padding: '1px 3px',
                  border: '1px solid var(--border-color)',
                }}
              >
                +{resource.count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ResourceCollector;
