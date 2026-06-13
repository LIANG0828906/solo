import { useRef, useCallback } from 'react';
import { CraftableResult, RESOURCE_METAS, ResourceType } from '../types';
import { playCraftSound } from '../utils/audioUtils';
import CraftParticleBurst, { CraftParticleBurstRef } from './CraftParticleBurst';

interface CraftResultProps {
  craftableItems: CraftableResult[];
  onCraft: (recipeId: string) => void;
}

export default function CraftResult({ craftableItems, onCraft }: CraftResultProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const particleRef = useRef<CraftParticleBurstRef | null>(null);

  const handleCraft = useCallback(
    (recipeId: string, e: React.MouseEvent<HTMLButtonElement>) => {
      const container = containerRef.current;
      const button = e.currentTarget;
      if (container && particleRef.current) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        const x = buttonRect.left - containerRect.left + buttonRect.width / 2;
        const y = buttonRect.top - containerRect.top + buttonRect.height / 2;
        particleRef.current.burst(x, y);
      }

      try {
        playCraftSound();
      } catch {
        // ignore
      }

      onCraft(recipeId);
    },
    [onCraft]
  );

  return (
    <div className="craft-result-section" ref={containerRef} style={{ position: 'relative' }}>
      <div className="section-title">合成结果</div>
      {craftableItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚒️</div>
          <div>放入资源以检测配方</div>
        </div>
      ) : (
        <div className="craft-list">
          {craftableItems.map((item) => (
            <div key={item.recipeId} className="craft-item">
              <div
                className="craft-item-icon"
                style={{ backgroundColor: item.iconColor }}
              />
              <div className="craft-item-info">
                <div className="craft-item-name">{item.name}</div>
                <div className="craft-item-req">
                  {Object.entries(item.requirements).map(([res, count]) => {
                    const meta = RESOURCE_METAS[res as ResourceType];
                    return (
                      <span key={res}>
                        <span
                          className="req-dot"
                          style={{ backgroundColor: meta?.color || '#ccc' }}
                        />
                        {meta?.name} x{count}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button
                className="craft-btn"
                onClick={(e) => handleCraft(item.recipeId, e)}
              >
                合成
              </button>
            </div>
          ))}
        </div>
      )}
      <CraftParticleBurst
        ref={particleRef}
        particleCount={30}
        duration={800}
        colorStart="#e74c3c"
        colorEnd="#f1c40f"
      />
    </div>
  );
}
