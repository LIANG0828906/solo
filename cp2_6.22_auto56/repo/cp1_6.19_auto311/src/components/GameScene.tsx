import { useCallback, useRef, useState, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useGameStore } from '../gameStore';
import type { DoorColor, ItemType } from '../types';
import { cn } from '../lib/utils';

const INTERACTION_ZONES = [
  { id: 'bookshelf-tl', x: 5, y: 15, width: 12, height: 20, name: '左上书架边缘' },
  { id: 'bookshelf-tr', x: 83, y: 15, width: 12, height: 20, name: '右上书架边缘' },
  { id: 'carpet-bl', x: 5, y: 75, width: 15, height: 20, name: '左下地毯角落' },
  { id: 'carpet-br', x: 80, y: 75, width: 15, height: 20, name: '右下地毯角落' },
  { id: 'book-pages', x: 3, y: 40, width: 10, height: 25, name: '书页之间' },
  { id: 'chandelier', x: 78, y: 3, width: 18, height: 12, name: '吊灯反光' },
];

const ITEM_ICONS: Record<ItemType, string> = {
  'key-red': '🔑',
  'key-blue': '🔑',
  'key-green': '🔑',
  'rune-1': '☀️',
  'rune-2': '🌙',
};

const DOOR_COLORS: Record<DoorColor, { bg: string; glow: string }> = {
  red: { bg: 'linear-gradient(180deg, #8b0000 0%, #dc143c 50%, #8b0000 100%)', glow: '0 0 10px #ff4757' },
  blue: { bg: 'linear-gradient(180deg, #00008b 0%, #4169e1 50%, #00008b 100%)', glow: '0 0 10px #3742fa' },
  green: { bg: 'linear-gradient(180deg, #006400 0%, #32cd32 50%, #006400 100%)', glow: '0 0 10px #2ed573' },
};

const KEY_COLOR_MAP: Record<ItemType, DoorColor> = {
  'key-red': 'red',
  'key-blue': 'blue',
  'key-green': 'green',
  'rune-1': 'red',
  'rune-2': 'red',
};

