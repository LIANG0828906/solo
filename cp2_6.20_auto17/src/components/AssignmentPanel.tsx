import { useState, useMemo, memo } from 'react';
import { useStore } from '../store/useStore';
import type { Assignment, Submission } from '../types';
import './AssignmentPanel.css';

interface AssignmentPanelProps {
  userId: string;
}

const QuestionItem = memo(function QuestionItem({
  question,
  value,
  onChange,
  disabled,
}: {
  question: Assignment['questions'][0];
  value: string;
  onChange: (id: number, v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="question-item">
      <div className="question-header">
        <span className="question-number">{question.id}.</span>
        <span className="question-word-count">（限{question.maxWords}字以内）</span>
      </div>
      <p className="question-content">{question.content}</p>
      <textarea
        className="answer-textarea"
        value={value}
        onChange={(e) => onChange(question.id, e.target.value)}
        placeholder="请输入你的答案..."
        rows={4}
        maxLength={question.maxWords * 2}
        disabled={disabled}
      />
      <div className="word-count">
        {value.length} / {question.maxWords * 2} 字
      </div>
    </div>
  );
});

const GradingItem = memo(function GradingItem({
  question,
  result,
  answer,
}: {
  question: Assignment['questions'][0];
  result: Submission['gradingResults'][0];
  answer: string;
}) {
  const scoreLevel = result.score >= 80 ? 'high' : result.score >= 60 ? 'mid' : 'low';
  return (
    <div className="grading-item">
      <div className="grading-header">
        <span className="question-num">第 {result.questionId} 题</span>
        <span className={`score-badge ${scoreLevel}`}>{result.score} 分</span>
      </div>
      <p className="question-text">{question.content}</p>
      <div className="answer-block">
        <span className="answer-label">我的答案：</span>
        <p className="answer-text">{answer || '（未作答）'}</p>
      </div>
      <div className="feedback-block">
        <span className="feedback-label">批改评语：</span>
        <p className={`feedback-text ${scoreLevel}`}>{result.feedback}</p>
      </div>
      {result.errorType && (
        <div className="error-type-tag">
          错误类型：
          {result.errorType === 'knowledge_gap' && '知识遗漏'}
          {result.errorType === 'unclear_expression' && '表述不清'}
          {result.errorType === 'misunderstanding' && '理解偏差'}
        </div>
      )}
    </div>
  );
});

export function AssignmentPanel({ userId }: AssignmentPanelProps) {
  const { assignments, addSubmission, submissions, getSubmissionForAssignment } = useStore();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submission = useMemo(() => {
    if (!selectedAssignment) return undefined;
    return getSubmissionForAssignment(userId, selectedAssignment.id);
  }, [selectedAssignment, userId, submissions, getSubmissionForAssignment]);

  const isGrading = submission?.status === 'grading';
  const isGraded = submission?.status === 'graded';

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvgScore = (sub: Submission) => {
    if (sub.gradingResults.length === 0) return 0;
    const sum = sub.gradingResults.reduce((acc, r) => acc + r.score, 0);
    return Math.round(sum / sub.gradingResults.length);
  };

  const handleSelectAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    const initialAnswers: Record<number, string> = {};
    assignment.questions.forEach((q) => {
      initialAnswers[q.id] = '';
    });
    setAnswers(initialAnswers);
    setIsSubmitting(false);
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    const answerList = selectedAssignment.questions.map((q) => ({
      questionId: q.id,
      content: answers[q.id] || '',
    }));
    addSubmission(selectedAssignment.id, answerList);
  };

  return (
    <div className="assignment-panel">
      <div className="assignment-list">
        <h3 className="panel-title">作业列表</h3>
        <div className="assignment-cards">
          {assignments.map((assignment) => {
            const sub = getSubmissionForAssignment(userId, assignment.id);
            const isCompleted = sub && sub.status === 'graded';
            const isSubGrading = sub && sub.status === 'grading';
            const isSelected = selectedAssignment?.id === assignment.id;
            return (
              <div
                key={assignment.id}
                className={`assignment-card ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectAssignment(assignment)}
              >
                <div className="card-left-bar"></div>
                <div className="card-content">
                  <div className="card-header">
                    <h4 className="card-title">{assignment.title}</h4>
                    {isCompleted && <span className="check-icon">✓</span>}
                  </div>
                  <div className="card-meta">
                    <span className="subject-tag">{assignment.subject}</span>
                    <span className="deadline">截止：{formatDeadline(assignment.deadline)}</span>
                  </div>
                  {isCompleted && (
                    <div className="card-score">
                      得分：<strong>{getAvgScore(sub!)}</strong> 分
                    </div>
                  )}
                  {isSubGrading && <div className="grading-status">批改中...</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="assignment-detail">
        {!selectedAssignment ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>请从左侧选择一份作业</p>
          </div>
        ) : isGraded && submission ? (
          <div className="submission-result">
            <h3 className="detail-title">{selectedAssignment.title}</h3>
            <div className="result-summary">
              <div className="avg-score">
                <span className="score-label">平均得分</span>
                <span className="score-value">{getAvgScore(submission)}</span>
                <span className="score-unit">分</span>
              </div>
              <div className="result-info">
                <p>提交时间：{new Date(submission.submittedAt).toLocaleString('zh-CN')}</p>
                <p>题目数量：{selectedAssignment.questions.length} 题</p>
              </div>
            </div>
            <div className="grading-detail-list">
              {selectedAssignment.questions.map((question, idx) => {
                const result = submission.gradingResults[idx];
                const ans = submission.answers[idx]?.content || '';
                return result ? (
                  <GradingItem
                    key={question.id}
                    question={question}
                    result={result}
                    answer={ans}
                  />
                ) : null;
              })}
            </div>
          </div>
        ) : isGrading ? (
          <div className="grading-container">
            <h3 className="detail-title">{selectedAssignment.title}</h3>
            <div className="grading-big-indicator">
              <div className="big-spinner"></div>
              <h4 className="grading-big-text">正在批改中...</h4>
              <p className="grading-big-sub">AI评分引擎正在分析您的答案，约需2秒</p>
              <div className="grading-progress">
                <div className="grading-progress-bar"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="assignment-form">
            <h3 className="detail-title">{selectedAssignment.title}</h3>
            <div className="form-info">
              <span className="subject-badge">{selectedAssignment.subject}</span>
              <span className="deadline-text">截止时间：{formatDeadline(selectedAssignment.deadline)}</span>
            </div>
            <div className="questions-list">
              {selectedAssignment.questions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  value={answers[question.id] || ''}
                  onChange={handleAnswerChange}
                  disabled={isSubmitting}
                />
              ))}
            </div>
            <div className="form-actions">
              <button
                className="submit-btn btn-ripple"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '提交作业'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
