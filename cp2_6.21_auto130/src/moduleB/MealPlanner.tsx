import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, X, ShoppingCart, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/state/appStore';
import type { Recipe, MealSlot, WeekDay } from '@/state/appStore';
import { cn } from '@/lib/utils';
import { WEEKDAY_NAMES, SLOT_INFO, getMonday, formatDateRange } from '@/data/mockData';
import ToastContainer from '@/components/ToastContainer';

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

interface PickCell {
  day: WeekDay;
  slot: MealSlot;
}

interface DragInfo {
  fromDay: WeekDay;
  fromSlot: MealSlot;
  recipeId: string;
  recipeName: string;
}

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
};

export default function MealPlanner() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();

  const recipes = useAppStore((s) => s.recipes);
  const entries = useAppStore((s) => s.mealPlanEntries);
  const addMealPlanEntry = useAppStore((s) => s.addMealPlanEntry);
  const removeMealPlanEntry = useAppStore((s) => s.removeMealPlanEntry);
  const moveMealPlanEntryFlat = useAppStore((s) => s.moveMealPlanEntryFlat);
  const pushToast = useAppStore((s) => s.pushToast);

  const [pickCell, setPickCell] = useState<PickCell | null>(null);
  const [search, setSearch] = useState('');
  const pickRef = useRef<HTMLDivElement>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);

  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [hoverTarget, setHoverTarget] = useState<PickCell | null>(null);
  const [invalidDropRejected, setInvalidDropRejected] = useState(false);

  const weekStart = useMemo(() => getMonday(new Date()), []);
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const filteredRecipes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.mainIngredients.some((ing) => ing.toLowerCase().includes(q))
    );
  }, [recipes, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickRef.current && !pickRef.current.contains(e.target as Node)) {
        setPickCell(null);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getEntry = (day: WeekDay, slot: MealSlot) =>
    entries.find((e) => e.day === day && e.slot === slot);

  const getRecipe = (recipeId: string) => recipes.find((r) => r.id === recipeId);

  const handleSelectRecipe = (recipe: Recipe) => {
    if (!pickCell) return;
    addMealPlanEntry(pickCell.day, pickCell.slot, recipe.id);
    setPickCell(null);
    setSearch('');
  };

  const createDragGhost = (text: string) => {
    const el = document.createElement('div');
    el.className = 'fixed -left-[9999px] z-50 pointer-events-none select-none';
    el.innerHTML = `
      <div style="background:#fff;border:2px solid #f5a623;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,0.18);padding:12px 16px;display:flex;align-items:center;gap:12px">
        <span style="font-size:24px">🍽️</span>
        <div>
          <div style="font-family:'Ma Shan Zheng',serif;font-size:16px;color:#2d2a26">${text}</div>
          <div style="font-size:11px;color:#999;margin-top:2px">拖拽移动中...</div>
        </div>
      </div>`;
    document.body.appendChild(el);
    dragGhostRef.current = el;
    return el;
  };

  const cleanupDragGhost = () => {
    if (dragGhostRef.current) {
      document.body.removeChild(dragGhostRef.current);
      dragGhostRef.current = null;
    }
  };

  const handleDragStart = (e: React.DragEvent, day: WeekDay, slot: MealSlot) => {
    const entry = getEntry(day, slot);
    if (!entry) return;
    const recipe = getRecipe(entry.recipeId);
    if (!recipe) return;

    setDragInfo({
      fromDay: day,
      fromSlot: slot,
      recipeId: entry.recipeId,
      recipeName: recipe.name,
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', entry.recipeId);

    const ghost = createDragGhost(recipe.name);
    try {
      e.dataTransfer.setDragImage(ghost, 60, 30);
    } catch {
      /* ignore */
    }
    setTimeout(cleanupDragGhost, 0);
  };

  const handleDragOver = (e: React.DragEvent, day: WeekDay, slot: MealSlot) => {
    if (!dragInfo) return;
    if (dragInfo.fromSlot !== slot) {
      e.dataTransfer.dropEffect = 'none';
      setHoverTarget({ day, slot });
      setInvalidDropRejected(true);
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoverTarget({ day, slot });
    setInvalidDropRejected(false);
  };

  const handleDragLeave = (_e: React.DragEvent, day: WeekDay, slot: MealSlot) => {
    if (hoverTarget?.day === day && hoverTarget?.slot === slot) {
      setHoverTarget(null);
      setInvalidDropRejected(false);
    }
  };

  const handleDrop = (e: React.DragEvent, day: WeekDay, slot: MealSlot) => {
    e.preventDefault();
    if (!dragInfo) return;

    if (dragInfo.fromSlot !== slot) {
      pushToast(
        'warning',
        `拖拽失败：${SLOT_LABELS[dragInfo.fromSlot]} → ${SLOT_LABELS[slot]} 不允许跨餐次移动，仅相同餐次可跨日期`
      );
      setDragInfo(null);
      setHoverTarget(null);
      setInvalidDropRejected(false);
      cleanupDragGhost();
      return;
    }

    if (dragInfo.fromDay !== day) {
      moveMealPlanEntryFlat(dragInfo.fromDay, dragInfo.fromSlot, day, slot);
    }
    setDragInfo(null);
    setHoverTarget(null);
    setInvalidDropRejected(false);
    cleanupDragGhost();
  };

  const handleDragEnd = () => {
    setDragInfo(null);
    setHoverTarget(null);
    setInvalidDropRejected(false);
    cleanupDragGhost();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-[1400px] mx-auto">
      <ToastContainer />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span className="chip bg-primary/15 text-primary-dark border border-primary/20">
              房间 {inviteCode || 'demo-001'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display text-gray-800 flex items-center gap-3">
            🍽️ 每周菜单规划
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{formatDateRange(weekStart)}</p>
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            提示：拖拽菜单项可在「同一餐次」间跨日期移动
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate(`/room/${inviteCode || 'demo-001'}/shopping-list`)}
        >
          <ShoppingCart className="w-4 h-4" />
          生成采购清单
        </button>
      </div>

      <div className="card p-2 md:p-4 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-8 gap-2 md:gap-3 min-w-[320px]">
          <div className="hidden md:block" />

          {weekDates.map((d, idx) => (
            <div
              key={`head-${idx}`}
              className="flex flex-col items-center py-2 md:py-3 bg-gradient-to-b from-orange-50/60 to-transparent rounded-xl"
            >
              <span className="font-bold text-gray-800 text-sm md:text-base">
                {WEEKDAY_NAMES[idx]}
              </span>
              <span className="text-xs text-gray-400 mt-0.5">
                {d.getMonth() + 1}/{d.getDate()}
              </span>
            </div>
          ))}

          {SLOTS.map((slot) => {
            const info = SLOT_INFO[slot];
            return (
              <>
                <div
                  key={`slot-label-${slot}`}
                  className="flex md:items-center md:justify-end md:pr-2 py-3 md:py-0"
                >
                  <span className="chip bg-primary/20 text-primary-dark border border-primary/30 text-sm px-3 py-1.5 md:px-4 md:py-2 font-medium w-full md:w-auto justify-center">
                    <span className="mr-1">{info.emoji}</span>
                    {info.label}
                  </span>
                </div>

                {weekDates.map((_, dIdx) => {
                  const day = dIdx as WeekDay;
                  const entry = getEntry(day, slot);
                  const recipe = entry ? getRecipe(entry.recipeId) : null;
                  const isDragOver =
                    hoverTarget?.day === day && hoverTarget?.slot === slot;
                  const isDragging =
                    dragInfo?.fromDay === day && dragInfo?.fromSlot === slot;
                  const sameSlotDrag =
                    dragInfo && dragInfo.fromSlot === slot && dragInfo.fromDay !== day;
                  const isDropTarget = isDragOver && !!sameSlotDrag;
                  const isInvalidDrop =
                    isDragOver && !!dragInfo && dragInfo.fromSlot !== slot && invalidDropRejected;

                  return (
                    <div
                      key={`cell-${slot}-${dIdx}`}
                      className={cn(
                        'relative rounded-xl min-h-[88px] md:min-h-[110px] p-2 md:p-3 transition-all duration-200 select-none cursor-pointer group',
                        entry
                          ? 'bg-white border border-orange-100 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                          : 'bg-white/40 border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-orange-50/30',
                        isDropTarget && 'ring-2 ring-primary ring-offset-1 bg-orange-50',
                        isInvalidDrop && 'ring-2 ring-red-400 ring-offset-1 bg-red-50',
                        isDragging && 'opacity-40 scale-[0.98]'
                      )}
                      draggable={!!entry}
                      onDragStart={(e) => handleDragStart(e, day, slot)}
                      onDragOver={(e) => handleDragOver(e, day, slot)}
                      onDragLeave={(e) => handleDragLeave(e, day, slot)}
                      onDrop={(e) => handleDrop(e, day, slot)}
                      onDragEnd={handleDragEnd}
                      onClick={() => !entry && setPickCell({ day, slot })}
                    >
                      {!entry && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-1">
                          <span className="text-lg">➕</span>
                          <span>添加</span>
                        </div>
                      )}

                      {entry && recipe && (
                        <div className="h-full flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-1">
                            <div className="hand-write text-lg md:text-xl leading-tight text-gray-800 pr-1">
                              {recipe.name}
                            </div>
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 shrink-0 p-0.5 rounded hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMealPlanEntry(day, slot);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">
                              | {recipe.cookTimeMinutes}min
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            );
          })}
        </div>
      </div>

      {pickCell && (
        <div
          ref={pickRef}
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-40 p-4 animate-fade-in"
          onClick={() => {
            setPickCell(null);
            setSearch('');
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[75vh] flex flex-col animate-pop overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg text-gray-800">
                  选择食谱 · {WEEKDAY_NAMES[pickCell.day]} {SLOT_INFO[pickCell.slot].label}
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                  onClick={() => {
                    setPickCell(null);
                    setSearch('');
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  className="input-base pl-9"
                  placeholder="搜索食谱名或主要食材..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredRecipes.length === 0 && (
                <div className="py-10 text-center text-gray-400 text-sm">未找到匹配的食谱</div>
              )}
              {filteredRecipes.map((r) => (
                <button
                  key={r.id}
                  className="w-full text-left p-3 rounded-xl hover:bg-orange-50/70 transition-colors flex items-start gap-3 border border-transparent hover:border-orange-100"
                  onClick={() => handleSelectRecipe(r)}
                >
                  <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-2xl recipe-gradient-2">
                    🍳
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800">{r.name}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>⏱ {r.cookTimeMinutes}min</span>
                      <span>·</span>
                      <span>⭐ {r.avgRating}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {invalidDropRejected && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-toast-in">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">仅允许在相同餐次间跨日期移动</span>
          </div>
        </div>
      )}
    </div>
  );
}
