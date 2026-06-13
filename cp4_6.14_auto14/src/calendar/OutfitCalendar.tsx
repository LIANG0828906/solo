import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar, Trash2 } from 'lucide-react';
import { useWardrobeStore } from '@/store';
import { ClothingItem, Outfit } from '@/types';
import { cn } from '@/lib/utils';

interface ModalProps {
  outfit: Outfit | undefined;
  items: ClothingItem[];
  date: string;
  allOutfits: Outfit[];
  onClose: () => void;
  onAssign: (date: string, outfitId: string) => void;
  onRemove: (date: string) => void;
}

function OutfitDetailModal({ outfit, items, date, allOutfits, onClose, onAssign, onRemove }: ModalProps) {
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const handleImgError = (id: string) => {
    setImgErrors((prev) => new Set(prev).add(id));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)', borderRadius: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{formatDate(date)}</h3>
            {outfit && (
              <p className="text-sm text-gray-500">{outfit.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {outfit ? (
            <div>
              <div className="mb-4 grid grid-cols-2 gap-3">
                {outfit.items.map((itemId) => {
                  const item = items.find((i) => i.id === itemId);
                  if (!item) return null;

                  return (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-xl bg-white"
                      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: 12 }}
                    >
                      <div className="relative aspect-square overflow-hidden">
                        {imgErrors.has(item.id) ? (
                          <div className="flex h-full w-full items-center justify-center bg-gray-50">
                            <div
                              className="h-16 w-16 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                          </div>
                        ) : (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={() => handleImgError(item.id)}
                          />
                        )}
                        <div
                          className="absolute bottom-2 right-2 h-6 w-6 rounded-full border-2 border-white shadow-md"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category} · {item.season}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {outfit.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium',
                      tag === '色彩和谐' && 'bg-green-50 text-green-700',
                      tag === '撞色对比' && 'bg-red-50 text-red-700',
                      tag === '单色系' && 'bg-gray-100 text-gray-700',
                      tag === '暖色调' && 'bg-orange-50 text-orange-700',
                      tag === '冷色调' && 'bg-blue-50 text-blue-700',
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-1 mb-2">
                {outfit.items.map((itemId) => {
                  const item = items.find((i) => i.id === itemId);
                  return item ? (
                    <div
                      key={itemId}
                      className="h-5 w-5 rounded-full border border-gray-100 shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                  ) : null;
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  onRemove(date);
                  onClose();
                }}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                移除此日穿搭
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex flex-col items-center justify-center py-6 text-gray-400">
                <Calendar className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm">这一天还没有穿搭记录</p>
              </div>

              {allOutfits.length > 0 ? (
                <div>
                  <p className="mb-3 text-sm font-medium text-gray-600">选择穿搭安排到这一天：</p>
                  <div className="grid grid-cols-1 gap-3">
                    {allOutfits.map((o) => {
                      const oItems = o.items
                        .map((id) => items.find((i) => i.id === id))
                        .filter(Boolean) as ClothingItem[];

                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => {
                            onAssign(date, o.id);
                            onClose();
                          }}
                          className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition-all hover:border-blue-400 hover:bg-blue-50"
                          style={{ borderRadius: 12 }}
                        >
                          <div className="flex gap-1">
                            {oItems.slice(0, 4).map((item) => (
                              <div
                                key={item.id}
                                className="h-10 w-10 overflow-hidden rounded-lg"
                              >
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800">{o.name}</p>
                            <div className="mt-1 flex gap-1">
                              {oItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {o.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400">暂无穿搭，请先创建穿搭</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OutfitCalendar() {
  const {
    items,
    outfits,
    dailyOutfits,
    assignDailyOutfit,
    removeDailyOutfit,
  } = useWardrobeStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalDate, setModalDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const formatDate = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const days: (number | null)[] = [];
  for (let i = 0; i < startingDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const today = new Date().toISOString().split('T')[0];

  const dailyMap = useMemo(() => {
    const map = new Map<string, Outfit>();
    dailyOutfits.forEach((d) => {
      const outfit = outfits.find((o) => o.id === d.outfitId);
      if (outfit) map.set(d.date, outfit);
    });
    return map;
  }, [dailyOutfits, outfits]);

  const selectedOutfit = modalDate ? dailyMap.get(modalDate) : undefined;

  return (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-bold text-gray-800">穿搭日历</h2>

      <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: 12 }}>
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold text-gray-800">
            {year}年 {month + 1}月
          </h3>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateStr = formatDate(day);
            const outfit = dailyMap.get(dateStr);
            const isToday = dateStr === today;
            const isPast = dateStr < today;

            const outfitItems = outfit
              ? outfit.items
                  .map((id) => items.find((i) => i.id === id))
                  .filter(Boolean) as ClothingItem[]
              : [];

            return (
              <div
                key={day}
                onClick={() => setModalDate(dateStr)}
                className="cursor-pointer rounded-xl p-1.5 transition-all duration-200 hover:bg-gray-50"
                style={{ borderRadius: 12 }}
              >
                <div className="flex h-full flex-col items-center">
                  <span
                    className={cn(
                      'mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                      isToday && 'bg-blue-500 text-white',
                      !isToday && isPast && 'text-gray-400',
                      !isToday && !isPast && 'text-gray-700'
                    )}
                  >
                    {day}
                  </span>

                  {outfit && outfitItems.length > 0 ? (
                    <div className="w-full flex-1 overflow-hidden rounded-lg">
                      <div className="grid grid-cols-2 gap-px">
                        {outfitItems.slice(0, 4).map((item) => (
                          <div key={item.id} className="aspect-square overflow-hidden">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-0.5 flex justify-center gap-0.5">
                        {outfitItems.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalDate && (
        <OutfitDetailModal
          outfit={selectedOutfit}
          items={items}
          date={modalDate}
          allOutfits={outfits}
          onClose={() => setModalDate(null)}
          onAssign={assignDailyOutfit}
          onRemove={removeDailyOutfit}
        />
      )}
    </div>
  );
}

export default OutfitCalendar;
