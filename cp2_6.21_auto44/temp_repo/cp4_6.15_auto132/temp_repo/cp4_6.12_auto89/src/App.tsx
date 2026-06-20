import { useEffect, useRef } from 'react';
import { useGameEngine } from './useGameEngine';
import { Hero, Skill, LogEntry, AnimationState, GameStatus } from './GameEngine';

interface HeroCardProps {
  hero: Hero;
  isPlayer: boolean;
  isActive: boolean;
}

function HeroCard({ hero, isPlayer, isActive }: HeroCardProps) {
  const hpPercentage = (hero.currentHp / hero.maxHp) * 100;
  const isLowHp = hpPercentage < 30;

  return (
    <div className={`hero-area ${isPlayer ? 'player' : 'opponent'}`}>
      <div className={`hero-avatar ${isActive ? 'active' : ''}`}>
        {hero.emoji}
      </div>
      <div className="hero-name">{hero.name}</div>
      <div className="hero-stats">
        <div className="hp-bar-container">
          <div
            className={`hp-bar ${isLowHp ? 'low' : ''}`}
            style={{ width: `${hpPercentage}%` }}
          >
            <div className="hp-text">
              {hero.currentHp}/{hero.maxHp}
            </div>
          </div>
        </div>
        <div className="defense-text">防御: {hero.currentDefense}</div>
      </div>
    </div>
  );
}

interface SkillButtonProps {
  skill: Skill;
  onClick: () => void;
  disabled: boolean;
}

function SkillButton({ skill, onClick, disabled }: SkillButtonProps) {
  const isOnCooldown = skill.currentCooldown > 0;

  return (
    <button
      className="skill-button"
      onClick={onClick}
      disabled={disabled || isOnCooldown}
    >
      {isOnCooldown && (
        <span className="skill-cooldown">{skill.currentCooldown}</span>
      )}
      <div>{skill.name}</div>
      <div className="skill-description">{skill.description}</div>
    </button>
  );
}

interface BattleLogProps {
  logs: LogEntry[];
}

function BattleLog({ logs }: BattleLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="battle-log">
      <div className="battle-log-title">战斗日志</div>
      <div className="battle-log-content">
        {logs.length === 0 ? (
          <div className="log-entry">战斗开始！选择你的技能吧~</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={log.id}
              className={`log-entry ${index === logs.length - 1 ? 'latest' : ''}`}
            >
              <span className="log-round">第{log.round}回合</span>
              <span>{log.actor} {log.action}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

interface SkillEffectProps {
  animation: AnimationState;
  onComplete: () => void;
}

function SkillEffect({ animation, onComplete }: SkillEffectProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const renderEffect = () => {
    switch (animation.type) {
      case 'pounce':
        return (
          <div
            className={`paw-effect ${
              animation.from === 'player' ? 'from-player' : 'from-opponent'
            }`}
          >
            🐾
          </div>
        );
      case 'shield':
        return (
          <div className={`shield-effect ${animation.from}`}>
            🛡️
          </div>
        );
      case 'heal':
        return (
          <div className={`heal-effect ${animation.from}`}>
            💚
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="effect-area">{renderEffect()}</div>;
}

interface TurnIndicatorProps {
  show: boolean;
  currentTurn: 'player' | 'opponent';
  onHide: () => void;
}

function TurnIndicator({ show, currentTurn, onHide }: TurnIndicatorProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="turn-indicator">
      {currentTurn === 'player' ? '你的回合！' : '对手回合...'}
    </div>
  );
}

interface ResultBannerProps {
  status: GameStatus;
  playerHp: number;
  opponentHp: number;
  round: number;
  onPlayAgain: () => void;
}

function ResultBanner({
  status,
  playerHp,
  opponentHp,
  round,
  onPlayAgain,
}: ResultBannerProps) {
  const getResultText = () => {
    switch (status) {
      case 'playerWin':
        return { title: '胜利！', className: 'win' };
      case 'opponentWin':
        return { title: '失败...', className: 'lose' };
      case 'draw':
        return { title: '平局！', className: 'draw' };
      default:
        return { title: '', className: '' };
    }
  };

  const result = getResultText();

  return (
    <div className="result-overlay">
      <div className="result-banner">
        <div className={`result-title ${result.className}`}>
          {result.title}
        </div>
        <div className="result-stats">
          <div>对战回合: {round} 回合</div>
          <div>你的生命值: {playerHp}</div>
          <div>对手生命值: {opponentHp}</div>
        </div>
        <button className="play-again-button" onClick={onPlayAgain}>
          再来一局
        </button>
      </div>
    </div>
  );
}

function App() {
  const { state, useSkill, endAnimation, hideTurnIndicator, aiTurn, resetGame } =
    useGameEngine();

  useEffect(() => {
    if (
      state.gameStatus === 'playing' &&
      state.currentTurn === 'opponent' &&
      !state.animation &&
      !state.showTurnIndicator
    ) {
      const timer = setTimeout(() => {
        aiTurn();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.currentTurn, state.animation, state.showTurnIndicator, state.gameStatus, aiTurn]);

  const handleSkillClick = (skillId: string) => {
    if (state.currentTurn === 'player' && !state.animation && state.gameStatus === 'playing') {
      useSkill(skillId, 'player');
    }
  };

  const isPlayerTurn = state.currentTurn === 'player';
  const canUseSkill = isPlayerTurn && !state.animation && state.gameStatus === 'playing';

  return (
    <div className="app-container">
      <h1 className="game-title">🐱 猫咪大乱斗 🐈‍⬛</h1>

      <div className="main-content">
        <div className="battle-scene">
          <div className="cloud cloud1"></div>
          <div className="cloud cloud2"></div>

          <div className="round-indicator">
            第 {state.round} / {state.maxRounds} 回合
          </div>

          <HeroCard
            hero={state.player}
            isPlayer={true}
            isActive={isPlayerTurn && !state.animation}
          />

          <HeroCard
            hero={state.opponent}
            isPlayer={false}
            isActive={!isPlayerTurn && !state.animation}
          />

          <TurnIndicator
            show={state.showTurnIndicator}
            currentTurn={state.currentTurn}
            onHide={hideTurnIndicator}
          />

          {state.animation && (
            <SkillEffect animation={state.animation} onComplete={endAnimation} />
          )}
        </div>
      </div>

      <div className="bottom-panel">
        <div className="skill-panel">
          <div className="skill-panel-title">
            {canUseSkill ? '选择你的技能' : '等待对手行动...'}
          </div>
          <div className="skill-buttons">
            {state.player.skills.map((skill) => (
              <SkillButton
                key={skill.id}
                skill={skill}
                onClick={() => handleSkillClick(skill.id)}
                disabled={!canUseSkill}
              />
            ))}
          </div>
        </div>

        <BattleLog logs={state.battleLog} />
      </div>

      {state.gameStatus !== 'playing' && (
        <ResultBanner
          status={state.gameStatus}
          playerHp={state.player.currentHp}
          opponentHp={state.opponent.currentHp}
          round={state.round}
          onPlayAgain={resetGame}
        />
      )}
    </div>
  );
}

export default App;
