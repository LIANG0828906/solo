import { useMenuStore } from '@/hooks/useMenu';
import { ZONES, ZONE_ICONS } from '@/types';
import type { Zone, ShoppingItem } from '@/types';
import { Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const RADIUS = 40;
const STROKE = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRing({ checked, total }: { checked: number; total: number }) {
  const pct = total > 0 ? (checked / total) * 100 : 0;
  const isComplete = pct === 100;
  const offset = CIRCUMFERENCE * (1 - pct / 100);
  const strokeColor = isComplete ? '#6B8E23' : '#F28C28';

  return (
    <div className={`flex items-center gap-4 ${isComplete ? 'flash-complete' : ''}`}>
      <svg width={RADIUS * 2 + STROKE} height={RADIUS * 2 + STROKE}>
        <circle
          cx={RADIUS + STROKE / 2}
          cy={RADIUS + STROKE / 2}
          r={RADIUS}
          fill="none"
          stroke="#e8dfc8"
          strokeWidth={STROKE}
        />
        <circle
          className="progress-ring-circle"
          cx={RADIUS + STROKE / 2}
          cy={RADIUS + STROKE / 2}
          r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-warm-dark text-sm font-bold"
        >
          {Math.round(pct)}%
        </text>
      </svg>
      <div>
        <p className="text-warm-dark text-sm font-semibold">
          已采购 {checked} / {total} 项
        </p>
        {isComplete && (
          <p className="text-warm-olive text-xs font-medium mt-0.5">🎉 采购完成！</p>
        )}
      </div>
    </div>
  );
}

function WeekSelector() {
  const currentWeek = useMenuStore((s) => s.currentWeek);
  const setCurrentWeek = useMenuStore((s) => s.setCurrentWeek);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
        disabled={currentWeek <= 1}
        className="p-1 rounded hover:bg-warm-orange-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={18} className="text-warm-dark" />
      </button>
      <span className="text-warm-dark font-semibold text-sm min-w-[60px] text-center">
        第 {currentWeek} 周
      </span>
      <button
        onClick={() => setCurrentWeek(Math.min(4, currentWeek + 1))}
        disabled={currentWeek >= 4}
        className="p-1 rounded hover:bg-warm-orange-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={18} className="text-warm-dark" />
      </button>
    </div>
  );
}

function ZoneSection({ zone, items }: { zone: Zone; items: ShoppingItem[] }) {
  const expanded = useMenuStore((s) => s.expandedZones[zone]);
  const toggleZone = useMenuStore((s) => s.toggleZone);
  const toggleShoppingItem = useMenuStore((s) => s.toggleShoppingItem);

  return (
    <div className="mb-2">
      <div
        className="zone-header flex items-center gap-2 px-3 py-2 rounded-lg"
        onClick={() => toggleZone(zone)}
      >
        <span className="text-lg">{ZONE_ICONS[zone]}</span>
        <span className="text-warm-dark font-semibold text-sm flex-1">{zone}</span>
        <span className="text-warm-dark/50 text-xs">{items.length} 项</span>
        {expanded ? (
          <ChevronUp size={16} className="text-warm-dark/50" />
        ) : (
          <ChevronDown size={16} className="text-warm-dark/50" />
        )}
      </div>
      <div className={`zone-content ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className="pl-3 pr-1 py-1">
          {items.map((item) => (
            <div key={item.name} className="flex items-center gap-3 py-1.5">
              <div
                className={`circular-checkbox ${item.checked ? 'checked' : ''}`}
                onClick={() => toggleShoppingItem(item.name)}
              >
                {item.checked && <Check size={14} className="check-icon" />}
              </div>
              <span
                className={`text-sm flex-1 ${
                  item.checked ? 'line-through text-warm-dark/40' : 'text-warm-dark'
                }`}
              >
                {item.name}
              </span>
              <span className="text-warm-dark/50 text-xs whitespace-nowrap">
                {item.quantity} {item.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShoppingRadar({ items }: { items: ShoppingItem[] }) {
  const data = ZONES.map((zone) => ({
    zone,
    count: items.filter((i) => i.zone === zone).length,
  }));

  if (data.every((d) => d.count === 0)) return null;

  return (
    <div className="flex justify-center mt-4">
      <RadarChart width={300} height={300} data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#e8dfc8" />
        <PolarAngleAxis
          dataKey="zone"
          tick={{ fill: '#333333', fontSize: 12 }}
        />
        <Radar
          dataKey="count"
          stroke="#F28C28"
          fill="#F28C28"
          fillOpacity={0.3}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </RadarChart>
    </div>
  );
}

export default function ShoppingList() {
  const shoppingItems = useMenuStore((s) => s.shoppingItems);
  const checkedCount = shoppingItems.filter((i) => i.checked).length;
  const totalCount = shoppingItems.length;

  const grouped = ZONES.reduce<Record<Zone, ShoppingItem[]>>((acc, zone) => {
    acc[zone] = shoppingItems.filter((i) => i.zone === zone);
    return acc;
  }, {} as Record<Zone, ShoppingItem[]>);

  if (shoppingItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-warm-dark/60 py-16">
        <ShoppingCart size={48} className="mb-4 text-warm-orange/40" />
        <p className="text-sm font-medium">还没有采购项目，请先在左侧规划周菜单 🍳</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <ProgressRing checked={checkedCount} total={totalCount} />
          <WeekSelector />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {ZONES.map(
          (zone) =>
            grouped[zone].length > 0 && (
              <ZoneSection key={zone} zone={zone} items={grouped[zone]} />
            )
        )}
        <ShoppingRadar items={shoppingItems} />
      </div>
    </div>
  );
}
