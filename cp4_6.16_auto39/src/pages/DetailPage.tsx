import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { usePlaylistStore } from '../store/playlistStore';
import type { Comment } from '../types';
import './DetailPage.css';

export function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentPlaylist,
    currentSongs,
    currentComments,
    totalCommentCount,
    displayedCommentCount,
    loadPlaylist,
    loadSongs,
    loadComments,
    loadMoreComments,
    addComment,
    deletePlaylist,
  } = usePlaylistStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nickname, setNickname] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<number | null>(null);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (id) {
      loadPlaylist(id);
      loadSongs(id);
      loadComments(id);
    }
  }, [id, loadPlaylist, loadSongs, loadComments]);

  const hasMoreComments = displayedCommentCount < totalCommentCount;

  const handleLoadMoreComments = useCallback(() => {
    if (id && hasMoreComments) {
      loadMoreComments(id);
    }
  }, [id, hasMoreComments, loadMoreComments]);

  const goToNext = useCallback(() => {
    if (currentSongs.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % currentSongs.length);
  }, [currentSongs.length]);

  const goToPrev = useCallback(() => {
    if (currentSongs.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + currentSongs.length) % currentSongs.length);
  }, [currentSongs.length]);

  useEffect(() => {
    if (isFullscreen && isPlaying && currentSongs.length > 0) {
      timerRef.current = window.setTimeout(() => {
        goToNext();
      }, 3000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isFullscreen, isPlaying, currentIndex, currentSongs.length, goToNext]);

  const enterFullscreen = () => {
    setIsFullscreen(true);
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
    setIsPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !nickname.trim() || !commentContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(id, nickname.trim(), commentContent.trim());
      setCommentContent('');
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm('确定要删除这个歌单吗？')) {
      await deletePlaylist(id);
      navigate('/');
    }
  };

  if (!currentPlaylist) {
    return (
      <div className="detail-loading">
        <div className="spinner" />
        <p>加载中...</p>
      </div>
    );
  }

  const progress = currentSongs.length > 0 ? ((currentIndex + 1) / currentSongs.length) * 100 : 0;

  return (
    <div className="detail-page">
      <div className="detail-header" style={{ backgroundColor: currentPlaylist.coverColor }}>
        <div className="header-overlay" />
        <div className="header-content">
          <Link to="/" className="back-btn">
            ← 返回
          </Link>
          <div className="playlist-info">
            <h1>{currentPlaylist.title}</h1>
            <p className="playlist-description">{currentPlaylist.description}</p>
            <div className="playlist-meta">
              <span>🎵 {currentPlaylist.songCount} 首歌曲</span>
              <span>💬 {currentPlaylist.commentCount} 条评论</span>
              <span>
                创建于 {format(currentPlaylist.createdAt, 'yyyy年MM月dd日', { locale: zhCN })}
              </span>
            </div>
          </div>
          <div className="playlist-actions">
            {currentSongs.length > 0 && (
              <button className="btn-play" onClick={enterFullscreen}>
                ▶ 播放故事线
              </button>
            )}
            <Link to={`/edit/${currentPlaylist.id}`} className="btn-edit">
              编辑
            </Link>
            <button className="btn-delete" onClick={handleDelete}>
              删除
            </button>
          </div>
        </div>
      </div>

      <div className="detail-content">
        <section className="storyline-section">
          <h2>故事线</h2>
          {currentSongs.length === 0 ? (
            <div className="empty-storyline">
              <p>这个歌单还没有歌曲</p>
              <Link to={`/edit/${currentPlaylist.id}`} className="btn-add-songs">
                添加歌曲
              </Link>
            </div>
          ) : (
            <div className="storyline-list">
              {currentSongs.map((song, index) => (
                <div key={song.id} className="storyline-item">
                  <div className="storyline-number">{index + 1}</div>
                  <div className="storyline-line" />
                  <div className="storyline-card">
                    <div className="song-header">
                      <h3>{song.title}</h3>
                      <span className="song-artist">{song.artist}</span>
                    </div>
                    <p className="song-reason">{song.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="comments-section">
          <h2>评论区 ({totalCommentCount})</h2>

          <form className="comment-form" onSubmit={handleSubmitComment}>
            <input
              type="text"
              placeholder="你的昵称"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
            />
            <textarea
              placeholder="写下你的评论..."
              value={commentContent}
              onChange={e => setCommentContent(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <button
              type="submit"
              className="btn-submit-comment"
              disabled={!nickname.trim() || !commentContent.trim() || isSubmitting}
            >
              {isSubmitting ? '发送中...' : '发表评论'}
            </button>
          </form>

          <div className="comments-list">
            {currentComments.length === 0 ? (
              <div className="empty-comments">
                <p>还没有评论，来说点什么吧~</p>
              </div>
            ) : (
              <>
                {currentComments.map((comment: Comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-avatar">
                      {comment.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-nickname">{comment.nickname}</span>
                        <span className="comment-time">
                          {format(comment.createdAt, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                      <p className="comment-text">{comment.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={commentsEndRef} />
                {hasMoreComments && (
                  <div className="load-more-comments">
                    <button className="btn-load-more" onClick={handleLoadMoreComments}>
                      加载更多评论 ({totalCommentCount - displayedCommentCount} 条未读)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {isFullscreen && currentSongs.length > 0 && (
        <div
          className="fullscreen-mode"
          style={{
            background: `radial-gradient(circle at center, ${currentPlaylist.coverColor} 0%, #1a1a2e 100%)`,
          }}
        >
          <button className="fullscreen-exit" onClick={exitFullscreen}>
            ✕ 退出
          </button>

          <div className="fullscreen-content">
            <div key={currentIndex} className="song-card-glass">
              <div className="song-card-number">
                {currentIndex + 1} / {currentSongs.length}
              </div>
              <h2 className="song-card-title">{currentSongs[currentIndex].title}</h2>
              <p className="song-card-artist">{currentSongs[currentIndex].artist}</p>
              <p className="song-card-reason">{currentSongs[currentIndex].reason}</p>
            </div>
          </div>

          <button className="nav-btn nav-prev pulse-glow" onClick={goToPrev}>
            ‹
          </button>
          <button className="nav-btn nav-next pulse-glow" onClick={goToNext}>
            ›
          </button>

          <div className="fullscreen-controls">
            <button className="play-pause-btn" onClick={togglePlay}>
              {isPlaying ? '⏸ 暂停' : '▶ 播放'}
            </button>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
