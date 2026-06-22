import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useCalendarStore } from './store';
import { scheduleApi, recommendApi } from './api';
import { Draft, ScheduledItemWithDraft } from './types';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function CalendarGrid() {
  const currentMonth = useCalendarStore((s) => s.currentMonth);
  const setCurrentMonth = useCalendarStore((s) => s.setCurrentMonth);
  const schedule = useCalendarStore((s) => s.schedule);
  const addScheduleItem = useCalendarStore((s) => s.addScheduleItem);
  const removeScheduleItem = useCalendarStore((s) => s.removeScheduleItem);
  const draggingDraft = useCalendarStore((s) => s.draggingDraft);
  const setDraggingDraft = useCalendarStore((s) => s.setDraggingDraft);
  const removeDraft = useCalendarStore((s) => s.removeDraft);
  const addToast = useCalendarStore((s) => s.addToast);
  const conflictDate = useCalendarStore((s) => s.conflictDate);
  const setConflictDate = useCalendarStore((s) => s.setConflictDate);

  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [recommendCache, setRecommendCache] = useState<
    Record<string, { count: number; recommendations: Record<string, string>; isOverloaded: boolean }>
  >({});
  const [animDirection, setAnimDirection] = useState<1 | -1>(1);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { locale: zhCN, weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { locale: zhCN, weekStartsOn: 1 });

  const days = useMemo(
    () => eachDayOfInterval({ start: calStart, end: calEnd }),
    [calStart, calEnd]
  );

  const fetchRecommend = async (dateStr: string) => {
    if (recommendCache[dateStr]) return;
    try {
      const data = await recommendApi.getForDate(dateStr);
      setRecommendCache((c) => ({ ...c, [dateStr]: data }));
    } catch (e) {
      /* ignore */
    }
  };

  const triggerConflictFlash = (dateKey: string) => {
    setConflictDate(dateKey);
    setTimeout(() => setConflictDate(null), 800);
  };

  const handleDrop = async (date: Date, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingDraft) return;

    const dateKey = format(date, 'yyyy-MM-dd');
    const currentCount = (schedule[dateKey] || []).length;

    const rec = recommendCache[dateKey];
    const isOverloaded = rec ? rec.isOverloaded : currentCount >= 10;

    if (currentCount >= 10 || isOverloaded) {
      triggerConflictFlash(dateKey);
      addToast('error', dateKey + ' 当日排期已超过 10 条，请选择其他日期');
      return;
    }

    try {
      const result = await scheduleApi.create({
        draftId: draggingDraft.id,
        date: dateKey
      });
      const item = { ...result, draft: draggingDraft };
      addScheduleItem(dateKey, item);
      removeDraft(draggingDraft.id);
      setDraggingDraft(null);
      addToast('success', '已排期到 ' + dateKey);
    } catch (err) {
      addToast('error', '排期失败');
    }
  };

  const handlePrev = () => {
    setAnimDirection(-1);
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNext = () => {
    setAnimDirection(1);
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleRemoveSchedule = async (dateKey: string, scheduleId: string, draft: Draft) => {
    await scheduleApi.remove(scheduleId);
    removeScheduleItem(dateKey, scheduleId);
    useCalendarStore.getState().addDraft(draft);
    addToast('info', '已取消排期');
  };

  return (
    <div className="calendar-grid">
      <div style={calendarHeaderStyle}>
        <button onClick={handlePrev} style={navBtnStyle}>
          ‹
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, minWidth: 140, textAlign: 'center' }}>
          {format(currentMonth, 'yyyy 年 M 月', { locale: zhCN })}
        </div>
        <button onClick={handleNext} style={navBtnStyle}>
          ›
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #2a2a3e' }}>
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            style={{
              padding: '8px 0',
              textAlign: 'center',
              fontSize: 12,
              color: '#888',
              fontWeight: 500
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={format(currentMonth, 'yyyy-MM')}
            initial={{ opacity: 0, x: animDirection * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -animDirection * 50 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridAutoRows: '1fr',
              height: '100%',
              gap: 1
            }}
          >
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const items = schedule[dateKey] || [];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const isConflict = conflictDate === dateKey;
              const rec = recommendCache[dateKey];

              return (
                <motion.div
                  key={dateKey}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setHoverDate(dateKey);
                    fetchRecommend(dateKey);
                  }}
                  onDragLeave={() => setHoverDate(null)}
                  onDrop={(e) => handleDrop(day, e)}
                  onMouseEnter={() => fetchRecommend(dateKey)}
                  className={
                    'calendar-cell' + (isConflict ? ' conflict-flash' : '')
                  }
                  style={cellStyle(inMonth, today, hoverDate === dateKey)}
                >
                  <div style={dayNumberStyle(today)}>{format(day, 'd')}</div>
                  <div style={{ flex: 1, overflow: 'hidden', padding: '0 4px 4px' }}>
                    {items.slice(0, 3).map((item: ScheduledItemWithDraft) => (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSchedule(dateKey, item.id, item.draft);
                        }}
                        style={scheduleItemStyle(item.draft.platform)}
                      >
                        <span style={platformIconStyle(item.draft.platform)} />
                        <span
                          style={{
                            fontSize: 10,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}
                        >
                          {item.draft.title}
                        </span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                        +{items.length - 3} 更多
                      </div>
                    )}
                  </div>
                  {rec && Object.keys(rec.recommendations).length > 0 && (
                    <div style={tooltipStyle}>最佳时段</div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const calendarHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  gap: 20,
  borderBottom: '1px solid #2a2a3e'
};

const navBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  backgroundColor: '#2a2a3e',
  color: '#fff',
  fontSize: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1
};

const cellStyle = (inMonth: boolean, today: boolean, hovered: boolean): React.CSSProperties => {
  const style: React.CSSProperties = {
    backgroundColor: '#2a2a3e',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: today ? '2px solid transparent' : '1px solid #1a1a2e',
    transition: 'all 0.3s ease-in-out',
    position: 'relative'
  };
  if (today) {
    style.borderImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) 1';
    style.borderWidth = 2;
  }
  if (!inMonth) {
    style.opacity = 0.35;
  }
  if (hovered) {
    style.backgroundColor = '#35354a';
  }
  return style;
};

const dayNumberStyle = (today: boolean): React.CSSProperties => ({
  padding: '6px 8px',
  fontSize: 13,
  fontWeight: today ? 700 : 400,
  color: today ? '#667eea' : '#bbb'
});

const platformColor = (platform: string): string => {
  const colors: Record<string, string> = {
    '微博': '#e6162d',
    '小红书': '#fe2c55',
    '抖音': '#000000',
    '微信公众号': '#07c160'
  };
  return colors[platform] || '#667eea';
};

const platformIconStyle = (platform: string): React.CSSProperties => ({
  display: 'inline-block',
  width: 6,
  height: 6,
  borderRadius: 2,
  backgroundColor: platformColor(platform),
  marginRight: 4,
  flexShrink: 0
});

const scheduleItemStyle = (platform: string): React.CSSProperties => ({
  display: 'flex',
  padding: '3px 6px',
  marginTop: 2,
  borderRadius: 4,
  backgroundColor: 'rgba(102, 126, 234, 0.15)',
  fontSize: 10,
  color: '#ddd',
  cursor: 'pointer',
  alignItems: 'center',
  whiteSpace: 'nowrap'
});

const tooltipStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 6,
  right: 6,
  fontSize: 10,
  color: '#667eea',
  fontWeight: 500,
  padding: '2px 6px',
  backgroundColor: 'rgba(102, 126, 234, 0.2)',
  borderRadius: 4
};
