import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface Player {
  id: string;
  username: string;
  avatar?: string;
  score: number;
  lineCount: number;
}

interface ScorePanelProps {
  player1: Player;
  player2: Player;
}

function PlayerCard({ player, isLeft }: { player: Player; isLeft: boolean }) {
  const [animateScore, setAnimateScore] = useState(false);
  const prevScoreRef = useRef(player.score);

  useEffect(() => {
    if (prevScoreRef.current !== player.score) {
      setAnimateScore(true);
      const timer = setTimeout(() => setAnimateScore(false), 300);
      prevScoreRef.current = player.score;
      return () => clearTimeout(timer);
    }
  }, [player.score]);

  return (
    <div
      className={cn(
        "flex flex-col items-center p-4 rounded-xl bg-arena-card border border-arena-border",
        isLeft ? "text-left" : "text-right"
      )}
    >
      <div className="w-16 h-16 rounded-full bg-arena-bg border-2 border-arena-accent flex items-center justify-center mb-3 overflow-hidden">
        {player.avatar ? (
          <img src={player.avatar} alt={player.username} className="w-full h-full object-cover" />
        ) : (
          <User className="w-8 h-8 text-arena-accent" />
        )}
      </div>

      <h3 className="text-arena-text font-semibold text-lg mb-2">{player.username}</h3>

      <div className="flex flex-col items-center gap-1">
        <span
          className={cn(
            "text-4xl font-bold text-arena-accent",
            animateScore && "animate-bounce-score"
          )}
        >
          {player.score}
        </span>
        <span className="text-arena-textMuted text-sm">分</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-arena-textMuted text-sm">代码行数:</span>
        <span className="text-arena-text font-mono font-semibold">{player.lineCount}</span>
      </div>
    </div>
  );
}

export default function ScorePanel({ player1, player2 }: ScorePanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-arena-text text-center mb-2">对战信息</h2>
      <div className="flex flex-col gap-4">
        <PlayerCard player={player1} isLeft={true} />
        <div className="flex items-center justify-center">
          <span className="text-arena-textMuted text-2xl font-bold">VS</span>
        </div>
        <PlayerCard player={player2} isLeft={false} />
      </div>
    </div>
  );
}
