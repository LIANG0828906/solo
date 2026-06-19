import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { Assignment, Submission } from '../types';
import './AssignmentPanel.css';

interface AssignmentPanelProps {
  userId: string;
}

export function AssignmentPanel({ userId }: AssignmentPanelProps) {
  const { assignments, submissions, addSubmission } = useStore();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userSubmissions = useMemo(() => {
    return submissions.filter((s) => s.userId === userId);
  }, [submissions, userId]);

  const getSubmissionStatus = (assignmentId: string): Submission | undefined => {
    return userSubmissions.find((s) => s.assignmentId === assignmentId);
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
    setTimeout(() => {
      setIsSubmitting(false);
      const updated = getSubmissionStatus(selectedAssignment.id);
      if (updated && updated.status === 'grading') {
      }
    }, 2100);
  };

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

  const getSubmission = (assignmentId: string) => {
    return userSubmissions.find((s) => s.assignmentId === assignmentId);
  };

  const getAvgScore = (submission: Submission) => {
    if (submission.gradingResults.length === 0) return 0;
    const sum = submission.gradingResults.reduce((acc, r) => acc + r.score, 0);
    return Math.round(sum / submission.gradingResults.length);
  };

  const submission = selectedAssignment ? getSubmission(selectedAssignment.id) : undefined;

  return (
    <div className="assignment-panel">
      <div className="assignment-list">
        <h3 className="panel-title">作业列表</h3>
        <div className="assignment-cards">
          {assignments.map((assignment) => {
            const sub = getSubmission(assignment.id);
            const isCompleted = sub && sub.status === 'graded';
            const isGrading = sub && sub.status === 'grading';
            return (
              <div
                key={assignment.id}
                className={`assignment-card ${selectedAssignment?.id === assignment.id ? 'active' : ''}`}
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
                  {isGrading && <div className="grading-status">批改中...</div>}
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
        ) : submission && submission.status === 'graded' ? (
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
              {submission.gradingResults.map((result, idx) => {
                const question = selectedAssignment.questions[idx];
                return (
                  <div key={result.questionId} className="grading-item">
                    <div className="grading-header">
                      <span className="question-num">第 {result.questionId} 题</span>
                      <span className={`score-badge ${result.score >= 80 ? 'high' : result.score >= 60 ? 'mid' : 'low'}`}>
                        {result.score} 分
                      </span>
                    </div>
                    <p className="question-text">{question.content}</p>
                    <div className="answer-block">
                      <span className="answer-label">我的答案：</span>
                      <p className="answer-text">{submission.answers[idx]?.content || '（未作答）'}</p>
                    </div>
                    <div className="feedback-block">
                      <span className="feedback-label">批改评语：</span>
                      <p className={`feedback-text ${result.score >= 80 ? 'high' : result.score >= 60 ? 'mid' : 'low'}`}>
                        {result.feedback}
                      </p>
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
              })}
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
                <div key={question.id} className="question-item">
                  <div className="question-header">
                    <span className="question-number">{question.id}.</span>
                    <span className="question-word-count">（限{question.maxWords}字以内）</span>
                  </div>
                  <p className="question-content">{question.content}</p>
                  <textarea
                    className="answer-textarea"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="请输入你的答案..."
                    rows={4}
                    maxLength={question.maxWords * 2}
                    disabled={submission?.status === 'grading' || isSubmitting}
                  />
                  <div className="word-count">
                    {(answers[question.id] || '').length} / {question.maxWords * 2} 字
                  </div>
                </div>
              ))}
            </div>
            <div className="form-actions">
              {submission?.status === 'grading' ? (
                <div className="grading-indicator">
                  <div className="spinner"></div>
                  <span>批改中，请稍候...</span>
                </div>
              ) : (
                <button className="submit-btn btn-ripple" onClick={handleSubmit} disabled={isSubmitting}>
                  提交作业
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
