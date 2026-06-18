import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import type { NutritionInfo } from '../types';

interface NutritionPanelProps {
  nutrition: NutritionInfo;
}

const DAILY_RECOMMENDED: NutritionInfo = {
  calories: 2000,
  protein: 60,
  fat: 65,
  carbs: 300,
  fiber: 25,
};

const NUTRIENT_CONFIG = [
  { key: 'calories' as const, label: '总热量', unit: '大卡', gradientClass: 'progress-calories' },
  { key: 'protein' as const, label: '蛋白质', unit: '克', gradientClass: 'progress-protein' },
  { key: 'fat' as const, label: '脂肪', unit: '克', gradientClass: 'progress-fat' },
  { key: 'carbs' as const, label: '碳水', unit: '克', gradientClass: 'progress-carbs' },
  { key: 'fiber' as const, label: '膳食纤维', unit: '克', gradientClass: 'progress-fiber' },
];

function useAnimatedNumber(target: number, duration: number = 300): number {
  const [current, setCurrent] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    if (Math.abs(diff) < 0.05) {
      setCurrent(target);
      prevRef.current = target;
      return;
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = start + diff * eased;
      setCurrent(Math.round(value * 10) / 10);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}

function NutrientBar({ value, recommended, label, unit, gradientClass }: {
  value: number;
  recommended: number;
  label: string;
  unit: string;
  gradientClass: string;
}) {
  const animatedValue = useAnimatedNumber(value);
  const percent = Math.min((value / recommended) * 100, 100);
  const animatedPercent = Math.min((animatedValue / recommended) * 100, 100);

  return (
    <div className="nutrient-row">
      <div className="nutrient-header">
        <span className="nutrient-label">{label}</span>
        <span className="nutrient-value">
          <span className="nutrient-number">{animatedValue.toFixed(1)}</span>
          <span className="nutrient-unit">{unit}</span>
          <span className="nutrient-percent">({percent.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="nutrient-bar-bg">
        <div
          className={`nutrient-bar-fill ${gradientClass}`}
          style={{ width: `${animatedPercent}%` }}
        />
      </div>
      <div className="nutrient-daily">每日推荐 {recommended}{unit}</div>
    </div>
  );
}

export default function NutritionPanel({ nutrition }: NutritionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div className={`nutrition-panel ${isExpanded ? 'expanded' : ''}`}>
      <div className="nutrition-panel-header">
        <h2 className="nutrition-title">📊 营养分析</h2>
        <button className="nutrition-toggle" onClick={toggleExpanded}>
          {isExpanded ? <FiChevronDown /> : <FiChevronUp />}
        </button>
      </div>
      <div className="nutrition-panel-body">
        <div className="nutrition-summary">
          <div className="summary-calories">
            <span className="summary-calories-value">
              {useAnimatedNumber(nutrition.calories).toFixed(0)}
            </span>
            <span className="summary-calories-unit">大卡</span>
          </div>
          <span className="summary-calories-label">总热量</span>
        </div>
        <div className="nutrition-bars">
          {NUTRIENT_CONFIG.map(cfg => (
            <NutrientBar
              key={cfg.key}
              value={nutrition[cfg.key]}
              recommended={DAILY_RECOMMENDED[cfg.key]}
              label={cfg.label}
              unit={cfg.unit}
              gradientClass={cfg.gradientClass}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
