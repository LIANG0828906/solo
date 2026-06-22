// ============================================================
// 成功率圆形进度条组件
// 职责: SVG实现的圆形进度条展示成功率百分比, 颜色随阈值变化
// 颜色规则: >80% 绿色, 50-80% 橙色, <50% 红色
// 数据来源: useCraftingStore.preview.successRate (通过CraftingPanel传入)
// ============================================================

import { memo } from 'react';

interface Props {
  rate: number; // 0-100
  size?: number;
}

function getRateColor(rate: number): string {
  if (rate > 80) return '#22c55e';   // 高成功 - 绿
  if (rate >= 50) return '#f97316';  // 中等 - 橙
  return '#ef4444';                  // 低 - 红
}

function SuccessRateCircleComponent({ rate, size = 140 }: Props) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedRate = Math.max(0, Math.min(100, rate));
  const offset = circumference - (clampedRate / 100) * circumference;
  const color = getRateColor(clampedRate);

  return (
    <div className="success-rate" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="success-rate__svg">
        {/* 底圈 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* 进度圈 - strokeDasharray动画实现进度 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
          }}
        />
        {/* 内层光晕圈 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 12}
          fill="none"
          stroke={color}
          strokeOpacity={0.15}
          strokeWidth={2}
        />
      </svg>
      {/* 中心百分比文字 */}
      <div className="success-rate__content">
        <div className="success-rate__value" style={{ color }}>
          {clampedRate}%
        </div>
        <div className="success-rate__label">
          {clampedRate > 80 ? '极高' : clampedRate >= 50 ? '中等' : '危险'}
        </div>
      </div>
    </div>
  );
}

export const SuccessRateCircle = memo(SuccessRateCircleComponent);
