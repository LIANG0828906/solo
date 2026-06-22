import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "../stores/appState";
import { Recipe } from "../engine/recipeEngine";

function StepPanel({
  recipe,
  onClose,
}: {
  recipe: Recipe;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = recipe.steps.length;

  const step = recipe.steps[currentStep];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 420,
        background: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
        zIndex: 100,
        animation: "slideUp 0.4s ease-out",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Noto Sans SC', sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 28px 12px",
          borderBottom: "1px solid #F5F0EB",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#3A2A1A",
            fontFamily: "'Noto Serif SC', serif",
          }}
        >
          🍳 烹饪步骤
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, color: "#8B7355" }}>
            {currentStep + 1} / {totalSteps}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #E0D6C8",
              borderRadius: 8,
              padding: "4px 12px",
              color: "#8B7355",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            关闭
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", padding: "24px 28px", gap: 28, overflow: "hidden" }}>
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: 16,
            background: step?.semiProduct
              ? "linear-gradient(135deg, #C7A87B, #B8875A)"
              : "linear-gradient(135deg, #E8C89A, #D4A373)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: step?.semiProduct ? 48 : 56,
            flexShrink: 0,
            transition: "background 0.5s, font-size 0.5s",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          {step?.semiProduct ? step.semiProduct : recipe.ingredients[0]?.icon || "🍳"}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {currentStep === 0 && (
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                animation: "fadeIn 0.3s ease-out",
              }}
            >
              {recipe.ingredients.map((ing) => (
                <div
                  key={ing.id}
                  style={{
                    background: "#F5F0EB",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 13,
                    color: "#6B4F32",
                  }}
                >
                  {ing.icon} {ing.name} {ing.amount}
                </div>
              ))}
            </div>
          )}

          {step && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                animation: "fadeIn 0.3s ease-out",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#3A2A1A",
                  lineHeight: 1.6,
                  fontFamily: "'Noto Serif SC', serif",
                }}
              >
                {step.description}
              </div>
              {step.semiProduct && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    color: "#8B7355",
                    fontStyle: "italic",
                  }}
                >
                  🔄 当前状态：{step.semiProduct}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              style={{
                padding: "10px 24px",
                background: currentStep === 0 ? "#F5F0EB" : "#FFFFFF",
                border: `1px solid ${currentStep === 0 ? "#E8E0D5" : "#C7A87B"}`,
                borderRadius: 8,
                color: currentStep === 0 ? "#B0A090" : "#8B7355",
                cursor: currentStep === 0 ? "default" : "pointer",
                fontSize: 14,
                fontFamily: "'Noto Sans SC', sans-serif",
              }}
            >
              ← 上一步
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep >= totalSteps - 1}
              style={{
                padding: "10px 24px",
                background:
                  currentStep >= totalSteps - 1
                    ? "#F5F0EB"
                    : "linear-gradient(135deg, #D4A373, #B8875A)",
                border: "none",
                borderRadius: 8,
                color: currentStep >= totalSteps - 1 ? "#B0A090" : "#FFFFFF",
                cursor: currentStep >= totalSteps - 1 ? "default" : "pointer",
                fontSize: 14,
                fontFamily: "'Noto Sans SC', sans-serif",
              }}
            >
              下一步 →
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          height: 4,
          background: "#F5F0EB",
          margin: "0 28px 16px",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, #D4A373, #C7A87B)",
            borderRadius: 2,
            width: `${((currentStep + 1) / totalSteps) * 100}%`,
            transition: "width 0.4s ease-out",
          }}
        />
      </div>
    </div>
  );
}

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipes = useAppStore((s) => s.recipes);
  const unlockedRecipes = useAppStore((s) => s.unlockedRecipes);
  const [showSteps, setShowSteps] = useState(false);
  const [cookHover, setCookHover] = useState(false);

  const recipe = useMemo(() => {
    const found = recipes.find((r) => r.id === id);
    if (found) return found;
    const unlocked = unlockedRecipes.find((ur) => ur.recipe.id === id);
    return unlocked?.recipe;
  }, [id, recipes, unlockedRecipes]);

  if (!recipe) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#FAF8F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          fontFamily: "'Noto Sans SC', sans-serif",
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 16 }}>🍽️</div>
        <div style={{ fontSize: 18, color: "#8B7355", marginBottom: 12 }}>
          菜谱不存在
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "8px 20px",
            background: "linear-gradient(135deg, #D4A373, #B8875A)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

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
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "1px solid #E0D6C8",
              borderRadius: 8,
              padding: "6px 14px",
              color: "#8B7355",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ← 返回
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
            {recipe.name}
          </h1>
        </div>
        <button
          onClick={() => navigate("/recipe-book")}
          style={{
            background: "none",
            border: "1px solid #C7A87B",
            borderRadius: 8,
            padding: "6px 14px",
            color: "#8B7355",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          📖 菜谱本
        </button>
      </header>

      <div style={{ display: "flex", padding: 40, gap: 40, maxWidth: 960, margin: "0 auto" }}>
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: 16,
            background: "linear-gradient(135deg, #E8C89A, #D4A373)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 80,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            flexShrink: 0,
          }}
        >
          {recipe.ingredients[0]?.icon || "🍽️"}
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#3A2A1A",
              fontFamily: "'Noto Serif SC', serif",
              marginBottom: 12,
            }}
          >
            {recipe.name}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  background: "#F5E6D3",
                  borderRadius: 20,
                  padding: "4px 14px",
                  fontSize: 13,
                  color: "#8B7355",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#3A2A1A",
              marginBottom: 12,
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            📋 食材清单
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
            {recipe.ingredients.map((ing) => (
              <div
                key={ing.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 16px",
                  background: "#FFFFFF",
                  borderRadius: 10,
                  border: "1px solid #F5F0EB",
                }}
              >
                <span style={{ fontSize: 15, color: "#6B4F32", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{ing.icon}</span>
                  {ing.name}
                </span>
                <span style={{ fontSize: 14, color: "#8B7355", fontWeight: 500 }}>{ing.amount}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#3A2A1A",
              marginBottom: 12,
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            👨‍🍳 烹饪步骤预览
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 28 }}>
            {recipe.steps.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  fontSize: 14,
                  color: "#6B4F32",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#F5E6D3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: "#8B7355",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                {s.description}
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowSteps(true)}
            onMouseEnter={() => setCookHover(true)}
            onMouseLeave={() => setCookHover(false)}
            style={{
              padding: "14px 32px",
              background: "linear-gradient(135deg, #D4A373, #B8875A)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 600,
              filter: cookHover ? "brightness(1.2)" : "brightness(1)",
              transition: "filter 0.2s",
              fontFamily: "'Noto Sans SC', sans-serif",
              boxShadow: "0 4px 16px rgba(212,163,115,0.3)",
            }}
          >
            🍳 开始烹饪
          </button>
        </div>
      </div>

      {showSteps && <StepPanel recipe={recipe} onClose={() => setShowSteps(false)} />}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
