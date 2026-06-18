import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../stores/appState";
import { Recipe } from "../engine/recipeEngine";

function RecipeCard({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 240,
        height: 320,
        background: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
      }}
    >
      <div
        style={{
          height: 160,
          background: "linear-gradient(135deg, #E8C89A, #D4A373)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 56,
        }}
      >
        {recipe.ingredients[0]?.icon || "🍽️"}
      </div>
      <div style={{ padding: "16px 16px 12px" }}>
        <div
          style={{
            fontSize: 22,
            color: "#3A2A1A",
            fontWeight: 600,
            textAlign: "center",
            fontFamily: "'Noto Serif SC', serif",
            marginBottom: 8,
          }}
        >
          {recipe.name}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: "#F5E6D3",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 13,
                color: "#8B7355",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineView({
  unlockedRecipes,
  onNavigate,
}: {
  unlockedRecipes: Array<{ recipe: Recipe; unlockedAt: number }>;
  onNavigate: (id: string) => void;
}) {
  const sorted = [...unlockedRecipes].sort((a, b) => a.unlockedAt - b.unlockedAt);

  return (
    <div style={{ position: "relative", padding: "32px 0 32px 60px" }}>
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 0,
          bottom: 0,
          width: 2,
          background: "linear-gradient(to bottom, #D4A373, #C7A87B, #E8E0D5)",
        }}
      />
      {sorted.map(({ recipe, unlockedAt }, idx) => (
        <div
          key={recipe.id}
          style={{
            position: "relative",
            marginBottom: 28,
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            opacity: 0,
            animation: `fadeSlideIn 0.4s ease-out ${idx * 0.08}s forwards`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -28,
              top: 20,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#D4A373",
              border: "3px solid #FAF8F5",
              boxShadow: "0 0 0 2px #D4A373",
            }}
          />
          <div
            onClick={() => onNavigate(recipe.id)}
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              gap: 16,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              transition: "box-shadow 0.2s, transform 0.2s",
              flex: 1,
              maxWidth: 480,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
              e.currentTarget.style.transform = "translateX(4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 10,
                background: "linear-gradient(135deg, #E8C89A, #D4A373)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                flexShrink: 0,
              }}
            >
              {recipe.ingredients[0]?.icon || "🍽️"}
            </div>
            <div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#3A2A1A",
                  fontFamily: "'Noto Serif SC', serif",
                  marginBottom: 4,
                }}
              >
                {recipe.name}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: "#F5E6D3",
                      borderRadius: 20,
                      padding: "2px 8px",
                      fontSize: 11,
                      color: "#8B7355",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#B0A090" }}>
                {new Date(unlockedAt).toLocaleString("zh-CN")}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecipeBook() {
  const navigate = useNavigate();
  const unlockedRecipes = useAppStore((s) => s.unlockedRecipes);
  const [viewMode, setViewMode] = useState<"gallery" | "timeline">("gallery");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF8F5",
        fontFamily: "'Noto Sans SC', sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 32px",
          borderBottom: "1px solid #E8E0D5",
          background: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "1px solid #E0D6C8",
              borderRadius: 8,
              padding: "6px 14px",
              color: "#8B7355",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            ← 返回工作台
          </button>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#3A2A1A",
              fontFamily: "'Noto Serif SC', serif",
              margin: 0,
            }}
          >
            📖 我的菜谱本
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            background: "#F5F0EB",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setViewMode("gallery")}
            style={{
              padding: "6px 16px",
              background: viewMode === "gallery" ? "#D4A373" : "transparent",
              color: viewMode === "gallery" ? "#FFFFFF" : "#8B7355",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              transition: "background 0.2s, color 0.2s",
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            画廊视图
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            style={{
              padding: "6px 16px",
              background: viewMode === "timeline" ? "#D4A373" : "transparent",
              color: viewMode === "timeline" ? "#FFFFFF" : "#8B7355",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              transition: "background 0.2s, color 0.2s",
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            时间轴
          </button>
        </div>
      </header>

      <div style={{ padding: 32 }}>
        {unlockedRecipes.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "#B0A090",
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔬</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: "#8B7355", marginBottom: 8 }}>
              还没有解锁任何菜谱
            </div>
            <div style={{ fontSize: 14 }}>前往工作台拖拽组合食材来发现新菜谱吧</div>
            <button
              onClick={() => navigate("/")}
              style={{
                marginTop: 20,
                padding: "10px 24px",
                background: "linear-gradient(135deg, #D4A373, #B8875A)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "'Noto Sans SC', sans-serif",
              }}
            >
              去探索 →
            </button>
          </div>
        ) : viewMode === "gallery" ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            {unlockedRecipes.map(({ recipe }) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => navigate(`/recipe/${recipe.id}`)}
              />
            ))}
          </div>
        ) : (
          <TimelineView
            unlockedRecipes={unlockedRecipes}
            onNavigate={(id) => navigate(`/recipe/${id}`)}
          />
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
