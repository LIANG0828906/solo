import './WaitingRoom.css';

interface WaitingRoomProps {
  playerName?: string;
}

export function WaitingRoom({ playerName = '玩家' }: WaitingRoomProps) {
  return (
    <div className="waiting-room">
      <div className="waiting-content">
        <h1 className="game-title">策略战棋</h1>
        <p className="game-subtitle">5×5 网格对战</p>

        <div className="waiting-animation">
          <div className="pulse-dots">
            <span className="dot dot-1" />
            <span className="dot dot-2" />
            <span className="dot dot-3" />
          </div>
        </div>

        <div className="waiting-text">
          <span className="waiting-label">等待对手中</span>
          <span className="waiting-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>

        <div className="player-info-waiting">
          <div className="player-badge">
            <span className="badge-label">你</span>
            <span className="badge-name">{playerName}</span>
          </div>
        </div>

        <div className="game-rules">
          <h3 className="rules-title">游戏规则</h3>
          <ul className="rules-list">
            <li>每回合移动 1 格（上下左右）</li>
            <li>移动到未占领格子自动占领</li>
            <li>踩到对方棋子触发骰子对战</li>
            <li>陷阱扣 1 分，加速格得 2 分并获得连动</li>
            <li>占领格子最多者获胜</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
