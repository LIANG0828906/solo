import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Refrigerator, GripHorizontal } from "lucide-react";
import { useRecipeContext, useRecipeActions } from "@/store/recipeStore";
import { v4 } from "uuid";

interface FridgeIngredient {
  id: string;
  name: string;
  quantity: number;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: { name: string; quantity: number }[];
}

export default function IngredientPanel() {
  const navigate = useNavigate();
  const { fridgeIngredients, recipes } = useRecipeContext() as {
    fridgeIngredients: FridgeIngredient[];
    recipes: Recipe[];
  };
  const { addFridgeIngredient, removeFridgeIngredient } = useRecipeActions();

  const [ingredientName, setIngredientName] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState(1);
  const [panelHeight, setPanelHeight] = useState(150);
  const [isMobile, setIsMobile] = useState(false);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      isDragging.current = true;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      startY.current = clientY;
      startHeight.current = panelHeight;

      const handleDragMove = (ev: MouseEvent | TouchEvent) => {
        if (!isDragging.current) return;
        const moveY = "touches" in ev ? ev.touches[0].clientY : ev.clientY;
        const delta = startY.current - moveY;
        const newHeight = Math.min(
          window.innerHeight * 0.8,
          Math.max(150, startHeight.current + delta)
        );
        setPanelHeight(newHeight);
      };

      const handleDragEnd = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
        window.removeEventListener("touchmove", handleDragMove);
        window.removeEventListener("touchend", handleDragEnd);
      };

      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
    },
    [panelHeight]
  );

  const handleSubmit = useCallback(() => {
    const trimmed = ingredientName.trim();
    if (!trimmed) return;
    addFridgeIngredient({ id: v4(), name: trimmed, quantity: ingredientQuantity });
    setIngredientName("");
    setIngredientQuantity(1);
  }, [ingredientName, ingredientQuantity, addFridgeIngredient]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
    },
    [handleSubmit]
  );

  const recommendations = useMemo(() => {
    if (fridgeIngredients.length === 0) return [];
    const fridgeNames = new Set(
      fridgeIngredients.map((i) => i.name.toLowerCase())
    );

    const scored = recipes.map((recipe) => {
      const matchedCount = recipe.ingredients.filter((ing) =>
        fridgeNames.has(ing.name.toLowerCase())
      ).length;
      const matchPercent = Math.round(
        (matchedCount / recipe.ingredients.length) * 100
      );
      return { ...recipe, matchPercent };
    });

    return scored.sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 5);
  }, [fridgeIngredients, recipes]);

  const panelContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <Refrigerator className="w-5 h-5 text-warm-500" />
        <h2 className="text-lg font-semibold text-gray-800">我的冰箱</h2>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={ingredientName}
            onChange={(e) => setIngredientName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入食材名称"
            className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-transparent"
          />
          <input
            type="number"
            value={ingredientQuantity}
            onChange={(e) => setIngredientQuantity(Math.max(1, Number(e.target.value)))}
            placeholder="数量"
            min={1}
            className="w-16 px-2 py-1.5 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-transparent"
          />
          <button
            onClick={handleSubmit}
            className="flex items-center justify-center w-9 h-9 bg-warm-400 hover:bg-warm-500 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        {fridgeIngredients.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {fridgeIngredients.map((ingredient) => (
              <span
                key={ingredient.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warm-100 text-sm text-gray-700"
              >
                {ingredient.name} × {ingredient.quantity}
                <button
                  onClick={() => removeFridgeIngredient(ingredient.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">冰箱空空如也</p>
        )}
      </div>

      <div className="px-4 py-3 flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          推荐菜谱
          {recommendations.length > 0 && (
            <span className="ml-1 text-warm-500">({recommendations.length})</span>
          )}
        </h3>
        {fridgeIngredients.length === 0 ? (
          <p className="text-sm text-gray-400">添加食材获取推荐</p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => navigate(`/recipe/${recipe.id}`)}
                className="w-full text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 group-hover:text-warm-500 transition-colors">
                    {recipe.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {recipe.matchPercent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full animate-progress-fill"
                    style={{
                      width: `${recipe.matchPercent}%`,
                      ["--progress-width" as string]: `${recipe.matchPercent}%`,
                      backgroundColor: `hsl(${recipe.matchPercent * 1.2}, 70%, 50%)`,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 rounded-t-2xl shadow-lg"
        style={{ height: `${panelHeight}px` }}
      >
        <div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="flex justify-center py-2 cursor-row-resize"
        >
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-5 h-0.5 bg-gray-300 rounded-full" />
            <GripHorizontal className="w-6 h-4 text-gray-300" />
            <div className="w-5 h-0.5 bg-gray-300 rounded-full" />
          </div>
        </div>
        <div className="overflow-y-auto" style={{ height: `${panelHeight - 40}px` }}>
          {panelContent}
        </div>
      </div>
    );
  }

  return (
    <div className="w-[300px] h-full bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
      {panelContent}
    </div>
  );
}
