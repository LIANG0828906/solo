import { useMemo } from 'react';
import {
  DragDropContext,
  DropResult,
  Draggable,
  Droppable,
} from 'react-beautiful-dnd';
import { Heart, GripVertical } from 'lucide-react';
import { useMealPlan } from '../context/MealPlanContext';
import { useFavorites } from '../context/FavoritesContext';
import { recipes } from '../data/recipesData';
import DroppableDay from '../components/DroppableDay';

const MAX_COOK_TIME = 120;
const MIN_RECIPES_PER_DAY = 2;
const FAVORITES_DROPPABLE_ID = 'favorites';

export default function MealPlanPage() {
  const { mealPlan, addRecipeToDay, removeRecipeFromDay, moveRecipe } =
    useMealPlan();
  const { favorites } = useFavorites();

  const favoriteRecipes = useMemo(() => {
    return recipes.filter((recipe) => favorites.includes(recipe.id));
  }, [favorites]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (
      source.droppableId === FAVORITES_DROPPABLE_ID &&
      destination.droppableId !== FAVORITES_DROPPABLE_ID
    ) {
      const recipe = favoriteRecipes[source.index];
      addRecipeToDay(destination.droppableId, {
        recipeId: recipe.id,
        name: recipe.name,
        image: recipe.image,
        cookTime: recipe.cookTime,
      });
      return;
    }

    if (
      source.droppableId !== FAVORITES_DROPPABLE_ID &&
      destination.droppableId !== FAVORITES_DROPPABLE_ID
    ) {
      moveRecipe(
        source.droppableId,
        destination.droppableId,
        source.index,
        destination.index
      );
    }
  };

  const getDayTotalCookTime = (dayKey: string) => {
    const day = mealPlan.find((d) => d.dayKey === dayKey);
    if (!day) return 0;
    return day.recipes.reduce((total, r) => total + r.cookTime, 0);
  };

  const getDayRecipeCount = (dayKey: string) => {
    const day = mealPlan.find((d) => d.dayKey === dayKey);
    return day ? day.recipes.length : 0;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            我的一周饮食计划
          </h1>
          <p className="text-gray-500 text-sm">
            从左侧收藏夹拖拽食谱到每日计划中，轻松规划一周美食
          </p>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4">
            <div className="hidden md:block w-56 flex-shrink-0">
              <div className="sticky top-24 bg-white rounded-xl shadow-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Heart size={18} className="text-red-500 fill-red-500" />
                  <h3 className="font-semibold text-gray-800">
                    已收藏食谱
                  </h3>
                  <span className="text-xs text-gray-400 ml-auto">
                    {favoriteRecipes.length}
                  </span>
                </div>

                <Droppable droppableId={FAVORITES_DROPPABLE_ID}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide"
                    >
                      {favoriteRecipes.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">
                          还没有收藏食谱
                          <br />
                          去浏览页收藏喜欢的食谱吧
                        </p>
                      ) : (
                        favoriteRecipes.map((recipe, index) => (
                          <Draggable
                            key={`fav-${recipe.id}`}
                            draggableId={`fav-${recipe.id}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.7 : 1,
                                }}
                                className={`flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 last:mb-0 transition-all duration-200 ${
                                  snapshot.isDragging
                                    ? 'shadow-lg scale-105 bg-white'
                                    : ''
                                }`}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical size={16} />
                                </div>
                                <img
                                  src={recipe.image}
                                  alt={recipe.name}
                                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-700 truncate">
                                    {recipe.name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {recipe.cookTime}分钟
                                  </p>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex gap-3 md:gap-4 min-w-max md:min-w-0">
                {mealPlan.map((day) => {
                  const totalTime = getDayTotalCookTime(day.dayKey);
                  const count = getDayRecipeCount(day.dayKey);
                  const isOverTime = totalTime > MAX_COOK_TIME;
                  const needsMore = count > 0 && count < MIN_RECIPES_PER_DAY;

                  return (
                    <DroppableDay
                      key={day.dayKey}
                      day={day}
                      totalCookTime={totalTime}
                      recipeCount={count}
                      isOverTime={isOverTime}
                      needsMoreRecipes={needsMore}
                      onRemoveRecipe={(id) =>
                        removeRecipeFromDay(day.dayKey, id)
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </DragDropContext>

        <div className="md:hidden mt-6">
          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={18} className="text-red-500 fill-red-500" />
              <h3 className="font-semibold text-gray-800">已收藏食谱</h3>
              <span className="text-xs text-gray-400 ml-auto">
                {favoriteRecipes.length}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {favoriteRecipes.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4 w-full">
                  还没有收藏食谱
                </p>
              ) : (
                favoriteRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex-shrink-0 w-20 text-center"
                  >
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-14 h-14 rounded-full object-cover mx-auto mb-1"
                    />
                    <p className="text-xs text-gray-600 truncate">
                      {recipe.name}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
