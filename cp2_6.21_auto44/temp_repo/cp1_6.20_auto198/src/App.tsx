import { useState, useEffect } from 'react';
import { Song, Room } from './types';
import SearchBar from './components/SearchBar';
import PlaylistGrid from './components/PlaylistGrid';
import RoomView from './components/RoomView';

type View = 'auth' | 'home' | 'room';

export default function App() {
  const [view, setView] = useState<View>('auth');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [participants, setParticipants] = useState<string[]>(['', '']);

  useEffect(() => {
    const savedUser = localStorage.getItem('music_app_user');
    if (savedUser) {
      setUser(savedUser);
      setView('home');
    }
  }, []);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`playlist_${user}`);
      if (saved) {
        setPlaylist(JSON.parse(saved));
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`playlist_${user}`, JSON.stringify(playlist));
    }
  }, [playlist, user]);

  const handleAuth = () => {
    if (!username.trim()) return;
    localStorage.setItem('music_app_user', username);
    setUser(username);
    setView('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('music_app_user');
    setUser(null);
    setUsername('');
    setPassword('');
    setPlaylist([]);
    setView('auth');
  };

  const handleAddSong = (song: Song) => {
    if (!playlist.find((s) => s.id === song.id)) {
      setPlaylist([...playlist, song]);
    }
  };

  const handleRemoveSong = (songId: string) => {
    setPlaylist(playlist.filter((s) => s.id !== songId));
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newPlaylist = [...playlist];
    const [removed] = newPlaylist.splice(fromIndex, 1);
    newPlaylist.splice(toIndex, 0, removed);
    setPlaylist(newPlaylist);
  };

  const addParticipantField = () => {
    if (participants.length < 5) {
      setParticipants([...participants, '']);
    }
  };

  const removeParticipantField = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, value: string) => {
    const updated = [...participants];
    updated[index] = value;
    setParticipants(updated);
  };

  const handleCreateRoom = async () => {
    const validParticipants = participants.filter((p) => p.trim() !== '');
    if (!roomName.trim() || validParticipants.length < 1) {
      alert('请输入房间名称和至少一位参与者姓名');
      return;
    }

    try {
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName,
          participants: validParticipants,
        }),
      });
      const room: Room = await res.json();
      setCurrentRoom(room);
      setShowCreateRoom(false);
      setRoomName('');
      setParticipants(['', '']);
      setView('room');
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('创建房间失败');
    }
  };

  if (view === 'auth') {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h1 className="auth-title">🎵 音乐播放列表</h1>
          <p className="auth-subtitle">创建聚会歌单，让每个人都满意</p>

          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              className="form-input"
              placeholder={isRegister ? '设置密码' : '密码'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            />
          </div>

          <button className="btn-primary" onClick={handleAuth}>
            {isRegister ? '注册' : '登录'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: '#bb86fc',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'room' && currentRoom) {
    return (
      <div className="app-container">
        <RoomView
          room={currentRoom}
          onBack={() => {
            setView('home');
            setCurrentRoom(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🎵 我的音乐</h1>
        <div className="header-actions">
          <span style={{ color: '#9e9e9e', alignSelf: 'center', marginRight: '8px' }}>
            欢迎, {user}
          </span>
          <button
            className="btn-secondary"
            onClick={() => setShowCreateRoom(true)}
          >
            + 创建聚会房间
          </button>
          <button className="btn-secondary" onClick={handleLogout}>
            退出
          </button>
        </div>
      </header>

      <h2 className="section-title">搜索歌曲</h2>
      <SearchBar onAddSong={handleAddSong} />

      <h2 className="section-title">
        我的歌单 ({playlist.length}首)
      </h2>
      <PlaylistGrid
        songs={playlist}
        onRemoveSong={handleRemoveSong}
        onReorder={handleReorder}
      />

      {showCreateRoom && (
        <div className="create-room-modal">
          <div className="modal-content">
            <h2 className="modal-title">创建聚会房间</h2>

            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="房间名称"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </div>

            <h3
              style={{
                fontSize: '14px',
                color: '#9e9e9e',
                marginBottom: '12px',
                marginTop: '24px',
              }}
            >
              参与者 ({participants.length}/5)
            </h3>

            {participants.map((p, index) => (
              <div key={index} className="participant-input-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder={`参与者 ${index + 1}`}
                  value={p}
                  onChange={(e) => updateParticipant(index, e.target.value)}
                />
                {participants.length > 1 && (
                  <button
                    className="remove-participant-btn"
                    onClick={() => removeParticipantField(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {participants.length < 5 && (
              <button
                className="add-participant-btn"
                onClick={addParticipantField}
              >
                + 添加参与者
              </button>
            )}

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowCreateRoom(false);
                  setRoomName('');
                  setParticipants(['', '']);
                }}
              >
                取消
              </button>
              <button className="btn-primary" onClick={handleCreateRoom}>
                创建房间
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
