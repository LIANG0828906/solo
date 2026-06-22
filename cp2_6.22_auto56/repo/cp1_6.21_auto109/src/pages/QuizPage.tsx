import React, { useEffect, useState } from 'react';
import axios from 'axios';
import type { Question, Answer, GradeResult } from '../types';
import QuestionManager from '../QuestionManager';
import { submitGrading, saveReport } from '../GraderService';
import ResultPage from './ResultPage';

interface QuizPageProps {
  onBackHome: () => void;
}

const QUIZ_COUNT = 5;

const QuizPage: React.FC<QuizPageProps> = ({ onBackHome }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get<Question[]>('/api/questions');
      setQuestions(data);

      const choices = data.filter((q) => q.type === 'choice');
      const judges = data.filter((q) => q.type === 'judge');
      const choiceCount = Math.min(3, choices.length);
      const judgeCount = Math.min(2, judges.length);

      const pickedChoices = [...choices].sort(() => Math.random() - 0.5).slice(0, choiceCount);
      const pickedJudges = [...judges].sort(() => Math.random() - 0.5).slice(0, judgeCount);

      let picked = [...pickedChoices, ...pickedJudges];
      if (picked.length < QUIZ_COUNT && data.length > picked.length) {
        const remaining = data.filter((q) => !picked.find((p) => p.id === q.id));
        picked = picked.concat(remaining.sort(() => Math.random() - 0.5).slice(0, QUIZ_COUNT - picked.length));
      }
      setQuizQuestions(picked.sort(() => Math.random() - 0.5));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleSubmit = async (answers: Answer[]) => {
    try {
      const submitStart = performance.now();
      setSubmitting(true);
      const gradeResult = await submitGrading(answers);
      saveReport(gradeResult);
      setResult(gradeResult);
      const total = performance.now() - submitStart;
      console.info(`[QuizPage] Submit-to-render total: ${total.toFixed(1)}ms`);
    } catch (e) {
      console.error('Grading failed:', e);
      alert('批改失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    if (questions.length > 0) {
      const choices = questions.filter((q) => q.type === 'choice');
      const judges = questions.filter((q) => q.type === 'judge');
      const choiceCount = Math.min(3, choices.length);
      const judgeCount = Math.min(2, judges.length);
      const pickedChoices = [...choices].sort(() => Math.random() - 0.5).slice(0, choiceCount);
      const pickedJudges = [...judges].sort(() => Math.random() - 0.5).slice(0, judgeCount);
      let picked = [...pickedChoices, ...pickedJudges];
      if (picked.length < QUIZ_COUNT && questions.length > picked.length) {
        const remaining = questions.filter((q) => !picked.find((p) => p.id === q.id));
        picked = picked.concat(remaining.sort(() => Math.random() - 0.5).slice(0, QUIZ_COUNT - picked.length));
      }
      setQuizQuestions(picked.sort(() => Math.random() - 0.5));
    } else {
      loadQuestions();
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: '4px solid #E5E7EB',
            borderTop: '4px solid #8B5CF6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px',
          }}
        />
        <p style={{ color: '#6B7280', fontSize: 15 }}>正在加载题目...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (result) {
    return <ResultPage result={result} questions={quizQuestions} onRetry={handleRetry} onBackHome={onBackHome} />;
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>
          学生端 · 随堂测验
        </h1>
        <button
          onClick={onBackHome}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            background: '#fff',
            color: '#6B7280',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          ← 返回首页
        </button>
      </div>
      <p style={{ color: '#6B7280', margin: '0 0 28px 0' }}>
        共 {quizQuestions.length} 题，包含 {quizQuestions.filter((q) => q.type === 'choice').length} 道选择题，
        {quizQuestions.filter((q) => q.type === 'judge').length} 道判断题
      </p>

      {submitting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '28px 40px',
              borderRadius: 16,
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                border: '3px solid #E5E7EB',
                borderTop: '3px solid #8B5CF6',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p style={{ color: '#374151', fontSize: 15, margin: 0, fontWeight: 500 }}>
              正在智能批改...
            </p>
          </div>
        </div>
      )}

      <QuestionManager questions={quizQuestions} onSubmit={handleSubmit} />
    </div>
  );
};

export default QuizPage;
