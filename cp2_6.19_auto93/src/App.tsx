import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Canvas from './canvas/Canvas';
import UserManager, {
  generateUserId,
  generateUserName,
  generateAvatarColor,
  generateAvatarPattern,
  OnlineUser,
} from './users/UserManager';
import PlaybackController, {
  RecordingData,
  DrawPoint,
} from './playback/PlaybackController';
import {
  createDrawingChannel,
  sendMessage,
  onMessage,
  ChannelMessage,
  DrawStrokeMessage,
  UserJoinMessage,
  UserLeaveMessage,
} from './broadcast/channel';

const PRESET_COLORS = [
  '#000000',
  '#e53935',
  '#fb8c00',
  '#fdd835',
  '#43a047',
  '#00acc1',
  '#1e88e5',
  '#8e24aa',
  '#ec407a',
  '#6d4c41',
  '#757575',
  '#424242',
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return {
    r: parseInt(full.substring(0, 2), 16),
    g: parseInt(full.substring(2, 4), 16),
    b: parseInt(full.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerpColor(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}

export default function App() {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const colorAnimRef = useRef<number>(0);
  const colorAnimStartRef = useRef<number>(0);
  const colorAnimFromRef = useRef<string>('#000000');
  const recordingStartRef = useRef<number>(0);
  const playbackRafRef = useRef<number>(0);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackPausedProgressRef = useRef<number>(0);

  const [targetColor, setTargetColor] = useState('#000000');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentSize, setCurrentSize] = useState(3);

  const [currentUser] = useState<OnlineUser>(() => ({
    id: generateUserId(),
    name: generateUserName(),
    avatarColor: generateAvatarColor(),
    avatarPattern: generateAvatarPattern(),
  }));

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const [remoteStrokes, setRemoteStrokes] = useState<
    Map<string, { userId: string; points: DrawPoint[] }>
  >(new Map());

  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState<RecordingData | null>(null);
  const [recordingStrokes, setRecordingStrokes] = useState<
    { strokeId: string; userId: string; points: DrawPoint[] }[]
  >([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  useEffect(() => {
    if (colorAnimRef.current) {
      cancelAnimationFrame(colorAnimRef.current);
    }
    colorAnimFromRef.current = currentColor;
    colorAnimStartRef.current = performance.now();
    const from = currentColor;
    const to = targetColor;

    const animate = (now: number) => {
      const elapsed = now - colorAnimStartRef.current;
      const t = Math.min(elapsed / 100, 1);
      setCurrentColor(lerpColor(from, to, t));
      if (t < 1) {
        colorAnimRef.current = requestAnimationFrame(animate);
      }
    };
    colorAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (colorAnimRef.current) {
        cancelAnimationFrame(colorAnimRef.current);
      }
    };
  }, [targetColor]);

  useEffect(() => {
    const channel = createDrawingChannel();
    channelRef.current = channel;

    onMessage(channel, (msg: ChannelMessage) => {
      if (msg.type === 'user-join') {
        const joinMsg = msg as UserJoinMessage;
        if (joinMsg.user.id === currentUser.id) return;
        setOnlineUsers((prev) => {
          if (prev.find((u) => u.id === joinMsg.user.id)) return prev;
          return [...prev, joinMsg.user];
        });
        sendMessage(channel, {
          type: 'user-join',
          user: currentUser,
        });
      } else if (msg.type === 'user-leave') {
        const leaveMsg = msg as UserLeaveMessage;
        setOnlineUsers((prev) => prev.filter((u) => u.id !== leaveMsg.userId));
        setRemoteStrokes((prev) => {
          const next = new Map(prev);
          next.forEach((_, key) => {
            if (key.startsWith(leaveMsg.userId + '-')) {
              next.delete(key);
            }
          });
          return next;
        });
      } else if (msg.type === 'draw') {
        const drawMsg = msg as DrawStrokeMessage;
        if (drawMsg.userId === currentUser.id) return;
        setRemoteStrokes((prev) => {
          const next = new Map(prev);
          next.set(drawMsg.strokeId, {
            userId: drawMsg.userId,
            points: drawMsg.points,
          });
          return next;
        });
        if (isRecording) {
          setRecordingStrokes((prev) => [
            ...prev,
            {
              strokeId: drawMsg.strokeId,
              userId: drawMsg.userId,
              points: drawMsg.points,
            },
          ]);
        }
      }
    });

    sendMessage(channel, {
      type: 'user-join',
      user: currentUser,
    });

    const handleBeforeUnload = () => {
      sendMessage(channel, {
        type: 'user-leave',
        userId: currentUser.id,
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sendMessage(channel, {
        type: 'user-leave',
        userId: currentUser.id,
      });
      channel.close();
    };
  }, [currentUser, isRecording]);

  const handleStrokeComplete = useCallback(
    (strokeId: string, points: DrawPoint[]) => {
      if (channelRef.current) {
        sendMessage(channelRef.current, {
          type: 'draw',
          userId: currentUser.id,
          strokeId,
          points,
        });
      }
      if (isRecording) {
        setRecordingStrokes((prev) => [
          ...prev,
          { strokeId, userId: currentUser.id, points },
        ]);
      }
    },
    [currentUser.id, isRecording]
  );

  const handleToggleRecording = useCallback(() => {
    if (isPlaying) return;
    if (isRecording) {
      const endTime = Date.now();
      setIsRecording(false);
      setRecordedData({
        strokes: recordingStrokes,
        startTime: recordingStartRef.current,
        endTime,
      });
    } else {
      setRecordingStrokes([]);
      recordingStartRef.current = Date.now();
      setIsRecording(true);
    }
  }, [isRecording, isPlaying, recordingStrokes]);

  const handleClearRecording = useCallback(() => {
    setRecordedData(null);
    setRecordingStrokes([]);
    setPlaybackProgress(0);
    playbackPausedProgressRef.current = 0;
  }, []);

  const handleExport = useCallback(() => {
    if (!recordedData) return;
    const blob = new Blob([JSON.stringify(recordedData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordedData]);

  const handleImport = useCallback((data: RecordingData) => {
    setRecordedData(data);
    setPlaybackProgress(0);
    playbackPausedProgressRef.current = 0;
  }, []);

  const playbackStrokesRef = useRef<
    Map<string, { userId: string; points: DrawPoint[] }>
  >(new Map());

  const renderPlaybackFrame = useCallback(
    (progress: number) => {
      if (!recordedData) return;
      const totalDuration = recordedData.endTime - recordedData.startTime;
      const targetTimestamp = recordedData.startTime + totalDuration * progress;

      const visibleStrokes = new Map<
        string,
        { userId: string; points: DrawPoint[]; firstTimestamp: number }
      >();

      recordedData.strokes.forEach((stroke) => {
        const visiblePoints = stroke.points.filter(
          (p) => p.timestamp <= targetTimestamp
        );
        if (visiblePoints.length > 0) {
          visibleStrokes.set(stroke.strokeId, {
            userId: stroke.userId,
            points: visiblePoints,
            firstTimestamp: stroke.points[0].timestamp,
          });
        }
      });

      const allFirstTimestamps = Array.from(visibleStrokes.values()).map(
        (s) => s.firstTimestamp
      );
      allFirstTimestamps.sort((a, b) => a - b);
      const totalCount = allFirstTimestamps.length;
      const fadeWindow = Math.max(30, totalCount * 0.5);

      const remote = new Map<string, { userId: string; points: DrawPoint[] }>();
      visibleStrokes.forEach((stroke, key) => {
        const idx = allFirstTimestamps.indexOf(stroke.firstTimestamp);
        const alpha =
          totalCount <= fadeWindow
            ? 1
            : idx < totalCount - fadeWindow
            ? 0.15
            : 0.15 + 0.85 * ((idx - (totalCount - fadeWindow)) / fadeWindow);

        const adjustedPoints = stroke.points.map((p) => ({
          ...p,
          color: p.color,
        }));

        if (alpha >= 0.99) {
          remote.set(key, {
            userId: stroke.userId,
            points: adjustedPoints,
          });
        } else {
          remote.set(key, {
            userId: stroke.userId,
            points: adjustedPoints.map((p) => ({
              ...p,
              _alpha: alpha,
            })) as any,
          });
        }
      });
      playbackStrokesRef.current = remote;
      setRemoteStrokes(new Map(remote));
    },
    [recordedData]
  );

  useEffect(() => {
    if (!isPlaying || !recordedData) return;

    const totalDuration = (recordedData.endTime - recordedData.startTime) / 5;
    const startProgress = playbackPausedProgressRef.current;
    playbackStartTimeRef.current = performance.now() - startProgress * totalDuration;

    const animate = (now: number) => {
      const elapsed = now - playbackStartTimeRef.current;
      const progress = Math.min(elapsed / totalDuration, 1);
      setPlaybackProgress(progress);
      renderPlaybackFrame(progress);

      if (progress < 1) {
        playbackRafRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        playbackPausedProgressRef.current = 0;
      }
    };

    playbackRafRef.current = requestAnimationFrame(animate);

    return () => {
      if (playbackRafRef.current) {
        cancelAnimationFrame(playbackRafRef.current);
      }
    };
  }, [isPlaying, recordedData, renderPlaybackFrame]);

  const handleTogglePlayback = useCallback(() => {
    if (!recordedData || recordedData.strokes.length === 0) return;

    if (isPlaying) {
      if (playbackRafRef.current) {
        cancelAnimationFrame(playbackRafRef.current);
      }
      playbackPausedProgressRef.current = playbackProgress;
      setIsPlaying(false);
    } else {
      if (playbackProgress >= 1) {
        playbackPausedProgressRef.current = 0;
        setPlaybackProgress(0);
      }
      setIsPlaying(true);
    }
  }, [isPlaying, recordedData, playbackProgress]);

  const handleUpdateUsers = useCallback((users: OnlineUser[]) => {
    setOnlineUsers(users);
  }, []);

  const displayRemoteStrokes = useMemo(() => {
    if (isPlaying) return remoteStrokes;
    return remoteStrokes;
  }, [remoteStrokes, isPlaying]);

  return (
    <div className="app-container">
      <header className="top-bar">
        <h1 className="app-title">协同画板</h1>
        <UserManager
          currentUser={currentUser}
          onlineUsers={onlineUsers}
          onUpdateUsers={handleUpdateUsers}
        />
      </header>

      <main className="main-area">
        <div className="canvas-wrapper">
          <Canvas
            currentColor={currentColor}
            currentSize={currentSize}
            userId={currentUser.id}
            onStrokeComplete={handleStrokeComplete}
            remoteStrokes={displayRemoteStrokes}
          />
        </div>

        <div className="color-picker">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className={`color-swatch ${targetColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setTargetColor(color)}
              title={color}
            />
          ))}
          <div className="size-control">
            <span className="size-label">大小</span>
            <input
              type="range"
              min="1"
              max="30"
              value={currentSize}
              onChange={(e) => setCurrentSize(Number(e.target.value))}
              className="size-slider"
            />
            <span className="size-value">{currentSize}px</span>
          </div>
        </div>
      </main>

      <footer className="bottom-bar">
        <PlaybackController
          isRecording={isRecording}
          onToggleRecording={handleToggleRecording}
          recordedData={recordedData}
          onExport={handleExport}
          onImport={handleImport}
          isPlaying={isPlaying}
          onTogglePlayback={handleTogglePlayback}
          playbackProgress={playbackProgress}
          onClearRecording={handleClearRecording}
        />
      </footer>
    </div>
  );
}
