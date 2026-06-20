import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRecipeStore } from './recipe/recipeStore';
import { MaterialType, MATERIAL_CONFIG } from './types';
import RadarChart from './render/RadarChart';
import PropertyCards from './render/PropertyCards';

const App: React.FC = () => {
  const { ratios, properties, favorites, setRatio, addFavorite, loadRecipe } =
    useRecipeStore();
  const [starAnim, setStarAnim] = useState(false);
  const [ratioPcts, setRatioPcts] = useState<Record<string, string>>({});

  const total = ratios.reduce((s, r) => s + r.value, 0);

  useEffect(() => {
    const pcts: Record<string, string> = {};
    for (const r of ratios) {
      pcts[r.material] = total > 0 ? ((r.value / total) * 100).toFixed(1) : '0.0';
    }
    setRatioPcts(pcts);
  }, [ratios, total]);

  const handleFavorite = useCallback(() => {
    setStarAnim(true);
    addFavorite();
    setTimeout(() => setStarAnim(false), 200);
  }, [addFavorite]);

  const handleLoadFavorite = useCallback(
    (ratios: typeof ratios) => {
      loadRecipe(ratios);
    },
    [loadRecipe]
  );

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#0D0D1A',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 320,
          minWidth: 320,
          background: '#1E1E2E',
          borderRadius: 16,
          border: '1px solid #2D2D44',
          margin: 16,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>配方面板</h2>
          <button
            onClick={handleFavorite}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: favorites.length > 0 ? '#F1C40F' : '#4A4A5A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              transform: starAnim ? 'scale(1.3)' : 'scale(1)',
              transition: 'transform 0.2s ease-out, background 0.2s',
            }}
          >
            ★
          </button>
        </div>

        {ratios.map((r) => {
          const cfg = MATERIAL_CONFIG[r.material];
          return (
            <div key={r.material}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                  fontSize: 14,
                }}
              >
                <span style={{ color: cfg.color }}>{cfg.label}</span>
                <span style={{ opacity: 0.7 }}>
                  {ratioPcts[r.material] ?? '0.0'}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={r.value}
                onChange={(e) =>
                  setRatio(r.material, Number(e.target.value))
                }
                style={{
                  width: '100%',
                  accentColor: cfg.color,
                  height: 6,
                  cursor: 'pointer',
                }}
              />
            </div>
          );
        })}

        <button
          onClick={() => useRecipeStore.getState().resetRatios()}
          style={{
            marginTop: 8,
            padding: '10px 0',
            borderRadius: 8,
            border: '1px solid #3D3D55',
            background: '#2A2A40',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          重置配比
        </button>

        {favorites.length > 0 && (
          <div
            style={{
              marginTop: 12,
              borderTop: '1px solid #2D2D44',
              paddingTop: 12,
            }}
          >
            <h3 style={{ fontSize: 14, marginBottom: 10, opacity: 0.8 }}>
              收藏列表
            </h3>
            <div
              style={{
                maxHeight: 260,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  onClick={() => handleLoadFavorite(fav.ratios)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: '#2A2A40',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      '#3D3D55';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      '#2A2A40';
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      background: `linear-gradient(135deg, ${MATERIAL_CONFIG[MaterialType.Wood].color}33, ${MATERIAL_CONFIG[MaterialType.Metal].color}33, ${MATERIAL_CONFIG[MaterialType.Ceramic].color}33, ${MATERIAL_CONFIG[MaterialType.Plastic].color}33)`,
                      border: '1px solid #3D3D55',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ fontSize: 13 }}>
                    {fav.name}
                    <span style={{ opacity: 0.5, marginLeft: 6, fontSize: 11 }}>
                      {fav.ratios
                        .map(
                          (r) =>
                            `${MATERIAL_CONFIG[r.material].label[0]}${
                              total > 0
                                ? ((r.value / fav.ratios.reduce((s, x) => s + x.value, 0)) * 100).toFixed(0)
                                : 0
                            }%`
                        )
                        .join(' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          overflowY: 'auto',
        }}
      >
        <RadarChart properties={properties} size={500} />
        <PropertyCards properties={properties} />
      </div>
    </div>
  );
};

export default App;
