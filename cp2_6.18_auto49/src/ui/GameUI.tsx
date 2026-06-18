import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, BeatEvent } from '../engine/types';
import { eventBus } from '../core/EventBus';
import { COLORS } from '../engine/constants';
import './GameUI.css';

interface GameUIProps {
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onBackToMenu: () => void;
  isMobile: boolean;
}

export const GameUI: React.FC<GameUIProps> = ({
  onPause,
  onResume,
  onRestart,
  onBackToMenu,
  isMobile,
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [beatPulse, setBeatPulse] = useState(false);
  const [pulseColor, setPulseColor] = useState(COLORS.beatIntro);
  const [showComboBreak, setShowComboBreak] = useState(false);
  const [comboMilestone, setComboMilestone] = useState<number | null>(null);
  const [milestoneColor, setMilestoneColor] = useState(COLORS.gold);
  
  const comboBreakTimerRef = useRef<number | null>(null);
  const milestoneTimerRef = useRef<number | null>(null);
  const beatTimerRef = useRef<number | null>(null);

  const handleGameState = useCallback((state: GameState) => {
    setGameState(state);
    setIsPaused(state.isPaused);
    
    if (state.comboBreak) {
      setShowComboBreak(true);
    }
  }, []);

  const handleBeat = useCallback((beat: BeatEvent) => {
    setBeatPulse(true);
    
    switch (beat.section) {
      case 'intro':
        setPulseColor(COLORS.beatIntro);
        break;
      case 'verse':
        setPulseColor(COLORS.beatVerse);
        break;
      case 'chorus':
        setPulseColor(COLORS.beatChorus);
        break;
    }
    
    if (beatTimerRef.current !== null) {
      window.clearTimeout(beatTimerRef.current);
    }
    beatTimerRef.current = window.setTimeout(() => setBeatPulse(false), 200);
  }, []);

  const handleComboBreak = useCallback(() => {
    if (comboBreakTimerRef.current !== null) {
      window.clearTimeout(comboBreakTimerRef.current);
    }
    
    setShowComboBreak(true);
    comboBreakTimerRef.current = window.setTimeout(() => {
      setShowComboBreak(false);
      comboBreakTimerRef.current = null;
    }, 1000);
  }, []);

  const handleComboMilestone = useCallback((payload: { threshold: number }) => {
    if (milestoneTimerRef.current !== null) {
      window.clearTimeout(milestoneTimerRef.current);
    }
    
    setComboMilestone(payload.threshold);
    
    if (payload.threshold >= 20) {
      setMilestoneColor(COLORS.gold);
    } else if (payload.threshold >= 10) {
      setMilestoneColor(COLORS.silver);
    } else {
      setMilestoneColor(COLORS.bronze);
    }
    
    milestoneTimerRef.current = window.setTimeout(() => {
      setComboMilestone(null);
      milestoneTimerRef.current = null;
    }, 1500);
  }, []);

  useEffect(() => {
    const unsub1 = eventBus.on('gameState', handleGameState);
    const unsub2 = eventBus.on('beat', handleBeat);
    const unsub3 = eventBus.on('comboBreak', handleComboBreak);
    const unsub4 = eventBus.on('comboMilestone', handleComboMilestone);
    
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      
      if (comboBreakTimerRef.current !== null) {
        window.clearTimeout(comboBreakTimerRef.current);
        comboBreakTimerRef.current = null;
      }
      if (milestoneTimerRef.current !== null) {
        window.clearTimeout(milestoneTimerRef.current);
        milestoneTimerRef.current = null;
      }
      if (beatTimerRef.current !== null) {
        window.clearTimeout(beatTimerRef.current);
        beatTimerRef.current = null;
      }
    };
  }, [handleGameState, handleBeat, handleComboBreak, handleComboMilestone]);

  const handlePauseClick = () => {
    if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  const handleResume = () => {
    onResume();
  };

  const handleRestart = () => {
    setShowComboBreak(false);
    setComboMilestone(null);
    
    if (comboBreakTimerRef.current !== null) {
      window.clearTimeout(comboBreakTimerRef.current);
      comboBreakTimerRef.current = null;
    }
    if (milestoneTimerRef.current !== null) {
      window.clearTimeout(milestoneTimerRef.current);
      milestoneTimerRef.current = null;
    }
    
    onRestart();
  };

  const handleBackToMenu = () => {
    setShowComboBreak(false);
    setComboMilestone(null);
    
    if (comboBreakTimerRef.current !== null) {
      window.clearTimeout(comboBreakTimerRef.current);
      comboBreakTimerRef.current = null;
    }
    if (milestoneTimerRef.current !== null) {
      window.clearTimeout(milestoneTimerRef.current);
      milestoneTimerRef.current = null;
    }
    
    onBackToMenu();
  };

  const renderHearts = () => {
    if (!gameState) return null;
    const hearts = [];
    for (let i = 0; i < 5; i++) {
      const isFull = i < gameState.health;
      hearts.push(
        <span
          key={i}
          className={`heart ${isFull ? 'heart-full' : 'heart-empty'}`}
        >
          ♥
        </span>
      );
    }
    return hearts;
  };

  const getComboColor = (combo: number): string => {
    if (combo >= 20) return COLORS.gold;
    if (combo >= 10) return COLORS.silver;
    if (combo >= 5) return COLORS.bronze;
    return '#A29BFE';
  };

  if (!gameState) return null;

  return (
    <>
      <div className="game-ui-container">
        <div className={`score-display ${gameState.combo > 0 ? 'has-combo' : ''}`}>
          <span className="score-value">{gameState.score}</span>
          
          {gameState.combo > 0 && (
            <div 
              className={`combo-display ${gameState.comboFlash ? 'combo-flash' : ''}`}
              style={{ color: getComboColor(gameState.combo) }}
            >
              <span className="combo-label">COMBO</span>
              <span 
                className="combo-value"
                style={{ 
                  textShadow: `0 0 20px ${getComboColor(gameState.combo)}`,
                  fontSize: gameState.combo >= 20 ? '36px' : gameState.combo >= 10 ? '32px' : '28px'
                }}
              >
                {gameState.combo}
              </span>
              <span className="combo-x">x</span>
            </div>
          )}
        </div>

        <div className="health-display">
          {renderHearts()}
        </div>

        <button 
          className={`pause-btn ${isMobile ? 'pause-btn-mobile' : ''}`}
          onClick={handlePauseClick}
          aria-label={isPaused ? '继续' : '暂停'}
        >
          {isPaused ? '▶' : '❚❚'}
        </button>

        {gameState.section === 'chorus' && (
          <div className="section-indicator chorus-mode">
            <span className="section-label">副歌</span>
            <span className="section-bonus">分数 x2</span>
          </div>
        )}
      </div>

      <div 
        className={`beat-pulse ${beatPulse ? 'active' : ''}`}
        style={{ 
          boxShadow: beatPulse ? `inset 0 0 100px 20px ${pulseColor}` : 'none',
          borderColor: pulseColor
        }}
      />

      {showComboBreak && (
        <div className="combo-break-overlay">
          <span className="combo-break-text">COMBO BREAK!</span>
        </div>
      )}

      {comboMilestone !== null && (
        <div 
          className="combo-milestone-overlay"
          style={{ color: milestoneColor }}
        >
          <span className="milestone-number">{comboMilestone}</span>
          <span className="milestone-label">COMBO!</span>
        </div>
      )}

      {isPaused && (
        <div className="pause-overlay">
          <div className="pause-menu">
            <h2 className="pause-title">游戏暂停</h2>
            <div className="pause-buttons">
              <button className="pause-menu-btn" onClick={handleResume}>
                继续游戏
              </button>
              <button className="pause-menu-btn" onClick={handleRestart}>
                重新开始
              </button>
              <button className="pause-menu-btn" onClick={handleBackToMenu}>
                返回主菜单
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
