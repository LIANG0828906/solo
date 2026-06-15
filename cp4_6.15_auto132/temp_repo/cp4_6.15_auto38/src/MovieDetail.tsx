import type { Movie } from './types';
import StarRating from './StarRating';

interface MovieDetailProps {
  movie: Movie;
  onBack: () => void;
  onEdit: (movie: Movie) => void;
  onDelete: (id: string) => void;
  onUpdateRating: (id: string, rating: number) => void;
}

export default function MovieDetail({
  movie,
  onBack,
  onEdit,
  onDelete,
  onUpdateRating,
}: MovieDetailProps) {
  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDelete = () => {
    if (window.confirm(`确定要删除《${movie.titleCn}》吗？此操作不可撤销。`)) {
      onDelete(movie.id);
    }
  };

  const allRecords = [
    ...movie.watchHistory,
    {
      id: 'current',
      date: movie.watchDate,
      comment: movie.comment,
      rating: movie.rating,
    },
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="detail-container">
      <div className="back-btn" onClick={onBack}>
        <span>←</span>
        <span>返回列表</span>
      </div>

      <div className="glass detail-content">
        <div className="detail-poster">
          <img src={movie.poster} alt={movie.titleCn} />
        </div>

        <div className="detail-info">
          <h1>{movie.titleCn}</h1>
          <h2>{movie.titleEn}</h2>

          <div className="detail-meta">
            <div className="meta-item">
              <div className="meta-label">导演</div>
              <div className="meta-value">{movie.director}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">上映年份</div>
              <div className="meta-value">{movie.year}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">最近观看</div>
              <div className="meta-value">{formatDate(movie.watchDate)}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">观看次数</div>
              <div className="meta-value">{movie.watchHistory.length + 1} 次</div>
            </div>
          </div>

          <div className="detail-rating-section">
            <div className="section-title">我的评分</div>
            <StarRating
              rating={movie.rating}
              onChange={(r) => onUpdateRating(movie.id, r)}
              size="lg"
            />
          </div>

          <div>
            <div className="section-title">分类标签</div>
            <div className="detail-categories">
              {movie.categories.map((c) => (
                <div key={c} className="chip active" style={{ cursor: 'default' }}>
                  {c}
                </div>
              ))}
              {movie.categories.length === 0 && (
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  暂无标签
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="section-title">观影心得</div>
            <div className="detail-comment">
              {movie.comment || <span style={{ color: 'var(--text-secondary)' }}>暂无评论</span>}
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn" onClick={() => onEdit(movie)}>
              <span>✏️</span>
              <span>编辑信息</span>
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <span>🗑️</span>
              <span>删除电影</span>
            </button>
          </div>
        </div>
      </div>

      <div className="glass timeline-section">
        <h3 style={{ fontSize: 18, marginBottom: 20, fontFamily: 'Raleway, sans-serif' }}>
          📅 观影时间线
        </h3>
        <div className={`timeline ${allRecords.length === 1 ? 'timeline-single' : ''}`}>
          {allRecords.map((rec, idx) => (
            <div
              key={rec.id}
              className="timeline-item"
              style={{
                paddingBottom: idx === allRecords.length - 1 ? '0' : undefined,
              }}
            >
              <div className="timeline-date">
                {formatDate(rec.date)} · 评分 {rec.rating}/10
              </div>
              <div className="timeline-content">
                {rec.comment ? (
                  <div className="timeline-comment">{rec.comment}</div>
                ) : (
                  <div
                    className="timeline-comment"
                    style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}
                  >
                    （没有记录评论）
                  </div>
                )}
                <StarRating rating={rec.rating} size="sm" />
              </div>
            </div>
          ))}
        </div>
        {allRecords.length === 1 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 16 }}>
            每次重新观看并更新记录后，这里会显示完整的观影历程。
          </div>
        )}
      </div>
    </div>
  );
}
