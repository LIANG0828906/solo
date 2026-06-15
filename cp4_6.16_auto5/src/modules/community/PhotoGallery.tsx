import { useState, useEffect } from 'react';
import { likeService, LikeData } from '../../services/LikeService';
import { commentService, Comment } from '../../services/CommentService';

export interface PhotoData {
  id: number;
  imageUrl: string;
  author: string;
  userId: string;
  createdAt: string;
  title?: string;
}

interface PhotoGalleryProps {
  photos: PhotoData[];
  currentUser: { username: string } | null;
}

interface PhotoState {
  likeData: LikeData | null;
  comments: Comment[];
  showComments: boolean;
  newComment: string;
  loadingComments: boolean;
}

export default function PhotoGallery({ photos, currentUser }: PhotoGalleryProps) {
  const [photoStates, setPhotoStates] = useState<Map<number, PhotoState>>(new Map());

  useEffect(() => {
    const photoIds = photos.map((p) => p.id);
    likeService.initializeDefaultLikes(photoIds);
    commentService.initializeDefaultComments(photoIds);

    const initialStates = new Map<number, PhotoState>();
    photos.forEach((photo) => {
      initialStates.set(photo.id, {
        likeData: null,
        comments: [],
        showComments: false,
        newComment: '',
        loadingComments: false,
      });
    });

    setPhotoStates(initialStates);

    photos.forEach(async (photo) => {
      const userId = currentUser?.username || 'guest_' + Date.now();
      const likeStatus = await likeService.getLikeStatus(photo.id, userId);
      setPhotoStates((prev) => {
        const updated = new Map(prev);
        const state = updated.get(photo.id);
        if (state) {
          updated.set(photo.id, { ...state, likeData: likeStatus });
        }
        return updated;
      });
    });
  }, [photos, currentUser?.username]);

  const handleToggleLike = async (photoId: number) => {
    const userId = currentUser?.username || 'guest_' + Date.now();
    const result = await likeService.toggleLike(photoId, userId);
    setPhotoStates((prev) => {
      const updated = new Map(prev);
      const state = updated.get(photoId);
      if (state) {
        updated.set(photoId, { ...state, likeData: result });
      }
      return updated;
    });
  };

  const handleToggleComments = async (photoId: number) => {
    const state = photoStates.get(photoId);
    if (!state) return;

    const newShowComments = !state.showComments;
    setPhotoStates((prev) => {
      const updated = new Map(prev);
      const s = updated.get(photoId);
      if (s) {
        updated.set(photoId, { ...s, showComments: newShowComments, loadingComments: newShowComments });
      }
      return updated;
    });

    if (newShowComments && state.comments.length === 0) {
      const comments = await commentService.getComments(photoId);
      setPhotoStates((prev) => {
        const updated = new Map(prev);
        const s = updated.get(photoId);
        if (s) {
          updated.set(photoId, { ...s, comments, loadingComments: false });
        }
        return updated;
      });
    } else {
      setPhotoStates((prev) => {
        const updated = new Map(prev);
        const s = updated.get(photoId);
        if (s) {
          updated.set(photoId, { ...s, loadingComments: false });
        }
        return updated;
      });
    }
  };

  const handleCommentChange = (photoId: number, value: string) => {
    setPhotoStates((prev) => {
      const updated = new Map(prev);
      const state = updated.get(photoId);
      if (state) {
        updated.set(photoId, { ...state, newComment: value });
      }
      return updated;
    });
  };

  const handleSubmitComment = async (photoId: number) => {
    const state = photoStates.get(photoId);
    if (!state || !state.newComment.trim()) return;

    const username = currentUser?.username || '匿名皮友';
    const userId = currentUser?.username || 'anonymous_' + Date.now();

    const newComment = await commentService.addComment(
      photoId,
      userId,
      username,
      state.newComment.trim()
    );

    setPhotoStates((prev) => {
      const updated = new Map(prev);
      const s = updated.get(photoId);
      if (s) {
        const allComments = [newComment, ...s.comments].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        updated.set(photoId, { ...s, comments: allComments, newComment: '' });
      }
      return updated;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent, photoId: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment(photoId);
    }
  };

  const getAvatarInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 1) return '今天';
    if (days < 7) return `${days}天前`;

    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  if (photos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📷</div>
        <p>还没有作品，成为第一个分享者吧！</p>
        <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
          完成教程后即可上传你的作品
        </p>
      </div>
    );
  }

  return (
    <div className="gallery-grid">
      {photos.map((photo, index) => {
        const state = photoStates.get(photo.id);
        const likeCount = state?.likeData?.likeCount ?? 0;
        const isLiked = state?.likeData?.liked ?? false;
        const commentsCount = state?.comments.length ?? 0;

        return (
          <div
            key={photo.id}
            className="photo-card fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <img
              src={photo.imageUrl}
              alt={photo.title || photo.author + '的作品'}
              className="photo-image"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20leather%20wallet%2C%20craftsmanship%2C%20warm%20lighting&image_size=square';
              }}
            />
            <div className="photo-info">
              <div className="photo-author">
                <span className="avatar">{getAvatarInitial(photo.author)}</span>
                <span>{photo.author}</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999', fontWeight: 400 }}>
                  {formatDate(photo.createdAt)}
                </span>
              </div>

              {photo.title && (
                <p style={{ fontSize: '14px', color: 'var(--color-ink)', marginBottom: '12px' }}>
                  {photo.title}
                </p>
              )}

              <div className="photo-actions">
                <button
                  className={`like-btn ${isLiked ? 'liked' : ''}`}
                  onClick={() => handleToggleLike(photo.id)}
                >
                  <span>{isLiked ? '❤️' : '🤍'}</span>
                  <span>{likeCount}</span>
                </button>
                <button
                  className="comment-toggle"
                  onClick={() => handleToggleComments(photo.id)}
                >
                  💬 {commentsCount} 条评论
                  <span style={{ fontSize: '12px', marginLeft: '4px' }}>
                    {state?.showComments ? '▲' : '▼'}
                  </span>
                </button>
              </div>

              {state?.showComments && (
                <div className="comment-section">
                  <div className="comment-list">
                    {state.loadingComments ? (
                      <div className="empty-comments">加载中...</div>
                    ) : state.comments.length === 0 ? (
                      <div className="empty-comments">还没有评论，来抢沙发吧！</div>
                    ) : (
                      state.comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                          <div>
                            <span className="comment-author">{comment.username}</span>
                            <span className="comment-time">
                              {commentService.formatTime(comment.createdAt)}
                            </span>
                          </div>
                          <div className="comment-text">{comment.content}</div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="comment-input-area">
                    <input
                      type="text"
                      className="comment-input"
                      placeholder={currentUser ? '写评论...' : '登录后评论...'}
                      value={state.newComment}
                      onChange={(e) => handleCommentChange(photo.id, e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, photo.id)}
                      disabled={!currentUser}
                    />
                    <button
                      className="comment-submit"
                      onClick={() => handleSubmitComment(photo.id)}
                      disabled={!state.newComment.trim() || !currentUser}
                    >
                      发送
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
