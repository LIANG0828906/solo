import React, { useMemo } from 'react';
import { useEquipmentStore, CATEGORY_COLORS, CATEGORIES, type Category } from '@/stores/equipmentStore';
import styles from './WeightDashboard.module.css';

const WeightDashboard: React.FC = () => {
  const packingItems = useEquipmentStore((s) => s.packingItems);
  const equipments = useEquipmentStore((s) => s.equipments);
  const weightThreshold = useEquipmentStore((s) => s.weightThreshold);
  const setWeightThreshold = useEquipmentStore((s) => s.setWeightThreshold);

  const categoryWeights = useMemo(() => {
    const checkedItems = packingItems.filter((pi) => pi.checked);
    const result: Record<Category, number> = {
      '露营': 0, '徒步': 0, '摄影': 0, '急救': 0, '衣物': 0,
    };
    for (const pi of checkedItems) {
      const eq = equipments.find((e) => e.id === pi.equipmentId);
      if (eq) {
        result[eq.category] += eq.weight;
      }
    }
    return result;
  }, [packingItems, equipments]);

  const totalWeight = useMemo(() => {
    return Object.values(categoryWeights).reduce((a, b) => a + b, 0);
  }, [categoryWeights]);

  const maxWeight = useMemo(() => {
    return Math.max(...Object.values(categoryWeights), 1);
  }, [categoryWeights]);

  const isOverWeight = totalWeight > weightThreshold;

  return (
    <div className={styles.dashboard}>
      {isOverWeight && (
        <div className={styles.warningBanner}>
          <span className={styles.warningText}>超重！请减少物品</span>
        </div>
      )}
      <div className={styles.header}>
        <h3 className={styles.title}>重量分析</h3>
        <div className={styles.thresholdRow}>
          <label className={styles.thresholdLabel}>阈值</label>
          <input
            type="number"
            className={styles.thresholdInput}
            value={weightThreshold / 1000}
            min={1}
            step={0.5}
            onChange={(e) => setWeightThreshold(Math.max(0, Number(e.target.value) * 1000))}
          />
          <span className={styles.thresholdUnit}>kg</span>
        </div>
      </div>

      <div className={styles.chart}>
        {CATEGORIES.map((cat) => {
          const w = categoryWeights[cat];
          const pct = (w / maxWeight) * 100;
          return (
            <div key={cat} className={styles.barRow}>
              <span className={styles.barLabel} style={{ color: CATEGORY_COLORS[cat] }}>
                {cat}
              </span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: CATEGORY_COLORS[cat],
                  }}
                />
              </div>
              <span className={styles.barValue}>{w}g</span>
            </div>
          );
        })}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>总重</span>
          <span className={`${styles.summaryValue} ${isOverWeight ? styles.overWeight : ''}`}>
            {totalWeight >= 1000
              ? `${(totalWeight / 1000).toFixed(2)}kg`
              : `${totalWeight}g`}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>阈值</span>
          <span className={styles.summaryValue}>
            {(weightThreshold / 1000).toFixed(1)}kg
          </span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{
              width: `${Math.min((totalWeight / weightThreshold) * 100, 100)}%`,
              backgroundColor: isOverWeight ? '#E63946' : '#76B5C2',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default WeightDashboard;
