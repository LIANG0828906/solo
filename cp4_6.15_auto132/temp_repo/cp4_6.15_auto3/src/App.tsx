import React, { useState, useEffect, useCallback } from 'react';
import RhythmPlayer from './RhythmPlayer';
import ScoreBoard from './ScoreBoard';
import { BeatGenerator, getDifficultyLabel, getModeLabel, getThemeLabel } from './BeatGenerator';
import type { DifficultyLevel, GameMode, ThemeType, GameState, Score, Beat } from './types';
import styles from './styles/App.module.css';
import './styles/themes.css';

const App: React.FC = () => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [mode, setMode] = useState<GameMode>('standard');
  const [theme, setTheme] = useState<ThemeType>('neon');
  const [gameState, setGameState] = useState<GameState>('idle');
  const [beats, setBeats] = useState<Beat[]>([]);
  const [score, setScore] = useState<Score>({
    total: 0,
    perfect: 0,
    good: 0,
    miss: 0,
    combo: 0,
    maxCombo: 0,
    totalDeviation: 0,
    hitCount: 0,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [finalScore, setFinalScore] = useState<Score | null>(null);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const generateBeats = useCallback((diff: DifficultyLevel) => {
    const generator = new BeatGenerator(diff);
    return generator.generateBeats();
  }, []);

  useEffect(() => {
    if (gameState === 'idle') {
      setBeats(generateBeats(difficulty));
    }
  }, [difficulty, generateBeats, gameState]);

  const handleStart = useCallback(() => {
    setScore({
      total: 0,
      perfect: 0,
      good: 0,
      miss: 0,
      combo: 0,
      maxCombo: 0,
      totalDeviation: 0,
      hitCount: 0,
    });
    setFinalScore(null);
    setBeats(generateBeats(difficulty));
    setGameState('playing');
    setShowSettings(false);
  }, [difficulty, generateBeats]);

  const handleScoreUpdate = useCallback((newScore: Score) => {
    setScore(newScore);
  }, []);

  const handleGameEnd = useCallback((finalScore: Score) => {
    setFinalScore(finalScore);
    setGameState('finished');
  }, []);

  const handleRestart = useCallback(() => {
    setGameState('idle');
    setFinalScore(null);
  }, []);

  const handleDifficultyChange = useCallback((newDifficulty: DifficultyLevel) => {
    setDifficulty(newDifficulty);
  }, []);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>节奏训练大师</h1>
        <button 
          className={styles.settingsButton}
          onClick={() => setShowSettings(true)}
          aria-label="设置"
        >
          ⚙
        </button>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.sidePanel}>
          <ScoreBoard score={score} isLive={true} />
        </div>

        <div className={styles.gameArea}>
          <RhythmPlayer
            beats={beats}
            difficulty={difficulty}
            mode={mode}
            theme={theme}
            onScoreUpdate={handleScoreUpdate}
            onGameEnd={handleGameEnd}
            isPlaying={gameState === 'playing'}
            onStart={handleStart}
          />
        </div>

        <div className={styles.sidePanel}>
          <div className={styles.container} style={{ 
            background: 'var(--panel-bg)',
            border: '2px solid var(--panel-border)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div className={styles.label} style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
            }}>
              当前设置
            </div>
            <div style={{ marginTop: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>难度</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  {getDifficultyLabel(difficulty)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>模式</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  {getModeLabel(mode)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>主题</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  {getThemeLabel(theme)}
                </span>
              </div>
            </div>
            <button
              className={styles.startButton}
              onClick={handleStart}
              style={{ marginTop: '20px' }}
            >
              开始游戏
            </button>
          </div>
        </div>
      </main>

      {showSettings && (
        <>
          <div 
            className={styles.settingsOverlay}
            onClick={() => setShowSettings(false)}
          />
          <div className={styles.settingsPanel}>
            <button
              className={styles.closeButton}
              onClick={() => setShowSettings(false)}
              aria-label="关闭"
            >
              ✕
            </button>
            
            <h2 className={styles.settingsTitle}>设置</h2>

            <div className={styles.settingsSection}>
              <label className={styles.sectionLabel}>难度选择</label>
              <select
                className={styles.selectInput}
                value={difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value as DifficultyLevel)}
              >
                <option value="easy">简单 - 4/4拍, BPM 80, 单轨道</option>
                <option value="normal">普通 - 4/4拍, BPM 120, 双轨道</option>
                <option value="hard">困难 - 7/8拍, BPM 150, 四轨道</option>
              </select>
            </div>

            <div className={styles.settingsSection}>
              <label className={styles.sectionLabel}>游戏模式</label>
              <div className={styles.modeButtons}>
                <button
                  className={`${styles.modeButton} ${mode === 'standard' ? styles.active : ''}`}
                  onClick={() => setMode('standard')}
                >
                  标准模式
                </button>
                <button
                  className={`${styles.modeButton} ${mode === 'practice' ? styles.active : ''}`}
                  onClick={() => setMode('practice')}
                >
                  自由练习
                </button>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <label className={styles.sectionLabel}>视觉主题</label>
              <div className={styles.themePreview}>
                <div
                  className={`${styles.themeCard} ${styles.neon} ${theme === 'neon' ? styles.active : ''}`}
                  onClick={() => setTheme('neon')}
                >
                  <span className={styles.themeLabel}>霓虹科幻</span>
                </div>
                <div
                  className={`${styles.themeCard} ${styles.retro} ${theme === 'retro' ? styles.active : ''}`}
                  onClick={() => setTheme('retro')}
                >
                  <span className={styles.themeLabel}>复古像素</span>
                </div>
                <div
                  className={`${styles.themeCard} ${styles.minimal} ${theme === 'minimal' ? styles.active : ''}`}
                  onClick={() => setTheme('minimal')}
                >
                  <span className={styles.themeLabel}>极简黑白</span>
                </div>
              </div>
            </div>

            <button className={styles.startButton} onClick={handleStart}>
              开始游戏
            </button>
          </div>
        </>
      )}

      {gameState === 'finished' && finalScore && (
        <div className={styles.resultOverlay}>
          <div className={styles.resultPanel}>
            <h2 className={styles.resultTitle}>训练完成!</h2>
            <ScoreBoard score={finalScore} isLive={false} />
            <button className={styles.restartButton} onClick={handleRestart}>
              继续训练
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
