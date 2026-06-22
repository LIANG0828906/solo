import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useQuizStore } from '../store';
import { quizApi } from '../api';
import type { Score, QuestionStat } from '../types';

function ResultDashboard() {
  const { id } = useParams<{ id: string }>();
  const scoreResult = useQuizStore((state) => state.scoreResult);
  const setScoreResult = useQuizStore((state) => state.setScoreResult);
  const resetQuiz = useQuizStore((state) => state.resetQuiz);

  const [score, setScore] = useState<Score | null>(scoreResult);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!score && id) {
      const loadScore = async () => {
        const data = await quizApi.getScoreDetail(id);
        if (data) {
          setScore(data);
          setScoreResult(data);
        }
      };
      loadScore();
    }
  }, [id, score, setScoreResult]);

  useEffect(() => {
    if (!score) return;
    const target = score.totalScore;
    const duration = 1500;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(target * easeOut));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [score]);

  if (!score) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
        加载中...
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  const getBarColor = (value: number) => {
    if (value >= 80) return '#38a169';
    if (value >= 50) return '#3182ce';
    if (value >= 30) return '#ed8936';
    return '#e53e3e';
  };

  const getHeatColor = (seconds: number) => {
    const normalized = Math.min(seconds / 60, 1);
    if (normalized < 0.25) return '#fefcbf';
    if (normalized < 0.5) return '#fbd38d';
    if (normalized < 0.75) return '#fc8181';
    return '#c53030';
  };

  const barData = score.questionStats.map((stat: QuestionStat) => ({
    name: `第${stat.questionIndex + 1}题`,
    正确率: stat.accuracy,
  }));

  return (
    <div className="animate-fade-in">
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ color: '#1a365d', fontSize: '28px', marginBottom: '24px' }}>
          答题完成！
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '24px',
          }}
        >
          <div>
            <div
              style={{
                color: '#718096',
                fontSize: '14px',
                marginBottom: '8px',
              }}
            >
              总得分
            </div>
            <div
              style={{
                color: '#1a365d',
                fontSize: '48px',
                fontWeight: 700,
              }}
            >
              {displayScore}
            </div>
          </div>
          <div>
            <div
              style={{
                color: '#718096',
                fontSize: '14px',
                marginBottom: '8px',
              }}
            >
              正确率
            </div>
            <div
              style={{
                color: score.accuracy >= 60 ? '#38a169' : '#e53e3e',
                fontSize: '48px',
                fontWeight: 700,
              }}
            >
              {score.accuracy}%
            </div>
          </div>
          <div>
            <div
              style={{
                color: '#718096',
                fontSize: '14px',
                marginBottom: '8px',
              }}
            >
              答对题数
            </div>
            <div
              style={{
                color: '#1a365d',
                fontSize: '48px',
                fontWeight: 700,
              }}
            >
              {score.correctCount}/{score.totalQuestions}
            </div>
          </div>
          <div>
            <div
              style={{
                color: '#718096',
                fontSize: '14px',
                marginBottom: '8px',
              }}
            >
              总用时
            </div>
            <div
              style={{
                color: '#3182ce',
                fontSize: '36px',
                fontWeight: 700,
              }}
            >
              {formatTime(score.totalTime)}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <h3
          style={{
            color: '#1a365d',
            fontSize: '20px',
            marginBottom: '20px',
          }}
        >
          各题正确率分布
        </h3>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#4a5568', fontSize: 12 }} />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#4a5568', fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, '正确率']}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              />
              <Bar dataKey="正确率" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.正确率)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <h3
          style={{
            color: '#1a365d',
            fontSize: '20px',
            marginBottom: '20px',
          }}
        >
          答题时长热力图
        </h3>
        <div style={{ marginBottom: '16px', color: '#718096', fontSize: '14px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: '#fefcbf',
                borderRadius: '2px',
                display: 'inline-block',
              }}
            />
            用时短
          </span>
          <span style={{ margin: '0 16px' }}>→</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            用时长
            <span
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: '#c53030',
                borderRadius: '2px',
                display: 'inline-block',
              }}
            />
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '8px',
          }}
        >
          {score.questionStats.map((stat: QuestionStat) => (
            <div
              key={stat.questionId}
              style={{
                backgroundColor: getHeatColor(stat.avgTimeSpent),
                borderRadius: '6px',
                padding: '12px 8px',
                textAlign: 'center',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a365d' }}>
                第{stat.questionIndex + 1}题
              </div>
              <div style={{ fontSize: '12px', color: '#4a5568', marginTop: '4px' }}>
                {stat.avgTimeSpent.toFixed(1)}秒
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
        <Link
          to="/"
          onClick={() => resetQuiz()}
          style={{
            padding: '12px 32px',
            backgroundColor: '#3182ce',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          返回测验列表
        </Link>
      </div>
    </div>
  );
}

export default ResultDashboard;
