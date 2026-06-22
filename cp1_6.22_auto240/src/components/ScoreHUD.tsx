interface ScoreHUDProps {
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
}

export function ScoreHUD({
  score,
  combo,
  maxCombo,
  perfectCount,
  goodCount,
  missCount,
}: ScoreHUDProps) {
  return (
    <div className="score-hud">
      <div className="score-main">{score.toLocaleString()}</div>
      <div className="score-row score-combo">
        <span className="score-label">连击</span>
        <span className="score-value">
          {combo} <span style={{ opacity: 0.5, fontSize: 11 }}>(最高 {maxCombo})</span>
        </span>
      </div>
      <div className="score-row score-perfect">
        <span className="score-label">Perfect</span>
        <span className="score-value">{perfectCount}</span>
      </div>
      <div className="score-row score-good">
        <span className="score-label">Good</span>
        <span className="score-value">{goodCount}</span>
      </div>
      <div className="score-row score-miss">
        <span className="score-label">Miss</span>
        <span className="score-value">{missCount}</span>
      </div>
    </div>
  );
}
