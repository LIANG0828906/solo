import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { useStore } from '../store';
import { RehearsalCard } from './RehearsalCard';
import { RehearsalForm } from './RehearsalForm';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { WEEKDAY_NAMES, getWeekDates, dateToString, formatRange } from './utils';

export const Calendar = () => {
  const rehearsals = useStore((s) => s.rehearsals);
  const deleteRehearsal = useStore((s) => s.deleteRehearsal);

  const [anchor, setAnchor] = useState<Date>(() => new Date('2026-06-15'));
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState<string | undefined>();

  const weekDates = useMemo(() => getWeekDates(anchor), [anchor]);

  const rehearsalsByDate = useMemo(() => {
    const map = new Map<string, typeof rehearsals>();
    for (const r of rehearsals) {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    }
    return map;
  }, [rehearsals]);

  const shiftWeek = (delta: number) => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + delta * 7);
    setAnchor(d);
  };

  const handleCellClick = (dateStr: string) => {
    setNewDate(dateStr);
    setShowForm(true);
  };

  const totalRehearsals = rehearsals.length;
  const withConflicts = rehearsals.filter((r) => r.conflicts.length > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className="text-white font-semibold"
            style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 22 }}
          >
            排练日历
          </h2>
          <p className="text-white/50 text-xs mt-1">
            本周共 {totalRehearsals} 场排练 · 存在冲突 {withConflicts} 场
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center rounded-lg px-1 py-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <button
              onClick={() => shiftWeek(-1)}
              className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="上一周"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2 px-3 text-white text-sm">
              <CalendarDays size={16} style={{ color: '#FFD54F' }} />
              <span>{`${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()} - ${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`}</span>
            </div>
            <button
              onClick={() => shiftWeek(1)}
              className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="下一周"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <Button icon={<Plus size={16} />} onClick={() => { setNewDate(undefined); setShowForm(true); }}>
            新建排练
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 md:hidden">
        {weekDates.map((date, idx) => {
          const dateStr = dateToString(date);
          const list = rehearsalsByDate.get(dateStr) ?? [];
          return (
            <div key={dateStr} className="col-span-7">
              <div className="flex items-center justify-between px-3 py-2 rounded-t-xl mb-2"
                style={{ backgroundColor: 'rgba(255,213,79,0.08)', border: '1px solid rgba(255,213,79,0.15)' }}
              >
                <span className="text-white text-sm font-medium">
                  {WEEKDAY_NAMES[idx]} {date.getMonth() + 1}/{date.getDate()}
                </span>
                <button
                  onClick={() => handleCellClick(dateStr)}
                  className="p-1 rounded-md text-white/60 hover:text-[#FFD54F] transition-colors"
                  aria-label="添加排练"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {list.length === 0 ? (
                  <div
                    className="h-20 rounded-xl flex items-center justify-center text-xs text-white/30 cursor-pointer hover:text-white/50 transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}
                    onClick={() => handleCellClick(dateStr)}
                  >
                    点击添加排练
                  </div>
                ) : (
                  list.map((r) => (
                    <div
                      key={r.id}
                      className="w-full"
                      style={{ width: '100%' }}
                    >
                      <div style={{ width: '100%' }}>
                        <RehearsalCard rehearsal={r} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block overflow-x-auto pb-4">
        <div className="grid grid-cols-7 gap-3" style={{ minWidth: 820 }}>
          {weekDates.map((date, idx) => {
            const dateStr = dateToString(date);
            const list = rehearsalsByDate.get(dateStr) ?? [];
            return (
              <div key={dateStr} className="min-w-[180px]">
                <div className="px-3 py-2 rounded-t-xl mb-2 flex items-center justify-between"
                  style={{ backgroundColor: 'rgba(255,213,79,0.08)', border: '1px solid rgba(255,213,79,0.15)' }}
                >
                  <div>
                    <div className="text-[11px] text-white/60">{WEEKDAY_NAMES[idx]}</div>
                    <div className="text-white text-sm font-semibold">
                      {date.getMonth() + 1}/{date.getDate()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCellClick(dateStr)}
                    className="p-1.5 rounded-md text-white/60 hover:text-[#FFD54F] hover:bg-white/10 transition-colors"
                    aria-label="添加排练"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div
                  className="rounded-xl p-3 min-h-[220px] flex flex-col gap-3 cursor-pointer transition-colors hover:bg-white/5"
                  style={{ backgroundColor: 'rgba(38,50,56,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.05)' }}
                  onClick={() => handleCellClick(dateStr)}
                >
                  {list.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-[11px] text-white/25">
                      <Plus size={14} className="mr-1 opacity-50" />
                      添加
                    </div>
                  ) : (
                    list.map((r) => (
                      <div key={r.id} onClick={(e) => e.stopPropagation()}>
                        <RehearsalCard rehearsal={r} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={newDate ? `新建排练 · ${newDate}` : '新建排练'}
        maxWidth={620}
      >
        <RehearsalForm
          initialDate={newDate}
          onSubmit={() => setShowForm(false)}
        />
      </Modal>

      <div className="rounded-xl p-4 text-xs space-y-2"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="text-white/50 font-medium flex items-center gap-1.5">
          <span style={{ width: 3, height: 14, backgroundColor: '#E53935', borderRadius: 2 }} />
          冲突说明
        </div>
        <div className="text-white/40 pl-4.5 leading-relaxed">
          排练事件卡片左侧红色边框表示该时段存在人员时间冲突。请调整时间或替换冲突成员后重新排期。
          鼠标悬停在警告图标上可查看具体冲突人员名单。
        </div>
      </div>
    </motion.div>
  );
};
