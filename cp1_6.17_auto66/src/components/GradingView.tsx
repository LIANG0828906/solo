import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { getRelativeTime } from '../utils';
import Button from './Button';
import Input from './Input';
import '../styles/GradingView.css';

const GradingView: React.FC = () => {
  const { selectedSubmission, selectSubmission, gradeSubmission, isSaving, assignments } = useStore();
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState('80');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (selectedSubmission) {
      setFeedback(selectedSubmission.feedback || '');
      setGrade(String(selectedSubmission.grade || 80));
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [selectedSubmission]);

  if (!selectedSubmission) return null;

  const assignment = assignments.find(a => a.id === selectedSubmission.assignmentId);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => selectSubmission(null), 300);
  };

  const handleSave = () => {
    const gradeNum = parseInt(grade, 10);
    if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 100) {
      alert('请输入1-100之间的分数');
      return;
    }
    gradeSubmission(selectedSubmission.id, gradeNum, feedback);
  };

  const graded = selectedSubmission.status === 'graded';

  return (
    <div className="grading-overlay" onClick={handleClose}>
      <div
        className={`grading-panel ${isVisible ? 'visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grading-header">
          <button className="close-btn" onClick={handleClose} aria-label="关闭">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h3>作业批改</h3>
        </div>

        <div className="grading-content">
          <div className="student-info-section slide-in">
            <div className="info-row">
              <span className="info-label">学生姓名</span>
              <span className="info-value">{selectedSubmission.studentName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">提交时间</span>
              <span className="info-value">{getRelativeTime(selectedSubmission.submittedAt)}</span>
            </div>
            {assignment && (
              <div className="info-row">
                <span className="info-label">对应作业</span>
                <span className="info-value">{assignment.title}</span>
              </div>
            )}
            {graded && selectedSubmission.gradedAt && (
              <div className="info-row">
                <span className="info-label">批改时间</span>
                <span className="info-value">{getRelativeTime(selectedSubmission.gradedAt)}</span>
              </div>
            )}
          </div>

          <div className="submission-section slide-in" style={{ animationDelay: '0.05s' }}>
            <h4>学生提交内容</h4>
            <div className="submission-content">
              {selectedSubmission.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            {selectedSubmission.fileUrl && (
              <a
                href={selectedSubmission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="submission-file"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                {selectedSubmission.fileUrl}
              </a>
            )}
          </div>

          <div className="grading-section slide-in" style={{ animationDelay: '0.1s' }}>
            <div className="grading-row">
              <div className="grade-input-wrapper">
                <label className="grading-label">评分</label>
                <Input
                  type="number"
                  value={grade}
                  onChange={setGrade}
                  min={1}
                  max={100}
                  step={1}
                  disabled={isSaving}
                />
                <span className="grade-hint">1-100分</span>
              </div>
            </div>

            <div className="feedback-wrapper">
              <label className="grading-label">评语</label>
              <Input
                type="textarea"
                value={feedback}
                onChange={setFeedback}
                placeholder="请输入评语..."
                maxLength={500}
                rows={4}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <div className="grading-footer">
          <Button variant="ghost" onClick={handleClose} disabled={isSaving}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSave} loading={isSaving}>
            {graded ? '更新评分' : '保存评分'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GradingView;
