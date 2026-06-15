import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { Clock, Heart, MessageCircle } from "lucide-react";
import type { Recipe } from "../../../shared/types";

function formatRelativeTime(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}

function getDifficultyColor(diff: string) {
  if (diff === "简单") return "bg-diff-easy";
  if (diff === "中等") return "bg-diff-medium";
  return "bg-diff-hard";
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300 group"
      style={{ backgroundColor: "#fdf5e6" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/recipe/${recipe.id}`)}
    >
      <div className="relative overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-48 sm:h-56 object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <span
          className={`absolute top-3 right-3 px-3 py-1 rounded-full text-white text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}
        >
          {recipe.difficulty}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2" style={{ color: "#3e2723" }}>
          {recipe.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Clock size={14} />
          <span>{recipe.totalTime}</span>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between text-sm"
        style={{
          backgroundColor: hovered ? "rgba(255,248,225,0.3)" : "transparent",
          transform: hovered ? "translateY(0)" : "translateY(20px)",
          opacity: hovered ? 1 : 0,
          transition: "all 0.3s ease-out",
        }}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1" style={{ color: "#3e2723" }}>
            <Heart size={14} fill="#ff1744" stroke="#ff1744" />
            {recipe.likes}
          </span>
          <span className="flex items-center gap-1" style={{ color: "#3e2723" }}>
            <MessageCircle size={14} />
            {recipe.comments}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {formatRelativeTime(recipe.createdAt)}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const { recipes, fetchRecipes, loading } = useStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const leftCol = filtered.filter((_, i) => i % 2 === 0);
  const rightCol = filtered.filter((_, i) => i % 2 !== 0);

  return (
    <div className="min-h-screen pb-12">
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{ backgroundColor: "rgba(255,248,225,0.85)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif", color: "#3e2723" }}
            >
              烘焙配比
            </h1>
            <span className="text-sm text-gray-500">智能食谱分享</span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="搜索食谱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-transparent focus:border-warm-orange outline-none transition-colors duration-200"
              style={{ backgroundColor: "#fdf5e6" }}
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400">
          加载中...
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-4">
              {leftCol.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
            <div className="flex flex-col gap-4">
              {rightCol.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              没有找到匹配的食谱
            </div>
          )}
        </div>
      )}
    </div>
  );
}
