import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Submission, Annotation } from '../types';
import { useStore } from '../store/useStore';
import { TextAnnotator } from './TextAnnotator';

interface 批改编辑器Props {
  submission: Submission;
  studentHistory: Submission[];
}

export const 批改编辑器: React.FC<批改编辑器Props> = ({
  submission,
  studentHistory,
}) => {
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [localScore, setLocalScore] = useState<number | null>(submission.score);
  const [localComment, setLocalComment] = useState(submission.overallComment);
  const [highlightAnnotationId, setHighlightAnnotationId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const addAnnotation = useStore((state) => state.addAnnotation);
  const deleteAnnotation = useStore((state) => state.deleteAnnotation);
  const updateOverallComment = useStore((state) => state.updateOverallComment);
  const updateScore = useStore((state) => state.updateScore);
  const submitGrading = useStore((state) => state.submitGrading);

  const displaySubmission = useMemo(() => {
    if (selectedHistoryId) {
      return studentHistory.find((s) => s.id === selectedHistoryId) || submission;
    }
    return submission;
  }, [selectedHistoryId, studentHistory, submission]);

  const isCurrent = !selectedHistoryId || selectedHistoryId === submission.id;

  useEffect(() => {
    setLocalScore(submission.score);
    setLocalComment(submission.overallComment);
    setSelectedHistoryId(null);
  }, [submission.id]);

  const handleHistoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value || null;
    const oldIndex = studentHistory.findIndex((s) => s.id === (selectedHistoryId || submission.id));
    const newIndex = newId
      ? studentHistory.findIndex((s) => s.id === newId)
      : studentHistory.findIndex((s) => s.id === submission.id);

    setSlideDirection(newIndex > oldIndex ? 'left' : 'right');
    setIsAnimating(true);
    setSelectedHistoryId(newId);

    setTimeout(() => {
      setIsAnimating(false);
      setSlideDirection(null);
    }, 300);
  };

  const handleAddAnnotation = (
    startIndex: number,
    endIndex: number,
    text: string,
    content: string
  ) => {
    if (!isCurrent) return;
    addAnnotation(submission.id, { startIndex, endIndex, text, content });
  };

  const handleDeleteAnnotation = (annotationId: string) => {
    if (!isCurrent) return;
    deleteAnnotation(submission.id, annotationId);
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setLocalScore(value);
    updateScore(submission.id, value);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalComment(e.target.value);
    updateOverallComment(submission.id, e.target.value);
  };

  const handleSubmit = () => {
    if (localScore === null) {
      alert('请先打分');
      return;
    }
    submitGrading(submission.id);
    alert('批改已提交！');
  };

  const sortedAnnotations = [...displaySubmission.annotations].sort(
    (a, b) => a.startIndex - b.startIndex
  );

  const handleAnnotationHover = (id: string | null) => {
    setHighlightAnnotationId(id);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="grading-editor" ref={containerRef}>
      <div className="editor-header">
        <div className="editor-title-section">
          <h2 className="editor-title">{displaySubmission.title}</h2>
          <div className="editor-meta">
            <span className="student-name-label">学生：{displaySubmission.studentName}</span>
            <span className="submit-time-label">
              提交时间：{formatDate(displaySubmission.submittedAt)}
            </span>
            {displaySubmission.gradedAt && (
              <span className="graded-time-label">
                批改时间：{formatDate(displaySubmission.gradedAt)}
              </span>
            )}
          </div>
        </div>
        <div className="history-selector">
          <label htmlFor="history-select">历史作业：</label>
          <select
            id="history-select"
            value={selectedHistoryId || ''}
            onChange={handleHistoryChange}
            className="history-select"
          >
            <option value="">当前作业</option>
            {studentHistory
              .filter((s) => s.id !== submission.id)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({formatDate(s.submittedAt)})
                  {s.score !== null ? ` - ${s.score}分` : ''}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="editor-body">
        <div
          className={`text-pane ${isAnimating ? `slide-${slideDirection}` : ''}`}
          key={displaySubmission.id + '-text'}
        >
          <TextAnnotator
            content={displaySubmission.content}
            annotations={displaySubmission.annotations}
            onAddAnnotation={handleAddAnnotation}
            onDeleteAnnotation={isCurrent ? handleDeleteAnnotation : undefined}
            highlightId={highlightAnnotationId}
          />
        </div>

        <div
          className={`annotation-pane ${isAnimating ? `slide-${slideDirection}` : ''}`}
          key={displaySubmission.id + '-pane'}
        >
          <div className="annotations-section">
            <h3 className="section-title">
              批注列表
              <span className="annotation-count-badge">
                {sortedAnnotations.length}
              </span>
            </h3>
            <div className="annotations-list">
              {sortedAnnotations.length === 0 ? (
                <div className="empty-annotations">
                  <p>暂无批注</p>
                  <p className="hint">选中左侧文本添加批注</p>
                </div>
              ) : (
                sortedAnnotations.map((annotation, index) => (
                  <div
                    key={annotation.id}
                    className={`annotation-item ${
                      highlightAnnotationId === annotation.id ? 'highlight' : ''
                    }`}
                    onMouseEnter={() => handleAnnotationHover(annotation.id)}
                    onMouseLeave={() => handleAnnotationHover(null)}
                  >
                    <div className="annotation-header">
                      <span className="annotation-index">{index + 1}</span>
                      {isCurrent && (
                        <button
                          className="annotation-delete"
                          onClick={() => handleDeleteAnnotation(annotation.id)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="annotation-text">"{annotation.text}"</div>
                    <div className="annotation-content">{annotation.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="comment-section">
            <h3 className="section-title">总体评语</h3>
            <textarea
              className="comment-textarea"
              value={isCurrent ? localComment : displaySubmission.overallComment}
              onChange={handleCommentChange}
              placeholder="请输入总体评语..."
              rows={4}
              readOnly={!isCurrent}
            />
          </div>

          <div className="score-section">
            <div className="score-header">
              <h3 className="section-title">评分</h3>
              <span className="score-value">
                {isCurrent ? (localScore ?? '--') : displaySubmission.score ?? '--'}
                <span className="score-unit">分</span>
              </span>
            </div>
            <div className="score-slider-container">
              <input
                type="range"
                min="0"
                max="100"
                value={isCurrent ? localScore ?? 0 : displaySubmission.score ?? 0}
                onChange={handleScoreChange}
                className="score-slider"
                disabled={!isCurrent}
              />
              <div className="slider-labels">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {isCurrent && (
            <div className="submit-section">
              <button className="submit-btn" onClick={handleSubmit}>
                {submission.gradedAt ? '更新批改' : '提交批改'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .grading-editor {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100vh;
          overflow: hidden;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: #fff;
          border-bottom: 1px solid #e5e5e5;
          flex-shrink: 0;
        }

        .editor-title-section {
          min-width: 0;
        }

        .editor-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0 0 4px 0;
        }

        .editor-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #888;
        }

        .history-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .history-selector label {
          font-size: 13px;
          color: #666;
        }

        .history-select {
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          background: #fff;
          cursor: pointer;
          min-width: 200px;
        }

        .history-select:focus {
          outline: none;
          border-color: #4a90d9;
        }

        .editor-body {
          flex: 1;
          display: flex;
          min-height: 0;
        }

        .text-pane {
          flex: 1;
          min-width: 0;
          position: relative;
          overflow: hidden;
        }

        .annotation-pane {
          width: 320px;
          background: #f5f5f5;
          border-left: 1px solid #e5e5e5;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow: hidden;
        }

        .slide-left {
          animation: slideLeft 0.3s ease;
        }

        .slide-right {
          animation: slideRight 0.3s ease;
        }

        @keyframes slideLeft {
          from {
            opacity: 0.5;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideRight {
          from {
            opacity: 0.5;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .annotations-section {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .annotation-count-badge {
          background: #4a90d9;
          color: white;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 500;
        }

        .annotations-list {
          flex: 1;
          overflow-y: auto;
          margin-top: 12px;
          padding-right: 4px;
        }

        .empty-annotations {
          text-align: center;
          padding: 30px 10px;
          color: #999;
        }

        .empty-annotations p {
          margin: 4px 0;
          font-size: 13px;
        }

        .empty-annotations .hint {
          font-size: 12px;
          color: #bbb;
        }

        .annotation-item {
          background: #fff;
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 8px;
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .annotation-item.highlight {
          border-color: #4a90d9;
          box-shadow: 0 2px 8px rgba(74, 144, 217, 0.15);
        }

        .annotation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .annotation-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: #ff8c42;
          color: white;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
        }

        .annotation-delete {
          background: none;
          border: none;
          font-size: 16px;
          color: #ccc;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        }

        .annotation-delete:hover {
          color: #ff6b6b;
        }

        .annotation-text {
          font-size: 12px;
          color: #666;
          font-style: italic;
          margin-bottom: 6px;
          padding: 4px 8px;
          background: #f8f9fa;
          border-radius: 4px;
          line-height: 1.5;
        }

        .annotation-content {
          font-size: 13px;
          color: #333;
          line-height: 1.5;
        }

        .comment-section {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .comment-textarea {
          width: 100%;
          margin-top: 10px;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
          resize: none;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .comment-textarea:focus {
          outline: none;
          border-color: #4a90d9;
        }

        .comment-textarea[readonly] {
          background: #f8f9fa;
          color: #666;
        }

        .score-section {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .score-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .score-value {
          font-size: 24px;
          font-weight: 700;
          color: #ff8c42;
        }

        .score-unit {
          font-size: 14px;
          font-weight: 400;
          color: #888;
          margin-left: 2px;
        }

        .score-slider-container {
          position: relative;
        }

        .score-slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(to right, #ff8c42, #ffb078);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }

        .score-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: #fff;
          border: 3px solid #ff8c42;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          transition: transform 0.15s;
        }

        .score-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .score-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: #fff;
          border: 3px solid #ff8c42;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .score-slider:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-size: 11px;
          color: #aaa;
        }

        .submit-section {
          padding: 16px;
        }

        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #4a90d9, #3a7bc8);
          color: white;
          padding: 12px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
        }

        .submit-btn:hover {
          background: linear-gradient(135deg, #3a7bc8, #2e6bb0);
        }

        @media (max-width: 768px) {
          .grading-editor {
            height: auto;
          }

          .editor-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 16px;
          }

          .history-select {
            width: 100%;
            min-width: auto;
          }

          .editor-body {
            flex-direction: column;
            height: auto;
          }

          .text-pane {
            height: 300px;
          }

          .annotation-pane {
            width: 100%;
            border-left: none;
            border-top: 1px solid #e5e5e5;
          }
        }
      `}</style>
    </div>
  );
};
