import React, { useEffect, useState } from 'react';
import { Wrench, Users, Clock, Zap } from 'lucide-react';
import { useElementStore } from '@data/elementStore';
import { ToolType } from '@types/index';

const TOOL_LABELS: Record<ToolType, string> = {
  brush: '自由画笔',
  rectangle: '矩形工具',
  circle: '椭圆工具',
  polygon: '多边形工具',
  text: '文字便签',
  image: '图片上传',
  select: '选择/移动',
};

const formatTime = (ts: number | null): string => {
  if (!ts) return '暂无操作';
  const date = new Date(ts);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

export const StatusBar: React.FC<{ fps: number }> = ({ fps }) => {
  const { tool, collaborators, lastOperationTime, elements, replay } =
    useElementStore();
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <footer className="statusbar">
      <div className="statusbar-left">
        <div className="status-item">
          <Wrench size={14} />
          <span className="status-label">当前工具:</span>
          <span className="status-value tool-value">{TOOL_LABELS[tool]}</span>
        </div>
        {replay.isPlaying && (
          <div className="status-item replay-indicator">
            <Zap size={14} />
            <span>历史回放中 {replay.currentStep}/{replay.totalSteps}</span>
          </div>
        )}
      </div>

      <div className="statusbar-right">
        <div className="status-item">
          <Users size={14} />
          <span className="status-label">在线:</span>
          <span className="status-value users-value">{collaborators.length}人</span>
        </div>

        <div className="status-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6v6H9z" />
          </svg>
          <span className="status-label">元素:</span>
          <span className="status-value">{elements.length}个</span>
        </div>

        <div className="status-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
          </svg>
          <span className="status-label">帧率:</span>
          <span
            className={`status-value fps-value ${fps >= 50 ? 'good' : fps >= 30 ? 'ok' : 'bad'}`}
          >
            {fps} FPS
          </span>
        </div>

        <div className="status-item">
          <Clock size={14} />
          <span className="status-label">最后操作:</span>
          <span className="status-value time-value">
            {formatTime(lastOperationTime)}
          </span>
        </div>
      </div>
    </footer>
  );
};
