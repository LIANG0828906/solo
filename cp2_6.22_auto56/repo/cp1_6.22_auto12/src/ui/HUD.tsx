import React, { useState, useRef } from 'react';
import { GameState, Item, ItemType } from '@/types';

interface HUDProps {
  gameState: GameState;
  onEquipItem: (itemId: string) => void;
  onUsePotion: (itemId: string) => void;
}

const rarityColors: Record<string, string> = {
  common: '#9d9d9d',
  rare: '#4169e1',
  epic: '#9932cc',
  legendary: '#ffd700',
};

const rarityBorders: Record<string, string> = {
  common: '2px solid #9d9d9d',
  rare: '2px solid #4169e1',
  epic: '2px solid #9932cc',
  legendary: '2px solid #ffd700',
};

const itemIcons: Record<string, string> = {
  weapon: '⚔️',
  shield: '🛡️',
  potion: '🧪',
};

export const HUD: React.FC<HUDProps> = ({ gameState, onEquipItem, onUsePotion }) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  const hpPercent = (gameState.hero.hp / gameState.hero.maxHp) * 100;

  const handleDragStart = (e: React.DragEvent, item: Item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handleDropOnSlot = (slotType: ItemType) => {
    if (draggedItem && draggedItem.type === slotType) {
      onEquipItem(draggedItem.id);
    }
    setDraggedItem(null);
  };

  const EquipmentSlot = ({ type, item, label }: { type: ItemType; item: Item | null; label: string }) => (
    <div
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={() => handleDropOnSlot(type)}
      style={{
        width: 60,
        height: 60,
        backgroundColor: '#1a0f2e',
        border: item ? rarityBorders[item.rarity] : '2px dashed #4a3666',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        position: 'relative',
        transition: 'all 0.3s ease',
        cursor: item ? 'pointer' : 'default',
        boxShadow: item ? `0 0 10px ${rarityColors[item.rarity]}40` : 'none',
      }}
      onClick={() => item && setSelectedItem(item.id)}
    >
      {item ? (
        <span style={{
          animation: selectedItem === item.id ? 'pulse 1s infinite' : 'none',
        }}>
          {itemIcons[type]}
        </span>
      ) : (
        <span style={{ opacity: 0.3, fontSize: 20 }}>{label}</span>
      )}
      {item && selectedItem === item.id && (
        <div style={{
          position: 'absolute',
          inset: -2,
          border: '2px solid #d4af37',
          borderRadius: '10px',
          animation: 'glowPulse 1.5s infinite',
        }} />
      )}
    </div>
  );

  const InventoryItem = ({ item }: { item: Item }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, item)}
      onDragEnd={handleDragEnd}
      onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
      style={{
        width: 50,
        height: 50,
        backgroundColor: '#1a0f2e',
        border: rarityBorders[item.rarity],
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        cursor: 'grab',
        transition: 'all 0.2s ease',
        transform: selectedItem === item.id ? 'scale(1.1)' : 'scale(1)',
        boxShadow: selectedItem === item.id
          ? `0 0 15px ${rarityColors[item.rarity]}`
          : `0 0 5px ${rarityColors[item.rarity]}40`,
      }}
      title={item.name}
    >
      {itemIcons[item.type]}
    </div>
  );

  const renderMiniMap = () => {
    const map = gameState.map;
    const scale = 4;
    const hero = gameState.hero;

    return (
      <div style={{
        width: map.width * scale,
        height: map.height * scale,
        backgroundColor: '#0a0612',
        border: '2px solid #6b4c9a',
        borderRadius: '4px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {map.tiles.map((row, y) =>
          row.map((tile, x) => {
            if (!tile.explored) return null;
            let color = '#1a0f2e';
            if (tile.type === 'wall') color = '#2d1f47';
            if (tile.type === 'floor') color = '#3d2b5c';
            if (tile.type === 'stairs') color = '#d4af37';
            if (!tile.visible && tile.explored) {
              color = '#1a0f2e';
            }
            return (
              <div
                key={`${x}-${y}`}
                style={{
                  position: 'absolute',
                  left: x * scale,
                  top: y * scale,
                  width: scale,
                  height: scale,
                  backgroundColor: color,
                }}
              />
            );
          })
        )}
        {gameState.monsters.filter(m => {
          const t = map.tiles[m.position.y]?.[m.position.x];
          return t?.visible;
        }).map(monster => (
          <div
            key={monster.id}
            style={{
              position: 'absolute',
              left: monster.position.x * scale - 1,
              top: monster.position.y * scale - 1,
              width: scale + 2,
              height: scale + 2,
              backgroundColor: '#ff4444',
              borderRadius: '50%',
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            left: hero.position.x * scale - 2,
            top: hero.position.y * scale - 2,
            width: scale + 4,
            height: scale + 4,
            backgroundColor: '#d4af37',
            borderRadius: '50%',
            boxShadow: '0 0 6px #d4af37',
            animation: 'heroPulse 1s infinite',
          }}
        />
      </div>
    );
  };

  const renderCombatLog = () => {
    if (gameState.scene !== 'combat') return null;

    const logs = gameState.combat.logs;
    const currentLog = logs[gameState.combat.logIndex];
    const displayText = currentLog
      ? currentLog.text.substring(0, Math.floor(gameState.combat.charIndex))
      : '';

    return (
      <div style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        maxWidth: 500,
        backgroundColor: 'rgba(26, 15, 46, 0.9)',
        border: '2px solid #6b4c9a',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#e0d5f0',
        fontFamily: 'serif',
        fontSize: 14,
        lineHeight: 1.6,
        maxHeight: 120,
        overflowY: 'auto',
      }}>
        {logs.slice(0, gameState.combat.logIndex).map((log, i) => (
          <div key={i} style={{
            color: log.type === 'damage' ? '#ff6b6b' : log.type === 'victory' ? '#ffd700' : '#9ec5ff',
            marginBottom: 4,
          }}>
            {log.text}
          </div>
        ))}
        {currentLog && (
          <div style={{
            color: currentLog.type === 'damage' ? '#ff6b6b' : currentLog.type === 'victory' ? '#ffd700' : '#9ec5ff',
          }}>
            {displayText}
            <span style={{ animation: 'blink 0.7s infinite' }}>_</span>
          </div>
        )}
      </div>
    );
  };

  const renderActionHint = () => {
    const hint = gameState.nearbyInteractable;
    if (!hint || gameState.scene !== 'exploration') return null;

    let text = '';
    if (hint.type === 'chest') text = '按 E 或 空格 打开宝箱';
    else if (hint.type === 'stairs') text = '按 E 或 空格 进入下一层';

    return (
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(26, 15, 46, 0.9)',
        border: '2px solid #d4af37',
        borderRadius: '20px',
        padding: '8px 20px',
        color: '#d4af37',
        fontFamily: 'serif',
        fontSize: 14,
        animation: 'breath 2s infinite',
        whiteSpace: 'nowrap',
      }}>
        {text}
      </div>
    );
  };

  return (
    <div
      onDragOver={handleDragOver}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 5px #d4af37; opacity: 1; }
          50% { box-shadow: 0 0 20px #d4af37; opacity: 0.7; }
        }
        @keyframes heroPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 6px #d4af37; }
          50% { transform: scale(1.3); box-shadow: 0 0 12px #d4af37; }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes breath {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes hpBar {
          from { width: 0%; }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          top: 15,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          pointerEvents: 'auto',
        }}
      >
        <div style={{
          backgroundColor: 'rgba(26, 15, 46, 0.9)',
          border: '2px solid #6b4c9a',
          borderRadius: '20px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ color: '#ff4444', fontSize: 20 }}>❤️</span>
          <div style={{
            width: 200,
            height: 16,
            backgroundColor: '#1a0f2e',
            border: '1px solid #4a3666',
            borderRadius: 8,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: `${hpPercent}%`,
              background: 'linear-gradient(90deg, #8b0000, #ff4444)',
              transition: 'width 0.3s ease-out',
              borderRadius: 8,
            }} />
            <span style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 12,
              fontWeight: 'bold',
              textShadow: '1px 1px 2px #000',
            }}>
              {gameState.hero.hp} / {gameState.hero.maxHp}
            </span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(26, 15, 46, 0.9)',
          border: '2px solid #d4af37',
          borderRadius: '20px',
          padding: '8px 16px',
          color: '#d4af37',
          fontFamily: 'serif',
          fontSize: 16,
          fontWeight: 'bold',
        }}>
          🏰 第 {gameState.floor} 层
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 15,
          top: 60,
          bottom: 60,
          width: 140,
          backgroundColor: 'rgba(26, 15, 46, 0.9)',
          border: '2px solid #6b4c9a',
          borderRadius: '8px',
          padding: 12,
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{
          color: '#d4af37',
          fontFamily: 'serif',
          fontSize: 14,
          fontWeight: 'bold',
          textAlign: 'center',
          borderBottom: '1px solid #4a3666',
          paddingBottom: 8,
        }}>
          ⚔️ 装备栏
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <EquipmentSlot type="weapon" item={gameState.hero.equipment.weapon} label="武器" />
          <EquipmentSlot type="shield" item={gameState.hero.equipment.shield} label="盾牌" />
          <EquipmentSlot type="potion" item={gameState.hero.equipment.potion} label="药水" />
        </div>

        <div style={{
          color: '#d4af37',
          fontFamily: 'serif',
          fontSize: 14,
          fontWeight: 'bold',
          textAlign: 'center',
          borderTop: '1px solid #4a3666',
          paddingTop: 8,
          marginTop: 4,
        }}>
          🎒 背包
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 6,
          justifyItems: 'center',
        }}>
          {gameState.hero.inventory.map(item => (
            <InventoryItem key={item.id} item={item} />
          ))}
          {Array.from({ length: Math.max(0, 6 - gameState.hero.inventory.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                width: 50,
                height: 50,
                backgroundColor: '#0a0612',
                border: '1px dashed #4a3666',
                borderRadius: '6px',
                opacity: 0.5,
              }}
            />
          ))}
        </div>

        {selectedItem && (() => {
          let item: import('@/types').Item | undefined = gameState.hero.inventory.find(i => i.id === selectedItem);
          if (!item) {
            const equipmentItems = [
              gameState.hero.equipment.weapon,
              gameState.hero.equipment.shield,
              gameState.hero.equipment.potion,
            ].filter(Boolean) as import('@/types').Item[];
            item = equipmentItems.find(i => i.id === selectedItem);
          }
          if (!item) return null;
          return (
            <div style={{
              backgroundColor: '#1a0f2e',
              border: `1px solid ${rarityColors[item.rarity]}`,
              borderRadius: '6px',
              padding: 8,
              fontSize: 12,
              color: '#e0d5f0',
              marginTop: 'auto',
            }}>
              <div style={{ color: rarityColors[item.rarity], fontWeight: 'bold', marginBottom: 4 }}>
                {item.name}
              </div>
              <div style={{ opacity: 0.8, marginBottom: 6 }}>
                {item.description}
              </div>
              {item.type !== 'potion' ? (
                <button
                  onClick={() => onEquipItem(item.id)}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    backgroundColor: '#6b4c9a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  装备
                </button>
              ) : (
                <button
                  onClick={() => onUsePotion(item.id)}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    backgroundColor: '#2e8b57',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  使用
                </button>
              )}
            </div>
          );
        })()}
      </div>

      <div
        style={{
          position: 'absolute',
          right: 15,
          top: 60,
          pointerEvents: 'auto',
        }}
      >
        <div style={{
          backgroundColor: 'rgba(26, 15, 46, 0.9)',
          border: '2px solid #6b4c9a',
          borderRadius: '8px',
          padding: 10,
        }}>
          <div style={{
            color: '#d4af37',
            fontFamily: 'serif',
            fontSize: 13,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            🗺️ 地图
          </div>
          {renderMiniMap()}
        </div>
      </div>

      {renderCombatLog()}
      {renderActionHint()}

      {gameState.scene === 'combat' && !gameState.combat.showLoot && (
        <div style={{
          position: 'absolute',
          bottom: 140,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 15,
          pointerEvents: 'auto',
        }}>
          <button
            onClick={() => gameState.combat.turn === 'hero' && !gameState.combat.isAnimating ? null : undefined}
            disabled={gameState.combat.turn !== 'hero' || gameState.combat.isAnimating}
            style={{
              padding: '12px 30px',
              backgroundColor: gameState.combat.turn === 'hero' && !gameState.combat.isAnimating ? '#6b4c9a' : '#2d1f47',
              color: gameState.combat.turn === 'hero' && !gameState.combat.isAnimating ? '#fff' : '#666',
              border: '2px solid #d4af37',
              borderRadius: '8px',
              fontFamily: 'serif',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: gameState.combat.turn === 'hero' && !gameState.combat.isAnimating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ⚔️ 攻击 (空格)
          </button>
          <button
            onClick={() => {}}
            style={{
              padding: '12px 30px',
              backgroundColor: '#2d1f47',
              color: '#e0d5f0',
              border: '2px solid #6b4c9a',
              borderRadius: '8px',
              fontFamily: 'serif',
              fontSize: 16,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🏃 逃跑 (F)
          </button>
        </div>
      )}

      {draggedItem && (
        <div
          ref={dragRef}
          style={{
            position: 'fixed',
            left: dragPos.x - 25,
            top: dragPos.y - 25,
            width: 50,
            height: 50,
            backgroundColor: '#1a0f2e',
            border: rarityBorders[draggedItem.rarity],
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            pointerEvents: 'none',
            opacity: 0.8,
            zIndex: 1000,
          }}
        >
          {itemIcons[draggedItem.type]}
        </div>
      )}
    </div>
  );
};
