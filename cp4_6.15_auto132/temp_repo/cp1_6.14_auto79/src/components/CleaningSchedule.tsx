import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { transactionsApi, type DutyItem, type HouseInfo } from '../services/api';

export default function CleaningSchedule({ house }: { house: HouseInfo }) {
  const [duties, setDuties] = useState<DutyItem[]>([]);
  const [flippingId, setFlippingId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);
  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    transactionsApi.getDuties().then(setDuties);
  }, []);

  const byDate = useMemo(() => {
    const map: Record<string, DutyItem[]> = {};
    duties.forEach((d) => {
      if (!map[d.date]) map[d.date] = [];
      map[d.date].push(d);
    });
    return map;
  }, [duties]);

  const days = useMemo(() => {
    const arr: string[] = [];
    const today = new Date();
    const day = today.getDay() === 0 ? 7 : today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - (day - 1));
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  }, []);

  const swapUser = async (dutyId: string, newUserId: string) => {
    setFlippingId(dutyId);
    setPickerOpen(null);
    setTimeout(async () => {
      const updated = await transactionsApi.updateDuty(dutyId, newUserId);
      setDuties((ds) => ds.map((d) => (d.id === dutyId ? updated : d)));
      setTimeout(() => setFlippingId(null), 300);
    }, 500);
  };

  const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="fade-in">
      <div className="glass-card p-5 overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 gap-3 mb-3">
            {weekdayLabels.map((w, i) => (
              <div key={w} className="text-center text-xs font-semibold uppercase tracking-wider text-[#6b7c8a] py-1">
                周{w}
                <span className="block text-[10px] opacity-60 mt-0.5">{i < 5 ? '工作日' : '周末'}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-3 auto-rows-fr">
            {days.map((dateStr, idx) => {
              const isToday = dateStr === todayStr;
              const items = byDate[dateStr] || [];
              const d = new Date(dateStr);
              const m = d.getMonth() + 1;
              const day = d.getDate();
              return (
                <div
                  key={dateStr}
                  className={`rounded-2xl p-3 min-h-[180px] border transition-all ${
                    isToday
                      ? 'bg-gradient-to-br from-[#4a90a4]/20 via-white/60 to-[#e8c99b]/25 border-[#4a90a4]/50 shadow-[0_0_0_2px_rgba(74,144,164,0.2)]'
                      : idx < 7
                      ? 'bg-white/70 border-white/80'
                      : 'bg-white/50 border-white/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-lg font-bold ${isToday ? 'text-[#356d7e]' : 'text-[#2c3e50]'}`}>
                        {m}月
                      </span>
                      <span className={`text-2xl font-serif-sc font-bold ${isToday ? 'text-[#4a90a4]' : 'text-[#2c3e50]'}`}>
                        {day}
                      </span>
                    </div>
                    {isToday && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#4a90a4] to-[#6eb4c7] text-white font-bold nod-anim inline-block">
                        今天
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {items.map((it) => {
                      const flipping = flippingId === it.id;
                      const picking = pickerOpen === it.id;
                      return (
                        <div key={it.id} className="duty-flip relative h-[68px]">
                          <div className={`duty-flip-inner w-full h-full ${flipping ? 'flip' : ''}`}>
                            <div
                              className={`duty-face front rounded-xl p-2 cursor-pointer bg-white/85 hover:bg-white transition-all border ${
                                isToday ? 'border-[#4a90a4]/40 shadow-md' : 'border-transparent'
                              }`}
                              onClick={() => setPickerOpen(picking ? null : it.id)}
                            >
                              <div className="flex items-center gap-2 h-full">
                                <div className="relative shrink-0">
                                  <img
                                    src={it.user?.avatar}
                                    alt=""
                                    className={`w-10 h-10 rounded-lg border-2 border-white ${
                                      isToday ? 'nod-anim' : ''
                                    }`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-semibold text-[#6b7c8a]">{it.area}</p>
                                  <p className="text-sm font-semibold text-[#2c3e50] truncate">
                                    {it.user?.nickname}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="duty-face back rounded-xl p-2 bg-gradient-to-br from-[#e8c99b]/60 to-[#4a90a4]/40 border-2 border-white flex items-center justify-center">
                              <RefreshCw size={18} className="text-white animate-spin" />
                            </div>
                          </div>

                          {picking && (
                            <div className="absolute z-10 top-full left-0 mt-2 w-44 glass-card p-2 shadow-xl slide-in-right">
                              <p className="text-[11px] font-semibold text-[#6b7c8a] px-2 py-1">换为：</p>
                              <div className="space-y-1 max-h-48 overflow-auto">
                                {house.members.map((mm) => (
                                  <button
                                    key={mm.id}
                                    onClick={() => swapUser(it.id, mm.id)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white text-left transition-colors"
                                  >
                                    <img src={mm.avatar} className="w-6 h-6 rounded-md" alt="" />
                                    <span className="text-sm font-medium">{mm.nickname}</span>
                                    {mm.id === it.userId && (
                                      <Check size={14} className="ml-auto text-[#27ae60]" />
                                    )}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => setPickerOpen(null)}
                                className="mt-1 w-full text-center text-xs text-[#6b7c8a] py-1.5 hover:bg-white/70 rounded-lg"
                              >
                                取消
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-[#6b7c8a] text-center">
            💡 点击任意卡片可切换值日生；今日值日生会自动「点头」提醒自己哦
          </p>
        </div>
      </div>
    </div>
  );
}
