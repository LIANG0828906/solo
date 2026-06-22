import { Word } from '../stores/wordStore';
import './WordList.css';

interface WordListProps {
  words: Word[];
  onDelete: (wordId: number) => void;
  isLoading: boolean;
}

function WordList({ words, onDelete, isLoading }: WordListProps) {
  if (isLoading) {
    return (
      <div className="word-list-loading">
        <div className="loading-spinner"></div>
        <span>加载中...</span>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="empty-state card">
        <div className="empty-state-icon">📭</div>
        <div className="empty-state-text">还没有词汇，点击上方"添加词汇"开始吧</div>
      </div>
    );
  }

  const getPriorityColor = (index: number) => {
    if (index < 3) return 'high';
    if (index < 6) return 'medium';
    return 'low';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="word-list">
      {words.map((word, index) => (
        <div key={word.id} className="word-item card">
          <div className="word-item-header">
            <div className="word-main">
              <span className="word-text">{word.word}</span>
              <span className={`priority-badge priority-${getPriorityColor(index)}`}>
                遗忘指数 {Math.round(word.forgetting_index * 100)}%
              </span>
            </div>
            <button
              className="delete-btn"
              onClick={() => onDelete(word.id)}
              title="删除"
            >
              🗑️
            </button>
          </div>

          <div className="word-definition">{word.definition}</div>

          {word.example_sentence && (
            <div className="word-example">
              <span className="example-text">"{word.example_sentence}"</span>
              <span className="example-trans">{word.example_translation}</span>
            </div>
          )}

          <div className="word-footer">
            <div className="word-stats">
              <span className="stat-item">✓ 掌握 {word.master_count}</span>
              <span className="stat-item">🔄 复习 {word.review_count}</span>
            </div>
            <div className="word-date">
              {word.last_reviewed_at
                ? `上次复习: ${formatDate(word.last_reviewed_at)}`
                : `添加于: ${formatDate(word.created_at)}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default WordList;
