import { useState, useMemo, useRef, DragEvent } from 'react';
import { useAppStore } from '../stores/appStore';
import { RadarChart } from './RadarChart';
import {
  calculateTotalNutrients,
  type MealItem,
} from '../utils/nutrition';

interface EditableItemProps {
  item: MealItem;
  index: number;
  onUpdate: (id: string, amount: number) => void;
  onRemove: (id: string) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDrop: () => void;
  isOver: boolean;
}

function MealItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  isOver,
}: EditableItemProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(item.amount));
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setValue(String(item.amount));
    setEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }

  function commitEdit() {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n > 0) {
      onUpdate(item.id, n);
    } else {
      setValue(String(item.amount));
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setValue(String(item.amount));
      setEditing(false);
    }
  }

  function handleRemove() {
    setRemoving(true);
    setTimeout(() => {
      onRemove(item.id);
    }, 180);
  }

  return (
    <div
      className={`meal-item ${removing ? 'removing' : ''} ${isOver ? 'drag-over' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={onDrop}
      onDoubleClick={startEdit}
    >
      <div className="meal-item-drag">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <circle cx="9" cy="5" r="1.5" />
          <circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" />
          <circle cx="15" cy="19" r="1.5" />
        </svg>
      </div>

      <div className="meal-item-info">
        <span className="meal-item-name">{item.foodName}</span>
        {editing ? (
          <input
            ref={inputRef}
            className="meal-item-input"
            type="number"
            min="1"
            max="10000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="meal-item-amount" onClick={startEdit}>
            {item.amount}g
          </span>
        )}
      </div>

      <button
        className="meal-item-delete"
        onClick={handleRemove}
        title="删除"
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export function MealPanel() {
  const currentMeal = useAppStore((s) => s.currentMeal);
  const selectedDate = useAppStore((s) => s.selectedDate);
  const removeMealItem = useAppStore((s) => s.removeMealItem);
  const updateMealItemAmount = useAppStore((s) => s.updateMealItemAmount);
  const reorderMealItems = useAppStore((s) => s.reorderMealItems);

  const totalNutrients = useMemo(() => calculateTotalNutrients(currentMeal), [currentMeal]);

  const dragFrom = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;
  const title = isToday ? '今日餐盘' : `${selectedDate} 餐盘`;

  function onDragStart(e: DragEvent<HTMLDivElement>, index: number) {
    dragFrom.current = index;
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }

  function onDrop() {
    if (dragFrom.current !== null && dragOverIndex !== null) {
      reorderMealItems(dragFrom.current, dragOverIndex);
    }
    dragFrom.current = null;
    setDragOverIndex(null);
  }

  function onDragEnd(e: React.SyntheticEvent<HTMLElement>) {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDragOverIndex(null);
  }

  return (
    <div className="meal-panel" onDragEnd={onDragEnd}>
      <div className="meal-panel-header">
        <h2 className="meal-panel-title">{title}</h2>
        <span className="meal-panel-count">
          {currentMeal.length} 项
        </span>
      </div>

      <div className="meal-items-list">
        {currentMeal.length === 0 ? (
          <div className="meal-empty">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <p>餐盘还是空的</p>
            <p className="meal-empty-hint">搜索食物添加进来吧</p>
          </div>
        ) : (
          currentMeal.map((item, idx) => (
            <MealItemRow
              key={item.id}
              item={item}
              index={idx}
              onUpdate={updateMealItemAmount}
              onRemove={removeMealItem}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              isOver={dragOverIndex === idx && dragFrom.current !== idx}
            />
          ))
        )}
      </div>

      <div className="radar-section">
        <div className="radar-title">营养均衡度</div>
        <div className="radar-chart-wrap">
          <RadarChart nutrients={totalNutrients} size={200} />
        </div>
        <div className="nutrient-summary">
          <div className="summary-item">
            <span className="summary-dot" style={{ backgroundColor: '#FF6B35' }} />
            <span>热量 {totalNutrients.calories} kcal</span>
          </div>
          <div className="summary-item">
            <span className="summary-dot" style={{ backgroundColor: '#4ECDC4' }} />
            <span>蛋白 {totalNutrients.protein} g</span>
          </div>
          <div className="summary-item">
            <span className="summary-dot" style={{ backgroundColor: '#FFD166' }} />
            <span>脂肪 {totalNutrients.fat} g</span>
          </div>
        </div>
      </div>
    </div>
  );
}
