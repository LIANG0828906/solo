import { useMemo, useState, useEffect } from 'react';
import type { Risk } from '@/types';
import { RISK_LEVEL_COLORS, LEVEL_LABELS, STATUS_LABELS } from '@/types';
import { getDateRange, getDaysDiff, getTodayString, formatDate } from '@/utils/date';
import styles from './GanttView.module.css';

interface GanttViewProps {
  risks: Risk[];
  onViewDetail: (risk: Risk) => void;
}

const GanttView = ({ risks, onViewDetail }: GanttViewProps) => {
  const [today, setToday] = useState(getTodayString());

  useEffect(() => {
    const interval = setInterval(() => {
      const newToday = getTodayString();
      if (newToday !== today) {
        setToday(newToday);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [today]);

  const { dateRange, totalDays, dayWidth, todayPosition } = useMemo(() => {
    const allDates = risks.flatMap((r) => [r.createdAt, r.expectedCloseDate]);
    const { min, max } = getDateRange(allDates.length > 0 ? allDates : [today, today]);
    const total = getDaysDiff(min, max) + 1;
    const width = Math.max(60, 800 / total);
    const todayPos = getDaysDiff(min, new Date(today)) * width;

    return {
      dateRange: { min, max },
      totalDays: total,
      dayWidth: width,
      todayPosition: todayPos,
    };
  }, [risks, today]);

  const timelineLabels = useMemo(() => {
    const labels: { date: Date; label: string; position: number }[] = [];
    const current = new Date(dateRange.min);

    while (current <= dateRange.max) {
      const position = getDaysDiff(dateRange.min, current) * dayWidth;
      const showMonth = current.getDate() === 1 || labels.length === 0;

      labels.push({
        date: new Date(current),
        label: showMonth
          ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
          : String(current.getDate()).padStart(2, '0'),
        position,
      });

      current.setDate(current.getDate() + Math.max(1, Math.floor(totalDays / 20)));
    }

    return labels;
  }, [dateRange, dayWidth, totalDays]);

  const sortedRisks = useMemo(() => {
    return [...risks].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [risks]);

  const ganttWidth = totalDays * dayWidth + 200;

  return (
    <div className={styles.ganttContainer}>
      <div className={styles.ganttHeader}>
        <div className={styles.riskLabelHeader}>风险项</div>
        <div className={styles.timelineHeader} style={{ width: ganttWidth - 200 }}>
          {timelineLabels.map((label, index) => (
            <div
              key={index}
              className={styles.timelineLabel}
              style={{ left: label.position }}
            >
              {label.label}
            </div>
          ))}
          <div
            className={styles.todayLine}
            style={{
              left: todayPosition,
              transition: 'left 1s ease-in-out',
            }}
          >
            <div className={styles.todayLineDot} />
            <span className={styles.todayLabel}>今天</span>
          </div>
        </div>
      </div>

      <div className={styles.ganttBody}>
        <div className={styles.ganttScroll} style={{ width: ganttWidth }}>
          {sortedRisks.map((risk, index) => {
            const startPos = getDaysDiff(dateRange.min, new Date(risk.createdAt)) * dayWidth;
            const duration = getDaysDiff(new Date(risk.createdAt), new Date(risk.expectedCloseDate));
            const barWidth = Math.max(20, duration * dayWidth);
            const levelColor = RISK_LEVEL_COLORS[risk.level];

            return (
              <div
                key={risk.id}
                className={styles.ganttRow}
                style={{ animationDelay: `${index * 10}ms` }}
              >
                <div className={styles.riskInfo} onClick={() => onViewDetail(risk)}>
                  <span
                    className={styles.riskLevelDot}
                    style={{ backgroundColor: levelColor }}
                  />
                  <span className={styles.riskTitle} title={risk.title}>
                    {risk.title}
                  </span>
                </div>
                <div className={styles.ganttBarArea} style={{ width: ganttWidth - 200 }}>
                  <div
                    className={styles.ganttBar}
                    style={{
                      left: startPos,
                      width: barWidth,
                      backgroundColor: levelColor,
                      boxShadow: `0 2px 8px ${levelColor}40`,
                    }}
                    onClick={() => onViewDetail(risk)}
                  >
                    <div className={styles.ganttBarTooltip}>
                      <div className={styles.tooltipTitle}>{risk.title}</div>
                      <div className={styles.tooltipRow}>
                        <span>{LEVEL_LABELS[risk.level]}</span>
                        <span>{STATUS_LABELS[risk.status]}</span>
                      </div>
                      <div className={styles.tooltipRow}>
                        <span>创建: {formatDate(risk.createdAt)}</span>
                      </div>
                      <div className={styles.tooltipRow}>
                        <span>预计: {formatDate(risk.expectedCloseDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div
            className={styles.todayLineOverlay}
            style={{
              left: todayPosition + 200,
              transition: 'left 1s ease-in-out',
            }}
          />
        </div>
      </div>

      {sortedRisks.length === 0 && (
        <div className={styles.emptyState}>暂无风险数据</div>
      )}
    </div>
  );
};

export default GanttView;
