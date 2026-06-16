import { useCallback, useState, useRef, useEffect } from 'react';
import { useRoomStore } from '../store/roomStore';
import { pickItem } from '../../sync/socketSync';
import type { InteractionPoint, Item } from '../../types';

function playPickupSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => ctx.close(), 500);
  } catch {
    // ignore audio errors
  }
}

function InteractionPointMarker({
  point,
  items,
  onInteract,
}: {
  point: InteractionPoint;
  items: Item[];
  onInteract: (point: InteractionPoint) => void;
}) {
  const hasUnpickedItems = items.some((item) => !item.picked);
  const allPicked = items.length > 0 && items.every((item) => item.picked);

  return (
    <button
      className={`absolute group transition-all duration-300 ${
        allPicked
          ? 'opacity-40 cursor-default'
          : hasUnpickedItems
          ? 'cursor-pointer hover:scale-110'
          : 'cursor-pointer hover:scale-110'
      }`}
      style={{
        left: `${point.posX}%`,
        top: `${point.posY}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={() => !allPicked && onInteract(point)}
      disabled={allPicked}
    >
      <div
        className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 ${
          allPicked
            ? 'border-gray-400 bg-gray-200/50'
            : 'border-amber-600 bg-amber-100/80'
        }`}
      >
        <span className={`text-lg ${allPicked ? 'text-gray-400' : 'text-amber-800'}`}>
          {point.id === 'desk' && '📖'}
          {point.id === 'bookshelf' && '📚'}
          {point.id === 'fireplace' && '🔥'}
          {point.id === 'experiment-table' && '⚗️'}
          {point.id === 'microscope' && '🔬'}
          {point.id === 'cabinet' && '🗄️'}
          {point.id === 'old-chest' && '🧳'}
          {point.id === 'dusty-painting' && '🖼️'}
          {point.id === 'broken-clock' && '🕰️'}
          {point.id === 'final-puzzle' && '🔮'}
          {point.id === 'stone-tablet' && '🪨'}
          {point.id === 'ancient-door' && '🚪'}
        </span>
        {!allPicked && (
          <span className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-40" />
        )}
      </div>
      <span
        className={`absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs px-2 py-0.5 rounded transition-opacity ${
          allPicked ? 'text-gray-400' : 'text-amber-900 bg-amber-50/90'
        } opacity-0 group-hover:opacity-100`}
      >
        {point.label}
      </span>
    </button>
  );
}

function AreaBackground({ areaId }: { areaId: string }) {
  const bgConfig: Record<string, { elements: string[]; accent: string }> = {
    study: {
      elements: ['📖', '🕯️', '📜', '🖋️', '🏛️'],
      accent: '#8D6E63',
    },
    laboratory: {
      elements: ['⚗️', '🧪', '🔬', '💡', '🧲'],
      accent: '#4FC3F7',
    },
    attic: {
      elements: ['🕯️', '🕸️', '📦', '🪟', '🗝️'],
      accent: '#A1887F',
    },
    'secret-room': {
      elements: ['🔮', '✨', '🔱', '📜', '🕯️'],
      accent: '#CE93D8',
    },
  };

  const config = bgConfig[areaId] ?? bgConfig.study;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 40%, rgba(141, 110, 99, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 60%, rgba(141, 110, 99, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #F5E6CA 0%, #EFD9B4 50%, #E8D0A8 100%)
          `,
        }}
      />
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.12 }}>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#5D4037" strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {config.elements.map((emoji, i) => (
        <span
          key={i}
          className="absolute text-2xl opacity-10 select-none"
          style={{
            left: `${15 + (i * 17) % 70}%`,
            top: `${10 + (i * 23) % 80}%`,
            transform: `rotate(${i * 15 - 30}deg)`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}

function DetailModal({
  point,
  items,
  onClose,
}: {
  point: InteractionPoint;
  items: Item[];
  onClose: () => void;
}) {
  const playerId = useRoomStore((s) => s.playerId);
  const availableItems = items.filter((item) => !item.picked);
  const pickedItems = items.filter((item) => item.picked);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-2xl border-2 border-amber-300 p-6 max-w-md w-full mx-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-amber-200 hover:bg-amber-300 flex items-center justify-center text-amber-800 transition-all hover:-translate-y-0.5"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-xl font-serif font-bold text-amber-900 mb-4 flex items-center gap-2">
          {point.id === 'desk' && '📖'}
          {point.id === 'bookshelf' && '📚'}
          {point.id === 'fireplace' && '🔥'}
          {point.id === 'experiment-table' && '⚗️'}
          {point.id === 'microscope' && '🔬'}
          {point.id === 'cabinet' && '🗄️'}
          {point.id === 'old-chest' && '🧳'}
          {point.id === 'dusty-painting' && '🖼️'}
          {point.id === 'broken-clock' && '🕰️'}
          {point.id === 'final-puzzle' && '🔮'}
          {point.id === 'stone-tablet' && '🪨'}
          {point.id === 'ancient-door' && '🚪'}
          {point.label}
        </h3>

        <div className="space-y-3 mb-4">
          <p className="text-sm text-amber-700/70 italic">仔细观察这里……</p>

          {availableItems.length > 0 && (
            <div className="space-y-2">
              {availableItems.map((item) => (
                <button
                  key={item.id}
                  className="group flex items-center gap-3 w-full p-3 rounded-xl bg-blue-50 border-2 border-blue-200 hover:border-amber-400 hover:bg-amber-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-grab active:cursor-grabbing"
                  onClick={() => {
                    pickItem(item.id, item.areaId);
                    playPickupSound();
                  }}
                >
                  <span
                    className="w-[50px] h-[50px] rounded-full bg-[#B3E5FC] flex items-center justify-center text-xl shrink-0 transition-transform duration-300 group-hover:scale-[1.2]"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', item.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    {item.iconEmoji}
                  </span>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-amber-900">{item.name}</div>
                    <div className="text-xs text-amber-600/80">{item.description}</div>
                    <div className="text-xs text-blue-500 mt-0.5">💡 {item.hint}</div>
                  </div>
                  <span className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                    拾取 →
                  </span>
                </button>
              ))}
            </div>
          )}

          {pickedItems.length > 0 && (
            <div className="space-y-1">
              {pickedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 opacity-50"
                >
                  <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                    {item.iconEmoji}
                  </span>
                  <span className="text-sm text-gray-500 line-through">{item.name}</span>
                  <span className="text-xs text-gray-400">已被拾取</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RoomScene() {
  const currentAreaId = useRoomStore((s) => s.currentAreaId);
  const areas = useRoomStore((s) => s.areas);
  const items = useRoomStore((s) => s.items);
  const interactionPoints = useRoomStore((s) => s.interactionPoints);
  const setCurrentArea = useRoomStore((s) => s.setCurrentArea);
  const gameComplete = useRoomStore((s) => s.gameComplete);
  const revealMessage = useRoomStore((s) => s.revealMessage);
  const setRevealMessage = useRoomStore((s) => s.setRevealMessage);
  const players = useRoomStore((s) => s.players);

  const [selectedPoint, setSelectedPoint] = useState<InteractionPoint | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [prevArea, setPrevArea] = useState(currentAreaId);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (prevArea !== currentAreaId) {
      setTransitioning(true);
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => {
        setPrevArea(currentAreaId);
        setTransitioning(false);
      }, 500);
    }
  }, [currentAreaId, prevArea]);

  useEffect(() => {
    return () => clearTimeout(fadeTimerRef.current);
  }, []);

  const handleAreaSwitch = useCallback(
    (areaId: string) => {
      if (areaId !== currentAreaId) {
        setCurrentArea(areaId);
      }
    },
    [currentAreaId, setCurrentArea]
  );

  const currentPoints = interactionPoints.filter((p) => p.areaId === currentAreaId);
  const currentItems = items.filter((i) => i.areaId === currentAreaId);

  if (gameComplete) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100 animate-fade-in">
        <div className="text-center p-8">
          <div className="text-6xl mb-6">🏆</div>
          <h1 className="text-4xl font-serif font-bold text-amber-900 mb-4">
            恭喜逃脱成功！
          </h1>
          <p className="text-lg text-amber-700">
            你们成功解开了所有谜题，逃出了密室！
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-900/90 backdrop-blur-sm z-10 overflow-x-auto">
        {areas.map((area) => (
          <button
            key={area.id}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              !area.unlocked
                ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                : currentAreaId === area.id
                ? 'bg-amber-600 text-white shadow-lg hover:bg-amber-500 hover:-translate-y-0.5'
                : 'bg-amber-800/60 text-amber-200 hover:bg-amber-700 hover:-translate-y-0.5'
            }`}
            onClick={() => area.unlocked && handleAreaSwitch(area.id)}
            disabled={!area.unlocked}
          >
            {!area.unlocked && '🔒 '}{area.name}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-700/50 text-amber-100 text-xs"
            >
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {p.name}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            transitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <AreaBackground areaId={currentAreaId} />

          {currentPoints.map((point) => (
            <InteractionPointMarker
              key={point.id}
              point={point}
              items={currentItems.filter((i) => i.interactionPointId === point.id)}
              onInteract={setSelectedPoint}
            />
          ))}

          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-amber-900/20 to-transparent pointer-events-none" />
        </div>

        {selectedPoint && (
          <DetailModal
            point={selectedPoint}
            items={items.filter((i) => i.interactionPointId === selectedPoint.id)}
            onClose={() => setSelectedPoint(null)}
          />
        )}
      </div>

      {revealMessage && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-fade-in"
          onClick={() => setRevealMessage(null)}
        >
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-400 rounded-2xl shadow-2xl p-8 max-w-lg text-center cursor-pointer">
            <div className="text-3xl mb-4">✨</div>
            <p className="text-amber-900 text-lg font-serif">{revealMessage}</p>
            <p className="text-amber-600/60 text-sm mt-3">点击关闭</p>
          </div>
        </div>
      )}
    </div>
  );
}
