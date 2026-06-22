import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { getMonthDisplay } from '@/utils/priority';
import { calculatePriorityScore } from '@/utils/priority';

export default function ReadingPlan() {
  const { books, plan, generateMonthlyPlan, removeBookFromPlan, addBookToPlan, selectBook } = useLibrary();
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipPhase, setFlipPhase] = useState<'idle' | 'flip-out' | 'flip-in'>('idle');
  const [showAddSelector, setShowAddSelector] = useState(false);

  const handleGenerate = useCallback(() => {
    setFlipPhase('flip-out');
    setTimeout(() => {
      generateMonthlyPlan();
      setFlipPhase('flip-in');
      setTimeout(() => {
        setFlipPhase('idle');
      }, 600);
    }, 400);
  }, [generateMonthlyPlan]);

  const planBooks = plan
    ? plan.bookIds
        .map((id) => books.find((b) => b.id === id))
        .filter(Boolean) as typeof books
    : [];

  const availableBooks = books.filter(
    (b) => b.status === 'want-to-read' && plan && !plan.bookIds.includes(b.id)
  );

  return (
    <div className="reading-plan-page">
      <div className="plan-header">
        <div className="plan-title-section">
          <h2 className="plan-title">月度阅读计划</h2>
          {plan && <span className="plan-month">{getMonthDisplay(plan.month)}</span>}
        </div>
        <button className="btn btn-primary" onClick={handleGenerate}>
          {plan ? '重新生成' : '生成本月计划'}
        </button>
      </div>

      <div className={`calendar-card ${flipPhase}`}>
        {flipPhase === 'flip-out' && (
          <div className="calendar-flip-overlay">
            <div className="flip-calendar-icon">📅</div>
            <div className="flip-text">正在翻阅日历...</div>
          </div>
        )}
        {flipPhase === 'flip-in' && (
          <div className="calendar-flip-overlay flip-in-overlay">
            <div className="flip-calendar-icon flip-in-icon">📅</div>
            <div className="flip-text">计划已就绪！</div>
          </div>
        )}
        {flipPhase === 'idle' && (
          <>
            {!plan ? (
              <div className="plan-empty">
                <div className="plan-empty-icon">📖</div>
                <p>点击"生成本月计划"从想读列表中挑选前5本书</p>
              </div>
            ) : planBooks.length === 0 ? (
              <div className="plan-empty">
                <div className="plan-empty-icon">📖</div>
                <p>计划中的书籍已被移除，请重新生成</p>
              </div>
            ) : (
              <div className="plan-list">
                {planBooks.map((book, index) => (
                  <div
                    key={book.id}
                    className="plan-book-item"
                    onClick={() => selectBook(book.id)}
                  >
                    <div className="plan-book-rank">#{index + 1}</div>
                    <div className="plan-book-info">
                      <h4>{book.title}</h4>
                      <p>{book.author}</p>
                    </div>
                    <div className="plan-book-score">
                      优先级: {calculatePriorityScore(index + 1, book.difficulty)}
                    </div>
                    <button
                      className="plan-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBookFromPlan(book.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {planBooks.length < 8 && (
                  <button
                    className="plan-add-btn"
                    onClick={() => setShowAddSelector(!showAddSelector)}
                  >
                    + 添加书籍到计划
                  </button>
                )}
                {showAddSelector && availableBooks.length > 0 && (
                  <div className="plan-add-selector">
                    {availableBooks.slice(0, 10).map((book) => (
                      <div
                        key={book.id}
                        className="plan-add-option"
                        onClick={() => {
                          addBookToPlan(book.id);
                          setShowAddSelector(false);
                        }}
                      >
                        <span>{book.title}</span>
                        <span className="option-author">{book.author}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
