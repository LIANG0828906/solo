import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import BookCard from '../components/BookCard';

function HomePage() {
  const { recommendations, records, loading, fetchAll } = useAppStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="home-page">
      <section className="section">
        <div className="section-header">
          <h1 className="section-title">✨ 为宝贝推荐的绘本</h1>
          <p className="section-subtitle">
            根据{records.length > 0 ? `${records.length}条阅读记录` : '精选书单'}智能推荐
          </p>
        </div>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="books-grid" key={recommendations.map((r) => r.id).join(',')}>
            {recommendations.map((book, index) => (
              <BookCard key={book.id} book={book} delay={index * 300} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">📖 最近阅读记录</h2>
        </div>
        {records.length === 0 ? (
          <div className="empty">还没有阅读记录，去记录页添加吧～</div>
        ) : (
          <div className="records-list">
            {records.map((record) => (
              <div key={record.id} className="record-card">
                <div className="record-left">
                  <div className="record-book">{record.bookName}</div>
                  <div className="record-meta">
                    <span>👶 {record.childName}</span>
                    <span>📅 {record.date}</span>
                  </div>
                </div>
                <div className="record-right">
                  <div className="record-tags">
                    {record.tags.map((t) => (
                      <span key={t} className="tag-chip small">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="record-rating">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={'star-icon' + (i < record.rating ? ' filled' : '')}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
