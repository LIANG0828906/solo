import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AudioPlayer, formatTime } from './AudioPlayer';
import { NoteManager, Podcast, Note, PLACEHOLDER_AUDIOS } from './NoteManager';
import StatisticsChart from './StatisticsChart';
import './styles.css';

type Page = 'home' | 'player' | 'notes' | 'statistics';

interface NoteModalState {
  isOpen: boolean;
  timestamp: number;
  editingNoteId: string | null;
}

const noteManager = new NoteManager();
const audioPlayer = new AudioPlayer();

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedPodcastId, setSelectedPodcastId] = useState<string | null>(null);
  const [seekToTimestamp, setSeekToTimestamp] = useState<number | null>(null);
  const [noteModal, setNoteModal] = useState<NoteModalState | null>(null);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [filterPodcastId, setFilterPodcastId] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');
  const [waveformBars] = useState(() => 
    Array.from({ length: 120 }, (_, i) => 20 + Math.random() * 60)
  );
  const [showImportModal, setShowImportModal] = useState(false);
  const [importIndex, setImportIndex] = useState(0);

  const listeningStartRef = useRef<number | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPodcasts(noteManager.getPodcasts());
    setNotes(noteManager.filterNotes({}));
  }, []);

  useEffect(() => {
    const unsubscribeTime = audioPlayer.onTimeUpdate((time) => {
      setCurrentTime(time);
    });

    const unsubscribeDuration = audioPlayer.onLoadedMetadata((dur) => {
      setDuration(dur);
    });

    const unsubscribePlayState = audioPlayer.onPlayStateChange((playing) => {
      setIsPlaying(playing);
      
      if (playing) {
        listeningStartRef.current = Date.now();
      } else if (listeningStartRef.current && selectedPodcastId) {
        const elapsed = Math.floor((Date.now() - listeningStartRef.current) / 1000);
        if (elapsed > 5) {
          const today = new Date().toISOString().split('T')[0];
          noteManager.addListeningSession({
            podcastId: selectedPodcastId,
            date: today,
            duration: elapsed
          });
        }
        listeningStartRef.current = null;
      }
    });

    return () => {
      unsubscribeTime();
      unsubscribeDuration();
      unsubscribePlayState();
    };
  }, [selectedPodcastId]);

  useEffect(() => {
    if (selectedPodcastId && seekToTimestamp !== null) {
      const timer = setTimeout(() => {
        audioPlayer.seek(seekToTimestamp);
        setSeekToTimestamp(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedPodcastId, seekToTimestamp]);

  const refreshData = useCallback(() => {
    setPodcasts(noteManager.getPodcasts());
    setNotes(noteManager.filterNotes({ podcastId: filterPodcastId, tag: filterTag }));
  }, [filterPodcastId, filterTag]);

  const handlePodcastClick = useCallback(async (podcastId: string) => {
    const podcast = noteManager.getPodcastById(podcastId);
    if (podcast) {
      setSelectedPodcastId(podcastId);
      setCurrentPage('player');
      try {
        await audioPlayer.loadAudio(podcast.audioUrl);
        setCurrentTime(0);
      } catch (e) {
        console.error('Failed to load audio:', e);
      }
    }
  }, []);

  const handleBack = useCallback(() => {
    audioPlayer.pause();
    setCurrentPage('home');
    setSelectedPodcastId(null);
  }, []);

  const handleMarkTimestamp = useCallback(() => {
    const timestamp = audioPlayer.markTimestamp();
    setNoteModal({
      isOpen: true,
      timestamp,
      editingNoteId: null
    });
    setNoteContent('');
    setNoteTags('');
  }, []);

  const handleMarkerClick = useCallback((noteId: string) => {
    const note = noteManager.getNoteById(noteId);
    if (note) {
      setNoteModal({
        isOpen: true,
        timestamp: note.timestamp,
        editingNoteId: noteId
      });
      setNoteContent(note.content);
      setNoteTags(note.tags.join(', '));
    }
  }, []);

  const handleSaveNote = useCallback(() => {
    if (!noteModal || !selectedPodcastId) return;

    const tags = noteTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (noteModal.editingNoteId) {
      noteManager.updateNote(noteModal.editingNoteId, {
        content: noteContent,
        tags,
        timestamp: noteModal.timestamp
      });
    } else {
      noteManager.addNote({
        podcastId: selectedPodcastId,
        timestamp: noteModal.timestamp,
        content: noteContent,
        tags
      });
    }

    setNoteModal(null);
    refreshData();
    audioPlayer.play();
  }, [noteModal, selectedPodcastId, noteContent, noteTags, refreshData]);

  const handleDeleteNote = useCallback((noteId: string) => {
    noteManager.deleteNote(noteId);
    setNoteModal(null);
    refreshData();
  }, [refreshData]);

  const handleTimestampClick = useCallback((podcastId: string, timestamp: number) => {
    setSelectedPodcastId(podcastId);
    setSeekToTimestamp(timestamp);
    setCurrentPage('player');
    
    const podcast = noteManager.getPodcastById(podcastId);
    if (podcast) {
      audioPlayer.loadAudio(podcast.audioUrl).catch(console.error);
    }
  }, []);

  const handleWaveformClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || duration === 0) return;
    
    const rect = waveformRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const targetTime = Math.floor(percentage * duration);
    audioPlayer.seek(targetTime);
  }, [duration]);

  const handleImportPodcast = useCallback((index: number) => {
    const audio = PLACEHOLDER_AUDIOS[index];
    noteManager.addPodcast({
      title: audio.title,
      audioUrl: '',
      duration: audio.duration
    });
    setShowImportModal(false);
    setImportIndex((importIndex + 1) % PLACEHOLDER_AUDIOS.length);
    refreshData();
  }, [importIndex, refreshData]);

  const currentPodcast = useMemo(() => 
    selectedPodcastId ? noteManager.getPodcastById(selectedPodcastId) : null,
    [selectedPodcastId]
  );

  const podcastNotes = useMemo(() => 
    selectedPodcastId ? noteManager.getNotesByPodcast(selectedPodcastId) : [],
    [selectedPodcastId, notes]
  );

  const weeklyStats = useMemo(() => noteManager.getWeeklyListeningStats(), [notes, podcasts]);
  const podcastNoteStats = useMemo(() => noteManager.getPodcastNoteStats(), [notes, podcasts]);
  const totalStats = useMemo(() => noteManager.getTotalStats(), [notes, podcasts]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const renderNavItem = (page: Page, icon: string, label: string) => (
    <div
      key={page}
      className={`nav-item ${currentPage === page ? 'active' : ''}`}
      onClick={() => {
        if (page !== 'player') {
          if (currentPage === 'player') {
            audioPlayer.pause();
          }
          setCurrentPage(page);
          setSelectedPodcastId(null);
        }
      }}
    >
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
    </div>
  );

  const renderMobileTab = (page: Page, icon: string, label: string) => (
    <div
      key={page}
      className={`mobile-tab-item ${currentPage === page ? 'active' : ''}`}
      onClick={() => {
        if (page !== 'player') {
          if (currentPage === 'player') {
            audioPlayer.pause();
          }
          setCurrentPage(page);
          setSelectedPodcastId(null);
        }
      }}
    >
      <span className="mobile-tab-icon">{icon}</span>
      <span className="mobile-tab-label">{label}</span>
    </div>
  );

  const renderHomePage = () => (
    <>
      <div className="page-header">
      <h1 className="page-title">我的播客</h1>
      <button className="btn btn-primary" onClick={() => setShowImportModal(true)}>
        + 导入播客
      </button>
    </div>
    
    {podcasts.length === 0 ? (
      <div className="empty-state">
        <div className="empty-icon">🎙️</div>
        <p>还没有播客节目，点击上方按钮导入吧</p>
      </div>
    ) : (
      <div className="podcast-grid">
        {podcasts.map(podcast => (
          <div
            key={podcast.id}
            className="podcast-card"
            onClick={() => handlePodcastClick(podcast.id)}
          >
            <div
              className="podcast-cover"
              style={{ background: `linear-gradient(135deg, ${podcast.coverColor}, ${podcast.coverColor}CC)` }}
            >
              🎧
            </div>
            <div className="podcast-title">{podcast.title}</div>
            <div className="podcast-duration">
              <span>⏱️</span>
              <span>{formatTime(podcast.duration)}</span>
            </div>
          </div>
        ))}
      </div>
    )}
    </>
  );

  const renderPlayerPage = () => {
    if (!currentPodcast) return null;

    return (
      <div className="player-page">
        <button className="back-btn" onClick={handleBack}>
          ← 返回列表
        </button>
        
        <div className="player-header">
          <div
            className="player-cover"
            style={{ background: `linear-gradient(135deg, ${currentPodcast.coverColor}, ${currentPodcast.coverColor}CC)` }}
          >
            🎧
          </div>
          <div className="player-info">
            <div className="player-title">{currentPodcast.title}</div>
            <div className="player-meta">
              时长: {formatTime(currentPodcast.duration)} · 
              笔记: {podcastNotes.length} 条
            </div>
          </div>
        </div>

        <div className="waveform-container">
          <div
            className="waveform"
            ref={waveformRef}
            onClick={handleWaveformClick}
          >
            {waveformBars.map((height, index) => {
              const barProgress = (index / waveformBars.length) * 100;
              const isPlayed = barProgress <= progressPercentage;
              return (
                <div
                  key={index}
                  className={`waveform-bar ${isPlayed ? 'played' : ''}`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
            
            <div
              className="playhead"
              style={{ left: `${progressPercentage}%` }}
            />
            
            <div className="note-markers">
              {podcastNotes.map(note => {
                const markerPosition = (note.timestamp / duration) * 100;
                return (
                  <div
                    key={note.id}
                    className="note-marker"
                    style={{ left: `${markerPosition}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkerClick(note.id);
                    }}
                    title={note.content.substring(0, 30)}
                  />
                );
              })}
            </div>
          </div>
          
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="controls">
          <button
            className="control-btn"
            onClick={() => audioPlayer.skipBackward(15)}
            title="后退15秒"
          >
            ⏪
          </button>
          <button
            className="control-btn play-pause"
            onClick={() => audioPlayer.togglePlay()}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button
            className="control-btn"
            onClick={() => audioPlayer.skipForward(15)}
            title="前进15秒"
          >
            ⏩
          </button>
          <button
            className="control-btn mark"
            onMouseDown={handleMarkTimestamp}
            title="打点记笔记"
          >
            📍
          </button>
        </div>
      </div>
    );
  };

  const renderNotesPage = () => {
    const filteredNotes = noteManager.filterNotes({
      podcastId: filterPodcastId || undefined,
      tag: filterTag || undefined
    });

    return (
      <>
        <div className="page-header">
          <h1 className="page-title">笔记浏览</h1>
        </div>
        
        <div className="notes-filters">
          <select
            className="filter-select"
            value={filterPodcastId}
            onChange={(e) => setFilterPodcastId(e.target.value)}
          >
            <option value="">全部节目</option>
            {podcasts.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          
          <input
            type="text"
            className="filter-input"
            placeholder="搜索标签..."
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          />
        </div>

        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>暂无笔记记录</p>
          </div>
        ) : (
          <div className="notes-list">
            {filteredNotes.map(note => {
              const podcast = noteManager.getPodcastById(note.podcastId);
              return (
                <div key={note.id} className="note-card">
                  <div
                    className="note-color-bar"
                    style={{ background: podcast?.coverColor || '#6366F1' }}
                  />
                  <div className="note-content">
                    <div className="note-header">
                      <span className="note-podcast">{podcast?.title || '未知节目'}</span>
                      <div className="note-actions">
                        <button
                          className="note-action-btn"
                          onClick={() => {
                            setNoteModal({
                              isOpen: true,
                              timestamp: note.timestamp,
                              editingNoteId: note.id
                            });
                            setNoteContent(note.content);
                            setNoteTags(note.tags.join(', '));
                          }}
                        >
                          编辑
                        </button>
                        <button
                          className="note-action-btn"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    
                    <div
                      className="note-timestamp"
                      onClick={() => handleTimestampClick(note.podcastId, note.timestamp)}
                    >
                      ⏱️ {formatTime(note.timestamp)}
                    </div>
                    
                    <div className="note-text">{note.content}</div>
                    
                    <div className="note-tags">
                      {note.tags.map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  const renderStatisticsPage = () => (
    <>
      <div className="page-header">
        <h1 className="page-title">学习统计</h1>
      </div>
      
      <StatisticsChart
        weeklyData={weeklyStats}
        podcastNoteData={podcastNoteStats}
        totalStats={totalStats}
      />
    </>
  );

  const renderNoteModal = () => {
    if (!noteModal?.isOpen) return null;

    return (
      <div className="modal-overlay" onClick={() => {
        if (!noteModal.editingNoteId) {
          audioPlayer.play();
        }
        setNoteModal(null);
      }}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2 className="modal-title">
            {noteModal.editingNoteId ? '编辑笔记' : '新建笔记'}
          </h2>
          <p className="modal-subtitle">
            时间戳: {formatTime(noteModal.timestamp)}
          </p>
          
          <div className="form-group">
            <label className="form-label">笔记内容</label>
            <textarea
              className="form-textarea"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="记录你的想法..."
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">标签（多个标签用逗号分隔）</label>
            <input
              type="text"
              className="form-input"
              value={noteTags}
              onChange={(e) => setNoteTags(e.target.value)}
              placeholder="例如: 重要, 观点, 方法论"
            />
          </div>
          
          <div className="modal-actions">
            {noteModal.editingNoteId && (
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteNote(noteModal.editingNoteId!)}
              >
                删除
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (!noteModal.editingNoteId) {
                  audioPlayer.play();
                }
                setNoteModal(null);
              }}
            >
              取消
            </button>
            <button className="btn btn-primary" onClick={handleSaveNote}>
              保存
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderImportModal = () => {
    if (!showImportModal) return null;

    const availableAudios = PLACEHOLDER_AUDIOS.filter((_, index) => {
      const existingTitles = podcasts.map(p => p.title);
      return !existingTitles.includes(PLACEHOLDER_AUDIOS[index].title);
    });

    return (
      <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2 className="modal-title">导入播客</h2>
          <p className="modal-subtitle">选择要导入的播客节目</p>
          
          {availableAudios.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-icon">📦</div>
              <p>所有预设播客都已导入</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {availableAudios.map((audio, idx) => (
                <button
                  key={idx}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  onClick={() => handleImportPodcast(PLACEHOLDER_AUDIOS.indexOf(audio))}
                >
                  <div style={{ fontWeight: 600 }}>{audio.title}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                    时长: {formatTime(audio.duration)}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
              取消
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return renderHomePage();
      case 'player':
        return renderPlayerPage();
      case 'notes':
        return renderNotesPage();
      case 'statistics':
        return renderStatisticsPage();
      default:
        return renderHomePage();
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">🎙️ PodNotes</div>
        <nav className="sidebar-nav">
          {renderNavItem('home', '🏠', '首页')}
          {renderNavItem('notes', '📝', '笔记')}
          {renderNavItem('statistics', '📊', '统计')}
        </nav>
      </aside>

      <main className="content-area">
        <div className="content-wrapper">
          {renderPage()}
        </div>
      </main>

      <nav className="mobile-tabbar">
        {renderMobileTab('home', '🏠', '首页')}
        {renderMobileTab('notes', '📝', '笔记')}
        {renderMobileTab('statistics', '📊', '统计')}
      </nav>

      {renderNoteModal()}
      {renderImportModal()}
    </div>
  );
};

export default App;
