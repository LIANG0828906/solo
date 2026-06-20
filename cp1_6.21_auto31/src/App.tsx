import React, { useState, useEffect, useRef, useCallback } from 'react';
import FarmGrid, { type FarmCell, type CropType, type CropStage, type FarmGridHandle } from './farm/FarmGrid';
import { WeatherSystem, type WeatherState, type WeatherData } from './weather/WeatherSystem';
import InfoPanel from './ui/InfoPanel';

const CROP_NAMES: Record<CropType, string> = {
  tomato: '番茄', carrot: '胡萝卜', wheat: '小麦', corn: '玉米',
};

const CROP_ICONS: Record<CropType, string> = {
  tomato: '🍅', carrot: '🥕', wheat: '🌾', corn: '🌽',
};

const CROP_SELL_PRICE: Record<CropType, number> = {
  tomato: 10, carrot: 8, wheat: 5, corn: 12,
};

const STAGE_ICONS: Record<CropStage, string> = {
  seed: '🟢', sprout: '🌱', flowering: '🌸', mature: '✨',
};

const CROP_LIST: CropType[] = ['tomato', 'carrot', 'wheat', 'corn'];

interface HarvestAnimEntry {
  id: number;
  row: number;
  col: number;
  crop: CropType;
  stage: CropStage;
  startTime: number;
  particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[];
}

function createInitialGrid(): FarmCell[][] {
  const grid: FarmCell[][] = [];
  for (let r = 0; r < 8; r++) {
    const row: FarmCell[] = [];
    for (let c = 0; c < 8; c++) {
      if (Math.random() < 0.35) {
        const crop = CROP_LIST[Math.floor(Math.random() * CROP_LIST.length)];
        const stages: CropStage[] = ['seed', 'sprout', 'flowering', 'mature'];
        const si = Math.floor(Math.random() * 3);
        row.push({
          crop,
          stage: stages[si],
          moisture: 0.3 + Math.random() * 0.4,
          health: 0.8 + Math.random() * 0.2,
          growthProgress: si * 0.25 + Math.random() * 0.2,
        });
      } else {
        row.push({ crop: null, stage: 'seed', moisture: 0.2, health: 1, growthProgress: 0 });
      }
    }
    grid.push(row);
  }
  return grid;
}

function cloneGrid(grid: FarmCell[][]): FarmCell[][] {
  return grid.map(row => row.map(cell => ({ ...cell })));
}

let harvestIdCounter = 0;

