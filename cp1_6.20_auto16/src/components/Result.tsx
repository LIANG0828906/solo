import { Crown, ArrowLeft, Code, Clock, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerResult {
  id: string;
  username: string;
  avatar?: string;
  score: number;
  timeUsed: number;
  lineCount: number;
  code: string;
}

interface ResultProps {
  player1: PlayerResult;
  player2: PlayerResult;
  onBackToLobby: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
}

function CodeDisplay({ code, title }: { code: string; title: string }) {
  const lines = code.split("\n");
  return (
    <div className="bg-arena-card border border-arena-border rounded-xl overflow-hidden">
      <div className="bg-arena-bg border-b border-arena-border px-4 py-2 flex items-center gap-2">
        <Code className="w-4 h-4 text-arena-accent" />
        <span className="text-arena-text font-medium text-sm">{title}</span>
      </div>
      <div className="flex max-h-64 overflow-auto">
        <div className="flex-shrink-0 bg-arena-bg border-r border-arena-border py-3 px-2 select-none">
          {lines.map((_, i) => (
            <div
              key={i}
              className="text-right text-arena-textMuted text-xs font-mono leading-5 h-5 pr-2"
            >
              {i + 1}
            </div>
          ))}
        </div>
        <pre className="flex-1 p-3 overflow-x-auto bg-arena-bg">
          <code className="text-arena-text font-mono text-xs whitespace-pre leading-5">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}

function PlayerCard({
  player,
  isWinner,
  isLeft,
}: {
  player: PlayerResult;
  isWinner: boolean;
  isLeft: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-300",
        isWinner
          ? "bg-gradient-to-br from-arena-card to-arena-accent/10 border-arena-accent"
          : "bg-arena-card border-arena-border"
      )}
    >
      {isWinner && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Crown className="w-10 h-10 text-yellow-400 fill-yellow-400 drop-shadow-lg animate-bounce" />
        </div>
      )}

      <div
        className={cn(
          "w-20 h-20 rounded-full border-4 flex items-center justify-center mb-4 overflow-hidden",
          isWinner ? "border-arena-accent" : "border-arena-border"
        )}
      >
        {player.avatar ? (
          <img src={player.avatar} alt={player.username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-arena-accent/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-arena-accent">
              {player.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <h3
        className={cn(
          "text-xl font-bold mb-1",
          isWinner ? "text-arena-accent" : "text-arena-text"
        )}
      >
        {player.username}
      </h3>

      {isWinner && (
        <span className="text-arena-success text-sm font-semibold mb-4">🎉 获胜!</span>
      )}

      <div className="w-full space-y-3 mt-2">
        <div className="flex items-center justify-between bg-arena-bg rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-arena-accent" />
            <span className="text-arena-textMuted text-sm">得分</span>
          </div>
          <span
            className={cn(
              "font-bold text-lg",
              isWinner ? "text-arena-accent" : "text-arena-text"
            )}
          >
            {player.score}
          </span>
        </div>

        <div className="flex items-center justify-between bg-arena-bg rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-arena-warning" />
            <span className="text-arena-textMuted text-sm">用时</span>
          </div>
          <span className="text-arena-text font-semibold">{formatTime(player.timeUsed)}</span>
        </div>

        <div className="flex items-center justify-between bg-arena-bg rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-arena-success" />
            <span className="text-arena-textMuted text-sm">代码行数</span>
          </div>
          <span className="text-arena-text font-semibold">{player.lineCount}</span>
        </div>
      </div>
    </div>
  );
}

export default function Result({ player1, player2, onBackToLobby }: ResultProps) {
  const player1Wins = player1.score > player2.score;
  const player2Wins = player2.score > player1.score;
  const isDraw = player1.score === player2.score;

  return (
    <div className="min-h-screen bg-arena-bg p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-arena-text mb-2">
            {isDraw ? "🤝 平局!" : "🏆 对战结束!"}
          </h1>
          <p className="text-arena-textMuted">让我们看看双方的表现</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <PlayerCard player={player1} isWinner={player1Wins} isLeft={true} />
          <PlayerCard player={player2} isWinner={player2Wins} isLeft={false} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <CodeDisplay code={player1.code} title={`${player1.username} 的代码`} />
          <CodeDisplay code={player2.code} title={`${player2.username} 的代码`} />
        </div>

        <div className="flex justify-center">
          <button
            onClick={onBackToLobby}
            className="flex items-center gap-2 px-8 py-3 bg-arena-accent hover:bg-arena-accentHover text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            返回大厅
          </button>
        </div>
      </div>
    </div>
  );
}