export default function GameScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [shakingDoor, setShakingDoor] = useState<string | null>(null);
  const [altarDragOver, setAltarDragOver] = useState(false);
  const [victoryParticles, setVictoryParticles] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);

  const {
    items,
    doors,
    highlightItem,
    altarVisible,
    gameComplete,
    ripples,
    draggingItem,
    dragPosition,
    inventory,
    discoverItem,
    collectItem,
    collectClue,
    addRipple,
    unlockDoor,
    synthesizeRune,
    setHighlightItem,
    setDraggingItem,
    setDragPosition,
    resetGame,
  } = useGameStore(
    (state) => ({
      items: state.items,
      doors: state.doors,
      highlightItem: state.highlightItem,
      altarVisible: state.altarVisible,
      gameComplete: state.gameComplete,
      ripples: state.ripples,
      draggingItem: state.draggingItem,
      dragPosition: state.dragPosition,
      inventory: state.inventory,
      discoverItem: state.discoverItem,
      collectItem: state.collectItem,
      collectClue: state.collectClue,
      addRipple: state.addRipple,
      unlockDoor: state.unlockDoor,
      synthesizeRune: state.synthesizeRune,
      setHighlightItem: state.setHighlightItem,
      setDraggingItem: state.setDraggingItem,
      setDragPosition: state.setDragPosition,
      resetGame: state.resetGame,
    }),
    shallow
  );

  const clues = useGameStore((state) => state.clues);

  useEffect(() => {
    if (gameComplete) {
      const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ['#FFD700', '#FF6347', '#00d2ff', '#2ed573'][Math.floor(Math.random() * 4)],
        delay: Math.random() * 0.5,
      }));
      setVictoryParticles(particles);
    } else {
      setVictoryParticles([]);
    }
  }, [gameComplete]);

  const getRelativePosition = useCallback((clientX: number, clientY: number) => {
    if (!sceneRef.current) return { x: 0, y: 0 };
    const rect = sceneRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const checkInteractionZone = useCallback((x: number, y: number) => {
    return INTERACTION_ZONES.find(
      (zone) =>
        x >= zone.x &&
        x <= zone.x + zone.width &&
        y >= zone.y &&
        y <= zone.y + zone.height
    );
  }, []);

  const checkItemAtPosition = useCallback((x: number, y: number) => {
    return items.find(
      (item) =>
        !item.collected &&
        item.discovered &&
        Math.abs(item.x / 8 - x) < 4 &&
        Math.abs(item.y / 6 - y) < 4
    );
  }, [items]);

  const checkDoorAtPosition = useCallback((x: number, y: number) => {
    return doors.find(
      (door) =>
        Math.abs(door.x / 8 + 6 - x) < 8 &&
        y < 35
    );
  }, [doors]);

  const checkClueAtPosition = useCallback((x: number, y: number) => {
    const cluePositions = [
      { id: 'clue-red', x: 20, y: 55 },
      { id: 'clue-blue', x: 45, y: 50 },
      { id: 'clue-green', x: 70, y: 55 },
    ];
    return cluePositions.find(
      (pos) => Math.abs(pos.x - x) < 5 && Math.abs(pos.y - y) < 5
    );
  }, []);

  const handleSceneClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (draggingItem) return;

      const { x, y } = getRelativePosition(e.clientX, e.clientY);
      addRipple(e.clientX, e.clientY);

      const zone = checkInteractionZone(x, y);
      if (zone) {
        const undiscoveredItem = items.find(
          (item) =>
            !item.discovered &&
            !item.collected &&
            Math.abs(item.x / 8 - x) < 10 &&
            Math.abs(item.y / 6 - y) < 10
        );
        if (undiscoveredItem) {
          discoverItem(undiscoveredItem.id);
          setTimeout(() => collectItem(undiscoveredItem.id), 800);
        }
      }

      const item = checkItemAtPosition(x, y);
      if (item) {
        collectItem(item.id);
        return;
      }

      const cluePos = checkClueAtPosition(x, y);
      if (cluePos) {
        const clue = clues.find((c) => c.id === cluePos.id);
        if (clue && !clue.collected) {
          collectClue(clue.id);
        }
        return;
      }
    },
    [draggingItem, getRelativePosition, addRipple, checkInteractionZone, checkItemAtPosition, checkClueAtPosition, items, discoverItem, collectItem, collectClue, clues]
  );

  const handleDoorClick = useCallback(
    (doorColor: DoorColor) => {
      const door = doors.find((d) => d.color === doorColor);
      if (!door) return;

      if (door.unlocked) return;

      if (draggingItem && KEY_COLOR_MAP[draggingItem] === doorColor) {
        const success = unlockDoor(doorColor, draggingItem);
        if (success) {
          setDraggingItem(null);
        }
        return;
      }

      const keyType = `key-${doorColor}` as ItemType;
      if (inventory.includes(keyType)) {
        unlockDoor(doorColor, keyType);
        return;
      }

      setShakingDoor(doorColor);
      setTimeout(() => setShakingDoor(null), 400);
    },
    [doors, draggingItem, inventory, unlockDoor, setDraggingItem]
  );

  const handleItemPointerDown = useCallback(
    (e: React.PointerEvent, itemType: ItemType, itemId: string) => {
      e.stopPropagation();
      if (!inventory.includes(itemType)) {
        collectItem(itemId);
        return;
      }
      setDraggingItem(itemType, { x: e.clientX, y: e.clientY });
    },
    [inventory, collectItem, setDraggingItem]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingItem) {
        setDragPosition({ x: e.clientX, y: e.clientY });

        const { x, y } = getRelativePosition(e.clientX, e.clientY);
        if (altarVisible && x > 35 && x < 65 && y > 40 && y < 65) {
          setAltarDragOver(true);
        } else {
          setAltarDragOver(false);
        }
      }
    },
    [draggingItem, setDragPosition, getRelativePosition, altarVisible]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingItem) return;

      const { x, y } = getRelativePosition(e.clientX, e.clientY);

      const door = checkDoorAtPosition(x, y);
      if (door && !door.unlocked && KEY_COLOR_MAP[draggingItem] === door.color) {
        const success = unlockDoor(door.color, draggingItem);
        if (success) {
          setDraggingItem(null);
          setAltarDragOver(false);
          return;
        }
      }

      if (altarVisible && x > 35 && x < 65 && y > 40 && y < 65) {
        if (draggingItem.startsWith('rune-')) {
          const success = synthesizeRune();
          if (success) {
            setDraggingItem(null);
            setAltarDragOver(false);
            return;
          }
        }
      }

      setDraggingItem(null);
      setAltarDragOver(false);
    },
    [draggingItem, getRelativePosition, checkDoorAtPosition, unlockDoor, altarVisible, synthesizeRune, setDraggingItem]
  );

  const renderItem = (item: typeof items[0]) => {
    if (item.collected) return null;

    const isHighlighted = highlightItem === item.id;
    const leftPercent = (item.x / 800) * 100;
    const topPercent = (item.y / 600) * 100;

    return (
      <div
        key={item.id}
        className={cn(
          'absolute flex items-center justify-center text-2xl transition-all duration-300 select-none',
          !item.discovered && 'opacity-15',
          item.discovered && 'cursor-pointer item-hover',
          isHighlighted && 'animate-pulse'
        )}
        style={{
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
          transform: 'translate(-50%, -50%)',
          width: '48px',
          height: '48px',
          filter: item.discovered ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))' : 'none',
          animation: isHighlighted ? 'pulse-highlight 1.5s ease-in-out infinite' : undefined,
        }}
        onPointerDown={(e) => handleItemPointerDown(e, item.type, item.id)}
        onMouseEnter={() => item.discovered && setHighlightItem(item.id)}
        onMouseLeave={() => setHighlightItem(null)}
      >
        <span style={{ filter: !item.discovered ? 'grayscale(100%) brightness(0.5)' : 'none' }}>
          {ITEM_ICONS[item.type]}
        </span>
        {isHighlighted && (
          <div
            className="absolute -top-6 text-xl"
            style={{ animation: 'bounce 0.6s ease-in-out infinite' }}
          >
            👇
          </div>
        )}
      </div>
    );
  };

  const renderDoor = (door: typeof doors[0]) => {
    const leftPercent = (door.x / 800) * 100;
    const colorScheme = DOOR_COLORS[door.color];
    const isShaking = shakingDoor === door.color;

    return (
      <div
        key={door.id}
        className="absolute"
        style={{
          left: `${leftPercent}%`,
          top: '8%',
          transform: 'translateX(-50%)',
          width: '12%',
          height: '25%',
        }}
      >
        <div
          className={cn(
            'relative w-full h-full rounded-t-lg overflow-hidden cursor-pointer transition-all duration-300',
            isShaking && 'door-shake'
          )}
          style={{
            background: colorScheme.bg,
            boxShadow: door.unlocked ? 'none' : colorScheme.glow,
            opacity: door.unlocked ? 0.4 : 1,
          }}
          onClick={() => handleDoorClick(door.color)}
        >
          {!door.unlocked && (
            <>
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
              >
                🔒
              </div>
              <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-t-lg" />
              <div className="absolute top-2 left-2 right-2 h-1 bg-black/30 rounded" />
              <div className="absolute top-5 left-2 right-2 h-1 bg-black/30 rounded" />
              <div className="absolute top-8 left-2 right-2 h-1 bg-black/30 rounded" />
            </>
          )}
          {door.unlocked && (
            <>
              <div
                className="absolute top-0 left-0 w-1/2 h-full"
                style={{
                  background: colorScheme.bg,
                  animation: 'door-slide-left 0.8s ease-out forwards',
                }}
              />
              <div
                className="absolute top-0 right-0 w-1/2 h-full"
                style={{
                  background: colorScheme.bg,
                  animation: 'door-slide-right 0.8s ease-out forwards',
                }}
              />
            </>
          )}
        </div>
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-yellow-400/80 font-medium">
          {door.color === 'red' ? '火之门' : door.color === 'blue' ? '水之门' : '木之门'}
        </div>
      </div>
    );
  };

  const renderClue = (clue: typeof clues[0], index: number) => {
    if (clue.collected) return null;

    const positions = [
      { x: 20, y: 55 },
      { x: 45, y: 50 },
      { x: 70, y: 55 },
    ];
    const pos = positions[index] || { x: 50, y: 50 };

    return (
      <div
        key={clue.id}
        className="absolute cursor-pointer item-hover clue-highlight"
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: 'translate(-50%, -50%)',
          width: '40px',
          height: '50px',
        }}
        onClick={(e) => {
          e.stopPropagation();
          collectClue(clue.id);
        }}
      >
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-amber-100 to-amber-200 rounded border-2 border-amber-600 shadow-lg">
          <span className="text-2xl">📜</span>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={sceneRef}
      className="relative overflow-hidden select-none"
      style={{
        width: '800px',
        height: '600px',
        background: `
          linear-gradient(180deg, 
            rgba(30, 20, 10, 0.95) 0%, 
            rgba(60, 40, 20, 0.9) 25%,
            rgba(80, 50, 25, 0.85) 50%,
            rgba(60, 35, 15, 0.9) 75%,
            rgba(40, 25, 10, 0.95) 100%
          ),
          repeating-linear-gradient(90deg, 
            transparent 0px, 
            transparent 80px, 
            rgba(139, 90, 43, 0.1) 80px, 
            rgba(139, 90, 43, 0.1) 82px
          ),
          repeating-linear-gradient(0deg,
            transparent 0px,
            transparent 120px,
            rgba(101, 67, 33, 0.15) 120px,
            rgba(101, 67, 33, 0.15) 140px
          )
        `,
        borderRadius: '12px',
        boxShadow: '0 0 40px rgba(0, 0, 0, 0.5), inset 0 0 100px rgba(0, 0, 0, 0.3)',
        cursor: draggingItem ? 'grabbing' : 'default',
      }}
      onClick={handleSceneClick}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1/4"
        style={{
          background: `
            repeating-linear-gradient(90deg,
              rgba(101, 67, 33, 0.6) 0px,
              rgba(101, 67, 33, 0.6) 60px,
              rgba(139, 90, 43, 0.4) 60px,
              rgba(139, 90, 43, 0.4) 65px,
              rgba(101, 67, 33, 0.6) 65px,
              rgba(101, 67, 33, 0.6) 125px
            )
          `,
        }}
      >
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0"
            style={{
              left: `${i * 8.33}%`,
              width: '7%',
              height: '70%',
              background: `linear-gradient(180deg, 
                rgba(139, 69, 19, 0.8) 0%,
                rgba(160, 82, 45, 0.6) 100%
              )`,
              borderRadius: '2px 2px 0 0',
            }}
          >
            <div
              className="absolute top-2 left-1 right-1 h-3 rounded-sm"
              style={{ background: ['#8B4513', '#A0522D', '#6B4423', '#8B4513'][i % 4] }}
            />
            <div
              className="absolute top-7 left-1 right-1 h-3 rounded-sm"
              style={{ background: ['#A0522D', '#6B4423', '#8B4513', '#A0522D'][i % 4] }}
            />
          </div>
        ))}
      </div>

      <div
        className="absolute top-2 left-1/2 transform -translate-x-1/2"
        style={{
          width: '150px',
          height: '80px',
          background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
        }}
      >
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-16 bg-gradient-to-b from-gray-600 to-gray-800 rounded-b-lg" />
        <div className="absolute top-14 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-gradient-to-b from-amber-500 to-amber-700 rounded-full shadow-lg">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 w-1 bg-gradient-to-t from-transparent via-amber-300 to-white"
              style={{
                left: `${20 + i * 15}%`,
                height: '20px',
                opacity: 0.8 + Math.random() * 0.2,
                animation: `flicker ${1.5 + Math.random()}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        style={{
          width: '70%',
          height: '35%',
          background: `
            radial-gradient(ellipse at center, rgba(139, 0, 0, 0.4) 0%, transparent 70%),
            repeating-linear-gradient(45deg,
              rgba(139, 0, 0, 0.2) 0px,
              rgba(139, 0, 0, 0.2) 20px,
              rgba(100, 0, 0, 0.3) 20px,
              rgba(100, 0, 0, 0.3) 40px
            ),
            linear-gradient(180deg, rgba(80, 0, 0, 0.5) 0%, rgba(50, 0, 0, 0.6) 100%)
          `,
          borderRadius: '8px',
          boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5)',
        }}
      />

      {doors.map(renderDoor)}

      {INTERACTION_ZONES.map((zone) => (
        <div
          key={zone.id}
          className="absolute cursor-pointer transition-all duration-300 hover:bg-white/5"
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
          }}
          title={zone.name}
        />
      ))}

      {clues.map((clue, index) => renderClue(clue, index))}

      {items.map(renderItem)}

      {altarVisible && (
        <div
          className={cn(
            'absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700',
            altarDragOver && 'scale-105'
          )}
          style={{
            width: '180px',
            height: '150px',
            opacity: altarVisible ? 1 : 0,
          }}
        >
          <div
            className="w-full h-full rounded-lg p-4"
            style={{
              background: `
                linear-gradient(180deg, #2d1810 0%, #1a0f0a 100%),
                linear-gradient(135deg, #4a2c17 0%, #2d1810 50%, #1a0f0a 100%)
              `,
              border: altarDragOver ? '3px solid #FFD700' : '2px solid #8B4513',
              boxShadow: altarDragOver
                ? '0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 215, 0, 0.2)'
                : '0 10px 30px rgba(0, 0, 0, 0.6), inset 0 2px 10px rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: `
                    radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%),
                    conic-gradient(from 0deg, #8B4513, #A0522D, #8B4513)
                  `,
                  border: '2px solid #DAA520',
                }}
              >
                <span className="text-4xl">⚱️</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-yellow-400 whitespace-nowrap">
            符文祭坛
          </div>
        </div>
      )}

      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="ripple-effect"
          style={{
            left: ripple.x,
            top: ripple.y,
            position: 'fixed',
          }}
        />
      ))}

      {draggingItem && dragPosition && (
        <div
          className="fixed pointer-events-none z-50 text-3xl"
          style={{
            left: dragPosition.x,
            top: dragPosition.y,
            transform: 'translate(-50%, -50%) rotate(-10deg)',
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))',
            animation: 'drag-float 0.5s ease-in-out infinite alternate',
          }}
        >
          {ITEM_ICONS[draggingItem]}
        </div>
      )}

      {gameComplete && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.3) 0%, rgba(0, 0, 0, 0.7) 100%)',
            animation: 'victory-fade-in 2s ease-out forwards',
          }}
        >
          {victoryParticles.map((particle) => (
            <div
              key={particle.id}
              className="victory-particle"
              style={{
                left: `${particle.x}%`,
                bottom: '20%',
                backgroundColor: particle.color,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}

          <h1
            className="text-5xl font-bold mb-4"
            style={{
              color: '#FFD700',
              textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4)',
              fontFamily: "'Cinzel Decorative', serif",
              animation: 'text-glow 2s ease-in-out infinite alternate',
            }}
          >
            Quest Complete
          </h1>

          <p
            className="text-xl text-yellow-200 mb-8"
            style={{
              animation: 'fade-in-up 1s ease-out 0.5s both',
            }}
          >
            恭喜你完成了古老图书馆的探索！
          </p>

          <button
            className="px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#1a1a2e',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
              animation: 'fade-in-up 1s ease-out 1s both',
            }}
            onClick={resetGame}
          >
            Play Again
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse-highlight {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.8));
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            filter: drop-shadow(0 0 20px rgba(255, 215, 0, 1));
          }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes flicker {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        @keyframes door-slide-left {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(-100%); opacity: 0; }
        }

        @keyframes door-slide-right {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        @keyframes drag-float {
          0% { transform: translate(-50%, -50%) rotate(-10deg) translateY(0); }
          100% { transform: translate(-50%, -50%) rotate(-10deg) translateY(-5px); }
        }

        @keyframes victory-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes text-glow {
          0% {
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4);
          }
          100% {
            text-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 0 60px rgba(255, 215, 0, 0.6), 0 0 80px rgba(255, 215, 0, 0.4);
          }
        }

        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
