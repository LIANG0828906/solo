import React, { useState, useEffect } from 'react';
import { useSongStore } from '../store/useSongStore';

interface SongListProps {
  onSongSelect: (songId: string) => void;
}

export const SongList: React.FC<SongListProps> = ({ onSongSelect }) => {
  const { songs, loadSongs, createSong, loading, error, clearError, userName, setUserName, userId, setUserId } = useSongStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSongName, setNewSongName] = useState('');
  const [newTimeSignature, setNewTimeSignature] = useState<'4/4' | '3/4'>('4/4');
  const [showNameModal, setShowNameModal] = useState(true);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const storedUserId = localStorage.getItem('harmonylab_user_id');
    const storedUserName = localStorage.getItem('harmonylab_user_name');
    
    if (storedUserId) {
      setUserId(storedUserId);
    }
    
    if (storedUserName) {
      setUserName(storedUserName);
      setShowNameModal(false);
    }
    
    loadSongs();
  }, [loadSongs, setUserId, setUserName]);

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem('harmonylab_user_name', tempName.trim());
      
      const newUserId = crypto.randomUUID();
      setUserId(newUserId);
      localStorage.setItem('harmonylab_user_id', newUserId);
      
      setShowNameModal(false);
    }
  };

  const handleCreateSong = async () => {
    if (newSongName.trim()) {
      const song = await createSong(newSongName.trim(), newTimeSignature);
      if (song) {
        setShowCreateModal(false);
        setNewSongName('');
        loadSongs();
        setTimeout(() => onSongSelect(song.id), 100);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return '刚刚';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
    return `${Math.floor(seconds / 86400)} 天前`;
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      padding: '40px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '700',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, var(--accent), #985EFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🎵 HarmonyLab
            </h1>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '16px'
            }}>
              在线歌曲创作与协作平台
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              你好，<span style={{ color: 'var(--accent)', fontWeight: '600' }}>{userName}</span>
            </span>
            <button
              className="btn btn-primary ripple"
              onClick={() => setShowCreateModal(true)}
            >
              + 新建歌曲
            </button>
          </div>
        </div>

        {error && (
          <div className="toast error" onClick={clearError}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px'
          }}>
            <div className="loading-spinner" />
          </div>
        ) : songs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '2px dashed var(--border)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎶</div>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '8px',
              color: 'var(--text-primary)'
            }}>
              还没有歌曲
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '24px'
            }}>
              创建你的第一首歌曲，开始创作之旅！
            </p>
            <button
              className="btn btn-primary ripple"
              onClick={() => setShowCreateModal(true)}
            >
              + 创建第一首歌曲
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {songs.map(song => (
              <div
                key={song.id}
                className="card"
                style={{
                  width: '320px',
                  justifySelf: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => onSongSelect(song.id)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      marginBottom: '4px',
                      color: 'var(--text-primary)'
                    }}>
                      {song.name}
                    </h3>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)'
                    }}>
                      {formatDate(song.updatedAt)} • {getTimeSince(song.updatedAt)}
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    background: 'var(--accent-light)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--accent)'
                  }}>
                    <span>👥</span>
                    <span>{song.memberCount}</span>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '16px',
                  fontSize: '13px'
                }}>
                  <span style={{
                    padding: '4px 8px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '4px',
                    color: 'var(--text-secondary)'
                  }}>
                    {song.timeSignature}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '4px',
                    color: 'var(--text-secondary)'
                  }}>
                    {song.key}调
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '4px',
                    color: 'var(--text-secondary)'
                  }}>
                    ♩ {song.bpm}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}>
                    {song.chordCount} 个和弦
                  </span>
                  <span
                    className="btn btn-ghost"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      opacity: '0',
                      transition: 'opacity var(--transition-fast)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSongSelect(song.id);
                    }}
                  >
                    编辑 →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNameModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">欢迎来到 HarmonyLab 👋</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              请输入你的名字，开始创作之旅
            </p>
            
            <div className="form-group">
              <label className="form-label">你的名字</label>
              <input
                type="text"
                className="form-input"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="例如：小明"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              />
            </div>
            
            <div className="form-actions">
              <button
                className="btn btn-primary ripple"
                onClick={handleNameSubmit}
                disabled={!tempName.trim()}
              >
                开始创作
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">创建新歌曲</h2>
            
            <div className="form-group">
              <label className="form-label">歌曲名称</label>
              <input
                type="text"
                className="form-input"
                value={newSongName}
                onChange={(e) => setNewSongName(e.target.value)}
                placeholder="例如：我的第一首歌"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSong()}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">拍号</label>
              <select
                className="form-select"
                value={newTimeSignature}
                onChange={(e) => setNewTimeSignature(e.target.value as '4/4' | '3/4')}
              >
                <option value="4/4">4/4 (四拍)</option>
                <option value="3/4">3/4 (三拍)</option>
              </select>
            </div>
            
            <div className="form-actions">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewSongName('');
                }}
              >
                取消
              </button>
              <button
                className="btn btn-primary ripple"
                onClick={handleCreateSong}
                disabled={!newSongName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongList;
