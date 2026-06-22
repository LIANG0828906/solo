import { useEffect, useState, useCallback } from 'react';
import { useStore } from './store';
import AnalyticsBoard from './AnalyticsBoard';
import FeedbackList from './FeedbackList';
import type { FeedbackSubmission } from './types';

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="stars">
      {stars.map((s) => (
        <span
          key={s}
          className={`star ${s <= value ? 'filled' : 'empty'} ${readonly ? 'readonly' : ''}`}
          onClick={() => !readonly && onChange?.(s)}
        >
          {s <= value ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const {
    courses,
    selectedCourseId,
    searchQuery,
    successMessage,
    setCourses,
    setSelectedCourseId,
    setSearchQuery,
    fetchCourses,
    fetchAnalysis,
    fetchFeedbacks,
    submitFeedback,
    setSuccessMessage,
  } = useStore();

  const [cq, setCq] = useState(0);
  const [ie, setIe] = useState(0);
  const [pv, setPv] = useState(0);
  const [comment, setComment] = useState('');
  const [employeeName, setEmployeeName] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchAnalysis(selectedCourseId);
      fetchFeedbacks(selectedCourseId);
    }
  }, [selectedCourseId]);

  const filteredCourses = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const handleSubmit = useCallback(async () => {
    if (!selectedCourseId || cq === 0 || ie === 0 || pv === 0 || !comment.trim()) return;
    const data: FeedbackSubmission = {
      courseId: selectedCourseId,
      employeeName: employeeName.trim() || undefined!,
      contentQuality: cq,
      instructorExpression: ie,
      practicalValue: pv,
      comment: comment.trim(),
    };
    await submitFeedback(data);
    setCq(0);
    setIe(0);
    setPv(0);
    setComment('');
    setEmployeeName('');
  }, [selectedCourseId, cq, ie, pv, comment, employeeName, submitFeedback]);

  return (
    <div className="app-layout">
      {successMessage && (
        <div className={`success-toast ${successMessage ? 'show' : ''}`}>
          {successMessage}
          <button className="close-btn" onClick={() => setSuccessMessage('')}>✕</button>
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-title">📚 培训课程</div>
        <input
          className="course-search"
          type="text"
          placeholder="搜索课程..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div>
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className={`course-item ${course.id === selectedCourseId ? 'active' : ''}`}
              onClick={() => setSelectedCourseId(course.id)}
            >
              <div className="course-item-name">{course.name}</div>
              <div className="course-item-desc">{course.description}</div>
              <div className="course-item-stats">
                <span>⭐ {(course as any).avgScore || '-'}</span>
                <span>💬 {(course as any).totalFeedback || 0}条反馈</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="main-content">
        {selectedCourse ? (
          <>
            <div className="overview-cards">
              <div className="overview-card">
                <div className="overview-card-label">课程名称</div>
                <div className="overview-card-value" style={{ fontSize: 18 }}>{selectedCourse.name}</div>
              </div>
              <div className="overview-card">
                <div className="overview-card-label">平均评分</div>
                <div className="overview-card-value" style={{ color: '#FFB300' }}>
                  {(selectedCourse as any).avgScore || '-'} / 5
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-card-label">总反馈数</div>
                <div className="overview-card-value" style={{ color: '#3182CE' }}>
                  {(selectedCourse as any).totalFeedback || 0}
                </div>
              </div>
            </div>

            <div className="feedback-form">
              <h3>📝 提交反馈</h3>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="您的姓名（可选）"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #CBD5E0',
                    borderRadius: 6,
                    fontSize: 14,
                    width: 200,
                    outline: 'none',
                  }}
                />
              </div>
              <div className="rating-row">
                <span className="rating-label">内容质量</span>
                <StarRating value={cq} onChange={setCq} />
              </div>
              <div className="rating-row">
                <span className="rating-label">讲师表达</span>
                <StarRating value={ie} onChange={setIe} />
              </div>
              <div className="rating-row">
                <span className="rating-label">实用价值</span>
                <StarRating value={pv} onChange={setPv} />
              </div>
              <div className="comment-area">
                <textarea
                  className="comment-textarea"
                  placeholder="请写下您的评论（最多200字）"
                  maxLength={200}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <span className="char-count">{comment.length}/200</span>
              </div>
              <button className="submit-btn" onClick={handleSubmit} disabled={cq === 0 || ie === 0 || pv === 0 || !comment.trim()}>
                提交反馈
              </button>
            </div>

            <AnalyticsBoard />

            <FeedbackList />
          </>
        ) : (
          <div className="no-data">请从左侧选择一门课程</div>
        )}
      </main>
    </div>
  );
}
