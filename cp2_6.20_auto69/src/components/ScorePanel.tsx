import React, { useRef } from 'react';
import { Check } from 'lucide-react';
import { ScoreSlider } from './ScoreSlider';
import { useGradingStore } from '@/store/useGradingStore';

export const ScorePanel: React.FC = () => {
  const { score, setScore, submitScore, showSuccessToast } = useGradingStore();
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = btnRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height);

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const dimensions: { key: 'content' | 'language' | 'structure' | 'creativity'; label: string; color: string }[] = [
    { key: 'content', label: '内容', color: '#1976d2' },
    { key: 'language', label: '语言', color: '#4caf50' },
    { key: 'structure', label: '结构', color: '#ff9800' },
    { key: 'creativity', label: '创意', color: '#9c27b0' },
  ];

  const totalScore = dimensions.reduce((sum, d) => sum + score[d.key], 0);

  return (
    <div className="p-4 bg-bg-panel rounded-xl shadow-card relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-text-primary">评分面板</h3>
        <div className="text-right">
          <span className="text-xs text-text-secondary">总分</span>
          <span className="ml-2 text-2xl font-bold text-brand">
            {totalScore}
          </span>
          <span className="text-sm text-text-secondary">/40</span>
        </div>
      </div>

      {dimensions.map((dim) => (
        <ScoreSlider
          key={dim.key}
          label={dim.label}
          value={score[dim.key]}
          onChange={(value) => setScore({ [dim.key]: value })}
          color={dim.color}
        />
      ))}

      <button
        ref={btnRef}
        onClick={(e) => {
          handleRipple(e);
          submitScore();
        }}
        className="ripple-btn w-full py-2.5 mt-2 text-white text-sm font-medium rounded-lg bg-brand hover:bg-brand-hover transition-colors flex items-center justify-center gap-2"
      >
        提交评分
      </button>

      {showSuccessToast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-positive text-white rounded-lg shadow-card flex items-center gap-2 animate-slide-up">
          <Check size={16} />
          <span className="text-sm font-medium">保存成功</span>
        </div>
      )}
    </div>
  );
};
