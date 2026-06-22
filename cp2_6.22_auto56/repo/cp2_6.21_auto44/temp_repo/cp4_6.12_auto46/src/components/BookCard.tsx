import { useState } from 'react';
import type { BookRecommendation } from '../types';

interface BookCardProps {
  book: BookRecommendation;
  delay: number;
}

function BookCard({ book, delay }: BookCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className="book-card"
        style={{ animationDelay: `${delay}ms` }}
        onClick={() => setShowModal(true)}
      >
        <div className="book-cover">{book.cover}</div>
        <div className="book-info">
          <h3 className="book-title">{book.title}</h3>
          <p className="book-reason">{book.reason}</p>
          <div className="match-container">
            <div className="match-bar">
              <div
                className="match-fill"
                style={{ width: `${book.matchScore}%` }}
              />
            </div>
            <span className="match-label">{book.matchScore}%</span>
          </div>
        </div>
        <div className="card-hover-tip">点击查看详情</div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              ✕
            </button>
            <div className="modal-cover">{book.cover}</div>
            <h2 className="modal-title">{book.title}</h2>
            <div className="modal-meta">
              <span>作者：{book.author}</span>
              <span>适龄：{book.ageRange}</span>
            </div>
            <div className="modal-score">
              <span>匹配度：</span>
              <div className="match-bar large">
                <div
                  className="match-fill"
                  style={{ width: `${book.matchScore}%` }}
                />
              </div>
              <span className="match-label">{book.matchScore}%</span>
            </div>
            <div className="modal-tags">
              {book.matchedTags.length > 0 ? (
                book.matchedTags.map((tag) => (
                  <span key={tag} className="tag-chip matched">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="tag-empty">暂无匹配标签</span>
              )}
            </div>
            <p className="modal-desc">{book.description}</p>
            <p className="modal-reason">💡 {book.reason}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default BookCard;
