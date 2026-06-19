import { memo, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, DragStartEvent } from '@dnd-kit/core';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BarShelf } from './components/BarShelf';
import { MixingArea } from './components/MixingArea';
import { useCartStore } from './stores/cartStore';
import { Recipe, BottleData } from './types';

const ALL_BOTTLES: BottleData[] = [
  { id: 'whiskey', name: '波本威士忌', color: '#d4a574', abv: 40, type: 'base', labelColor: '#f4d03f' },
  { id: 'vodka', name: '伏特加', color: '#e8e8e8', abv: 40, type: 'base', labelColor: '#3498db' },
  { id: 'gin', name: '金酒', color: '#d5f5e3', abv: 37.5, type: 'base', labelColor: '#27ae60' },
  { id: 'rum', name: '朗姆酒', color: '#f5cba7', abv: 38, type: 'base', labelColor: '#e67e22' },
  { id: 'tequila', name: '龙舌兰', color: '#f9e79f', abv: 38, type: 'base', labelColor: '#f1c40f' },
  { id: 'mint', name: '薄荷酒', color: '#82e0aa', abv: 25, type: 'mixer', labelColor: '#1abc9c' },
  { id: 'bitters', name: '安格斯特拉苦精', color: '#7b241c', abv: 44.7, type: 'mixer', labelColor: '#922b21' },
  { id: 'vermouth', name: '味美思', color: '#a93226', abv: 18, type: 'mixer', labelColor: '#c0392b' },
  { id: 'triple-sec', name: '橙味力娇酒', color: '#f9e79f', abv: 30, type: 'mixer', labelColor: '#f39c12' },
  { id: 'lime-juice', name: '青柠汁', color: '#abebc6', abv: 0, type: 'mixer', labelColor: '#2ecc71' },
  { id: 'simple-syrup', name: '糖浆', color: '#fef9e7', abv: 0, type: 'mixer', labelColor: '#f7dc6f' },
  { id: 'cola', name: '可乐', color: '#4a235a', abv: 0, type: 'mixer', labelColor: '#884ea0' },
  { id: 'lemon', name: '柠檬片', color: '#f7dc6f', abv: 0, type: 'garnish' },
  { id: 'olive', name: '橄榄', color: '#1e8449', abv: 0, type: 'garnish' },
  { id: 'cherry', name: '樱桃', color: '#e74c3c', abv: 0, type: 'garnish' },
  { id: 'straw', name: '吸管', color: '#f1948a', abv: 0, type: 'garnish' },
  { id: 'mint-leaf', name: '薄荷叶', color: '#27ae60', abv: 0, type: 'garnish' },
];

const DEFAULT_RECIPE: Recipe = {
  id: 'whiskey-sour',
  name: '威士忌酸',
  description: '经典威士忌鸡尾酒，酸甜平衡，口感清爽',
  glassType: '古典杯',
  ingredients: [
    { id: 'whiskey', name: '波本威士忌', type: 'base', color: '#d4a574', abv: 40, amount: 60, unit: 'ml', labelColor: '#f4d03f' },
    { id: 'lime-juice', name: '青柠汁', type: 'mixer', color: '#abebc6', abv: 0, amount: 30, unit: 'ml', labelColor: '#2ecc71' },
    { id: 'simple-syrup', name: '糖浆', type: 'mixer', color: '#fef9e7', abv: 0, amount: 20, unit: 'ml', labelColor: '#f7dc6f' },
    { id: 'bitters', name: '安格斯特拉苦精', type: 'mixer', color: '#7b241c', abv: 44.7, amount: 2, unit: 'dash', labelColor: '#922b21' },
    { id: 'cherry', name: '樱桃', type: 'garnish', color: '#e74c3c', abv: 0, amount: 1, unit: '颗' },
    { id: 'lemon', name: '柠檬片', type: 'garnish', color: '#f7dc6f', abv: 0, amount: 1, unit: '片' },
  ],
  steps: [
    '将波本威士忌倒入调酒壶',
    '加入青柠汁和糖浆',
    '加入安格斯特拉苦精',
    '加入冰块摇匀',
    '过滤倒入古典杯',
    '用樱桃和柠檬片装饰'
  ],
  standardOrder: ['whiskey', 'lime-juice', 'simple-syrup', 'bitters', 'cherry', 'lemon']
};

