import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, User } from 'lucide-react';
import { Exchange, CATEGORY_COLORS, WEEKDAYS } from '../types';

interface Props {
  exchanges: Exchange[];
  currentUserId: number;
  currentMonth: number;
  currentYear: number;
  onChangeMonth: (delta: number) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

export default function ScheduleView({
  exchanges, currentUserId, currentMonth, currentYear, onChangeMonth
}: Props) {
  const [selected, setSelected] = useState<Exchange | null>(null);
  const [hovered, setHovered] = useState<{ exchange: Exchange; x: number; y: number } | null>(null);

  const firstDay = new Date(currentYear, currentMonth - 1, 1);
  const weeks: Date[][] = [];
  let current = new Date(firstDay);
  current.setDate(current.getDate() - current.getDay());
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  const today = new Date();
  const isCurrentMonth = (d: Date) => d.getMonth() === currentMonth - 1;
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  const getExchangesForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return exchanges.filter(e => e.scheduledDate === dateStr);
  };

  const hourHeight = 48;

  return (
    <div className="card p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            日程总览
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
            {currentYear}年{currentMonth}月
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost"
            onClick={() => onChangeMonth(-1)}
            style={{ padding: '8px 12px' }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              const t = new Date();
              onChangeMonth((t.getFullYear() - currentYear) * 12 + (t.getMonth() + 1 - currentMonth));
            }}
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            今天
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => onChangeMonth(1)}
            style={{ padding: '8px 12px' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 780 }}>
          <div className="grid" style={{ gridTemplateColumns: '60px repeat(7, 1fr)', gap: 4 }}>
            <div></div>
            {WEEKDAYS.map((d, i) => (
              <div
                key={d}
                className="text-center pb-2 text-xs font-medium"
                style={{ color: i === 0 || i === 6 ? 'var(--accent-dark)' : 'var(--text-light)' }}
              >
                {d}
              </div>
            ))}

            {weeks.map((week, wi) => (
              <>
                {week.map((day, di) => (
                  di === 0 ? (
                    <div
                      key={`label-${wi}-${di}`}
                      className="flex items-center justify-start pt-2 text-xs"
                      style={{ color: 'var(--text-light)', minHeight: 120 }}
                    >
                      <span style={{ transform: 'rotate(-90deg)', transformOrigin: 'left center', whiteSpace: 'nowrap', paddingLeft: 20 }}>
                        {day.getDate()} - {week[6].getDate()}
                      </span>
                    </div>
                  ) : null
                ))}
                {week.map((day, di) => (
                  <div
                    key={`day-${wi}-${di}`}
                    className="rounded-xl p-2 relative"
                    style={{
                      minHeight: 120,
                      background: !isCurrentMonth(day)
                        ? 'rgba(245, 230, 202, 0.4)'
                        : isToday(day)
                        ? 'rgba(74, 103, 65, 0.1)'
                        : 'rgba(255, 250, 240, 0.5)',
                      border: isToday(day) ? '2px solid var(--primary)' : '1px solid var(--card-border)',
                    }}
                  >
                    <div
                      className="text-xs font-semibold mb-2"
                      style={{
                        color: !isCurrentMonth(day) ? '#b9b0a3' : isToday(day) ? 'var(--primary)' : 'var(--text)',
                      }}
                    >
                      {day.getDate()}
                    </div>
                    <div className="flex flex-col gap-1">
                      {getExchangesForDay(day).slice(0, 3).map((ex) => {
                        const color = CATEGORY_COLORS[ex.skill?.category || ''] || '#4A6741';
                        const other = ex.fromUserId === currentUserId ? ex.toUser : ex.fromUser;
                        return (
                          <button
                            key={ex.id}
                            onClick={() => setSelected(ex)}
                            onMouseEnter={(e) => setHovered({ exchange: ex, x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setHovered(null)}
                            className="text-left px-2 py-1 rounded-lg text-xs text-white font-medium truncate transition-all"
                            style={{
                              background: color,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnterCapture={(e) => {
                              (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
                              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeaveCapture={(e) => {
                              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                            }}
                          >
                            <Clock size={10} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
                            {ex.startTime.toString().padStart(2, '0')}:00
                            {' '}
                            <span style={{ opacity: 0.9 }}>{ex.skill?.title}</span>
                          </button>
                        );
                      })}
                      {getExchangesForDay(day).length > 3 && (
                        <div className="text-xs text-center" style={{ color: 'var(--text-light)' }}>
                          +{getExchangesForDay(day).length - 3} 更多
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-light)' }}>本周时间轴详情</h3>
            <div className="relative grid" style={{ gridTemplateColumns: '60px repeat(7, 1fr)', gap: 0 }}>
              <div></div>
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs py-2 border-b" style={{ borderColor: 'var(--card-border)', color: 'var(--text-light)' }}>
                  {d}
                </div>
              ))}
              {HOURS.map((h) => (
                <>
                  <div
                    key={`h-label-${h}`}
                    className="text-xs pr-2 text-right border-t"
                    style={{
                      height: hourHeight,
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-light)',
                      paddingTop: 4,
                    }}
                  >
                    {h.toString().padStart(2, '0')}:00
                  </div>
                  {WEEKDAYS.map((_, di) => {
                    const day = weeks[0][di];
                    const dayExchanges = getExchangesForDay(day);
                    return (
                      <div
                        key={`h-${h}-${di}`}
                        className="relative border-l border-t"
                        style={{ height: hourHeight, borderColor: 'var(--card-border)' }}
                      >
                        {dayExchanges
                          .filter(e => e.startTime === h)
                          .map((ex) => {
                            const color = CATEGORY_COLORS[ex.skill?.category || ''] || '#4A6741';
                            const duration = ex.endTime - ex.startTime;
                            const other = ex.fromUserId === currentUserId ? ex.toUser : ex.fromUser;
                            const isMine = ex.fromUserId === currentUserId;
                            return (
                              <button
                                key={ex.id}
                                onClick={() => setSelected(ex)}
                                onMouseEnter={(e) => setHovered({ exchange: ex, x: e.clientX, y: e.clientY })}
                                onMouseLeave={() => setHovered(null)}
                                className="absolute left-1 right-1 top-1 rounded-lg p-1.5 text-xs text-white text-left overflow-hidden z-10"
                                style={{
                                  height: duration * hourHeight - 2,
                                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnterCapture={(e) => {
                                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
                                  (e.currentTarget as HTMLElement).style.zIndex = '20';
                                  (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                                }}
                                onMouseLeaveCapture={(e) => {
                                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                                  (e.currentTarget as HTMLElement).style.zIndex = '10';
                                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)';
                                }}
                              >
                                <div className="font-semibold truncate">{ex.skill?.title}</div>
                                <div className="flex items-center gap-1 opacity-90 truncate" style={{ fontSize: 10 }}>
                                  <User size={10} />
                                  <span>{other?.name || ''}</span>
                                  {!isMine && <span className="ml-auto">(请求)</span>}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hovered && !selected && (
        <div
          className="card p-3 fixed z-50 pointer-events-none"
          style={{
            left: Math.min(hovered.x + 12, window.innerWidth - 240),
            top: hovered.y + 12,
            width: 220,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="text-sm font-semibold">{hovered.exchange.skill?.title}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
            {(hovered.exchange.fromUserId === currentUserId ? hovered.exchange.toUser : hovered.exchange.fromUser)?.name}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--primary)' }}>
            {hovered.exchange.scheduledDate} {hovered.exchange.startTime}:00-{hovered.exchange.endTime}:00
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">{selected.skill?.title}</h3>
                <span className={`status-tag status-${selected.status} mt-2 inline-block`}>
                  {selected.status === 'pending' ? '待确认' : selected.status === 'confirmed' ? '已确认' : selected.status === 'completed' ? '已完成' : '已取消'}
                </span>
              </div>
              <button className="btn btn-ghost" onClick={() => setSelected(null)} style={{ padding: '6px 10px' }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="avatar" style={{ width: 48, height: 48, fontSize: 18, background: (selected.fromUserId === currentUserId ? selected.toUser : selected.fromUser)?.avatarColor }}>
                  {(selected.fromUserId === currentUserId ? selected.toUser : selected.fromUser)?.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{(selected.fromUserId === currentUserId ? selected.toUser : selected.fromUser)?.name}</div>
                  <div style={{ color: 'var(--text-light)' }}>
                    {selected.fromUserId === currentUserId ? '我发起的请求' : '对方向我请求'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl" style={{ background: 'rgba(74, 103, 65, 0.08)' }}>
                <div className="flex items-center gap-2">
                  <Clock size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
                    {selected.scheduledDate}  {selected.startTime}:00 - {selected.endTime}:00
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl" style={{ background: 'rgba(212, 165, 116, 0.1)' }}>
                <div className="text-xs" style={{ color: 'var(--text-light)', marginBottom: 4 }}>技能描述</div>
                <div>{selected.skill?.description}</div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button className="btn btn-primary flex-1">
                <User size={16} />
                联系对方
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
