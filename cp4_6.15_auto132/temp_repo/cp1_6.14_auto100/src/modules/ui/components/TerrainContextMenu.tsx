import { useEffect, useRef } from 'react';
import { useBattleStore } from '../../../store/battleStore';
import type { TerrainType } from '../../battle/types';
import { TERRAIN_COLORS } from '../../battle/types';

const terrainOptions: { type: TerrainType; name: string; icon: string }[] = [
  { type: 'grass', name: '草地', icon: '🌿' },
  { type: 'rock', name: '岩石', icon: '🪨' },
  { type: 'swamp', name: '沼泽', icon: '🌊' },
];

export default function TerrainContextMenu() {
  const contextMenuPos = useBattleStore((state) => state.contextMenuPos);
  const setContextMenu = useBattleStore((state) => state.setContextMenu);
  const setTerrain = useBattleStore((state) => state.setTerrain);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    if (contextMenuPos) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenuPos, setContextMenu]);

  if (!contextMenuPos) return null;

  const handleTerrainSelect = (terrain: TerrainType) => {
    setTerrain(contextMenuPos.position, terrain);
    setContextMenu(null);
  };

  const menuWidth = 200;
  const menuHeight = 180;
  let left = contextMenuPos.x - menuWidth / 2;
  let top = contextMenuPos.y - menuHeight / 2;

  if (left < 10) left = 10;
  if (top < 10) top = 10;
  if (left + menuWidth > window.innerWidth - 10) {
    left = window.innerWidth - menuWidth - 10;
  }
  if (top + menuHeight > window.innerHeight - 10) {
    top = window.innerHeight - menuHeight - 10;
  }

  return (
    <div
      ref={menuRef}
      className="terrain-context-menu"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${menuWidth}px`,
      }}
    >
      <div className="context-menu-title">选择地形</div>
      <div className="terrain-options">
        {terrainOptions.map((option) => (
          <button
            key={option.type}
            className="terrain-option-btn"
            style={{ '--terrain-color': TERRAIN_COLORS[option.type] } as React.CSSProperties}
            onClick={() => handleTerrainSelect(option.type)}
          >
            <span className="terrain-icon">{option.icon}</span>
            <span className="terrain-name">{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
