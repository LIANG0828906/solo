import { useGameStore } from '../store/useGameStore';
import type { PlayerType, RuneColor } from '../game/types';

const RUNE_NAMES: Record<RuneColor, string> = {
  red: '红色',
  blue: '蓝色',
  yellow: '黄色',
  green: '绿色',
};

export default function UIPanel() {
  const { state, endTurn, restartGame, aiThinking } = useGameStore();
  const { players, currentTurn, turnNumber, actionTaken, gameOver } = state;

  return (
    <>
      <div className="ui-panel left-panel">
        <h2 className="panel-title">玩家信息</h2>

        <div className="info-section">
          <div className="info-row">
            <span className="info-label">回合数</span>
            <span className="info-value turn-number">#{turnNumber}</span>
          </div>
          <div className="info-row">
            <span className="info-label">当前回合</span>
            <span
              className={`info-value ${currentTurn === 'player' ? 'player-color' : 'ai-color'}`}
            >
              {currentTurn === 'player'
                ? '玩家'
                : aiThinking
                  ? 'AI思考中...'
                  : 'AI'}
            </span>
          </div>
        </div>

        <div className="player-section">
          <div className="section-header">
            <span className="dot player-dot" />
            <span>玩家</span>
          </div>
          <PlayerInfo owner="player" players={players} />
        </div>

        <div className="player-section">
          <div className="section-header">
            <span className="dot ai-dot" />
            <span>AI对手</span>
          </div>
          <PlayerInfo owner="ai" players={players} />
        </div>

        <div className="button-group">
          <button
            className="game-btn end-turn-btn"
            onClick={endTurn}
            disabled={gameOver || aiThinking || currentTurn !== 'player'}
          >
            {actionTaken ? '结束回合' : '跳过回合'}
          </button>
          <button className="game-btn restart-btn" onClick={restartGame}>
            重新开始
          </button>
        </div>
      </div>

      <div className="ui-panel right-panel">
        <h2 className="panel-title">游戏说明</h2>
        <div className="help-section">
          <h3 className="help-title">操作方式</h3>
          <ul className="help-list">
            <li>点击矿车相邻格子铺设轨道</li>
            <li>点击已有轨道相邻格子延伸轨道</li>
            <li>矿车可沿已铺设轨道移动</li>
            <li>每回合只能进行一个操作</li>
          </ul>
        </div>
        <div className="help-section">
          <h3 className="help-title">游戏规则</h3>
          <ul className="help-list">
            <li>到达符文矿点自动采集</li>
            <li>返回基地卸载符文得10分</li>
            <li>避开地裂缝和熔岩陷阱</li>
            <li>先得50分或采集10块符文获胜</li>
          </ul>
        </div>
        <div className="legend-section">
          <h3 className="help-title">图例</h3>
          <div className="legend-grid">
            <div className="legend-item">
              <span className="legend-dot base-player" />
              <span>玩家基地</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot base-ai" />
              <span>AI基地</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot crack-line" />
              <span>地裂缝</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot lava" />
              <span>熔岩</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot rune-red" />
              <span>符文石</span>
            </div>
            <div className="legend-item">
              <span className="legend-track player-track" />
              <span>玩家轨道</span>
            </div>
            <div className="legend-item">
              <span className="legend-track ai-track" />
              <span>AI轨道</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface PlayerInfoProps {
  owner: PlayerType;
  players: ReturnType<typeof useGameStore.getState>['state']['players'];
}

function PlayerInfo({ owner, players }: PlayerInfoProps) {
  const p = players[owner];
  return (
    <div className="player-info">
      <div className="info-row">
        <span className="info-label">积分</span>
        <span className="info-value score">{p.score}</span>
      </div>
      <div className="info-row">
        <span className="info-label">符文数</span>
        <span className="info-value">{p.runesCollected}/10</span>
      </div>
      <div className="info-row">
        <span className="info-label">携带</span>
        <span className="info-value">
          {p.cart.carrying ? (
            <span
              className="carrying-dot"
              style={{
                backgroundColor: getRuneColor(p.cart.carrying),
              }}
            />
          ) : (
            '无'
          )}
          {p.cart.carrying && (
            <span className="carrying-name">
              {RUNE_NAMES[p.cart.carrying]}
            </span>
          )}
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">位置</span>
        <span className="info-value">
          ({p.cart.position.q}, {p.cart.position.r})
        </span>
      </div>
    </div>
  );
}

function getRuneColor(color: RuneColor): string {
  const map: Record<RuneColor, string> = {
    red: '#FF4757',
    blue: '#3742FA',
    yellow: '#FFD93D',
    green: '#6BCB77',
  };
  return map[color];
}
