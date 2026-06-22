import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AllocationResult } from './TimeAllocator';

interface BudgetBarProps {
  allocations: AllocationResult[];
  dailyAvailableHours: number;
}

function getDeviationColor(deviationPercent: number): string {
  const absDeviation = Math.abs(deviationPercent);
  if (absDeviation <= 10) {
    return '#2ED573';
  } else if (absDeviation <= 30) {
    return '#FFA502';
  } else {
    return '#FF4757';
  }
}

function getProjectAbbreviation(name: string): string {
  return name.substring(0, 2).toUpperCase();
}

export function BudgetBar({ allocations, dailyAvailableHours }: BudgetBarProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const totalRecommended = useMemo(
    () => allocations.reduce((sum, a) => sum + a.recommendedHours, 0),
    [allocations]
  );

  const totalActual = useMemo(
    () => allocations.reduce((sum, a) => sum + a.actualHours, 0),
    [allocations]
  );

  if (allocations.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <p style={styles.emptyText}>暂无进行中的项目</p>
        <p style={styles.emptySubText}>添加项目后将自动计算时间分配</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>可用时长</span>
          <span style={styles.summaryValue}>{dailyAvailableHours}h</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>推荐投入</span>
          <span style={styles.summaryValue}>{totalRecommended.toFixed(1)}h</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>实际投入</span>
          <span style={styles.summaryValue}>{totalActual.toFixed(1)}h</span>
        </div>
      </div>

      <div style={styles.barsContainer}>
        {allocations.map((allocation, index) => {
          const maxBarWidth = allocation.recommendedHours > 0
            ? (allocation.recommendedHours / Math.max(totalRecommended, 1)) * 100
            : 0;
          const actualBarWidth = allocation.recommendedHours > 0
            ? Math.min((allocation.actualHours / allocation.recommendedHours) * maxBarWidth, maxBarWidth)
            : 0;
          const color = getDeviationColor(allocation.deviationPercent);
          const isSelected = selectedIndex === index;

          return (
            <motion.div
              key={allocation.projectId}
              style={styles.barWrapper}
              onClick={() => setSelectedIndex(isSelected ? null : index)}
            >
              <div style={styles.barLabelRow}>
                <span
                  style={{
                    ...styles.projectAbbr,
                    backgroundColor: color + '33',
                    color: color,
                  }}
                >
                  {getProjectAbbreviation(allocation.projectName)}
                </span>
                <span style={styles.barValues}>
                  {allocation.actualHours.toFixed(1)} / {allocation.recommendedHours.toFixed(1)}h
                </span>
              </div>

              <motion.div
                style={styles.barBackground}
                layout
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${maxBarWidth}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: index * 0.05 }}
                  style={{
                    ...styles.barRecommended,
                    backgroundColor: color + '33',
                  }}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${actualBarWidth}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: index * 0.05 + 0.2 }}
                  style={{
                    ...styles.barActual,
                    backgroundColor: color,
                  }}
                />
              </motion.div>

              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={styles.detailPanel}
                >
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>项目名称</span>
                    <span style={styles.detailValue}>{allocation.projectName}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>推荐时长</span>
                    <span style={styles.detailValue}>{allocation.recommendedHours.toFixed(1)} 小时</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>实际投入</span>
                    <span style={styles.detailValue}>{allocation.actualHours.toFixed(1)} 小时</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>偏差</span>
                    <span style={{ ...styles.detailValue, color }}>
                      {allocation.deviationPercent > 0 ? '+' : ''}
                      {allocation.deviationPercent}%
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, backgroundColor: '#2ED573' }} />
          <span style={styles.legendText}>偏差 ≤ 10%</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, backgroundColor: '#FFA502' }} />
          <span style={styles.legendText}>偏差 10-30%</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, backgroundColor: '#FF4757' }} />
          <span style={styles.legendText}>偏差 {'>'} 30%</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  emptyContainer: {
    textAlign: 'center' as const,
    padding: '40px 20px',
  },
  emptyText: {
    color: '#E0E0E0',
    fontSize: '16px',
    fontWeight: 500,
    margin: '0 0 8px 0',
  },
  emptySubText: {
    color: '#888899',
    fontSize: '14px',
    margin: 0,
  },
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: '#1E1E2E',
    borderRadius: '12px',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: '4px',
  },
  summaryLabel: {
    color: '#888899',
    fontSize: '12px',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: '18px',
    fontWeight: 700,
  },
  barsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  barWrapper: {
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  barLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    marginBottom: '8px',
  },
  projectAbbr: {
    fontSize: '10px',
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: '4px',
  },
  barValues: {
    color: '#E0E0E0',
    fontSize: '12px',
  },
  barBackground: {
    height: '30px',
    backgroundColor: '#1E1E2E',
    borderRadius: '6px',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  barRecommended: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: '6px',
  },
  barActual: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: '6px',
  },
  detailPanel: {
    marginTop: '12px',
    padding: '16px',
    backgroundColor: '#1E1E2E',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#888899',
    fontSize: '13px',
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 500,
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    paddingTop: '12px',
    borderTop: '1px solid #3A3D5C',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: '6px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  legendText: {
    color: '#888899',
    fontSize: '12px',
  },
};
