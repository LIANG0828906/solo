import { useRef } from 'react';
import { CraftableResult, RESOURCE_METAS, ResourceType } from '../types';

interface CraftResultProps {
  craftableItems: CraftableResult[];
  onCraft: (recipeId: string, eventPos: { x: number; y: number }) => void;
}

export default function CraftResult({ craftableItems, onCraft }: CraftResultProps) {
  const listRef = useRef<HTMLDivElement | null>(null);

  const handleCraft = (recipeId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    onCraft(recipeId, { x, y });
  };

  return (
    <div className="craft-result-section">
      <div className="section-title">合成结果</div>
      {craftableItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚒️</div>
          <div>放入资源以检测配方</div>
        </div>
      ) : (
        <div className="craft-list" ref={listRef}>
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
    </div>
  );
}
