import { useState, useEffect } from 'react';
import { usePollStore } from '../pollStore';
import { CheckOutlined } from '@ant-design/icons';
import { Spin, message } from 'antd';
import type { Poll, Answer } from '../types';

interface VotePageProps {
  shortCode: string;
}

function VotePage({ shortCode }: VotePageProps) {
  const { fetchPollByShortCode, submitVote, initSocket, wsConnected } = usePollStore();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    initSocket();
  }, []);

  useEffect(() => {
    loadPoll();
  }, [shortCode]);

  const loadPoll = async () => {
    setLoading(true);
    const result = await fetchPollByShortCode(shortCode.toUpperCase());
    setPoll(result);
    setLoading(false);
  };

  const handleSingleSelect = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleMultipleSelect = (questionId: string, value: string) => {
    const current = (answers[questionId] as string[]) || [];
    if (current.includes(value)) {
      setAnswers({
        ...answers,
        [questionId]: current.filter((v) => v !== value),
      });
    } else {
      setAnswers({
        ...answers,
        [questionId]: [...current, value],
      });
    }
  };

  const handleRating = (questionId: string, value: number) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const validateAnswers = (): boolean => {
    if (!poll) return false;
    
    for (const q of poll.questions) {
      const answer = answers[q.id];
      if (q.type === 'single') {
        if (!answer) {
          message.error(`请完成题目：${q.title}`);
          return false;
        }
      } else if (q.type === 'multiple') {
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          message.error(`请完成题目：${q.title}`);
          return false;
        }
      } else if (q.type === 'rating') {
        if (!answer) {
          message.error(`请完成题目：${q.title}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!poll) return;
    if (!validateAnswers()) return;

    setSubmitting(true);
    
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 15;
      if (progressValue > 90) progressValue = 90;
      setProgress(progressValue);
    }, 200);

    try {
      const answerList: Answer[] = poll.questions.map((q) => ({
        questionId: q.id,
        value: answers[q.id] as string | string[] | number,
      }));

      const success = await submitVote(poll.id, answerList);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (success) {
        setTimeout(() => {
          setSubmitting(false);
          setSubmitted(true);
        }, 500);
      } else {
        setSubmitting(false);
        setProgress(0);
        message.error('提交失败，请重试');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setSubmitting(false);
      setProgress(0);
      message.error('提交失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="vote-page">
        <div className="vote-container" style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#666' }}>加载中...</div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="vote-page">
        <div className="vote-container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❓</div>
          <div style={{ fontSize: 18, color: '#333', marginBottom: 8 }}>投票不存在</div>
          <div style={{ fontSize: 13, color: '#999' }}>请检查短码是否正确</div>
        </div>
      </div>
    );
  }

  if (poll.closed) {
    return (
      <div className="vote-page">
        <div className="poll-closed-banner" style={{ width: '100%', maxWidth: 560 }}>
          投票已结束
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="vote-page">
        <div className="vote-container">
          <div className="thank-you-page">
            <div className="checkmark-circle">
              <CheckOutlined className="checkmark-icon" />
            </div>
            <div className="thank-you-text">感谢您的参与！</div>
            <div className="thank-you-subtext">您的投票已成功提交</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vote-page">
      <div className="vote-container">
        <div className="vote-title">{poll.title}</div>

        {submitting && (
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {poll.questions.map((q, index) => (
          <div key={q.id} className="vote-question" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="vote-question-title">
              {index + 1}. {q.title}
              <span style={{ color: '#F44336', marginLeft: 4 }}>*</span>
            </div>

            {q.type === 'single' && q.options?.map((opt) => (
              <div
                key={opt}
                className={`vote-option ${answers[q.id] === opt ? 'selected' : ''}`}
                onClick={() => handleSingleSelect(q.id, opt)}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `2px solid ${answers[q.id] === opt ? '#3F51B5' : '#E0E0E0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {answers[q.id] === opt && (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3F51B5' }} />
                  )}
                </div>
                <span style={{ fontSize: 14 }}>{opt}</span>
              </div>
            ))}

            {q.type === 'multiple' && q.options?.map((opt) => (
              <div
                key={opt}
                className={`vote-option ${(answers[q.id] as string[])?.includes(opt) ? 'selected' : ''}`}
                onClick={() => handleMultipleSelect(q.id, opt)}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 3,
                    border: `2px solid ${(answers[q.id] as string[])?.includes(opt) ? '#3F51B5' : '#E0E0E0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: (answers[q.id] as string[])?.includes(opt) ? '#3F51B5' : 'transparent',
                  }}
                >
                  {(answers[q.id] as string[])?.includes(opt) && (
                    <CheckOutlined style={{ color: '#fff', fontSize: 12 }} />
                  )}
                </div>
                <span style={{ fontSize: 14 }}>{opt}</span>
              </div>
            ))}

            {q.type === 'rating' && (
              <div className="rating-stars">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <div
                    key={num}
                    className={`rating-star ${(answers[q.id] as number) >= num ? 'active' : ''}`}
                    onClick={() => handleRating(q.id, num)}
                    style={{ fontSize: 28 }}
                  >
                    ★
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <button
          className="btn-primary"
          style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '提交投票'}
        </button>
      </div>
    </div>
  );
}

export default VotePage;
