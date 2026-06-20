import { useState, useEffect, useCallback } from 'react';
import { useStudioStore } from './store';
import { WSMessage, Track, Effects, RoomState, User } from './types';
import TrackPanel from './components/TrackPanel';
import MixerPanel from './components/MixerPanel';

const WS_URL = 'ws://localhost:3001';

function App() {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');

  const {
    currentUser,
    roomState,
    isConnected,
    isConnecting,
    isExporting,
    error,
    setCurrentUser,
    setRoomState,
    setConnected,
    setConnecting,
    setExporting,
    setError,
    setWs,
    updateTrack,
    deleteTrack,
    reorderTracks,
    updateEffects,
    setMasterVolume,
    setPlaying,
    addUser,
    removeUser,
    reset,
  } = useStudioStore();

  const connectToRoom = useCallback(() => {
    if (!roomIdInput.trim() || !nicknameInput.trim()) {
      setError('请输入房间号和昵称');
      return;
    }

    const roomId = roomIdInput.trim();
    const nickname = nicknameInput.trim();

    if (!/^\d{4}$/.test(roomId)) {
      setError('房间号必须是4位数字');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(WS_URL);
      setWs(ws);

      ws.onopen = () => {
        const msg: WSMessage = { type: 'join', roomId, nickname };
        ws.send(JSON.stringify(msg));
      };

      ws.onmessage = (event) => {
        const msg: WSMessage = JSON.parse(event.data);
        handleMessage(msg, ws);
      };

      ws.onerror = () => {
        setError('连接服务器失败，请稍后重试');
        setConnecting(false);
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
      };
    } catch (e) {
      setError('连接失败');
      setConnecting(false);
    }
  }, [roomIdInput, nicknameInput, setConnecting, setError, setWs]);

  const handleMessage = useCallback(
    (msg: WSMessage, ws: WebSocket) => {
      switch (msg.type) {
        case 'joined': {
          setConnecting(false);
          setConnected(true);
          setRoomState(msg.state);
          const user = msg.state.users.find((u) => u.id === msg.userId);
          if (user) {
            setCurrentUser(user);
          }
          break;
        }
        case 'state_update': {
          if (msg.state) {
            Object.keys(msg.state).forEach((key) => {
              useStudioStore.setState((s) => ({
                roomState: s.roomState
                  ? { ...s.roomState, ...msg.state }
                  : s.roomState,
              }));
            });
          }
          break;
        }
        case 'track_update': {
          updateTrack(msg.track);
          break;
        }
        case 'track_delete': {
          deleteTrack(msg.trackId);
          break;
        }
        case 'track_reorder': {
          reorderTracks(msg.trackIds);
          break;
        }
        case 'effects_update': {
          updateEffects(msg.effects);
          break;
        }
        case 'master_volume': {
          setMasterVolume(msg.volume);
          break;
        }
        case 'playback': {
          setPlaying(msg.isPlaying);
          break;
        }
        case 'export_complete': {
          setExporting(false);
          triggerDownload(msg.blobUrl);
          break;
        }
        case 'error': {
          setError(msg.message);
          break;
        }
        case 'room_full': {
          setError('房间已满（最多4人）');
          setConnecting(false);
          ws.close();
          break;
        }
        case 'user_leave': {
          removeUser(msg.userId);
          break;
        }
      }
    },
    [
      setConnecting,
      setConnected,
      setRoomState,
      setCurrentUser,
      updateTrack,
      deleteTrack,
      reorderTracks,
      updateEffects,
      setMasterVolume,
      setPlaying,
      setExporting,
      setError,
      removeUser,
    ]
  );

  const triggerDownload = (blobUrl: string) => {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `remote-studio-demo-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  };

  const handleLeave = () => {
    const ws = useStudioStore.getState().ws;
    if (ws) {
      ws.close();
    }
    reset();
  };

  const sendMessage = (data: object) => {
    const ws = useStudioStore.getState().ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  const onTrackVolumeChange = (track: Track, volume: number) => {
    const updated = { ...track, volume };
    updateTrack(updated);
    sendMessage({ type: 'track_update', track: updated });
  };

  const onTrackMute = (track: Track) => {
    const updated = { ...track, muted: !track.muted };
    updateTrack(updated);
    sendMessage({ type: 'track_update', track: updated });
  };

  const onTrackDelete = (trackId: string) => {
    if (!currentUser?.isHost) return;
    deleteTrack(trackId);
    sendMessage({ type: 'track_delete', trackId });
  };

  const onTrackReorder = (trackIds: string[]) => {
    reorderTracks(trackIds);
    sendMessage({ type: 'track_reorder', trackIds });
  };

  const onEffectsChange = (effects: Effects) => {
    updateEffects(effects);
    sendMessage({ type: 'effects_update', effects });
  };

  const onMasterVolumeChange = (volume: number) => {
    setMasterVolume(volume);
    sendMessage({ type: 'master_volume', volume });
  };

  const onPlaybackToggle = () => {
    if (!roomState) return;
    const newPlaying = !roomState.isPlaying;
    setPlaying(newPlaying);
    sendMessage({ type: 'playback', isPlaying: newPlaying });
  };

  const onExport = () => {
    if (!currentUser?.isHost || isExporting) return;
    setExporting(true);
    sendMessage({ type: 'export_request' });
  };

  if (!currentUser || !roomState) {
    return (
      <div className="app-container">
        <div className="login-screen">
          <h1>🎵 远程录音棚</h1>
          <p style={{ color: '#9E9E9E', marginBottom: 16 }}>
            在线协作创作，实时同步编曲混音
          </p>
          <div className="login-form">
            <input
              type="text"
              placeholder="房间号（4位数字）"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
            />
            <input
              type="text"
              placeholder="你的昵称"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value.slice(0, 20))}
              maxLength={20}
              onKeyDown={(e) => {
                if (e.key === 'Enter') connectToRoom();
              }}
            />
            {error && <div className="error-message">{error}</div>}
            <button onClick={connectToRoom} disabled={isConnecting}>
              {isConnecting ? '连接中...' : '创建 / 加入房间'}
            </button>
          </div>
          <p style={{ color: '#666', fontSize: 12, marginTop: 24 }}>
            输入相同房间号即可加入协作 · 每个房间最多 4 人
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="top-bar">
        <div className="top-bar-left">
          <span className="top-bar-title">🎵 远程录音棚</span>
          <div className="room-info">
            <span className="label">房间</span>
            <span className="value">{roomState.roomId}</span>
          </div>
          <div className={`connection-status ${isConnected ? 'connected' : isConnecting ? 'connecting' : 'disconnected'}`}>
            <span className="status-dot" />
            <span>{isConnected ? '已连接' : isConnecting ? '连接中' : '断开'}</span>
          </div>
        </div>
        <div className="top-bar-right">
          <div className="user-list">
            {roomState.users.map((u) => (
              <div key={u.id} className={`user-chip ${u.isHost ? 'is-host' : ''}`}>
                <span className="dot" />
                <span>{u.nickname}</span>
                {u.isHost && <span style={{ color: '#7C4DFF', fontSize: 11 }}>房主</span>}
              </div>
            ))}
          </div>
          <button className="leave-btn" onClick={handleLeave}>
            离开房间
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="tracks-area">
          {roomState.tracks.map((track) => (
            <TrackPanel
              key={track.id}
              track={track}
              isHost={currentUser.isHost}
              onVolumeChange={(v) => onTrackVolumeChange(track, v)}
              onMute={() => onTrackMute(track)}
              onDelete={() => onTrackDelete(track.id)}
              onReorder={onTrackReorder}
              trackIds={roomState.tracks.map((t) => t.id)}
              isPlaying={roomState.isPlaying}
              masterVolume={roomState.masterVolume}
            />
          ))}
        </div>

        <MixerPanel
          masterVolume={roomState.masterVolume}
          effects={roomState.effects}
          isPlaying={roomState.isPlaying}
          isHost={currentUser.isHost}
          isExporting={isExporting}
          onMasterVolumeChange={onMasterVolumeChange}
          onEffectsChange={onEffectsChange}
          onPlaybackToggle={onPlaybackToggle}
          onExport={onExport}
        />
      </div>
    </div>
  );
}

export default App;
