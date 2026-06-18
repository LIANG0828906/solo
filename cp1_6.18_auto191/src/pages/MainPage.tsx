import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../stores/appState";
import { Ingredient, Recipe } from "../engine/recipeEngine";

const CATEGORY_COLORS: Record<string, string> = {
  staple: "#D4A373",
  vegetable: "#8CB369",
  meat: "#A52A2A",
  seasoning: "#DAA520",
};

const CATEGORY_LABELS: Record<string, string> = {
  staple: "主食",
  vegetable: "蔬菜",
  meat: "肉类",
  seasoning: "调料",
};

function ParticleCanvas({ active, onDone }: { active: boolean; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const particles: Array<{ angle: number; speed: number; size: number }> = [];

    for (let i = 0; i < 36; i++) {
      particles.push({
        angle: (Math.PI * 2 * i) / 36 + (Math.random() - 0.5) * 0.3,
        speed: 0.7 + Math.random() * 0.6,
        size: 3 + Math.random() * 4,
      });
    }

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxR = 100;
    const dur = 800;
    let t0: number | null = null;
    let aid: number;

    function tick(ts: number) {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const pt of particles) {
        const d = maxR * p * pt.speed;
        const x = cx + Math.cos(pt.angle) * d;
        const y = cy + Math.sin(pt.angle) * d;
        const op = 1 - p;
        const r = pt.size * (1 - p * 0.5);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(218,165,32,${op})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(218,165,32,${op * 0.25})`;
        ctx.fill();
      }

      if (p < 1) {
        aid = requestAnimationFrame(tick);
      } else {
        onDone();
      }
    }

    aid = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(aid);
  }, [active, onDone]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={500}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 10 }}
    />
  );
}

function DiscoveredCard({ recipe, onDismiss }: { recipe: Recipe; onDismiss: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        background: "#FFFFFF",
        borderRadius: 16,
        padding: "20px 32px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        textAlign: "center",
        animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
      <div
        style={{
          fontSize: 22,
          color: "#3A2A1A",
          fontWeight: 700,
          fontFamily: "'Noto Serif SC', serif",
        }}
      >
        {recipe.name}
      </div>
      <div style={{ fontSize: 13, color: "#8B7355", marginTop: 4 }}>
        {recipe.tags.join(" · ")}
      </div>
      <button
        onClick={onDismiss}
        style={{
          marginTop: 12,
          padding: "8px 24px",
          background: "linear-gradient(135deg, #D4A373, #B8875A)",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        收入菜谱本
      </button>
    </div>
  );
}

function SearchBox() {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const searchResults = useAppStore((s) => s.searchResults);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        placeholder="搜索食材或菜名..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        style={{
          width: 260,
          height: 40,
          background: "#FAFAFA",
          borderRadius: 20,
          border: focused ? "2px solid #C7A87B" : "1px solid #E0D6C8",
          padding: "0 16px",
          fontSize: 14,
          color: "#3A2A1A",
          outline: "none",
          transition: "border 0.2s",
          fontFamily: "'Noto Sans SC', sans-serif",
        }}
      />
      {focused && searchResults.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 0,
            width: 300,
            background: "#FFFFFF",
            borderRadius: 12,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            zIndex: 100,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {searchResults.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => {
                setSearchQuery("");
                navigate(`/recipe/${recipe.id}`);
              }}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: "1px solid #F5F0EB",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F0EB")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ fontSize: 15, color: "#3A2A1A", fontWeight: 500 }}>
                <HighlightText text={recipe.name} query={searchQuery} />
              </div>
              <div style={{ fontSize: 12, color: "#8B7355", marginTop: 2 }}>
                {recipe.ingredients.map((i) => i.name).join("、")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: "#D4A373", fontWeight: 600 }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("ingredientId", ingredient.id);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        width: 120,
        background: "#FAF8F5",
        borderRadius: 12,
        border: "1px solid #E8E0D5",
        padding: "12px 8px",
        textAlign: "center",
        cursor: "grab",
        position: "relative",
        overflow: "hidden",
        transition:
          "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(199,168,123,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: CATEGORY_COLORS[ingredient.category],
        }}
      />
      <div style={{ fontSize: 28, marginBottom: 4 }}>{ingredient.icon}</div>
      <div style={{ fontSize: 13, color: "#3A2A1A", fontWeight: 500 }}>{ingredient.name}</div>
    </div>
  );
}

export default function MainPage() {
  const navigate = useNavigate();
  const ingredients = useAppStore((s) => s.ingredients);
  const workbenchItems = useAppStore((s) => s.workbenchItems);
  const unlockedRecipes = useAppStore((s) => s.unlockedRecipes);
  const discoveredRecipe = useAppStore((s) => s.discoveredRecipe);
  const showParticle = useAppStore((s) => s.showParticleAnimation);
  const addToWorkbench = useAppStore((s) => s.addToWorkbench);
  const removeFromWorkbench = useAppStore((s) => s.removeFromWorkbench);
  const clearWorkbench = useAppStore((s) => s.clearWorkbench);
  const dismissDiscovery = useAppStore((s) => s.dismissDiscovery);

  const workbenchRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [bounceId, setBounceId] = useState<string | null>(null);
  const [particleActive, setParticleActive] = useState(false);

  useEffect(() => {
    if (showParticle && !particleActive) setParticleActive(true);
  }, [showParticle, particleActive]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const ingId = e.dataTransfer.getData("ingredientId");
      const ing = ingredients.find((i) => i.id === ingId);
      if (!ing || !workbenchRef.current) return;
      const rect = workbenchRef.current.getBoundingClientRect();
      let x = Math.round((e.clientX - rect.left - 60) / 20) * 20;
      let y = Math.round((e.clientY - rect.top - 40) / 20) * 20;
      addToWorkbench(ing, x, y);
      const latest = useAppStore.getState().workbenchItems;
      const newItem = latest[latest.length - 1];
      if (newItem) {
        setBounceId(newItem.id);
        setTimeout(() => setBounceId(null), 300);
      }
    },
    [ingredients, addToWorkbench]
  );

  const grouped = useMemo(() => {
    const g: Record<string, Ingredient[]> = {};
    for (const ing of ingredients) {
      if (!g[ing.category]) g[ing.category] = [];
      g[ing.category].push(ing);
    }
    return g;
  }, [ingredients]);

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
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#3A2A1A",
              fontFamily: "'Noto Serif SC', serif",
              margin: 0,
            }}
          >
            🧪 配方炼金术
          </h1>
          <button
            onClick={() => navigate("/recipe-book")}
            style={{
              padding: "6px 16px",
              background: "transparent",
              border: "1px solid #C7A87B",
              borderRadius: 8,
              color: "#8B7355",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            📖 我的菜谱本 ({unlockedRecipes.length})
          </button>
        </div>
        <SearchBox />
      </header>

      <div style={{ display: "flex", padding: 24, gap: 24 }}>
        <div
          style={{
            width: 280,
            flexShrink: 0,
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
            paddingRight: 8,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#3A2A1A",
              marginBottom: 16,
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            📦 食材库
          </div>

          {(Object.entries(grouped) as [string, Ingredient[]][]).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: CATEGORY_COLORS[cat],
                  marginBottom: 8,
                  paddingLeft: 12,
                  borderLeft: `3px solid ${CATEGORY_COLORS[cat]}`,
                }}
              >
                {CATEGORY_LABELS[cat]}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {items.map((ing) => (
                  <IngredientCard key={ing.id} ingredient={ing} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#3A2A1A",
              marginBottom: 12,
              fontFamily: "'Noto Serif SC', serif",
              alignSelf: "flex-start",
            }}
          >
            ⚗️ 炼金工作台
          </div>

          <div
            ref={workbenchRef}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            style={{
              width: 600,
              height: 500,
              background: dragOver ? "#F0EBE4" : "#F5F0EB",
              border: dragOver ? "2px dashed #D4A373" : "2px dashed #C7A87B",
              borderRadius: 16,
              position: "relative",
              transition: "background 0.2s, border-color 0.2s",
            }}
          >
            {workbenchItems.length === 0 && !discoveredRecipe && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#B0A090",
                  fontSize: 15,
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>🫙</div>
                将食材拖放到这里组合
              </div>
            )}

            {workbenchItems.map((item) => (
              <div
                key={item.id}
                style={{
                  position: "absolute",
                  left: item.x,
                  top: item.y,
                  background: "#FFFFFF",
                  borderRadius: 12,
                  border: "1px solid #E8E0D5",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  animation: bounceId === item.id ? "wbBounce 0.3s cubic-bezier(0.34,1.56,0.64,1)" : undefined,
                  zIndex: 5,
                }}
              >
                <div
                  style={{
                    width: 3,
                    height: 28,
                    borderRadius: 2,
                    background: CATEGORY_COLORS[item.ingredient.category],
                  }}
                />
                <span style={{ fontSize: 20 }}>{item.ingredient.icon}</span>
                <span style={{ fontSize: 13, color: "#3A2A1A", fontWeight: 500 }}>
                  {item.ingredient.name}
                </span>
                <button
                  onClick={() => removeFromWorkbench(item.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#B0A090",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: 0,
                    marginLeft: 4,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            {workbenchItems.length > 0 && (
              <button
                onClick={clearWorkbench}
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  padding: "6px 12px",
                  background: "rgba(199,168,123,0.15)",
                  border: "1px solid #C7A87B",
                  borderRadius: 6,
                  color: "#8B7355",
                  cursor: "pointer",
                  fontSize: 12,
                  zIndex: 15,
                  fontFamily: "'Noto Sans SC', sans-serif",
                }}
              >
                清空工作台
              </button>
            )}

            <ParticleCanvas
              active={particleActive}
              onDone={() => setParticleActive(false)}
            />

            {discoveredRecipe && (
              <DiscoveredCard recipe={discoveredRecipe} onDismiss={dismissDiscovery} />
            )}
          </div>

          {workbenchItems.length > 0 && workbenchItems.length < 3 && (
            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                color: "#B0A090",
                fontFamily: "'Noto Sans SC', sans-serif",
              }}
            >
              💡 试试组合3种食材发现新菜谱
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes wbBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes popIn {
          0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
