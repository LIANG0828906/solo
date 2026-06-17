import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  KeyboardEvent,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Heart,
  Send,
  MessageCircle,
} from 'lucide-react';
import { useProjectStore } from './store';
import { useActivityStore } from '../activity/store';
import { CURRENT_USER } from '../../types';
import { formatRelativeTime, getInitials, generateAvatarColor } from '../../utils/format';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = useProjectStore((state) => state.getProjectById(id || ''));

  const commentsMap = useActivityStore((state) => state.comments);
  const likesMap = useActivityStore((state) => state.likes);
  const toggleLike = useActivityStore((state) => state.toggleLike);
  const addComment = useActivityStore((state) => state.addComment);

  const comments = id ? commentsMap[id] || [] : [];
  const projectLikes = id ? likesMap[id] || [] : [];
  const likeCount = projectLikes.length;
  const commentCount = comments.length;
  const isLiked = projectLikes.some((l) => l.user === CURRENT_USER);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const isOwnProject = project?.author === CURRENT_USER;

  const sortedComments = useMemo(() => {
    return [...comments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [comments]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sortedComments.length]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [id]);

  const handlePrevImage = useCallback(() => {
    if (!project?.images.length || isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) =>
        prev === 0 ? project.images.length - 1 : prev - 1
      );
      setTimeout(() => setIsAnimating(false), 300);
    }, 150);
  }, [project, isAnimating]);

  const handleNextImage = useCallback(() => {
    if (!project?.images.length || isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) =>
        prev === project.images.length - 1 ? 0 : prev + 1
      );
      setTimeout(() => setIsAnimating(false), 300);
    }, 150);
  }, [project, isAnimating]);

  const handleLike = useCallback(async () => {
    if (!project || isOwnProject || isLiking) return;

    setIsLiking(true);
    setLikeAnimating(true);
    try {
      await toggleLike(project.id, project.title);
    } finally {
      setIsLiking(false);
      setTimeout(() => setLikeAnimating(false), 200);
    }
  }, [project, isOwnProject, isLiking, toggleLike]);

  const handleSubmitComment = useCallback(async () => {
    if (!project || !commentInput.trim()) return;

    const content = commentInput.trim();
    setCommentInput('');
    await addComment(project.id, project.title, content);
  }, [project, commentInput, addComment]);

  const handleCommentKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitComment();
      }
    },
    [handleSubmitComment]
  );

  if (!project) {
    return (
      <div className="project-detail">
        <div className="project-detail__notfound">
          <p>项目不存在</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => navigate('/')}
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-detail">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={18} />
        <span>返回列表</span>
      </button>

      <div className="project-detail__header">
        <h1 className="project-detail__title">{project.title}</h1>
        <div className="project-detail__meta">
          <span className="project-detail__author">发起者：{project.author}</span>
          <span className="project-detail__date">
            {formatRelativeTime(project.createdAt)}
          </span>
        </div>
      </div>

      {project.images.length > 0 && (
        <div className="image-carousel">
          <div className="image-carousel__viewport">
            {project.images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${project.title} - ${index + 1}`}
                className={`image-carousel__img ${
                  index === currentImageIndex && !isAnimating
                    ? 'image-carousel__img--active'
                    : ''
                }`}
                style={{
                  opacity: index === currentImageIndex ? 1 : 0,
                }}
              />
            ))}
          </div>

          {project.images.length > 1 && (
            <>
              <button
                type="button"
                className="image-carousel__arrow image-carousel__arrow--left"
                onClick={handlePrevImage}
                aria-label="上一张"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                className="image-carousel__arrow image-carousel__arrow--right"
                onClick={handleNextImage}
                aria-label="下一张"
              >
                <ChevronRight size={24} />
              </button>
              <div className="image-carousel__dots">
                {project.images.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`image-carousel__dot ${
                      index === currentImageIndex ? 'image-carousel__dot--active' : ''
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`第${index + 1}张图片`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="project-detail__content">
        <p className="project-detail__description">{project.description}</p>
      </div>

      <div className="project-detail__actions">
        <button
          type="button"
          className={`like-btn ${isLiked ? 'like-btn--active' : ''} ${
            likeAnimating ? 'like-btn--animating' : ''
          } ${isOwnProject ? 'like-btn--disabled' : ''}`}
          onClick={handleLike}
          disabled={isOwnProject || isLiking}
          title={isOwnProject ? '不能给自己的项目点赞' : ''}
        >
          <Heart
            size={20}
            fill={isLiked ? '#E74C3C' : 'none'}
            color={isLiked ? '#E74C3C' : '#ccc'}
          />
          <span className="like-btn__count">{likeCount}</span>
        </button>
        <div className="comment-count-badge">
          <MessageCircle size={18} color="#27AE60" />
          <span>{commentCount} 评论</span>
        </div>
      </div>

      <div className="comments-section">
        <h3 className="comments-section__title">评论区</h3>

        <div className="comments-list">
          {sortedComments.length === 0 ? (
            <div className="comments-empty">还没有评论，快来发表第一条评论吧</div>
          ) : (
            sortedComments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div
                  className="comment-item__avatar"
                  style={{ backgroundColor: generateAvatarColor(comment.user) }}
                >
                  {getInitials(comment.user)}
                </div>
                <div className="comment-item__body">
                  <div className="comment-item__header">
                    <span className="comment-item__user">{comment.user}</span>
                    <span className="comment-item__time">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="comment-item__content">{comment.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        <div className="comment-input-section">
          <div
            className="comment-input__avatar"
            style={{ backgroundColor: generateAvatarColor(CURRENT_USER) }}
          >
            {getInitials(CURRENT_USER)}
          </div>
          <div className="comment-input__wrapper">
            <textarea
              className="comment-input"
              placeholder="发表你的评论（按 Enter 发送，最多200字）"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value.slice(0, 200))}
              onKeyDown={handleCommentKeyDown}
              rows={2}
              maxLength={200}
            />
            <div className="comment-input__footer">
              <span className="comment-input__count">
                {commentInput.length}/200
              </span>
              <button
                type="button"
                className="btn btn--primary btn--small comment-send-btn"
                onClick={handleSubmitComment}
                disabled={!commentInput.trim()}
              >
                <Send size={14} />
                <span>发送</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
