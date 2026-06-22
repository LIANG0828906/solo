import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setMeal, swapMeals } from '../store/appSlice';
import type { MealCategory } from '../types';
import RecipeSelector from './RecipeSelector';
import './WeekGrid.css';

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const mealLabels: Record<MealCategory, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};
const mealTypes: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function WeekGrid() {
  const dispatch = useDispatch<AppDispatch>();
  const weekPlan = useSelector((state: RootState) => state.app.weekPlan);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: number; meal: MealCategory } | null>(null);
  const [dragging, setDragging] = useState<{ day: number; meal: MealCategory } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ day: number; meal: MealCategory } | null>(null);
  const [flashTarget, setFlashTarget] = useState<{ day: number; meal: MealCategory } | null>(null);
  const dragImageRef = useRef<HTMLDivElement>(null);

  const handleCellClick = (day: number, meal: MealCategory) => {
    setSelectedCell({ day, meal });
    setSelectorOpen(true);
  };

  const handleSelectRecipe = (recipeId: string | null) => {
    if (selectedCell) {
      dispatch(setMeal({
        dayIndex: selectedCell.day,
        mealType: selectedCell.meal,
        recipeId,
      }));
    }
    setSelectorOpen(false);
  };

  const handleDragStart = (e: React.DragEvent, day: number, meal: MealCategory) => {
    setDragging({ day, meal });
    e.dataTransfer.effectAllowed = 'move';
    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent, day: number, meal: MealCategory) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragging) return;
    if (dragging.day !== day || dragging.meal !== meal) {
      setDropTarget({ day, meal });
    } else {
      setDropTarget(null);
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, day: number, meal: MealCategory) => {
    e.preventDefault();
    if (!dragging) return;
    if (dragging.day === day && dragging.meal === meal) {
      setDragging(null);
      setDropTarget(null);
      return;
    }
    dispatch(swapMeals({
      fromDay: dragging.day,
      fromMeal: dragging.meal,
      toDay: day,
      toMeal: meal,
    }));
    setFlashTarget({ day, meal });
    setTimeout(() => setFlashTarget(null), 300);
    setDragging(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDropTarget(null);
  };

  return (
    <div className="week-grid-container">
      <div className="week-grid-header">
        <div className="corner-cell"></div>
        {mealTypes.map(meal => (
          <div key={meal} className="meal-header">{mealLabels[meal]}</div>
        ))}
      </div>
      {dayNames.map((dayName, dayIdx) => (
        <div key={dayIdx} className="day-row">
          <div className="day-label">{dayName}</div>
          {mealTypes.map(meal => {
            const mealData = weekPlan[dayIdx]?.[meal];
            const isDragging = dragging?.day === dayIdx && dragging?.meal === meal;
            const isDropTarget = dropTarget?.day === dayIdx && dropTarget?.meal === meal;
            const isFlashing = flashTarget?.day === dayIdx && flashTarget?.meal === meal;
            return (
              <div
                key={meal}
                className={`meal-cell ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''} ${isFlashing ? 'flash' : ''}`}
                onClick={() => handleCellClick(dayIdx, meal)}
                draggable={!!mealData}
                onDragStart={(e) => handleDragStart(e, dayIdx, meal)}
                onDragOver={(e) => handleDragOver(e, dayIdx, meal)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dayIdx, meal)}
                onDragEnd={handleDragEnd}
              >
                <div className="cell-title">{mealLabels[meal]}</div>
                {mealData ? (
                  <div className="cell-recipe-name">{mealData.name}</div>
                ) : (
                  <div className="cell-empty">+ 添加</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div ref={dragImageRef} className="drag-image" style={{ display: 'none' }}></div>
      {selectorOpen && selectedCell && (
        <RecipeSelector
          mealCategory={selectedCell.meal}
          onSelect={handleSelectRecipe}
          onClose={() => setSelectorOpen(false)}
        />
      )}
    </div>
  );
}
