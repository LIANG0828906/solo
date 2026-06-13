import { Card } from '../types';

const TAG_COLORS = [
  '#e94560', '#f39c12', '#f1c40f', '#2ecc71',
  '#1abc9c', '#3498db', '#9b59b6', '#e67e22',
  '#ff6b6b', '#4ecdc4', '#a55eea', '#26de81',
  '#fd79a8', '#fdcb6e', '#00b894', '#0984e3',
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[hash];
}

interface DigestCardProps {
  card: Card;
  mode: 'preview' | 'detail' | 'random';
  onEdit?: () => void;
  onDelete?: () => void;
  onOpen?: () => void;
}

export default function DigestCard({ card, mode, onEdit, onDelete }: DigestCardProps) {
  const colorTag = card.tags.length > 0 ? card.tags[0] : 'default';
  const barColor = getTagColor(colorTag);
  const excerptText = mode === 'preview'
    ? (card.excerpt.length > 20 ? card.excerpt.slice(0, 20) + '…' : card.excerpt)
    : card.excerpt;

  if (mode === 'random') {
    return (
      <div className={`digest-card digest-card-random random-pulse`}>
        <div className="random-card-left-bar" style={{ backgroundColor: barColor }} />
        <div className="random-card-content">
          <div className="random-card-header">
            <div className="random-book-info">
              <h3 className="random-book-title">{card.title}</h3>
              {card.author && <p className="random-book-author">—— {card.author}</p>}
            </div>
            <div className="random-tags">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="random-tag"
                  style={{ backgroundColor: getTagColor(tag) }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="random-excerpt">
            <span className="quote-mark quote-left">「</span>
            <p className="excerpt-text-serif">{card.excerpt}</p>
            <span className="quote-mark quote-right">」</span>
          </div>
          {card.insight && (
            <div className="random-insight">
              <div className="insight-label">💭 个人感悟</div>
              <p className="insight-text">{card.insight}</p>
            </div>
          )}
          <div className="random-date">
            📅 {new Date(card.createdAt).toLocaleDateString('zh-CN')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`digest-card digest-card-${mode}`}>
      <div className="card-left-bar" style={{ backgroundColor: barColor }} />
      <div className="card-body-content">
        <div className="card-header-row">
          <h4 className="card-book-title" title={card.title}>{card.title}</h4>
          {mode === 'preview' && (
            <div className="card-actions-row" onClick={(e) => e.stopPropagation()}>
              <button className="icon-btn-sm" title="编辑" onClick={onEdit}>
                ✏️
              </button>
              <button className="icon-btn-sm" title="删除" onClick={onDelete}>
                🗑️
              </button>
            </div>
          )}
        </div>
        <p className="card-excerpt-preview excerpt-text-serif">
          {excerptText}
        </p>
        {card.tags.length > 0 && (
          <div className="card-tags-preview">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="card-tag-sm"
                style={{ borderColor: getTagColor(tag), color: getTagColor(tag) }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
