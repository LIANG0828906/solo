import { useGameStore } from '@/game/GameMaster';
import { RotateCcw, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const level = useGameStore(s => s.level);
  const score = useGameStore(s => s.score);
  const stepsRemaining = useGameStore(s => s.stepsRemaining);
  const availableLenses = useGameStore(s => s.availableLenses);
  const levelComplete = useGameStore(s => s.levelComplete);
  const restartLevel = useGameStore(s => s.restartLevel);
  const nextLevel = useGameStore(s => s.nextLevel);

  return (
    <>
      <aside className="hidden md:flex flex-col w-[150px] h-full text-white"
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #2d2d44 100%)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
        }}>
        <div className="p-3 border-b border-white/10">
          <div className="text-xs text-white/60 mb-1">关卡</div>
          <div className="text-xl font-bold">{level}</div>
        </div>
        <div className="p-3 border-b border-white/10">
          <div className="text-xs text-white/60 mb-1">分数</div>
          <div className="text-xl font-bold text-yellow-400">{score}</div>
        </div>
        <div className="p-3 border-b border-white/10">
          <div className="text-xs text-white/60 mb-1">剩余步数</div>
          <div className={`text-xl font-bold ${stepsRemaining <= 3 ? 'text-red-400' : 'text-green-400'}`}>
            {stepsRemaining}
          </div>
        </div>
        <div className="p-3 flex-1 overflow-y-auto">
          <div className="text-xs text-white/60 mb-3">可用透镜</div>
          <div className="flex flex-col gap-2">
            {availableLenses.map(lens => (
              <div
                key={lens.id}
                draggable
                onDragStart={e => e.dataTransfer.setData('lensId', lens.id)}
                className="flex items-center justify-center p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:bg-white/10"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full relative"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #4FC3F7 0%, #1E88E5 100%)',
                    boxShadow: 'inset 0 0 10px rgba(79,195,247,0.4), 0 0 8px rgba(79,195,247,0.3)',
                  }}
                />
              </div>
            ))}
            {availableLenses.length === 0 && (
              <div className="text-xs text-white/40 text-center py-2">无可用透镜</div>
            )}
          </div>
        </div>
        <div className="p-3 border-t border-white/10 flex flex-col gap-2">
          <button
            onClick={restartLevel}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm transition-all hover:bg-white/10 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <RotateCcw size={14} />
            重新开始
          </button>
          {levelComplete && (
            <button
              onClick={nextLevel}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(90deg, #4CAF50, #8BC34A)', color: '#fff' }}
            >
              下一关
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </aside>

      <div className="md:hidden flex items-center gap-2 h-[60px] px-3 text-white w-full"
        style={{
          background: 'linear-gradient(90deg, #1a1a2e 0%, #2d2d44 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
        <div className="flex items-center gap-3 text-xs">
          <div>
            <span className="text-white/60">关卡</span>
            <span className="font-bold ml-1">{level}</span>
          </div>
          <div>
            <span className="text-white/60">分数</span>
            <span className="font-bold ml-1 text-yellow-400">{score}</span>
          </div>
          <div>
            <span className="text-white/60">步数</span>
            <span className={`font-bold ml-1 ${stepsRemaining <= 3 ? 'text-red-400' : 'text-green-400'}`}>
              {stepsRemaining}
            </span>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-1 overflow-x-auto justify-end">
          {availableLenses.map(lens => (
            <div
              key={lens.id}
              draggable
              onDragStart={e => e.dataTransfer.setData('lensId', lens.id)}
              className="flex items-center justify-center p-1.5 rounded-md cursor-grab active:cursor-grabbing flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div
                className="w-6 h-6 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #4FC3F7 0%, #1E88E5 100%)',
                  boxShadow: 'inset 0 0 8px rgba(79,195,247,0.4)',
                }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={restartLevel}
          className="p-1.5 rounded-md flex-shrink-0 transition-all hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <RotateCcw size={16} />
        </button>
        {levelComplete && (
          <button
            onClick={nextLevel}
            className="p-1.5 rounded-md flex-shrink-0 transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(90deg, #4CAF50, #8BC34A)' }}
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </>
  );
}