export default function App() {
  const [grid, setGrid] = useState<FarmCell[][]>(createInitialGrid);
  const [weatherData, setWeatherData] = useState<WeatherData>(new WeatherSystem().getData());
  const [forecast, setForecast] = useState<WeatherState[]>([]);
  const [stamina, setStamina] = useState(100);
  const [gold, setGold] = useState(50);
  const [inventory, setInventory] = useState<Record<string, number>>({ tomato: 0, carrot: 0, wheat: 0, corn: 0 });
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [harvestAnims, setHarvestAnims] = useState<HarvestAnimEntry[]>([]);
  const [showPlantMenu, setShowPlantMenu] = useState(false);
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);

  const weatherSystemRef = useRef<WeatherSystem>(new WeatherSystem());
  const farmGridRef = useRef<FarmGridHandle>(null);
  const gridRef = useRef(grid);
  const weatherDataRef = useRef(weatherData);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { weatherDataRef.current = weatherData; }, [weatherData]);

  useEffect(() => {
    const ws = weatherSystemRef.current;
    ws.start((data, fc) => {
      setWeatherData(data);
      setForecast(fc);
    });
    return () => ws.stop();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGrid(prev => {
        const next = cloneGrid(prev);
        const wd = weatherDataRef.current;
        let changed = false;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const cell = next[r][c];
            if (!cell.crop) continue;
            if (cell.stage === 'mature') continue;

            if (wd.autoWater) {
              cell.moisture = Math.min(1, cell.moisture + 0.05);
            }
            cell.moisture = Math.max(0, Math.min(1, cell.moisture + wd.moistureDelta));

            if (Math.random() < wd.damageChance) {
              cell.health = Math.max(0.1, cell.health - 0.15);
            }

            const moistureFactor = 0.3 + 0.7 * cell.moisture;
            const healthFactor = cell.health;
            const growth = 0.015 * wd.growthMultiplier * moistureFactor * healthFactor;
            cell.growthProgress = Math.min(1, cell.growthProgress + growth);

            const prevStage = cell.stage;
            if (cell.growthProgress >= 0.75) cell.stage = 'mature';
            else if (cell.growthProgress >= 0.5) cell.stage = 'flowering';
            else if (cell.growthProgress >= 0.25) cell.stage = 'sprout';
            else cell.stage = 'seed';

            if (prevStage !== cell.stage) changed = true;
          }
        }
        return changed || true ? next : prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStamina(s => Math.min(100, s + 1));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHarvestAnims(prev => {
        const now = performance.now();
        return prev.filter(a => now - a.startTime < 600);
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const consumeStamina = useCallback((amount: number): boolean => {
    if (stamina < amount) return false;
    setStamina(s => s - amount);
    return true;
  }, [stamina]);

  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
    setShowPlantMenu(false);
  }, []);

  const handleAction = useCallback((action: 'water' | 'fertilize' | 'harvest') => {
    if (!selectedCell) return;
    if (!consumeStamina(5)) return;

    const { row, col } = selectedCell;

    setGrid(prev => {
      const next = cloneGrid(prev);
      const cell = next[row][col];
      if (!cell.crop) return prev;

      if (action === 'water') {
        cell.moisture = Math.min(1, cell.moisture + 0.3);
      } else if (action === 'fertilize') {
        cell.growthProgress = Math.min(1, cell.growthProgress + 0.1);
        if (cell.growthProgress >= 0.75) cell.stage = 'mature';
        else if (cell.growthProgress >= 0.5) cell.stage = 'flowering';
        else if (cell.growthProgress >= 0.25) cell.stage = 'sprout';
      } else if (action === 'harvest' && cell.stage === 'mature') {
        const crop = cell.crop;
        const sellPrice = CROP_SELL_PRICE[crop] || 5;
        setGold(g => g + sellPrice);
        setInventory(inv => ({ ...inv, [crop]: (inv[crop] || 0) + 1 }));

        const particles = Array.from({ length: 8 }, () => ({
          x: 0, y: 0,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3 - 1,
          life: 0.3 + Math.random() * 0.2,
          color: ['#FF4500', '#FFD700', '#32CD32', '#FF6347'][Math.floor(Math.random() * 4)],
        }));

        setHarvestAnims(prev => [...prev, {
          id: harvestIdCounter++,
          row, col, crop, stage: cell.stage,
          startTime: performance.now(),
          particles,
        }]);

        next[row][col] = { crop: null, stage: 'seed', moisture: 0.2, health: 1, growthProgress: 0 };
        setSelectedCell(null);
      }

      return next;
    });

    setTimeout(() => setPressedBtn(null), 150);
  }, [selectedCell, consumeStamina]);

  const handlePlant = useCallback((crop: CropType) => {
    if (!selectedCell) return;
    if (!consumeStamina(5)) return;

    setGrid(prev => {
      const next = cloneGrid(prev);
      const cell = next[selectedCell.row][selectedCell.col];
      if (cell.crop) return prev;
      next[selectedCell.row][selectedCell.col] = {
        crop,
        stage: 'seed',
        moisture: 0.3,
        health: 1,
        growthProgress: 0,
      };
      return next;
    });

    setSelectedCell(null);
    setShowPlantMenu(false);
  }, [selectedCell, consumeStamina]);

  const handlePlantClick = useCallback(() => {
    if (!selectedCell) return;
    if (!consumeStamina(5)) return;
    setShowPlantMenu(true);
  }, [selectedCell, consumeStamina]);

  const selectedCellData = selectedCell ? grid[selectedCell.row]?.[selectedCell.col] : null;

  const actionPanelPos = (() => {
    if (!selectedCell || !farmGridRef.current) return null;
    const pos = farmGridRef.current.getCellScreenPos(selectedCell.row, selectedCell.col);
    if (!pos) return null;
    return { left: pos.x + pos.size + 8, top: pos.y };
  })();

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: '#1a1a2e', fontFamily: "'Silkscreen', monospace",
      overflow: 'hidden',
    }}>
      <div style={{
        height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#FF4444', fontSize: 18 }}>❤️</span>
          <span style={{ color: '#FF4444', fontSize: 14, fontWeight: 700 }}>{stamina}</span>
          <div style={{
            width: 80, height: 8, background: 'rgba(255,255,255,0.1)',
            borderRadius: 4, overflow: 'hidden', marginLeft: 4,
          }}>
            <div style={{
              width: `${stamina}%`, height: '100%',
              background: stamina > 30 ? '#FF4444' : '#FF0000',
              borderRadius: 4, transition: 'width 0.3s',
            }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{weatherData.icon}</span>
          <span style={{ fontSize: 12, color: '#ccc' }}>{weatherData.label}</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <FarmGrid
            ref={farmGridRef}
            grid={grid}
            weatherData={weatherData}
            onCellClick={handleCellClick}
            harvestAnims={harvestAnims}
          />

          {selectedCell && selectedCellData && actionPanelPos && (
            <div style={{
              position: 'absolute',
              left: Math.min(actionPanelPos.left, window.innerWidth - 180),
              top: Math.max(10, Math.min(actionPanelPos.top, window.innerHeight - 250)),
              background: '#FFFFFF',
              borderRadius: 12,
              padding: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              zIndex: 50,
              minWidth: 150,
              fontFamily: "'Silkscreen', monospace",
            }}>
              {selectedCellData.crop ? (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#333', marginBottom: 4 }}>
                    {CROP_ICONS[selectedCellData.crop]} {CROP_NAMES[selectedCellData.crop]}
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 10 }}>
                    {STAGE_ICONS[selectedCellData.stage]} {selectedCellData.stage === 'seed' ? '种子' : selectedCellData.stage === 'sprout' ? '幼苗' : selectedCellData.stage === 'flowering' ? '开花' : '成熟'}
                  </div>
                  <div style={{ fontSize: 9, color: '#aaa', marginBottom: 8 }}>
                    湿度: {Math.round(selectedCellData.moisture * 100)}% · 健康: {Math.round(selectedCellData.health * 100)}%
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      onClick={() => { setPressedBtn('water'); handleAction('water'); }}
                      onMouseDown={() => setPressedBtn('water')}
                      onMouseUp={() => setPressedBtn(null)}
                      style={{
                        padding: '6px 10px', border: 'none', borderRadius: 8,
                        background: '#4FC3F7', color: '#fff', cursor: 'pointer',
                        fontSize: 11, fontFamily: "'Silkscreen', monospace",
                        transform: pressedBtn === 'water' ? 'scale(0.9)' : 'scale(1)',
                        transition: 'transform 0.15s',
                      }}
                    >💧 浇水 (-5体力)</button>
                    <button
                      onClick={() => { setPressedBtn('fertilize'); handleAction('fertilize'); }}
                      onMouseDown={() => setPressedBtn('fertilize')}
                      onMouseUp={() => setPressedBtn(null)}
                      style={{
                        padding: '6px 10px', border: 'none', borderRadius: 8,
                        background: '#66BB6A', color: '#fff', cursor: 'pointer',
                        fontSize: 11, fontFamily: "'Silkscreen', monospace",
                        transform: pressedBtn === 'fertilize' ? 'scale(0.9)' : 'scale(1)',
                        transition: 'transform 0.15s',
                      }}
                    >🌿 施肥 (-5体力)</button>
                    <button
                      onClick={() => { setPressedBtn('harvest'); handleAction('harvest'); }}
                      onMouseDown={() => setPressedBtn('harvest')}
                      onMouseUp={() => setPressedBtn(null)}
                      disabled={selectedCellData.stage !== 'mature'}
                      style={{
                        padding: '6px 10px', border: 'none', borderRadius: 8,
                        background: selectedCellData.stage === 'mature' ? '#FFA726' : '#ccc',
                        color: '#fff', cursor: selectedCellData.stage === 'mature' ? 'pointer' : 'not-allowed',
                        fontSize: 11, fontFamily: "'Silkscreen', monospace",
                        transform: pressedBtn === 'harvest' ? 'scale(0.9)' : 'scale(1)',
                        transition: 'transform 0.15s',
                        opacity: selectedCellData.stage === 'mature' ? 1 : 0.5,
                      }}
                    >🌾 收获 (-5体力)</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#333', marginBottom: 8 }}>
                    空地
                  </div>
                  {!showPlantMenu ? (
                    <button
                      onClick={handlePlantClick}
                      style={{
                        padding: '6px 10px', border: 'none', borderRadius: 8,
                        background: '#AB47BC', color: '#fff', cursor: 'pointer',
                        fontSize: 11, fontFamily: "'Silkscreen', monospace",
                        width: '100%',
                      }}
                    >🌱 种植 (-5体力)</button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {CROP_LIST.map(crop => (
                        <button
                          key={crop}
                          onClick={() => handlePlant(crop)}
                          style={{
                            padding: '4px 8px', border: 'none', borderRadius: 6,
                            background: '#7E57C2', color: '#fff', cursor: 'pointer',
                            fontSize: 10, fontFamily: "'Silkscreen', monospace",
                            textAlign: 'left',
                          }}
                        >{CROP_ICONS[crop]} {CROP_NAMES[crop]}</button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <button
                onClick={() => { setSelectedCell(null); setShowPlantMenu(false); }}
                style={{
                  position: 'absolute', top: 6, right: 8, border: 'none',
                  background: 'transparent', cursor: 'pointer', fontSize: 14,
                  color: '#999', lineHeight: 1,
                }}
              >✕</button>
            </div>
          )}

          {selectedCell && (
            <div
              onClick={() => { setSelectedCell(null); setShowPlantMenu(false); }}
              style={{ position: 'absolute', inset: 0, zIndex: 40 }}
            />
          )}
        </div>

        <InfoPanel
          weatherData={weatherData}
          forecast={forecast}
          weatherSystem={weatherSystemRef.current}
          gold={gold}
          inventory={inventory}
          stamina={stamina}
        />
      </div>
    </div>
  );
}
