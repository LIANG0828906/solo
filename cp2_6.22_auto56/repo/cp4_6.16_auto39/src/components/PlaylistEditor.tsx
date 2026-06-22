import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { usePlaylistStore } from '../store/playlistStore';
import { mockSongs, presetColors } from '../data/mockSongs';
import { useDebounce } from '../hooks/useDebounce';
import type { MockSong, Song } from '../types';
import './PlaylistEditor.css';

export function PlaylistEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const {
    currentPlaylist,
    currentSongs,
    loadPlaylist,
    loadSongs,
    createPlaylist,
    updatePlaylist,
    addSong,
    removeSong,
    reorderSongs,
  } = usePlaylistStore();

  const [title, setTitle] = useState('');
  const [coverColor, setCoverColor] = useState(presetColors[0]);
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<MockSong | null>(null);
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 100);

  useEffect(() => {
    if (isEditing && id) {
      loadPlaylist(id);
      loadSongs(id);
    }
  }, [isEditing, id, loadPlaylist, loadSongs]);

  useEffect(() => {
    if (currentPlaylist && isEditing) {
      setTitle(currentPlaylist.title);
      setCoverColor(currentPlaylist.coverColor);
      setDescription(currentPlaylist.description);
    }
  }, [currentPlaylist, isEditing]);

  const filteredSongs = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    const query = debouncedSearch.toLowerCase();
    return mockSongs.filter(
      song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [debouncedSearch]);

  const addedSongIds = useMemo(() => {
    return new Set(currentSongs.map(s => s.songId));
  }, [currentSongs]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(currentSongs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    if (id) {
      reorderSongs(id, items);
    }
  };

  const handleSelectSong = (song: MockSong) => {
    if (addedSongIds.has(song.id)) return;
    setSelectedSong(song);
    setReason('');
  };

  const handleAddSong = () => {
    if (!selectedSong || !id || reason.length < 10 || reason.length > 100) return;

    addSong(id, {
      songId: selectedSong.id,
      title: selectedSong.title,
      artist: selectedSong.artist,
      reason,
    });

    setSelectedSong(null);
    setReason('');
    setSearchQuery('');
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) return;

    setIsSaving(true);
    try {
      if (isEditing && id) {
        await updatePlaylist(id, { title, coverColor, description });
        navigate(`/playlist/${id}`);
      } else {
        const newId = await createPlaylist({ title, coverColor, description });
        navigate(`/edit/${newId}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isEditing && id) {
      navigate(`/playlist/${id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h1>{isEditing ? '编辑歌单' : '创建歌单'}</h1>
        <div className="editor-actions">
          <button className="btn btn-secondary" onClick={handleCancel}>
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !description.trim()}
          >
            {isSaving ? '保存中...' : '保存歌单'}
          </button>
        </div>
      </div>

      <div className="editor-form">
        <div className="form-group">
          <label>歌单标题</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="输入歌单标题..."
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label>封面颜色</label>
          <div className="color-picker">
            {presetColors.map(color => (
              <button
                key={color}
                className={`color-option ${coverColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setCoverColor(color)}
              />
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>主题故事（最多200字）</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 200))}
            placeholder="描述这个歌单的主题和故事..."
            rows={4}
            maxLength={200}
          />
          <span className="char-count">{description.length}/200</span>
        </div>
      </div>

      {isEditing && (
        <div className="editor-content">
          <div className="song-list-section">
            <h2>歌曲列表 ({currentSongs.length}首)</h2>
            <p className="section-hint">拖拽歌曲可以调整顺序</p>

            {currentSongs.length === 0 ? (
              <div className="empty-state">
                <p>还没有添加歌曲</p>
                <p className="hint">在右侧搜索并添加歌曲到你的故事线中</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="songs">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`song-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    >
                      {currentSongs.map((song: Song, index: number) => (
                        <Draggable key={song.id} draggableId={song.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`song-item ${snapshot.isDragging ? 'dragging' : ''}`}
                              style={{
                                ...provided.draggableProps.style,
                              }}
                            >
                              <div className="song-order">{index + 1}</div>
                              <div className="song-info">
                                <h4>{song.title}</h4>
                                <p>{song.artist}</p>
                                <p className="song-reason">{song.reason}</p>
                              </div>
                              <button
                                className="remove-btn"
                                onClick={() => removeSong(song.id)}
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>

          <div className="add-song-section">
            <h2>添加歌曲</h2>

            <div className="search-box">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索歌曲或歌手..."
              />
            </div>

            {searchQuery && filteredSongs.length > 0 && (
              <div className="search-results">
                {filteredSongs.map(song => (
                  <div
                    key={song.id}
                    className={`search-result ${addedSongIds.has(song.id) ? 'added' : ''}`}
                    onClick={() => handleSelectSong(song)}
                  >
                    <div className="result-info">
                      <h4>{song.title}</h4>
                      <p>{song.artist}</p>
                    </div>
                    {addedSongIds.has(song.id) && <span className="added-badge">已添加</span>}
                  </div>
                ))}
              </div>
            )}

            {selectedSong && (
              <div className="selected-song">
                <h3>已选择: {selectedSong.title}</h3>
                <p className="artist">{selectedSong.artist}</p>

                <div className="form-group">
                  <label>推荐理由（10-100字）</label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value.slice(0, 100))}
                    placeholder="为什么推荐这首歌？它在故事线中扮演什么角色？"
                    rows={4}
                    maxLength={100}
                  />
                  <span className="char-count">{reason.length}/100</span>
                </div>

                <button
                  className="btn btn-primary btn-block"
                  onClick={handleAddSong}
                  disabled={reason.length < 10 || reason.length > 100}
                >
                  添加到歌单
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
