import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameEngine } from '../game/GameEngine';
import type { Track, Skin, PlayerRecord } from '../types';
import SkinCustomizer from '../components/SkinCustomizer';

const ArenaPage: React.FC = () => {
  const tracks = useGameStore((s) => s.tracks);
  const selectedTrackId = useGameStore((s) => s.selectedTrackId);
  const selectTrack = useGameStore((s) => s.selectTrack);
  const currentSkin = useGameStore((s) => s.currentSkin);
  const setSkin = useGameStore((s) => s.setSkin);
  const nickname = useGameStore((s) => s.nickname);
  const setNickname = useGameStore((s) => s.setNickname);
  const submitRecord = useGameStore((s) => s.submitRecord);

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [finishTime, setFinishTime] = useState<number | null>(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showSkinPanel, setShowSkinPanel] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFinish = useCallback((time: number) => {
    setFinishTime(time);
    setShowFinishModal(true);
  }, []);

  useEffect(() => {
    if (!selectedTrack || !canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, selectedTrack, currentSkin, handleFinish);
    setGameEngine(engine);

    return () => {
      engine.stop();
      setGameEngine(null);
    };
  }, [selectedTrack, handleFinish]);

  useEffect(() => {
    if (!gameEngine) return;

    const onKeyDown = (e: KeyboardEvent) => gameEngine.handleKeyDown(e);
    const onKeyUp = (e: KeyboardEvent) => gameEngine.handleKeyUp(e);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gameEngine]);

  useEffect(() => {
    if (gameEngine) {
      gameEngine.setSkin(currentSkin);
    }
  }, [currentSkin, gameEngine]);

  const handleStartGame = useCallback(() => {
    if (gameEngine) {
      gameEngine.start();
      setGameStarted(true);
    }
  }, [gameEngine]);

  const handleSubmitRecord = useCallback(() => {
    if (!selectedTrack || finishTime === null) return;

    const record: PlayerRecord = {
      id: crypto.randomUUID(),
      trackId: selectedTrack.id,
      trackName: selectedTrack.name,
      nickname,
      time: finishTime,
      timestamp: Date.now(),
      skin: currentSkin,
      attempts: 1,
    };

    submitRecord(record);
    setShowFinishModal(false);
  }, [selectedTrack, finishTime, nickname, currentSkin, submitRecord]);

  const handleRestart = useCallback(() => {
    setShowFinishModal(false);
    setFinishTime(null);
    setGameStarted(false);
    if (gameEngine) {
      gameEngine.start();
      setGameStarted(true);
    }
  }, [gameEngine]);

  const handleBackToSelection = useCallback(() => {
    if (gameEngine) {
      gameEngine.stop();
    }
    setGameEngine(null);
    setSelectedTrack(null);
    setGameStarted(false);
    setFinishTime(null);
    setShowFinishModal(false);
  }, [gameEngine]);

  const handleSelectTrack = useCallback((track: Track) => {
    setSelectedTrack(track);
    selectTrack(track.id);
  }, [selectTrack]);

  if (!selectedTrack) {
    return (
      <div className="page-container fade-in">
        <h2 style={{ color: '#00f5d4', textAlign: 'center', marginBottom: '24px', textShadow: '0 0 10px rgba(0, 245, 212, 0.5)' }}>
          选择赛道
        </h2>

        <div style={{ maxWidth: '400px', margin: '0 auto 24px' }}>
          <label style={{ color: '#00f5d4', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            昵称
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{
              width: '100%',
              background: '#0a0f24',
              border: '1px solid #00f5d4',
              color: '#e0e0e0',
              padding: '8px 12px',
              borderRadius: '4px',
              fontFamily: "'Courier New', monospace",
              fontSize: '14px',
            }}
          />
        </div>

        <div className="track-list" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {tracks.map((track) => (
            <div key={track.id} className="track-card neon-border">
              <h3 style={{ color: '#00f5d4', marginBottom: '8px', fontSize: '16px' }}>
                {track.name}
              </h3>
              <p style={{ color: '#888', fontSize: '12px', marginBottom: '12px' }}>
                {track.width}×{track.height}
              </p>
              <button className="btn-primary" onClick={() => handleSelectTrack(track)}>
                开始挑战
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="arena-container" style={{ position: 'relative' }}>
        <button
          className="btn-secondary"
          style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, padding: '6px 12px', fontSize: '12px' }}
          onClick={() => setShowSkinPanel((v) => !v)}
        >
          自定义皮肤
        </button>

        {showSkinPanel && (
          <div
            className="neon-border"
            style={{
              position: 'absolute',
              top: '44px',
              left: '8px',
              zIndex: 10,
              background: 'rgba(13, 17, 36, 0.95)',
              padding: '16px',
              borderRadius: '8px',
              minWidth: '240px',
            }}
          >
            <SkinCustomizer />
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '4px' }} />

        {!gameStarted && !showFinishModal && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button className="btn-primary" onClick={handleStartGame}>
              开始
            </button>
          </div>
        )}

        {gameStarted && !showFinishModal && (
          <p style={{ textAlign: 'center', marginTop: '12px', color: '#00f5d4', fontSize: '14px', textShadow: '0 0 6px rgba(0, 245, 212, 0.4)' }}>
            按住空格蓄力跳跃
          </p>
        )}
      </div>

      {showFinishModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ color: '#00f5d4', marginBottom: '16px', textShadow: '0 0 10px rgba(0, 245, 212, 0.5)' }}>
              完成!
            </h2>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#e0e0e0', marginBottom: '16px' }}>
              {finishTime !== null ? (finishTime / 1000).toFixed(2) + 's' : ''}
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#00f5d4', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0a0f24',
                  border: '1px solid #00f5d4',
                  color: '#e0e0e0',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn-primary" onClick={handleSubmitRecord}>
                提交成绩
              </button>
              <button className="btn-secondary" onClick={handleRestart}>
                重新挑战
              </button>
              <button className="btn-danger" onClick={handleBackToSelection}>
                返回选择
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArenaPage;
