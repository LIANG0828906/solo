import React, { useCallback, useState } from 'react';
import type { PlantCategory } from '../types';
import { addPlant } from '../plantManager';
import styles from './AddPlantModal.module.css';

interface AddPlantModalProps {
  onClose: () => void;
  onAdded: () => void;
}

const categories: { value: PlantCategory; icon: string }[] = [
  { value: '多肉', icon: '🌵' },
  { value: '观叶', icon: '🌿' },
  { value: '开花', icon: '🌸' },
  { value: '水生', icon: '💧' },
];

const AddPlantModal: React.FC<AddPlantModalProps> = function AddPlantModal({
  onClose,
  onAdded,
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlantCategory>('多肉');
  const [initialHeight, setInitialHeight] = useState(10);
  const [initialLeaves, setInitialLeaves] = useState(5);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;

      addPlant({
        name: name.trim(),
        category,
        initialHeight,
        initialLeaves,
      });

      onAdded();
      onClose();
    },
    [name, category, initialHeight, initialLeaves, onAdded, onClose]
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>添加新植物</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>植物名称</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              placeholder="请输入植物名称"
              maxLength={20}
              autoFocus
            />
            <div className={styles.charCount}>{name.length}/20</div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>植物品种</label>
            <div className={styles.categoryOptions}>
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  className={`${styles.categoryOption} ${
                    category === cat.value ? styles.selected : ''
                  }`}
                  onClick={() => setCategory(cat.value)}
                >
                  <span className={styles.categoryIcon}>{cat.icon}</span>
                  <span className={styles.categoryName}>{cat.value}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>初始高度 ({initialHeight} cm)</label>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                className={styles.slider}
                min="0"
                max="100"
                step="1"
                value={initialHeight}
                onChange={(e) => setInitialHeight(Number(e.target.value))}
              />
              <span className={styles.sliderValue}>{initialHeight} cm</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>初始叶片数量</label>
            <input
              type="number"
              className={styles.input}
              min="0"
              max="20"
              step="1"
              value={initialLeaves}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 0 && val <= 20) {
                  setInitialLeaves(val);
                }
              }}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!name.trim()}
          >
            添加植物
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPlantModal;
