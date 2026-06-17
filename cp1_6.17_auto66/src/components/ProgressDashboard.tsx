import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { getRelativeTime } from '../utils';
import Spinner from './Spinner';
import '../styles/ProgressDashboard.css';

interface ProgressRingProps {
  progress: number;
  label: string;
  delay: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ progress, label, delay }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animated ? (progress / 100) * circumference : 0);
  const gradientId = `progress-gradient-${label.replace(/\s/g, '-')}`;

  return (
    <div className="progress-ring-container">
      <svg width={size} height={size} className="progress-ring">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-progress-start)" />
            <stop offset="100%" stopColor="var(--color-progress-end)" />
          </linearGradient>
        </defs>
        <circle
          className="progress-ring-bg"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="progress-ring-fg"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          stroke={`url(#${gradientId})`}
          style={{
            transition: 'stroke-dashoffset 1s ease-out',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
          }}
        />
      </svg>
      <div className="progress-ring-text">
        <span className="progress-percent">{animated ? progress : 0}%</span>
      </div>
      <span className="progress-label">{label}</span>
    </div>
  );
};

const ProgressDashboard: React.FC = () => {
  const { currentStudentProgress, loadingProgress, fetchProgress } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProgress('stu002');
  }, [fetchProgress]);

  if (loadingProgress) {
    return (
      <div className="dashboard-loading">
        <Spinner size={32} />
        <span>加载中...</span>
      </div>
    );
  }

  if (!currentStudentProgress) {
    return (
      <div className="dashboard-empty">
        <p>暂无进度数据</p>
      </div>
    );
  }

  return (
    <div className="progress-dashboard">
      <div className="dashboard-header">
        <h2>学习进度</h2>
        <span className="student-greeting">你好，{currentStudentProgress.studentName} 👋</span>
      </div>

      <div className="progress-rings-section">
        <h3 className="section-title">章节完成度</h3>
        <div className="progress-rings-grid">
          {currentStudentProgress.chapters.map((chapter, index) => (
            <ProgressRing
              key={chapter.chapterId}
              progress={chapter.completion}
              label={chapter.chapterName}
              delay={index * 150}
            />
          ))}
        </div>
      </div>

      <div className="timeline-section">
        <h3 className="section-title">最近批改</h3>
        <div className="timeline">
          {currentStudentProgress.recentGraded.length === 0 ? (
            <p className="timeline-empty">暂无批改记录</p>
          ) : (
            currentStudentProgress.recentGraded.map((submission, index) => (
              <div
                key={submission.id}
                className={`timeline-item ${mounted ? 'timeline-visible' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="timeline-dot" />
                <div className="timeline-line" />
                <div className="timeline-card">
                  <div className="timeline-card-header">
                    <span className="timeline-score">{submission.grade}分</span>
                    <span className="timeline-time">
                      {submission.gradedAt ? getRelativeTime(submission.gradedAt) : ''}
                    </span>
                  </div>
                  {submission.feedback && (
                    <p className="timeline-feedback">
                      {submission.feedback.length > 50
                        ? submission.feedback.substring(0, 50) + '...'
                        : submission.feedback}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
