import { X, Clock, AlertTriangle } from 'lucide-react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { DayPlan } from '../context/MealPlanContext';

interface DroppableDayProps {
  day: DayPlan;
  totalCookTime: number;
  recipeCount: number;
  isOverTime: boolean;
  needsMoreRecipes: boolean;
  onRemoveRecipe: (plannedId: string) => void;
}

export default function DroppableDay({
  day,
  totalCookTime,
  recipeCount,
  isOverTime,
  needsMoreRecipes,
  onRemoveRecipe,
}: DroppableDayProps) {
  return (
    <div className="flex-shrink-0 w-full md:w-[calc((100%-3rem)/7)] min-w-[180px]">
      <div
        className={`rounded-t-xl p-3 relative transition-all duration-300 ${
          isOverTime
            ? 'bg-orange-100 border-2 border-orange-400'
            : 'bg-gradient-to-br from-primary/20 to-secondary/30'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{day.dayName}</h3>
            <p className="text-sm text-gray-600">{day.date}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
              {recipeCount}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} />
              <span>{totalCookTime}分</span>
            </div>
          </div>
        </div>

        {isOverTime && (
          <div className="mt-2 flex items-center gap-1 text-orange-600 text-xs font-medium animate-slide-up">
            <AlertTriangle size={14} />
            <span>烹饪时间过长</span>
          </div>
        )}
      </div>

      <Droppable droppableId={day.dayKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] p-2 border-2 border-t-0 rounded-b-xl transition-all duration-300 ${
              snapshot.isDraggingOver
                ? 'bg-primary/10 border-primary border-dashed'
                : isOverTime
                ? 'bg-orange-50 border-orange-400'
                : 'bg-white border-gray-100'
            }`}
          >
            {day.recipes.length === 0 && (
              <div className="h-[180px] flex items-center justify-center text-gray-300 text-sm">
                拖拽食谱到这里
              </div>
            )}

            {day.recipes.map((recipe, index) => (
              <Draggable
                key={recipe.id}
                draggableId={recipe.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      opacity: snapshot.isDragging ? 0.8 : 1,
                    }}
                    className={`flex items-center gap-2 p-2 mb-2 bg-white rounded-lg shadow-sm last:mb-0 transition-all duration-200 ${
                      snapshot.isDragging ? 'shadow-lg scale-105' : ''
                    }`}
                  >
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {recipe.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {recipe.cookTime}分钟
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveRecipe(recipe.id)}
                      className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {needsMoreRecipes && (
        <div className="mt-2 p-2 bg-blue-50 text-blue-600 text-xs rounded-lg text-center animate-slide-up">
          💡 建议至少两道菜
        </div>
      )}
    </div>
  );
}
