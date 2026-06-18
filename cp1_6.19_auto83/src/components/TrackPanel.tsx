import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { FiPlus, FiTrash2, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { Track, OnlineUser, INSTRUMENT_NAMES, AVAILABLE_INSTRUMENTS } from '../data/project';

interface TrackPanelProps {
  tracks: Track[];
  selectedTrackId: string | null;
  onlineUsers: OnlineUser[];
  onSelectTrack: (id: string) => void;
  onAddTrack: () => void;
  onDeleteTrack: (id: string) => void;
  onReorderTracks: (from: number, to: number) => void;
  onToggleMute: (id: string) => void;
}

const TrackPanel: React.FC<TrackPanelProps> = ({
  tracks,
  selectedTrackId,
  onlineUsers,
  onSelectTrack,
  onAddTrack,
  onDeleteTrack,
  onReorderTracks,
  onToggleMute
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [tracksWithAnim, setTracksWithAnim] = useState(tracks.map(t => ({ ...t, exiting: false })));
  const dragOverIndex = useRef<number | null>(null);

  React.useEffect(() => {
    setTracksWithAnim(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const newItems = tracks.map(t => {
        const existing = prev.find(p => p.id === t.id);
        return existing || { ...t, exiting: false };
      });
      const removed = prev.filter(p => !tracks.find(t => t.id === p.id) && !p.exiting);
      if (removed.length > 0) {
        const withExiting = prev.map(p => {
          if (removed.find(r => r.id === p.id)) {
            return { ...p, exiting: true };
          }
          return p;
        }).filter(p => {
          if (p.exiting) return true;
          return tracks.find(t => t.id === p.id);
        });
        const merged = tracks.map(t => {
          const ex = withExiting.find(w => w.id === t.id);
          return ex ? { ...ex, exiting: false } : { ...t, exiting: false };
        });
        const exitOnly = withExiting.filter(w => !tracks.find(t => t.id === w.id));
        return [...merged, ...exitOnly];
      }
      if (prev.length > 0 && existingIds.size === tracks.length) {
        return newItems;
      }
      return newItems;
    });
  }, [tracks]);

  const handleDelete = (trackId: string) => {
    setDeleteConfirmId(null);
    setTracksWithAnim(prev =>
      prev.map(t => (t.id === trackId ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      onDeleteTrack(trackId);
    }, 300);
  };

  const getTrackUsers = (trackId: string) => {
    return onlineUsers;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #45475A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#A6ADC8' }}>
          轨道列表
        </h3>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onAddTrack}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: '#27AE60',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease-out'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#2ECC71')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#27AE60')}
          title="新建轨道"
        >
          <FiPlus size={16} />
        </motion.button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        <Reorder.Group
          axis="y"
          values={tracksWithAnim.filter(t => !t.exiting)}
          onReorder={(newOrder) => {
            if (draggedIndex !== null && dragOverIndex.current !== null && draggedIndex !== dragOverIndex.current) {
              onReorderTracks(draggedIndex, dragOverIndex.current);
            }
            setDraggedIndex(null);
            dragOverIndex.current = null;
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {tracksWithAnim.map((track, index) => (
            <AnimatePresence key={track.id}>
              {!track.exiting ? (
                <Reorder.Item
                  value={track}
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(e) => {
                    const target = (e.currentTarget as HTMLElement).parentElement;
                    if (target) {
                      const children = Array.from(target.children) as HTMLElement[];
                      dragOverIndex.current = children.indexOf(e.currentTarget as HTMLElement);
                    }
                  }}
                  style={{
                    listStyle: 'none',
                    width: '100%'
                  }}
                >
                  <motion.div
                    layout
                    initial={{ opacity: 1 }}
                    animate={{
                      opacity: 1,
                      x: draggedIndex === index ? 4 : 0,
                      boxShadow: draggedIndex === index ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={() => onSelectTrack(track.id)}
                    style={{
                      background: selectedTrackId === track.id ? '#FFFFFF12' : '#1E1E2E',
                      border: `2px solid ${selectedTrackId === track.id ? track.color : 'transparent'}`,
                      borderRadius: 10,
                      padding: 10,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-out',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTrackId !== track.id) {
                        e.currentTarget.style.background = '#FFFFFF08';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTrackId !== track.id) {
                        e.currentTarget.style.background = '#1E1E2E';
                      }
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      background: track.color,
                      borderRadius: '4px 0 0 4px'
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 6 }}>
                      <div
                        style={{
                          color: '#6C7086',
                          cursor: 'grab',
                          padding: 2,
                          flexShrink: 0,
                          opacity: 0.6,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <circle cx="9" cy="6" r="1.2" fill="currentColor" />
                          <circle cx="15" cy="6" r="1.2" fill="currentColor" />
                          <circle cx="9" cy="12" r="1.2" fill="currentColor" />
                          <circle cx="15" cy="12" r="1.2" fill="currentColor" />
                          <circle cx="9" cy="18" r="1.2" fill="currentColor" />
                          <circle cx="15" cy="18" r="1.2" fill="currentColor" />
                        </svg>
                      </div>

                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: track.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          flexShrink: 0
                        }}
                      >
                        {track.instrument === 'piano' && '🎹'}
                        {track.instrument === 'guitar' && '🎸'}
                        {track.instrument === 'drums' && '🥁'}
                        {track.instrument === 'bass' && '🎻'}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#CDD6F4',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {track.name}
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: '#7F849C',
                          marginTop: 2
                        }}>
                          {INSTRUMENT_NAMES[track.instrument]} · {track.notes.length} 音符
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleMute(track.id);
                          }}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: track.muted ? '#E74C3C' : '#7F849C',
                            transition: 'all 0.2s ease-out'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#FFFFFF15')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          title={track.muted ? '取消静音' : '静音'}
                        >
                          {track.muted ? <FiVolumeX size={13} /> : <FiVolume2 size={13} />}
                        </motion.button>

                        {deleteConfirmId === track.id ? (
                          <motion.button
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(track.id);
                            }}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              background: '#E74C3C',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 600
                            }}
                            title="确认删除"
                          >
                            ✓
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(track.id);
                              setTimeout(() => {
                                setDeleteConfirmId(prev => prev === track.id ? null : prev);
                              }, 2000);
                            }}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#7F849C',
                              transition: 'all 0.2s ease-out'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#E74C3C20';
                              e.currentTarget.style.color = '#E74C3C';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#7F849C';
                            }}
                            title="删除轨道"
                          >
                            <FiTrash2 size={13} />
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {getTrackUsers(track.id).length > 0 && (
                      <div style={{
                        display: 'flex',
                        marginTop: 8,
                        paddingLeft: 40,
                        gap: 4
                      }}>
                        {getTrackUsers(track.id).slice(0, 3).map((user, i) => (
                          <motion.div
                            key={user.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: user.color,
                              border: '1.5px solid #1E1E2E',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: 9,
                              fontWeight: 600,
                              marginLeft: i > 0 ? -6 : 0,
                              zIndex: 5 - i
                            }}
                            title={user.name}
                          >
                            {user.name.charAt(0)}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </Reorder.Item>
              ) : (
                <motion.div
                  key={`exit-${track.id}`}
                  initial={{ opacity: 1, height: 'auto', marginBottom: 6 }}
                  animate={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <motion.div
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: '#1E1E2E',
                      border: '2px solid transparent',
                      borderRadius: 10,
                      padding: 10,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      background: track.color,
                      borderRadius: '4px 0 0 4px',
                      opacity: 0.3
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 6 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: track.color, opacity: 0.3,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                      }}>
                        {track.instrument === 'piano' && '🎹'}
                        {track.instrument === 'guitar' && '🎸'}
                        {track.instrument === 'drums' && '🥁'}
                        {track.instrument === 'bass' && '🎻'}
                      </div>
                      <div style={{ flex: 1, opacity: 0.3 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#CDD6F4' }}>
                          {track.name}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </Reorder.Group>

        {tracks.length === 0 && (
          <div style={{
            padding: 32,
            textAlign: 'center',
            color: '#6C7086',
            fontSize: 12
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎵</div>
            暂无轨道，点击上方 + 添加
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPanel;
