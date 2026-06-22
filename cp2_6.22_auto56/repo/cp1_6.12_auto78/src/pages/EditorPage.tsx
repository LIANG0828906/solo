import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LyricLine from '../components/LyricLine';
import { socketClient } from '../utils/socketClient';
import { User, LyricLine as LyricLineType, Timestamp, TextOperation, CursorPosition } from '../types';

interface EditorPageProps {
  roomId: string;
  user: User;
}

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
};

const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;
  const minutes = parseInt(parts[0], 10) || 0;
  const secParts = parts[1].split('.');
  const seconds = parseInt(secParts[0], 10) || 0;
  const milliseconds = (parseInt(secParts[1], 10) || 0) * 10;
  return minutes * 60 * 1000 + seconds * 1000 + milliseconds;
};

const DEFAULT_LINES: LyricLineType[] = Array.from({ length: 12 }, (_, i) => ({
  id: `line_${i}`,
  text: i === 0 ? '在这里输入第一行歌词...' : '',
}));

const MAX_USERS = 8;
const CHAR_WIDTH = 9.6;

const EditorPage: React.FC<EditorPageProps> = ({ roomId, user }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [lines, setLines] = useState<LyricLineType[]>(DEFAULT_LINES);
  const [version, setVersion] = useState(0);
  const [remoteCursors, setRemoteCursors] = useState<
    Record<string, { position: CursorPosition; user: User }>
  >({});
  const [myCursor, setMyCursor] = useState<CursorPosition>({ lineIndex: 0, charIndex: 0 });
  const [connected, setConnected] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const playIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  const [totalDuration, setTotalDuration] = useState(180000);
  const [draggingTimestampId, setDraggingTimestampId] = useState<string | null>(null);

  const linesContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hiddenTextareaRef = useRef<HTMLTextAreaElement>(null);
  const sendCursorTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const socket = socketClient.connect();

    if (socket.id) {
      user.socketId = socket.id;
    }

    socket.on('connect', () => {
      if (socket.id) user.socketId = socket.id;
      setConnected(true);
      socketClient.joinRoom(roomId, user);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socketClient.onRoomJoined((state) => {
      setLines(state.lines.length ? state.lines : DEFAULT_LINES);
      setUsers(state.users.slice(0, MAX_USERS));
      setVersion(state.version);
      setConnected(true);
    });

    socketClient.onUserJoined((updatedUsers) => {
      setUsers(updatedUsers.slice(0, MAX_USERS));
    });

    socketClient.onUserLeft((updatedUsers) => {
      setUsers(updatedUsers.slice(0, MAX_USERS));
      setRemoteCursors((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((uid) => {
          if (!updatedUsers.find((u) => u.id === uid)) {
            delete next[uid];
          }
        });
        return next;
      });
    });

    socketClient.onTextOperation((op) => {
      if (op.userId === user.id) return;
      applyRemoteOperation(op);
    });

    socketClient.onCursorUpdate((cursors) => {
      setRemoteCursors((prev) => {
        const next: typeof prev = {};
        Object.entries(cursors).forEach(([uid, data]) => {
          if (uid !== user.id) {
            next[uid] = data;
          }
        });
        return next;
      });
    });

    socketClient.onTimestampAdded((ts) => {
      setLines((prev) => {
        const next = [...prev];
        if (next[ts.lineIndex]) {
          next[ts.lineIndex] = { ...next[ts.lineIndex], timestamp: ts };
        }
        return next;
      });
      updateTotalDuration();
    });

    socketClient.onTimestampUpdated((ts) => {
      setLines((prev) => {
        const next = prev.map((line) => {
          if (line.timestamp && line.timestamp.id === ts.id) {
            return { ...line, timestamp: undefined };
          }
          return line;
        });
        if (next[ts.lineIndex]) {
          next[ts.lineIndex] = { ...next[ts.lineIndex], timestamp: ts };
        }
        return next;
      });
      updateTotalDuration();
    });

    socketClient.onTimestampRemoved((data) => {
      setLines((prev) => {
        const next = [...prev];
        if (next[data.lineIndex] && next[data.lineIndex].timestamp?.id === data.timestampId) {
          next[data.lineIndex] = { ...next[data.lineIndex], timestamp: undefined };
        }
        return next;
      });
      updateTotalDuration();
    });

    if (socket.connected) {
      socketClient.joinRoom(roomId, user);
    }

    return () => {
      socketClient.leaveRoom(roomId, user.id);
      socketClient.offAll();
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [roomId, user]);

  const updateTotalDuration = useCallback(() => {
    setLines((currentLines) => {
      const maxTime = currentLines.reduce((max, line) => {
        return line.timestamp ? Math.max(max, line.timestamp.time) : max;
      }, 0);
      const newTotal = Math.max(maxTime + 10000, 60000);
      setTotalDuration(newTotal);
      return currentLines;
    });
  }, []);

  const applyRemoteOperation = useCallback((op: TextOperation) => {
    setLines((prev) => {
      const next = [...prev];
      const line = { ...next[op.lineIndex] };
      if (op.type === 'insert' && op.text !== undefined) {
        const chars = [...line.text];
        chars.splice(op.charIndex, 0, op.text);
        line.text = chars.join('');
      } else if (op.type === 'delete' && op.length !== undefined) {
        const chars = [...line.text];
        chars.splice(op.charIndex, op.length);
        line.text = chars.join('');
      } else if (op.type === 'replace' && op.text !== undefined && op.length !== undefined) {
        const chars = [...line.text];
        chars.splice(op.charIndex, op.length, op.text);
        line.text = chars.join('');
      }
      next[op.lineIndex] = line;
      return next;
    });
    if (op.lineIndex === myCursor.lineIndex) {
      setMyCursor((prev) => {
        let newChar = prev.charIndex;
        if (op.type === 'insert' && op.text && op.charIndex <= prev.charIndex) {
          newChar = prev.charIndex + op.text.length;
        } else if (op.type === 'delete' && op.length && op.charIndex < prev.charIndex) {
          newChar = Math.max(op.charIndex, prev.charIndex - op.length);
        }
        return { ...prev, charIndex: newChar };
      });
    }
    setVersion((v) => Math.max(v, op.version));
  }, [myCursor]);

  const sendOperation = useCallback(
    (op: Omit<TextOperation, 'version' | 'timestamp' | 'userId'>) => {
      const fullOp: TextOperation = {
        ...op,
        userId: user.id,
        version: version + 1,
        timestamp: Date.now(),
      };
      setVersion((v) => v + 1);
      socketClient.sendOperation(roomId, fullOp);
    },
    [roomId, user.id, version]
  );

  const sendCursorThrottled = useCallback(
    (pos: CursorPosition) => {
      if (sendCursorTimeoutRef.current) {
        window.clearTimeout(sendCursorTimeoutRef.current);
      }
      sendCursorTimeoutRef.current = window.setTimeout(() => {
        socketClient.sendCursor(roomId, user.id, pos);
      }, 50);
    },
    [roomId, user.id]
  );

  const focusHiddenTextarea = useCallback(() => {
    hiddenTextareaRef.current?.focus();
  }, []);

  useEffect(() => {
    focusHiddenTextarea();
  }, [focusHiddenTextarea]);

  const handleLineMouseDown = useCallback(
    (lineIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      focusHiddenTextarea();
      const target = e.currentTarget as HTMLElement;
      const textContainer = target.querySelector('[style*="Fira Code"]') as HTMLElement;
      if (!textContainer) return;
      const rect = textContainer.getBoundingClientRect();
      const relativeX = e.clientX - rect.left - 8;
      let charIndex = Math.round(relativeX / CHAR_WIDTH);
      charIndex = Math.max(0, Math.min(charIndex, lines[lineIndex]?.text.length || 0));
      const newPos = { lineIndex, charIndex };
      setMyCursor(newPos);
      sendCursorThrottled(newPos);
    },
    [focusHiddenTextarea, lines, sendCursorThrottled]
  );

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const { lineIndex, charIndex } = myCursor;
      const currentText = lines[lineIndex]?.text || '';

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        let newChar = charIndex - 1;
        let newLine = lineIndex;
        if (newChar < 0 && lineIndex > 0) {
          newLine = lineIndex - 1;
          newChar = lines[newLine]?.text.length || 0;
        }
        newChar = Math.max(0, newChar);
        const pos = { lineIndex: newLine, charIndex: newChar };
        setMyCursor(pos);
        sendCursorThrottled(pos);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        let newChar = charIndex + 1;
        let newLine = lineIndex;
        if (newChar > currentText.length && lineIndex < lines.length - 1) {
          newLine = lineIndex + 1;
          newChar = 0;
        }
        newChar = Math.min(newChar, lines[newLine]?.text.length || 0);
        const pos = { lineIndex: newLine, charIndex: newChar };
        setMyCursor(pos);
        sendCursorThrottled(pos);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (lineIndex > 0) {
          const newLine = lineIndex - 1;
          const newChar = Math.min(charIndex, lines[newLine]?.text.length || 0);
          const pos = { lineIndex: newLine, charIndex: newChar };
          setMyCursor(pos);
          sendCursorThrottled(pos);
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (lineIndex < lines.length - 1) {
          const newLine = lineIndex + 1;
          const newChar = Math.min(charIndex, lines[newLine]?.text.length || 0);
          const pos = { lineIndex: newLine, charIndex: newChar };
          setMyCursor(pos);
          sendCursorThrottled(pos);
        }
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (charIndex > 0) {
          setLines((prev) => {
            const next = [...prev];
            const line = { ...next[lineIndex] };
            const chars = [...line.text];
            chars.splice(charIndex - 1, 1);
            line.text = chars.join('');
            next[lineIndex] = line;
            return next;
          });
          const pos = { lineIndex, charIndex: charIndex - 1 };
          setMyCursor(pos);
          sendCursorThrottled(pos);
          sendOperation({ type: 'delete', lineIndex, charIndex: charIndex - 1, length: 1 });
        } else if (lineIndex > 0) {
          const prevLineText = lines[lineIndex - 1]?.text || '';
          const mergedText = prevLineText + currentText;
          setLines((prev) => {
            const next = prev.filter((_, i) => i !== lineIndex);
            if (next[lineIndex - 1]) {
              next[lineIndex - 1] = { ...next[lineIndex - 1], text: mergedText };
            }
            while (next.length < 3) next.push({ id: `line_${Date.now()}_${next.length}`, text: '' });
            return next;
          });
          const pos = { lineIndex: lineIndex - 1, charIndex: prevLineText.length };
          setMyCursor(pos);
          sendCursorThrottled(pos);
          sendOperation({ type: 'replace', lineIndex: lineIndex - 1, charIndex: prevLineText.length, text: currentText, length: 0 });
          sendOperation({ type: 'delete', lineIndex: lineIndex, charIndex: 0, length: currentText.length });
        }
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const before = currentText.slice(0, charIndex);
        const after = currentText.slice(charIndex);
        setLines((prev) => {
          const next = [...prev];
          next[lineIndex] = { ...next[lineIndex], text: before };
          next.splice(lineIndex + 1, 0, { id: `line_${Date.now()}`, text: after });
          return next;
        });
        const pos = { lineIndex: lineIndex + 1, charIndex: 0 };
        setMyCursor(pos);
        sendCursorThrottled(pos);
        sendOperation({ type: 'replace', lineIndex, charIndex, text: '', length: after.length });
        sendOperation({
          type: 'insert',
          lineIndex: lineIndex + 1,
          charIndex: 0,
          text: after,
        });
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const spaces = '  ';
        setLines((prev) => {
          const next = [...prev];
          const line = { ...next[lineIndex] };
          const chars = [...line.text];
          chars.splice(charIndex, 0, spaces);
          line.text = chars.join('');
          next[lineIndex] = line;
          return next;
        });
        const pos = { lineIndex, charIndex: charIndex + spaces.length };
        setMyCursor(pos);
        sendCursorThrottled(pos);
        sendOperation({ type: 'insert', lineIndex, charIndex, text: spaces });
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const char = e.key;
        setLines((prev) => {
          const next = [...prev];
          const line = { ...next[lineIndex] };
          const chars = [...line.text];
          chars.splice(charIndex, 0, char);
          line.text = chars.join('');
          next[lineIndex] = line;
          return next;
        });
        const pos = { lineIndex, charIndex: charIndex + 1 };
        setMyCursor(pos);
        sendCursorThrottled(pos);
        sendOperation({ type: 'insert', lineIndex, charIndex, text: char });
      }
    },
    [myCursor, lines, sendOperation, sendCursorThrottled]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      if (!text) return;
      const { lineIndex, charIndex } = myCursor;
      const currentText = lines[lineIndex]?.text || '';
      const pastedLines = text.split('\n');

      if (pastedLines.length === 1) {
        setLines((prev) => {
          const next = [...prev];
          const line = { ...next[lineIndex] };
          const chars = [...line.text];
          chars.splice(charIndex, 0, pastedLines[0]);
          line.text = chars.join('');
          next[lineIndex] = line;
          return next;
        });
        const pos = { lineIndex, charIndex: charIndex + pastedLines[0].length };
        setMyCursor(pos);
        sendCursorThrottled(pos);
        sendOperation({ type: 'insert', lineIndex, charIndex, text: pastedLines[0] });
      } else {
        const firstPart = currentText.slice(0, charIndex) + pastedLines[0];
        const lastPart = pastedLines[pastedLines.length - 1] + currentText.slice(charIndex);
        const middleLines = pastedLines.slice(1, -1);
        setLines((prev) => {
          const next = [...prev];
          next[lineIndex] = { ...next[lineIndex], text: firstPart };
          const newMiddle = middleLines.map((t, i) => ({ id: `line_p_${Date.now()}_${i}`, text: t }));
          const lastLineObj = { id: `line_p_${Date.now()}_last`, text: lastPart };
          next.splice(lineIndex + 1, 0, ...newMiddle, lastLineObj);
          return next;
        });
        const newLineIdx = lineIndex + middleLines.length + 1;
        const pos = { lineIndex: newLineIdx, charIndex: pastedLines[pastedLines.length - 1].length };
        setMyCursor(pos);
        sendCursorThrottled(pos);
        sendOperation({ type: 'replace', lineIndex, charIndex, text: pastedLines[0], length: 0 });
        middleLines.forEach((t, i) => {
          sendOperation({ type: 'insert', lineIndex: lineIndex + 1 + i, charIndex: 0, text: t });
        });
        sendOperation({ type: 'insert', lineIndex: newLineIdx, charIndex: 0, text: pastedLines[pastedLines.length - 1] });
      }
    },
    [myCursor, lines, sendOperation, sendCursorThrottled]
  );

  const addTimestampToLine = useCallback(
    (lineIndex: number, time: number) => {
      const existing = lines[lineIndex]?.timestamp;
      const ts: Timestamp = {
        id: existing?.id || `ts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        lineIndex,
        time,
      };
      socketClient.addTimestamp(roomId, ts);
    },
    [lines, roomId]
  );

  const removeTimestampFromLine = useCallback(
    (lineIndex: number) => {
      const ts = lines[lineIndex]?.timestamp;
      if (ts) {
        socketClient.removeTimestamp(roomId, ts.id, lineIndex);
      }
    },
    [lines, roomId]
  );

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const time = Math.max(0, Math.floor(ratio * totalDuration));

      if (draggingTimestampId) {
        const ts = lines.find((l) => l.timestamp?.id === draggingTimestampId)?.timestamp;
        if (ts) {
          const updated: Timestamp = { ...ts, time, lineIndex: ts.lineIndex };
          socketClient.updateTimestamp(roomId, updated);
        }
        setDraggingTimestampId(null);
        return;
      }

      const sortedTimestamps = lines
        .map((l, i) => ({ lineIndex: i, time: l.timestamp?.time, hasTs: !!l.timestamp }))
        .filter((x) => x.time !== undefined)
        .sort((a, b) => (a.time! - b.time!));

      let targetLine = 0;
      for (let i = 0; i < sortedTimestamps.length; i++) {
        if (sortedTimestamps[i].time! <= time) {
          targetLine = sortedTimestamps[i].lineIndex;
        }
      }
      const after = sortedTimestamps.find((x) => x.time! > time);
      if (after) {
        const candidates = [];
        for (let i = targetLine; i <= after.lineIndex; i++) {
          candidates.push(i);
        }
        const empty = candidates.find((i) => !lines[i]?.timestamp);
        targetLine = empty ?? targetLine;
      } else {
        const empties = [];
        for (let i = 0; i < lines.length; i++) {
          if (!lines[i]?.timestamp) empties.push(i);
        }
        targetLine = empties.find((e) => e >= targetLine) ?? targetLine;
      }

      if (!lines[targetLine]?.timestamp) {
        addTimestampToLine(targetLine, time);
      } else {
        let nextEmpty = -1;
        for (let i = 0; i < lines.length; i++) {
          if (!lines[i]?.timestamp) {
            nextEmpty = i;
            break;
          }
        }
        if (nextEmpty >= 0) {
          addTimestampToLine(nextEmpty, time);
        }
      }
    },
    [totalDuration, draggingTimestampId, lines, roomId]
  );

  const handleTimelineMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!draggingTimestampId) return;
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const ratio = x / rect.width;
      const time = Math.max(0, Math.floor(ratio * totalDuration));
      const ts = lines.find((l) => l.timestamp?.id === draggingTimestampId)?.timestamp;
      if (ts) {
        const updated: Timestamp = { ...ts, time, lineIndex: ts.lineIndex };
        socketClient.updateTimestamp(roomId, updated);
      }
    },
    [draggingTimestampId, totalDuration, lines, roomId]
  );

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now() - pausedAtRef.current * (1000 / playbackSpeed);
      playIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) * playbackSpeed;
        const currentTime = Math.min(elapsed, totalDuration);
        setCurrentPlaybackTime(currentTime);

        let activeIdx = -1;
        let maxTime = -1;
        lines.forEach((line, idx) => {
          if (line.timestamp && line.timestamp.time <= currentTime && line.timestamp.time > maxTime) {
            maxTime = line.timestamp.time;
            activeIdx = idx;
          }
        });
        setActiveLineIndex(activeIdx);

        if (activeIdx >= 0 && lineRefs.current[activeIdx]) {
          lineRefs.current[activeIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (currentTime >= totalDuration) {
          setIsPlaying(false);
          pausedAtRef.current = 0;
          setCurrentPlaybackTime(0);
          setActiveLineIndex(-1);
          if (playIntervalRef.current) clearInterval(playIntervalRef.current);
        }
      }, 50);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      if (currentPlaybackTime > 0) {
        pausedAtRef.current = currentPlaybackTime;
      }
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, playbackSpeed, lines, totalDuration, currentPlaybackTime]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      pausedAtRef.current = currentPlaybackTime;
      setIsPlaying(true);
    }
  }, [isPlaying, currentPlaybackTime]);

  const resetPlayback = useCallback(() => {
    setIsPlaying(false);
    pausedAtRef.current = 0;
    setCurrentPlaybackTime(0);
    setActiveLineIndex(-1);
    linesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLeaveRoom = () => {
    socketClient.leaveRoom(roomId, user.id);
    socketClient.disconnect();
    navigate('/');
  };

  const cursorsPerLine: Record<number, { user: User; charIndex: number; lineIndex: number }[]> = {};
  Object.values(remoteCursors).forEach(({ position, user: u }) => {
    if (!cursorsPerLine[position.lineIndex]) cursorsPerLine[position.lineIndex] = [];
    cursorsPerLine[position.lineIndex].push({ user: u, charIndex: position.charIndex, lineIndex: position.lineIndex });
  });

  const hasAnyTimestamp = lines.some((l) => l.timestamp);
  const playbackProgress = totalDuration > 0 ? (currentPlaybackTime / totalDuration) * 100 : 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        minWidth: 768,
        overflow: 'hidden',
      }}
    >
      <div
        className="fade-in"
        style={{
          width: 240,
          flexShrink: 0,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 4, letterSpacing: 0.5 }}>房间号</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, fontFamily: "'Fira Code', monospace" }}>
            {roomId}
          </div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: connected ? '#22c55e' : '#ef4444',
                display: 'inline-block',
                boxShadow: connected ? '0 0 8px #22c55e' : 'none',
              }}
            />
            {connected ? '已连接' : '连接中...'}
          </div>
        </div>

        <div style={{ padding: '12px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
            在线用户 ({users.length}/{MAX_USERS})
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map((u) => (
            <div
              key={u.id}
              className="fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                backgroundColor: u.id === user.id ? '#eef2ff' : '#f9fafb',
                border: u.id === user.id ? '1px solid #c7d2fe' : '1px solid #f3f4f6',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: u.color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                  boxShadow: `0 2px 8px ${u.color}40`,
                }}
              >
                {u.nickname.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1f2937',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {u.nickname}
                  {u.id === user.id && (
                    <span style={{ fontSize: 10, color: '#6366f1', marginLeft: 6 }}>(我)</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button
            onClick={handleLeaveRoom}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: '#6b7280',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fee2e2';
              (e.currentTarget as HTMLButtonElement).style.color = '#dc2626';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#fecaca';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f9fafb';
              (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
            }}
          >
            离开房间
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div
          className="fade-in"
          style={{
            height: 60,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🎵</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>歌词编辑器</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                点击歌词定位光标 · 键盘输入编辑 · {hasAnyTimestamp ? '播放预览已就绪' : '添加时间戳启用卡拉OK'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              style={{
                padding: '8px 10px',
                fontSize: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                backgroundColor: '#f9fafb',
                cursor: 'pointer',
                outline: 'none',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
            </select>

            <button
              onClick={resetPlayback}
              style={{
                padding: '8px 14px',
                fontSize: 13,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                backgroundColor: '#f9fafb',
                cursor: 'pointer',
                color: '#374151',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              ⏹ 重置
            </button>

            <button
              onClick={togglePlay}
              disabled={!hasAnyTimestamp}
              style={{
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                borderRadius: 8,
                background: hasAnyTimestamp
                  ? isPlaying
                    ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : '#d1d5db',
                color: '#fff',
                cursor: hasAnyTimestamp ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: hasAnyTimestamp ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
              }}
            >
              {isPlaying ? '⏸ 暂停' : '▶ 播放预览'}
            </button>
          </div>
        </div>

        <div
          ref={linesContainerRef}
          className="fade-in"
          onClick={focusHiddenTextarea}
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#F7F8FA',
            padding: '24px 8%',
            position: 'relative',
          }}
        >
          <div
            style={{
              maxWidth: 1000,
              margin: '0 auto',
              backgroundColor: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              padding: '16px 0',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'relative' }}>
              {lines.map((line, idx) => {
                if (!lineRefs.current[idx]) lineRefs.current[idx] = null;
                return (
                  <LyricLine
                    key={line.id}
                    lineIndex={idx}
                    text={line.text}
                    timestamp={line.timestamp ? formatTime(line.timestamp.time) : undefined}
                    lineRef={(el) => {
                      lineRefs.current[idx] = el;
                    }}
                    isActive={idx === activeLineIndex}
                    cursors={cursorsPerLine[idx] || []}
                    onMouseDown={(e) => handleLineMouseDown(idx, e)}
                    onClickTimestamp={() => removeTimestampFromLine(idx)}
                    onTimestampClick={(e) => {
                      if (line.timestamp) {
                        setDraggingTimestampId(line.timestamp.id);
                      }
                    }}
                  />
                );
              })}

              {myCursor.lineIndex < lines.length && (
                <div
                  style={{
                    position: 'absolute',
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: `calc(60px + 8px + ${myCursor.charIndex * CHAR_WIDTH}px)`,
                      top: `${myCursor.lineIndex * (16 * 1.8)}px`,
                      width: 2,
                      height: `calc(16px * 1.8)`,
                      backgroundColor: user.color,
                      animation: 'cursorBlink 1s step-end infinite',
                      boxShadow: `0 0 6px ${user.color}`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <textarea
            ref={hiddenTextareaRef}
            onKeyDown={handleTextareaKeyDown}
            onPaste={handlePaste}
            value=""
            onChange={() => {}}
            style={{
              position: 'fixed',
              left: -9999,
              top: 0,
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: 'none',
            }}
            autoFocus
          />
        </div>

        <div
          className="fade-in"
          style={{
            height: 88,
            flexShrink: 0,
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e5e7eb',
            padding: '12px 24px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
              fontSize: 12,
              color: '#6b7280',
              fontWeight: 500,
            }}
          >
            <span>⏱ 时间戳轨道 · 点击任意位置添加时间标记 · 拖动标记调整位置</span>
            <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 12 }}>
              {formatTime(currentPlaybackTime)} / {formatTime(totalDuration)}
            </span>
          </div>
          <div
            onClick={handleTimelineClick}
            onMouseMove={handleTimelineMouseMove}
            onMouseUp={() => setDraggingTimestampId(null)}
            onMouseLeave={() => setDraggingTimestampId(null)}
            style={{
              position: 'relative',
              height: 36,
              backgroundColor: '#f3f4f6',
              borderRadius: 8,
              cursor: 'pointer',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${playbackProgress}%`,
                backgroundColor: 'rgba(99,102,241,0.15)',
                borderRadius: 8,
                pointerEvents: 'none',
                transition: 'width 0.05s linear',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: `${playbackProgress}%`,
                height: '100%',
                width: 3,
                backgroundColor: '#6366f1',
                borderRadius: 2,
                pointerEvents: 'none',
                boxShadow: '0 0 8px rgba(99,102,241,0.5)',
                zIndex: 5,
              }}
            />
            {[0.25, 0.5, 0.75].map((ratio) => (
              <div
                key={ratio}
                style={{
                  position: 'absolute',
                  top: 8,
                  left: `${ratio * 100}%`,
                  width: 1,
                  height: 20,
                  backgroundColor: '#d1d5db',
                }}
              />
            ))}
            {lines.map((line, idx) => {
              if (!line.timestamp) return null;
              const position = (line.timestamp.time / totalDuration) * 100;
              return (
                <div
                  key={line.timestamp.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingTimestampId(line.timestamp!.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    removeTimestampFromLine(idx);
                  }}
                  title={`第${idx + 1}行: ${formatTime(line.timestamp.time)} - ${line.text.slice(0, 30) || '(空行)'}`}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: `${position}%`,
                    transform: 'translateX(-50%)',
                    cursor: draggingTimestampId === line.timestamp.id ? 'grabbing' : 'grab',
                    zIndex: draggingTimestampId === line.timestamp.id ? 20 : 10,
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 36,
                      backgroundColor: line.timestamp.id === draggingTimestampId ? '#ef4444' : '#6366f1',
                      borderRadius: '2px 2px 0 0',
                      boxShadow:
                        line.timestamp.id === draggingTimestampId
                          ? '0 0 12px rgba(239,68,68,0.5)'
                          : '0 0 4px rgba(99,102,241,0.3)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -18,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: 9,
                      fontFamily: "'Fira Code', monospace",
                      color: '#6b7280',
                      whiteSpace: 'nowrap',
                      backgroundColor: '#fff',
                      padding: '1px 4px',
                      borderRadius: 3,
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {formatTime(line.timestamp.time)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
