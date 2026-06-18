import { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';

export default function PlayerList() {
  const rankings = useGameStore((s) => s.rankings);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const phase = useGameStore((s) => s.phase);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const content = (
    <div className="flex flex-col gap-2">
      {rankings.map((r, i) => {
        const isCurrentPlayer = r.playerId === currentPlayerId;
        return (
          <div
            key={r.playerId}
            className="player-list-item flex items-center gap-3 h-[60px] px-3 rounded-xl transition-all duration-400 ease-out"
            style={{
              transform: `translateY(${0}px)`,
              backgroundColor: isCurrentPlayer && phase === 'playing' ? '#FFD70030' : 'transparent',
            }}
          >
            <span className="text-[#A0A0A0] text-sm font-bold w-5 text-center">
              {i + 1}
            </span>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: r.avatarColor }}
            >
              {r.nickname.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {i === 0 && r.score > 0 && (
                  <span className="text-sm">👑</span>
                )}
                <span className="text-white text-sm font-medium truncate">
                  {r.nickname}
                </span>
              </div>
            </div>
            <span className="score-number text-[#6C63FF] font-bold text-sm">
              {r.score}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="hidden md:block w-[240px] flex-shrink-0">
        <div className="player-list-panel h-full rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-[#6C63FF]" />
            <span className="text-white text-sm font-semibold">玩家排名</span>
          </div>
          {content}
        </div>
      </div>

      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-10 h-10 rounded-full bg-[#1A1A2E80] backdrop-blur flex items-center justify-center border border-[#FFFFFF20]"
        >
          {mobileOpen ? (
            <ChevronUp className="w-5 h-5 text-white" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white" />
          )}
        </button>

        {mobileOpen && (
          <div className="mt-2 w-[240px] player-list-panel rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[#6C63FF]" />
              <span className="text-white text-sm font-semibold">玩家排名</span>
            </div>
            {content}
          </div>
        )}
      </div>
    </>
  );
}
