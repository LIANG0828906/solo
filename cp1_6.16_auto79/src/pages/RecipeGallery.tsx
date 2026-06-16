import { useState, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock, Heart, SlidersHorizontal } from "lucide-react";
import { useRecipeContext, useRecipeActions } from "@/store/recipeStore";

const CATEGORIES = ["中餐", "西餐", "日餐", "早餐", "甜品"] as const;

const CATEGORY_GRADIENTS: Record<string, string> = {
  中餐: "linear-gradient(135deg, #FF4444, #FF8C00)",
  西餐: "linear-gradient(135deg, #4A6CF7, #9B59B6)",
  日餐: "linear-gradient(135deg, #00C9A7, #2ECC71)",
  早餐: "linear-gradient(135deg, #FFB347, #FF9500)",
  甜品: "linear-gradient(135deg, #FF69B4, #FF1493)",
};

const CATEGORY_COLORS: Record<string, string> = {
  中餐: "#FF6B35",
  西餐: "#7B5EA7",
  日餐: "#1ABC9C",
  早餐: "#FFB347",
  甜品: "#FF69B4",
};

type Recipe = {
  id: string;
  name: string;
  category: "中餐" | "西餐" | "日餐" | "早餐" | "甜品";
  cookTime: number;
  isFavorite: boolean;
};

export default function RecipeGallery() {
  const navigate = useNavigate();
  const { recipes, searchQuery, activeCategory, showFavoritesOnly } =
    useRecipeContext();
  const { setSearch, setCategory, toggleFavoritesFilter, toggleFavorite } =
    useRecipeActions();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe: Recipe) => {
      const matchesSearch = recipe.name
        .toLowerCase()
        .includes(localSearch.toLowerCase());
      const matchesCategory = activeCategory
        ? recipe.category === activeCategory
        : true;
      const matchesFavorite = showFavoritesOnly
        ? recipe.isFavorite
        : true;
      return matchesSearch && matchesCategory && matchesFavorite;
    });
  }, [recipes, localSearch, activeCategory, showFavoritesOnly]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    setSearch(value);
  };

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800 shrink-0">美味食谱</h1>
          <div className="flex-1 max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索菜谱..."
              className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-warm-400 bg-warm-50/50 text-sm outline-none focus:scale-105 focus:shadow-lg focus:ring-warm-400/30 transition-all duration-300"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
            <button
              onClick={toggleFavoritesFilter}
              className="relative w-12 h-6 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: showFavoritesOnly ? "#FFD700" : "#E5E7EB",
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
                style={{
                  transform: showFavoritesOnly
                    ? "translateX(24px)"
                    : "translateX(0)",
                }}
              />
            </button>
            <Heart
              className="w-4 h-4"
              style={{ color: showFavoritesOnly ? "#FFD700" : "#9CA3AF" }}
            />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-8">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(isActive ? null : cat)}
                className="relative px-5 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-300"
                style={
                  isActive
                    ? {
                        backgroundColor: CATEGORY_COLORS[cat],
                        color: "#FFFFFF",
                        fontWeight: 700,
                      }
                    : { backgroundColor: "#F3F4F6", color: "#4B5563" }
                }
              >
                {cat}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full animate-underline-in"
                    style={{
                      width: "60%",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-lg">
            没有找到匹配的菜谱
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe: Recipe, index: number) => (
              <div
                key={recipe.id}
                onClick={() => navigate(`/recipe/${recipe.id}`)}
                className="bg-white border border-gray-200 rounded overflow-hidden cursor-pointer opacity-0 animate-fade-in hover:-translate-y-[5px] hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className="h-[180px] flex items-center justify-center"
                  style={{
                    background: CATEGORY_GRADIENTS[recipe.category],
                  }}
                >
                  <span
                    className="text-white font-bold text-center px-4"
                    style={{
                      fontSize: "20px",
                      textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                  >
                    {recipe.name}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.cookTime}</span>
                    <span>分钟</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(recipe.id);
                    }}
                    className="p-1 transition-transform duration-300"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        recipe.isFavorite
                          ? "text-red-500 fill-red-500 animate-heart-beat"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
