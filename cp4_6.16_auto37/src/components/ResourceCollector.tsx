import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
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

const COLLECT_DURATION = 3000;
const COOLDOWN_DURATION = 5000;

const ResourceCollector: React.FC = () => {
  const { 
    isCollecting, 
    cooldownRemaining,
    isInventoryFull,
    startCollecting,
    finishCollecting,
    updateCooldown,
    items,
  } = useGameStore();
  
  const [floatingResources, setFloatingResources] = useState<FloatingResource[]>([]);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const collectStartRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const animate = useCallback((timestamp: number) => {
    console.log('[animate] 调用，timestamp=', timestamp);
    
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }
    
    const delta = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;
    
    const state = useGameStore.getState();
    console.log('[animate] state.isCollecting=', state.isCollecting, 'state.cooldownRemaining=', state.cooldownRemaining);
    
    if (state.isCollecting) {
      if (collectStartRef.current === 0) {
        collectStartRef.current = timestamp;
      }
      
      const elapsed = timestamp - collectStartRef.current;
      const progress = Math.min(100, (elapsed / COLLECT_DURATION) * 100);
      console.log('[animate] 采集中，progress=', progress);
      
      state.updateCollectProgress(progress);
      
      if (progress >= 100) {
        collectStartRef.current = 0;
        state.finishCollecting();
      }
    } else {
      collectStartRef.current = 0;
    }
    
    if (state.cooldownRemaining > 0) {
      console.log('[animate] 冷却中，cooldownRemaining=', state.cooldownRemaining);
      state.updateCooldown(delta);
    }
    
    setFloatingResources(prev => {
      const now = timestamp;
      return prev.filter(r => now - r.startTime < r.duration);
    });
    
    animationRef.current = requestAnimationFrame(animate);
  }, []);
  
  useEffect(() => {
    console.log('[ResourceCollector] useEffect 执行，启动动画');
    (window as any).__resourceCollectorMounted = true;
    (window as any).__animate = animate;
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      console.log('[ResourceCollector] useEffect cleanup，取消动画');
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);
  
  const handleCollect = () => {
    if (isCollecting || cooldownRemaining > 0 || isInventoryFull()) return;
    startCollecting();
  };
  
  const isDisabled = isCollecting || cooldownRemaining > 0 || isInventoryFull();
  const isFull = isInventoryFull();
  
  const collectProgress = useGameStore(state => state.collectProgress);
  
  return (
    <div ref={containerRef} className="collector-section">
      <div className="section-title" style={{ marginTop: 0 }}>资源采集</div>
      
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${collectProgress}%` }}
        />
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
                ? `冷却中 ${cooldownRemaining.toFixed(1)}s` 
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
