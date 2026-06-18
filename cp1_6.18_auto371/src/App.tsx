import { useRef, useEffect, useCallback } from 'react';
import { AudioAnalyzer } from './AudioAnalyzer';
import { GameEngine } from './GameEngine';
import { UIRenderer } from './UIRenderer';
import { useGameStore } from './store';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BeatAnalysisResult,
  GameState,
} from './types';

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<UIRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const beatAnalysisRef = useRef<BeatAnalysisResult | null>(null);
  const initializedRef = useRef(false);

  const {
    gameState,
    setGameState,
    isLoading,
    setIsLoading,
    error,
    setError,
    audioFileName,
    setAudioFileName,
    bpm,
    setBPM,
  } = useGameStore();

  gameStateRef.current = gameState;

  const handleStateChange = useCallback((state: GameState) => {
    gameStateRef.current = state;
    setGameState(state);
  }, [setGameState]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      audioAnalyzerRef.current = new AudioAnalyzer();
      gameEngineRef.current = new GameEngine();
      gameEngineRef.current.setStateChangeListener(handleStateChange);
    } catch (e) {
      setError('初始化系统失败：' + (e as Error).message);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      gameEngineRef.current?.dispose();
      audioAnalyzerRef.current?.dispose();
      initializedRef.current = false;
    };
  }, [handleStateChange, setError]);

  useEffect(() => {
    if (!canvasRef.current || !initializedRef.current) return;
    if (rendererRef.current) return;

    try {
      rendererRef.current = new UIRenderer(canvasRef.current);
    } catch (e) {
      setError('初始化渲染器失败：' + (e as Error).message);
    }
  }, [setError]);

  useEffect(() => {
    if (!rendererRef.current) return;
    if (animationFrameRef.current !== null) return;

    const renderLoop = () => {
      if (rendererRef.current && gameStateRef.current) {
        rendererRef.current.render(gameStateRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  const handleLoadDefaultBGM = useCallback(async () => {
    if (!audioAnalyzerRef.current || !gameEngineRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const analysis = audioAnalyzerRef.current.loadDefault();
      beatAnalysisRef.current = analysis;
      gameEngineRef.current.setBeatAnalysis(analysis);
      setBPM(analysis.bpm);
      setAudioFileName('默认背景音乐 (120 BPM)');
    } catch (e) {
      setError('加载默认音乐失败：' + (e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, setBPM, setAudioFileName]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !audioAnalyzerRef.current || !gameEngineRef.current) return;

      if (file.size > 5 * 1024 * 1024) {
        setError('文件大小超过5MB限制');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const analysis = await audioAnalyzerRef.current.loadFromFile(file);
        beatAnalysisRef.current = analysis;
        gameEngineRef.current.setBeatAnalysis(analysis);
        setBPM(analysis.bpm);
        setAudioFileName(`${file.name} (${analysis.bpm} BPM)`);
        audioAnalyzerRef.current.play();
      } catch (err) {
        setError('音频分析失败：' + (err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, setError, setBPM, setAudioFileName]
  );

  const handleStartGame = useCallback(async () => {
    if (!gameEngineRef.current) return;

    if (!beatAnalysisRef.current) {
      await handleLoadDefaultBGM();
    }

    if (audioAnalyzerRef.current && beatAnalysisRef.current) {
      audioAnalyzerRef.current.stop();
      setTimeout(() => {
        audioAnalyzerRef.current?.play();
      }, 50);
    }

    gameEngineRef.current.start();
  }, [handleLoadDefaultBGM]);

  const handleRestart = useCallback(() => {
    if (!gameEngineRef.current) return;

    if (audioAnalyzerRef.current && beatAnalysisRef.current) {
      audioAnalyzerRef.current.stop();
      setTimeout(() => {
        audioAnalyzerRef.current?.play();
      }, 100);
    }

    gameEngineRef.current.start();
  }, []);

  const showStartScreen =
    gameState.status === 'idle' || gameState.status === 'paused';
  const showGameOver = gameState.status === 'gameover';

  return (
    <div className="app-container">
      <h1 className="game-title">🎵 节拍冲刺 Beat Dash</h1>

      <div
        className="game-wrapper"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          className="game-canvas"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />

        {showStartScreen && !showGameOver && (
          <div className="start-screen">
            <h2>🎮 准备开始</h2>
            <p>
              跟随音乐节拍，控制小球在三条轨道上穿梭，
              <br />
              躲避障碍物，收集节拍点，创造最高连击！
            </p>

            <div className="file-upload">
              <label className="file-upload-label">
                📁 上传自定义音乐 (MP3/WAV, 限5MB)
                <input
                  type="file"
                  accept=".mp3,.wav,audio/mpeg,audio/wav"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
              </label>
            </div>

            {audioFileName && (
              <div className="audio-info">✅ 已加载：{audioFileName}</div>
            )}

            {isLoading && (
              <div style={{ margin: '16px 0' }}>
                <div className="loading-spinner"></div>
                <p style={{ marginTop: 12 }}>正在分析音频节拍...</p>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {!audioFileName && !isLoading && (
              <button
                className="btn btn-secondary"
                onClick={handleLoadDefaultBGM}
                disabled={isLoading}
              >
                🔊 使用默认BGM
              </button>
            )}

            <button
              className="btn btn-primary btn-start"
              onClick={handleStartGame}
              disabled={isLoading}
            >
              🚀 {audioFileName ? '开始游戏' : '直接开始 (默认BGM)'}
            </button>

            <div className="controls-hint">
              <h3>🎯 操作指南</h3>
              <ul>
                <li>
                  <span className="key-hint">空格</span> 跳跃（躲地面尖刺）
                </li>
                <li>
                  <span className="key-hint">S / ↓</span>{' '}
                  滑铲（躲空中横杆）
                </li>
                <li>
                  <span className="key-hint">A / ←</span> 切换到左轨道
                </li>
                <li>
                  <span className="key-hint">D / →</span> 切换到右轨道
                </li>
              </ul>
            </div>
          </div>
        )}

        {showGameOver && (
          <div className="game-over-overlay">
            <div className="game-over-panel">
              <h2>💥 游戏结束</h2>

              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">最终得分</span>
                  <span className="stat-value highlight">
                    {gameState.score.toLocaleString()}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">最高连击</span>
                  <span className="stat-value gold">
                    {gameState.maxCombo}x
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">收集节拍点</span>
                  <span className="stat-value">
                    {gameState.beatPointsCollected}
                  </span>
                </div>
              </div>

              <button className="btn-restart" onClick={handleRestart}>
                🔄 再来一次
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          {bpm ? `当前BPM: ${bpm} | ` : ''}
          提示：连续收集节拍点可触发Combo特效！
        </p>
      </div>
    </div>
  );
};

export default App;
