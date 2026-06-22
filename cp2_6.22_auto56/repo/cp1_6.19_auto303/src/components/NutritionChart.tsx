import { useMemo } from 'react';
import type { NutrientPercentages } from '../types';
import styles from './NutritionChart.module.css';

interface NutritionChartProps {
  percentages: NutrientPercentages;
  totalCalories: number;
}

const CIRCUMFERENCE = 2 * Math.PI * 60;

export const NutritionChart = ({
  percentages,
  totalCalories,
}: NutritionChartProps) => {
  const segments = useMemo(() => {
    const { protein, carbs, fat } = percentages;
    const total = protein + carbs + fat;
    if (total === 0) return [];

    const proteinLen = (protein / total) * CIRCUMFERENCE;
    const carbsLen = (carbs / total) * CIRCUMFERENCE;
    const fatLen = (fat / total) * CIRCUMFERENCE;

    return [
      {
        className: styles.protein,
        dashArray: `${proteinLen} ${CIRCUMFERENCE - proteinLen}`,
        dashOffset: 0,
        label: '蛋白质',
        value: protein,
        color: '#E8B4B8',
      },
      {
        className: styles.carbs,
        dashArray: `${carbsLen} ${CIRCUMFERENCE - carbsLen}`,
        dashOffset: -proteinLen,
        label: '碳水',
        value: carbs,
        color: '#C4A574',
      },
      {
        className: styles.fat,
        dashArray: `${fatLen} ${CIRCUMFERENCE - fatLen}`,
        dashOffset: -(proteinLen + carbsLen),
        label: '脂肪',
        value: fat,
        color: '#7C4A3A',
      },
    ];
  }, [percentages]);

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.title}>营养分析</h3>
      <div className={styles.svgContainer}>
        <svg
          className={styles.chartSvg}
          viewBox="0 0 160 160"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className={styles.circleBg}
            cx="80"
            cy="80"
            r="60"
          />
          {segments.map((segment, index) => (
            <circle
              key={index}
              className={`${styles.circleSegment} ${segment.className}`}
              cx="80"
              cy="80"
              r="60"
              strokeDasharray={segment.dashArray}
              strokeDashoffset={segment.dashOffset}
            />
          ))}
        </svg>
        <div className={styles.centerText}>
          <div className={styles.caloriesValue}>
            {Math.round(totalCalories)}
          </div>
          <div className={styles.caloriesLabel}>千卡</div>
        </div>
      </div>
      <div className={styles.legend}>
        {segments.map((segment, index) => (
          <div key={index} className={styles.legendItem}>
            <span className={styles.legendLabel}>
              <span
                className={styles.legendColor}
                style={{ backgroundColor: segment.color }}
              />
              {segment.label}
            </span>
            <span className={styles.legendValue}>
              {segment.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
