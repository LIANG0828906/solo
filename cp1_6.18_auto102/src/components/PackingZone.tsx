import React, { useMemo, useCallback } from 'react';
import { useEquipmentStore, CATEGORY_COLORS, type Category } from '@/stores/equipmentStore';
import { useDrop } from '@/hooks/useDrop';
import styles from './PackingZone.module.css';

const PackingZone: React.FC = () => {
  const packingItems = useEquipmentStore((s) => s.packingItems);
  const equipments = useEquipmentStore((s) => s.equipments);
  const toggleChecked = useEquipmentStore((s) => s.toggleChecked);
  const removeFromPacking = useEquipmentStore((s) => s.removeFromPacking);
  const addToPacking = useEquipmentStore((s) => s.addToPacking);

  const handleDrop = useCallback(
    (data: Record<string, string>) => {
      if (data.equipmentId) {
        addToPacking(data.equipmentId);
      }
    },
    [addToPacking]
  );

  const dropHandlers = useDrop({ onDrop: handleDrop });

  const enrichedItems = useMemo(() => {
    return packingItems.map((pi) => {
      const eq = equipments.find((e) => e.id === pi.equipmentId);
      return { ...pi, equipment: eq };
    }).filter((item) => item.equipment);
  }, [packingItems, equipments]);

  const totalWeight = useMemo(() => {
    return enrichedItems
      .filter((item) => item.checked)
      .reduce((sum, item) => sum + item.equipment!.weight, 0);
  }, [enrichedItems]);

  return (
    <div
      className={`${styles.zone} ${dropHandlers.isOver ? styles.zoneActive : ''}`}
      onDragOver={dropHandlers.onDragOver}
      onDragLeave={dropHandlers.onDragLeave}
      onDrop={dropHandlers.onDrop}
    >
      {enrichedItems.length === 0 && (
        <div className={styles.empty}>拖拽装备到此处开始打包</div>
      )}
      <div className={styles.list}>
        {enrichedItems.map((item) => {
          const color = CATEGORY_COLORS[item.equipment!.category];
          return (
            <div
              key={item.id}
              className={`${styles.packingItem} ${item.checked ? styles.checked : ''}`}
            >
              <div className={styles.colorBar} style={{ backgroundColor: color }} />
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={item.checked}
                onChange={() => toggleChecked(item.id)}
              />
              <div className={styles.itemInfo}>
                <span className={item.checked ? styles.itemNameChecked : styles.itemName}>
                  {item.equipment!.name}
                </span>
                <span className={styles.itemCategory} style={{ color }}>
                  {item.equipment!.category}
                </span>
              </div>
              <span className={styles.itemWeight}>{item.equipment!.weight}g</span>
              <button
                className={styles.removeBtn}
                onClick={() => removeFromPacking(item.id)}
                title="移除"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
      <div className={styles.totalBar}>
        <span className={styles.totalLabel}>已装包重量</span>
        <span className={styles.totalValue}>
          {totalWeight >= 1000
            ? `${(totalWeight / 1000).toFixed(2)}kg`
            : `${totalWeight}g`}
        </span>
      </div>
    </div>
  );
};

export default PackingZone;
