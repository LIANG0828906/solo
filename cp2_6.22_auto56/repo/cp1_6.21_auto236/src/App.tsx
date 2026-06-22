import { useRef, useState, useEffect, useCallback } from 'react';
import { Heart, Music, Trophy, Play, ChevronUp, ChevronDown, Upload, Volume2 } from 'lucide-react';
import { GameEngine } from './GameEngine';
import { AudioAnalyzer } from './AudioAnalyzer';
import type { GameState, ScoreRecord } from './types';

const HISTORY_KEY = 'beat_smasher_history';
const MAX_HISTORY = 10;

function loadHistory(): ScoreRecord[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return [];
}

function saveHistory(record: ScoreRecord): ScoreRecord[] {
  const history = loadHistory();
  history.unshift(record);
  const trimmed = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null);
  const dragCounterRef = useRef(0);

  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'paused' | 'ended'>('idle');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(5);
  const [songName, setSongName] = useState('');
  const [songProgress, setSongProgress] = useState(0);
  const [bpm, setBpm] = useState(0);
  const [history, setHistory] = useState<ScoreRecord[]>(loadHistory());
  const [showEndModal, setShowEndModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalMaxCombo, setFinalMaxCombo] = useState(0);
  const [finalSongName, setFinalSongName] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [comboAnimKey, setComboAnimKey] = useState(0);
  const prevComboRef = useRef(0);

  const handleStateUpdate = useCallback((state: GameState) => {
    setScore(state.score);
    setCombo(state.combo);
    setMaxCombo(state.maxCombo);
    setLives(state.lives);
    setSongName(state.songName);
    setSongProgress(state.songProgress);
    setBpm(state.bpm);
    setGameStatus(state.status);

    if (state.combo > prevComboRef.current && state.combo > 0) {
      setComboAnimKey(k => k + 1);
    }
    prevComboRef.current = state.combo;

    if (state.status === 'ended') {
      const record: ScoreRecord = {
        songName: state.songName,
        score: state.score,
        maxCombo: state.maxCombo,
        timestamp: Date.now(),
      };
      const newHistory = saveHistory(record);
      setHistory(newHistory);
      setFinalScore(state.score);
      setFinalMaxCombo(state.maxCombo);
      setFinalSongName(state.songName);
      setShowEndModal(true);
    }
  }, []);

  useEffect(() => {
    if (canvasRef.current && !gameEngineRef.current) {
      const engine = new GameEngine(canvasRef.current);
      engine.setOnStateUpdate(handleStateUpdate);
      gameEngineRef.current = engine;
      audioAnalyzerRef.current = engine.getAudioAnalyzer();
    }
    return () => {
      gameEngineRef.current?.destroy();
    };
  }, [handleStateUpdate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startGameWithFile = useCallback(async (file: File) => {
    if (!audioAnalyzerRef.current || !gameEngineRef.current) return;

    const name = file.name.replace(/\.[^.]+$/, '');
    setSongName(name);

    try {
      await audioAnalyzerRef.current.loadAudio(file);
      audioAnalyzerRef.current.startPlayback();
      gameEngineRef.current.start();
      setGameStatus('playing');
    } catch (e) {
      console.error('Failed to load audio', e);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      startGameWithFile(file);
    }
  }, [startGameWithFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'audio/mpeg' || file.type === 'audio/wav' || /\.(mp3|wav)$/i.test(file.name))) {
      startGameWithFile(file);
    }
  }, [startGameWithFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleRestart = useCallback(() => {
    setShowEndModal(false);
    setGameStatus('idle');
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(5);
    setSongProgress(0);
    setBpm(0);
    prevComboRef.current = 0;
  }, []);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const renderHistoryPanel = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={16} className="text-yellow-400" />
        <h2 className="text-white text-sm font-semibold">历史成绩</h2>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {history.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">暂无记录</p>
        ) : (
          history.map((record, idx) => (
            <div key={idx} className="bg-black/30 rounded-lg p-3 border border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-white text-xs font-medium truncate flex-1 mr-2">{record.songName || '未知歌曲'}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-pink-400 text-sm font-bold">{record.score.toLocaleString()}</span>
                <span className="text-purple-400 text-xs">x{record.maxCombo}</span>
              </div>
              <div className="text-gray-500 text-[10px] mt-1">{formatTime(record.timestamp)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #0A0A1A 0%, #1A1A2E 100%)' }}>
      <div className="desktop-sidebar" style={{ width: 220, background: '#1E1E2E', borderRadius: 8, margin: 16, padding: 16 }}>
        {renderHistoryPanel()}
      </div>

      <div className="flex-1 flex flex-col relative">
        <div style={{ height: 60, background: '#0A0A1ACC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', gap: 32 }}>
          <div className="flex items-center gap-3">
            <span className="text-white text-2xl font-bold tracking-wider" style={{ fontFamily: 'Orbitron, Rajdhani' }}>{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1">
            {combo > 0 && (
              <div key={comboAnimKey} className="combo-animate flex items-center gap-1">
                <span className="text-yellow-400 text-sm font-semibold">COMBO</span>
                <span className="text-yellow-400 text-2xl font-bold" style={{ fontFamily: 'Orbitron' }}>{combo}</span>
              </div>
            )}
            {maxCombo > 0 && (
              <div className="flex items-center gap-1 ml-2">
                <span className="text-purple-400/70 text-[10px] font-semibold">MAX</span>
                <span className="text-purple-400 text-sm font-bold">{maxCombo}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                size={20}
                fill={i < lives ? '#FF3366' : 'none'}
                color={i < lives ? '#FF3366' : '#444466'}
              />
            ))}
          </div>

          <div className="flex flex-col items-center" style={{ width: 300 }}>
            <div className="flex items-center gap-2 mb-1">
              <Music size={12} className="text-white/70" />
              <span className="text-white/80 text-xs truncate max-w-[200px]">{songName || '—'}</span>
              <Volume2 size={12} className="text-white/70" />
              <span className="text-white/60 text-[10px]">{bpm} BPM</span>
            </div>
            <div style={{ width: 300, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ width: `${songProgress * 100}%`, height: '100%', background: 'linear-gradient(90deg, #FF3366 0%, #9933FF 100%)' }} />
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {gameStatus === 'idle' && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`neon-border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isDragging ? 'scale-105' : ''}`}
                style={{
                  padding: '48px 64px',
                  borderRadius: 16,
                  border: '2px solid',
                  background: isDragging ? 'rgba(153, 51, 255, 0.15)' : 'rgba(255, 51, 102, 0.08)',
                }}
              >
                <Upload size={48} className="text-white mb-4" />
                <p className="text-white text-xl font-bold mb-2" style={{ fontFamily: 'Orbitron' }}>上传音乐开始游戏</p>
                <p className="text-white/60 text-sm">支持 .mp3, .wav 格式</p>
                <p className="text-white/40 text-xs mt-2">点击选择 或 拖拽文件到此处</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,audio/mpeg,audio/wav"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {showEndModal && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}>
              <div style={{ background: 'rgba(30, 30, 46, 0.9)', borderRadius: 16, padding: 48, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', minWidth: 320 }}>
                <h2 className="text-sm mb-2" style={{ fontFamily: 'Orbitron', color: '#FFD700' }}>游戏结束</h2>
                <p className="text-white/70 text-sm mb-6 truncate max-w-[280px]">{finalSongName}</p>
                <div className="mb-6">
                  <p className="text-white text-5xl font-bold" style={{ fontFamily: 'Orbitron' }}>{finalScore.toLocaleString()}</p>
                  <p className="text-white/50 text-xs mt-1">得分</p>
                </div>
                <div className="mb-8">
                  <p className="text-yellow-400 text-2xl font-bold">x{finalMaxCombo}</p>
                  <p className="text-white/50 text-xs mt-1">最高连击</p>
                </div>
                <button
                  onClick={handleRestart}
                  className="neon-border flex items-center justify-center gap-2 mx-auto"
                  style={{
                    padding: '12px 32px',
                    borderRadius: 8,
                    border: '2px solid #FF3366',
                    background: 'rgba(255, 51, 102, 0.2)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Play size={16} />
                  再来一局
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mobile-drawer">
          <div
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="flex items-center justify-center py-2 cursor-pointer"
            style={{ background: '#1E1E2E', borderTop: '1px solid rgba(255,255,255,0.1)' }}
          >
            {mobileDrawerOpen ? <ChevronDown size={20} className="text-white/60" /> : <ChevronUp size={20} className="text-white/60" />}
            <span className="text-white/60 text-xs ml-1">历史成绩</span>
          </div>
          {mobileDrawerOpen && (
            <div style={{ background: '#1E1E2E', padding: 16, maxHeight: 200, overflowY: 'auto' }}>
              {renderHistoryPanel()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
