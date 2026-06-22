import { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '@/game/GameEngine';
import { useTrackStore } from '@/store/useTrackStore';
import { useSkinStore } from '@/store/useSkinStore';
import { useLeaderboardStore } from '@/store/useLeaderboardStore';
import { TrackData, TrackCell } from '@/types';

interface GameTrackData {
  grid: {
    type: 'empty' | 'obstacle' | 'boost' | 'platform' | 'start' | 'finish';
    height?: number;
    boostMultiplier?: number;
  }[][];
  width: number;
  height: number;
}

function convertTrackData(track: { cells: TrackCell[]; width: number; height: number }): GameTrackData {
  const grid: GameTrackData['grid'] = [];

  for (let y = 0; y < track.height; y++) {
    grid[y] = [];
    for (let x = 0; x < track.width; x++) {
      grid[y][x] = { type: 'empty' };
    }
  }

  for (let x = 0; x < track.width; x++) {
    if (grid[track.height - 1] && grid[track.height - 1][x]) {
      grid[track.height - 1][x] = { type: 'empty' };
    }
  }

  for (const cell of track.cells) {
    if (cell.y >= 0 && cell.y < track.height && cell.x >= 0 && cell.x < track.width) {
      const type = cell.type as 'empty' | 'obstacle' | 'boost' | 'platform';
      grid[cell.y][cell.x] = {
        type,
        height: cell.height,
        boostMultiplier: cell.multiplier,
      };
    }
  }

  if (grid[track.height - 1] && grid[track.height - 1][0]) {
    grid[track.height - 1][0] = { type: 'start' };
  }
  if (grid[track.height - 1] && grid[track.height - 1][track.width - 1]) {
    grid[track.height - 1][track.width - 1] = { type: 'finish' };
  }

  return {
    grid,
    width: track.width,
    height: track.height,
  };
}

export default function ArenaPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const animationRef = useRef<number | null>(null);

  const { tracks, currentTrackId, setCurrentTrackId, loadTracks, getCurrentTrack } = useTrackStore();
  const { skin, playerName, loadFromStorage: loadSkin } = useSkinStore();
  const { addEntry } = useLeaderboardStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [finalTime, setFinalTime] = useState(0);

  useEffect(() => {
    loadTracks();
    loadSkin();
  }, [loadTracks, loadSkin]);

  const initGame = useCallback(() => {
    if (!canvasRef.current) return;

    const currentTrack = getCurrentTrack();
    if (!currentTrack) {
      const defaultTrack: TrackData = {
        id: 'default',
        name: '默认赛道',
        width: 20,
        height: 10,
        cells: [],
        createdAt: Date.now(),
      };
      const converted = convertTrackData(defaultTrack);
      engineRef.current = new GameEngine(canvasRef.current, converted as any);
      return;
    }

    const converted = convertTrackData(currentTrack);
    engineRef.current = new GameEngine(canvasRef.current, converted as any);
    engineRef.current.setSkin(skin.color, skin.accessory as Record<string, unknown>);

    engineRef.current.onFinish((time) => {
      setIsPlaying(false);
      setIsFinished(true);
      setFinalTime(time);
      setShowModal(true);
    });
  }, [getCurrentTrack, skin]);

  useEffect(() => {
    initGame();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initGame]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSkin(skin.color, skin.accessory as Record<string, unknown>);
    }
  }, [skin]);

  useEffect(() => {
    if (isPlaying) {
      const updateHUD = () => {
        if (engineRef.current) {
          setElapsedTime(engineRef.current.getElapsedTime());
          setCurrentSpeed(engineRef.current.getCurrentSpeed());
        }
        animationRef.current = requestAnimationFrame(updateHUD);
      };
      animationRef.current = requestAnimationFrame(updateHUD);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!engineRef.current || !canvasRef.current) return;

    const currentTrack = getCurrentTrack();
    if (currentTrack) {
      engineRef.current.destroy();

      const converted = convertTrackData(currentTrack);
      engineRef.current = new GameEngine(canvasRef.current, converted as any);
      engineRef.current.setSkin(skin.color, skin.accessory as Record<string, unknown>);
      engineRef.current.onFinish((time) => {
        setIsPlaying(false);
        setIsFinished(true);
        setFinalTime(time);
        setShowModal(true);
      });

      setIsPlaying(false);
      setIsFinished(false);
      setElapsedTime(0);
      setCurrentSpeed(0);
    }
  }, [currentTrackId]);

  const handleStart = () => {
    if (engineRef.current) {
      if (isFinished) {
        engineRef.current.reset();
        setIsFinished(false);
      }
      engineRef.current.start();
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setIsPlaying(false);
      setIsFinished(false);
      setElapsedTime(0);
      setCurrentSpeed(0);
    }
  };

  const handleSubmitScore = () => {
    const currentTrack = getCurrentTrack();
    if (!currentTrack) return;

    addEntry({
      trackId: currentTrack.id,
      trackName: currentTrack.name,
      playerName: playerName || 'Player',
      time: finalTime,
      skin: JSON.stringify(skin),
    });

    setShowModal(false);
    alert('成绩提交成功！');
  };

  const formatTime = (seconds: number) => {
    return seconds.toFixed(2);
  };

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            color: 'var(--neon-cyan)',
            textShadow: '0 0 20px rgba(0, 245, 212, 0.5)',
          }}
        >
          竞技场
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          选择赛道，按下空格键跳跃，挑战最快速度！
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="glass rounded-xl p-4 relative">
            <div className="absolute top-6 right-6 z-10 space-y-2">
              <div
                className="px-4 py-2 rounded-lg text-right"
                style={{
                  background: 'rgba(0, 0, 0, 0.7)',
                  border: '1px solid rgba(0, 245, 212, 0.3)',
                  backdropFilter: 'blur(5px)',
                }}
              >
                <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  时间
                </div>
                <div
                  className="text-2xl font-bold mono-text"
                  style={{
                    color: 'var(--neon-cyan)',
                    textShadow: '0 0 10px rgba(0, 245, 212, 0.5)',
                  }}
                >
                  {formatTime(elapsedTime)}s
                </div>
              </div>
              <div
                className="px-4 py-2 rounded-lg text-right"
                style={{
                  background: 'rgba(0, 0, 0, 0.7)',
                  border: '1px solid rgba(255, 0, 110, 0.3)',
                  backdropFilter: 'blur(5px)',
                }}
              >
                <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  速度
                </div>
                <div
                  className="text-xl font-bold mono-text"
                  style={{
                    color: 'var(--neon-pink)',
                    textShadow: '0 0 10px rgba(255, 0, 110, 0.5)',
                  }}
                >
                  {currentSpeed.toFixed(1)} m/s
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={800}
                height={300}
                className="rounded-lg"
                style={{
                  background: 'linear-gradient(180deg, #0a0f24 0%, #1a0033 100%)',
                  border: '1px solid rgba(0, 245, 212, 0.3)',
                  boxShadow: '0 0 30px rgba(0, 245, 212, 0.1)',
                }}
              />
            </div>

            <div className="flex justify-center gap-4 mt-4">
              <button onClick={handleStart} disabled={isPlaying} className="neon-button">
                {isPlaying ? '游戏中...' : isFinished ? '再来一次' : '开始游戏'}
              </button>
              <button onClick={handleReset} className="neon-button">
                重置
              </button>
            </div>

            <div className="text-center mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              按 <span className="mono-text px-2 py-1 rounded" style={{ background: 'rgba(0, 245, 212, 0.1)', color: 'var(--neon-cyan)' }}>空格键</span> 跳跃（按住跳更高）
            </div>
          </div>
        </div>

        <div className="w-full lg:w-72">
          <div className="glass rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--neon-cyan)' }}>
              选择赛道
            </h3>
            <select
              value={currentTrackId || ''}
              onChange={(e) => setCurrentTrackId(e.target.value || null)}
              className="w-full px-4 py-2 rounded-lg bg-transparent border focus:outline-none transition-all mb-4"
              style={{
                borderColor: 'rgba(0, 245, 212, 0.3)',
                color: 'var(--text-primary)',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
              }}
            >
              <option value="" style={{ color: '#000' }}>
                请选择赛道
              </option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id} style={{ color: '#000' }}>
                  {track.name}
                </option>
              ))}
            </select>

            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p>玩家: {playerName}</p>
              <p className="mt-2">
                当前皮肤颜色:
                <span
                  className="inline-block w-4 h-4 rounded-full ml-2 align-middle"
                  style={{ backgroundColor: skin.color, boxShadow: `0 0 8px ${skin.color}` }}
                />
              </p>
            </div>
          </div>

          <div className="glass rounded-xl p-4 mt-4">
            <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--neon-cyan)' }}>
              操作说明
            </h3>
            <ul className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <li>• 角色自动向前奔跑</li>
              <li>• 按空格键跳跃</li>
              <li>• 按住空格跳得更高</li>
              <li>• 避开障碍物</li>
              <li>• 收集加速带提速</li>
              <li>• 到达终点完成比赛</li>
            </ul>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)' }}
        >
          <div
            className="glass rounded-2xl p-8 max-w-md w-full mx-4 text-center"
            style={{
              border: '1px solid rgba(0, 245, 212, 0.5)',
              boxShadow: '0 0 50px rgba(0, 245, 212, 0.3)',
            }}
          >
            <h2
              className="text-3xl font-bold mb-2"
              style={{
                color: 'var(--neon-cyan)',
                textShadow: '0 0 20px rgba(0, 245, 212, 0.5)',
              }}
            >
              比赛完成！
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              恭喜你完成了挑战
            </p>

            <div
              className="py-6 mb-6 rounded-xl"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 245, 212, 0.2)',
              }}
            >
              <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                最终成绩
              </div>
              <div
                className="text-5xl font-bold mono-text"
                style={{
                  color: 'var(--neon-pink)',
                  textShadow: '0 0 20px rgba(255, 0, 110, 0.5)',
                }}
              >
                {formatTime(finalTime)}s
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={handleSubmitScore} className="neon-button">
                提交成绩
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  handleReset();
                }}
                className="neon-button"
              >
                再玩一次
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
