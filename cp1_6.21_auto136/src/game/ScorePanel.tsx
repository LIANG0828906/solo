import { PlayerInfo } from "../types";

interface ScorePanelProps {
  players: PlayerInfo[];
  currentPlayerIndex: number;
  sequenceLength: number;
  round: number;
}

export default function ScorePanel({
  players,
  currentPlayerIndex,
  sequenceLength,
  round,
}: ScorePanelProps) {
  return (
    <div className="score-panel">
      <h3>记分板</h3>
      <div className="sequence-info">
        第{round}轮 · 序列{sequenceLength}
      </div>
      {players.map((player, index) => (
        <div
          key={player.id}
          className={`score-card ${index === currentPlayerIndex ? "is-current" : ""}`}
        >
          <div className="sc-avatar">{player.nickname[0].toUpperCase()}</div>
          <div className="sc-info">
            <div className="sc-name">{player.nickname}</div>
          </div>
          <div className="sc-score">{player.score}</div>
        </div>
      ))}
    </div>
  );
}