const OrderPanel = memo(function OrderPanel() {
  const { currentRecipe, completedIngredients } = useCartStore();
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const lastAnimIdRef = useRef<string | null>(null);

  useEffect(() => {
    completedIngredients.forEach((id) => {
      if (lastAnimIdRef.current !== id) {
        lastAnimIdRef.current = id;
        setAnimatingId(id);
        const timer = window.setTimeout(() => setAnimatingId(null), 1000);
        return () => window.clearTimeout(timer);
      }
    });
  }, [completedIngredients]);

  const ingredientList = useMemo(() => {
    if (!currentRecipe) return [];
    return currentRecipe.ingredients;
  }, [currentRecipe]);

  const stepList = useMemo(() => {
    if (!currentRecipe) return [];
    return currentRecipe.steps;
  }, [currentRecipe]);

  if (!currentRecipe) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        加载订单中...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 bg-gradient-to-r from-amber-900/60 via-amber-800/40 to-amber-900/60 border-b border-yellow-500/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-yellow-500/70 uppercase tracking-widest mb-1">当前订单</div>
            <h2
              className="text-2xl font-bold text-yellow-400 tracking-wide"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {currentRecipe.name}
            </h2>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">杯具</div>
            <div className="text-sm text-gray-300">{currentRecipe.glassType}</div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{currentRecipe.description}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: 'thin' }}>
        <div className="text-xs text-yellow-500/70 uppercase tracking-wider mb-3">所需材料</div>
        <div className="space-y-2">
          {ingredientList.map((ingredient) => {
            const isComplete = completedIngredients.has(ingredient.id);
            const isAnimating = animatingId === ingredient.id;

            return (
              <div
                key={ingredient.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  isComplete
                    ? 'bg-green-900/30 border border-green-500/30'
                    : 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800/70'
                } ${isAnimating ? 'animate-green-flash' : ''}`}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 border-2"
                  style={{
                    backgroundColor: isComplete ? 'transparent' : ingredient.color,
                    borderColor: isComplete ? '#22c55e' : 'transparent',
                    opacity: isComplete ? 0.5 : 1
                  }}
                >
                  {isComplete && (
                    <svg className="w-full h-full text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isComplete ? 'text-green-400 line-through' : 'text-gray-200'}`}>
                    {ingredient.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ingredient.amount} {ingredient.unit}
                    {ingredient.abv > 0 && ` · ${ingredient.abv}% ABV`}
                  </div>
                </div>

                <div className={`text-xs px-2 py-1 rounded ${
                  ingredient.type === 'base' ? 'bg-amber-900/50 text-amber-400' :
                  ingredient.type === 'mixer' ? 'bg-blue-900/50 text-blue-400' :
                  'bg-emerald-900/50 text-emerald-400'
                }`}>
                  {ingredient.type === 'base' ? '基酒' : ingredient.type === 'mixer' ? '辅料' : '装饰'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="text-xs text-yellow-500/70 uppercase tracking-wider mb-3">调制步骤</div>
          <ol className="space-y-2">
            {stepList.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm text-gray-400">
                <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs flex-shrink-0">
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <style>{`
        @keyframes green-flash {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
          50% { box-shadow: 0 0 20px 5px rgba(34, 197, 94, 0.5); }
        }
        .animate-green-flash {
          animation: green-flash 1s ease-in-out;
        }
      `}</style>
    </div>
  );
});

interface DragOverlayContentProps {
  activeId: string | null;
}

const DragOverlayContent = memo(function DragOverlayContent({ activeId }: DragOverlayContentProps) {
  if (!activeId) return null;

  const bottle = useMemo(() => ALL_BOTTLES.find(b => b.id === activeId), [activeId]);
  if (!bottle) return null;

  const isGarnish = bottle.type === 'garnish';

  return (
    <div style={{ transform: 'scale(0.8)', pointerEvents: 'none', filter: 'drop-shadow(0 8px 16px rgba(244,208,63,0.4))' }}>
      {isGarnish ? (
        <GarnishSVG name={bottle.id} color={bottle.color} />
      ) : (
        <BottleSVG color={bottle.color} labelColor={bottle.labelColor || '#f4d03f'} />
      )}
    </div>
  );
});

const BottleSVG = memo(function BottleSVG({ color, labelColor }: { color: string; labelColor: string }) {
  return (
    <svg width="40" height="70" viewBox="0 0 40 70" className="drop-shadow-2xl">
      <defs>
        <linearGradient id={`overlayBottle-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <path d="M15 0 L25 0 L25 10 L27 15 L27 55 Q27 65 20 65 Q13 65 13 55 L13 15 L15 10 Z"
            fill={`url(#overlayBottle-${color})`} stroke="#2c1810" strokeWidth="1" />
      <rect x="13" y="10" width="14" height="5" fill="#3d2817" rx="1" />
      <rect x="14" y="40" width="12" height="18" fill={labelColor} rx="1" />
      <rect x="15" y="41" width="10" height="16" fill="none" stroke="#8b6914" strokeWidth="0.5" rx="0.5" />
    </svg>
  );
});

const GarnishSVG = memo(function GarnishSVG({ name, color }: { name: string; color: string }) {
  if (name === 'lemon') {
    return (
      <svg width="45" height="45" viewBox="0 0 45 45">
        <circle cx="22.5" cy="22.5" r="18" fill={color} fillOpacity="0.65" stroke="#d4ac0d" strokeWidth="1" />
        <circle cx="22.5" cy="22.5" r="10" fill="none" stroke="#d4ac0d" strokeWidth="1" />
      </svg>
    );
  }
  if (name === 'cherry') {
    return (
      <svg width="40" height="50" viewBox="0 0 40 50">
        <circle cx="15" cy="35" r="10" fill={color} stroke="#922b21" strokeWidth="1" />
        <circle cx="28" cy="38" r="9" fill={color} stroke="#922b21" strokeWidth="1" />
        <path d="M15 25 Q18 15 20 10 Q22 8 25 10 Q27 15 28 25" fill="none" stroke="#27ae60" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="15" fill={color} />
    </svg>
  );
});

const Timer = memo(function Timer() {
  const { startTime } = useCartStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const updateTimer = () => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    };
    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(timer);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg border border-yellow-500/20">
      <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <polyline points="12 6 12 12 16 14" strokeWidth="2" />
      </svg>
      <span className="text-yellow-400 font-mono text-lg tabular-nums">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
});

function BarPage() {
  const { setCurrentRecipe, setStartTime } = useCartStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    setCurrentRecipe(DEFAULT_RECIPE);
    setStartTime(Date.now());
    setLoading(false);
  }, [setCurrentRecipe, setStartTime]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const now = Date.now();
    if (now - debounceRef.current < 30) return;
    debounceRef.current = now;
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((_event: DragEndEvent) => {
    setActiveId(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e2a35' }}>
        <div className="text-yellow-400 text-xl animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        className="min-h-screen flex flex-col"
        style={{
          backgroundColor: '#1e2a35',
          backgroundImage: `
            radial-gradient(ellipse at 50% 0%, rgba(255, 193, 7, 0.15) 0%, transparent 50%),
            linear-gradient(180deg, #1e2a35 0%, #151d25 100%)
          `
        }}
      >
        <header className="h-16 border-b border-yellow-500/20 flex items-center justify-between px-6 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <span className="text-xl">🍸</span>
            </div>
            <div>
              <h1
                className="text-xl font-bold text-yellow-400 tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                虚拟调酒师
              </h1>
              <p className="text-xs text-gray-500">技能训练平台</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Timer />
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              营业中
            </div>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          <aside className="w-72 border-r border-yellow-500/10 flex-shrink-0" style={{ backgroundColor: 'rgba(26, 15, 10, 0.6)' }}>
            <OrderPanel />
          </aside>

          <section
            className="flex-1 relative"
            style={{
              background: `
                linear-gradient(180deg, rgba(74, 44, 26, 0.3) 0%, rgba(74, 44, 26, 0.1) 100%),
                repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(0,0,0,0.1) 50px, rgba(0,0,0,0.1) 51px),
                repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.1) 50px, rgba(0,0,0,0.1) 51px)
              `,
              backgroundColor: '#3d2817'
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% 100%, rgba(255, 193, 7, 0.1) 0%, transparent 60%)'
              }}
            />

            <div
              className="absolute bottom-0 left-0 right-0 h-3/4 rounded-t-3xl mx-8"
              style={{
                background: `
                  linear-gradient(180deg, #5c3d2e 0%, #4a2c1a 50%, #3d2417 100%)
                `,
                boxShadow: `
                  inset 0 2px 4px rgba(255, 215, 0, 0.1),
                  0 -4px 20px rgba(0, 0, 0, 0.5)
                `
              }}
            >
              <div
                className="absolute inset-0 rounded-t-3xl opacity-30"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 2px,
                      rgba(0, 0, 0, 0.1) 2px,
                      rgba(0, 0, 0, 0.1) 4px
                    )
                  `
                }}
              />
            </div>

            <div className="relative h-full flex">
              <div className="w-64 border-r border-yellow-500/10 h-full">
                <BarShelf />
              </div>

              <div className="flex-1 h-full">
                <MixingArea />
              </div>
            </div>
          </section>
        </main>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        <DragOverlayContent activeId={activeId} />
      </DragOverlay>
    </DndContext>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BarPage />} />
      </Routes>
    </Router>
  );
}

export default memo(App);
