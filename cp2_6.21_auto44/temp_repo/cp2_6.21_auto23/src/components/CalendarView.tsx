import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { usePetStore } from '@/store/petStore';
import { TIME_SLOTS } from '@/types';
import type { Appointment } from '@/types';
import ReviewForm from './ReviewForm';

export default function CalendarView() {
  const {
    appointments,
    pets,
    services,
    updateAppointment,
    canMoveAppointment,
    completeAppointment,
    getAppointmentReview,
  } = usePetStore();

  const [weekOffset, setWeekOffset] = useState(0);
  const [dragging, setDragging] = useState<Appointment | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState<{ date: string; timeSlot: string } | null>(null);
  const [reviewAptId, setReviewAptId] = useState<string | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 9 });

  const weekDays = useMemo(() => {
    const start = dayjs().startOf('week').add(weekOffset * 7, 'day');
    return Array.from({ length: 7 }, (_, i) => {
      const d = start.add(i, 'day');
      return {
        value: d.format('YYYY-MM-DD'),
        label: d.format('MM/DD'),
        weekday: d.format('ddd'),
        isToday: d.isSame(dayjs(), 'day'),
      };
    });
  }, [weekOffset]);

  const filteredAppointments = useMemo(() => {
    const weekStart = weekDays[0].value;
    const weekEnd = weekDays[6].value;
    return appointments.filter((a) => a.date >= weekStart && a.date <= weekEnd);
  }, [appointments, weekDays]);

  const limitedAppointments = useMemo(() => {
    return filteredAppointments.slice(0, 50);
  }, [filteredAppointments]);

  const getPetName = (petId: string) => pets.find((p) => p.id === petId)?.name ?? '未知';
  const getPetAvatar = (petId: string) => pets.find((p) => p.id === petId)?.avatar ?? '🐾';
  const getServiceName = (serviceId: string) => services.find((s) => s.id === serviceId)?.name ?? '未知';

  const getAppointmentAt = (date: string, timeSlot: string) =>
    limitedAppointments.find((a) => a.date === date && a.timeSlot === timeSlot);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, apt: Appointment) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(apt);
      setDragPos({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      setDragPos({ x: e.clientX, y: e.clientY });

      if (gridRef.current) {
        const elements = gridRef.current.querySelectorAll('[data-slot]');
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          ) {
            const date = (el as HTMLElement).dataset.date!;
            const timeSlot = (el as HTMLElement).dataset.slot!;
            setDropTarget({ date, timeSlot });
            return;
          }
        }
        setDropTarget(null);
      }
    },
    [dragging]
  );

  const handlePointerUp = useCallback(() => {
    if (dragging && dropTarget) {
      if (canMoveAppointment(dragging.id, dropTarget.date, dropTarget.timeSlot)) {
        updateAppointment(dragging.id, {
          date: dropTarget.date,
          timeSlot: dropTarget.timeSlot,
        });
      }
    }
    setDragging(null);
    setDropTarget(null);
  }, [dragging, dropTarget, canMoveAppointment, updateAppointment]);

  useEffect(() => {
    const handleKeyUp = () => {
      if (dragging) {
        setDragging(null);
        setDropTarget(null);
      }
    };
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [dragging]);

  const handleScroll = useCallback(() => {
    if (!gridRef.current) return;
    const scrollTop = gridRef.current.scrollTop;
    const rowHeight = 64;
    const startIdx = Math.floor(scrollTop / rowHeight);
    const visibleCount = Math.ceil(gridRef.current.clientHeight / rowHeight);
    setVisibleRange({
      start: Math.max(0, startIdx - 1),
      end: Math.min(TIME_SLOTS.length, startIdx + visibleCount + 2),
    });
  }, []);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#e0d6c8] bg-white px-4 py-3">
        <button
          className="ripple-btn rounded-lg border border-[#e0d6c8] px-3 py-1.5 text-sm font-medium text-[#3e3228] transition-colors hover:bg-[#fef9f2]"
          onClick={() => setWeekOffset((w) => w - 1)}
        >
          ← 上一周
        </button>
        <span className="text-sm font-bold text-[#3e3228]">
          {weekDays[0].label} - {weekDays[6].label}
        </span>
        <button
          className="ripple-btn rounded-lg border border-[#e0d6c8] px-3 py-1.5 text-sm font-medium text-[#3e3228] transition-colors hover:bg-[#fef9f2]"
          onClick={() => setWeekOffset((w) => w + 1)}
        >
          下一周 →
        </button>
      </div>

      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#e0d6c8] bg-white">
        <div className="p-2" />
        {weekDays.map((d) => (
          <div
            key={d.value}
            className={`border-l border-[#e0d6c8] p-2 text-center text-xs font-semibold ${
              d.isToday ? 'text-[#4caf50]' : 'text-[#7a6e62]'
            }`}
          >
            <div>{d.weekday}</div>
            <div className={d.isToday ? 'rounded-full bg-[#4caf50] text-white' : ''}>{d.label}</div>
          </div>
        ))}
      </div>

      <div
        ref={gridRef}
        className="calendar-grid flex-1 overflow-y-auto"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {TIME_SLOTS.map((slot, slotIdx) => {
          if (slotIdx < visibleRange.start || slotIdx > visibleRange.end) {
            return (
              <div key={slot} className="grid grid-cols-[60px_repeat(7,1fr)]" style={{ height: 64 }} />
            );
          }
          return (
            <div key={slot} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#f0ebe4]" style={{ minHeight: 64 }}>
              <div className="flex items-start justify-center pt-2 text-xs text-[#a09488]">{slot}</div>
              {weekDays.map((d) => {
                const apt = getAppointmentAt(d.value, slot);
                const isTarget = dropTarget?.date === d.value && dropTarget?.timeSlot === slot;
                const isDragSource = dragging?.date === d.value && dragging?.timeSlot === slot;
                const isOccupied = !!apt && apt.id !== dragging?.id;

                return (
                  <div
                    key={`${d.value}-${slot}`}
                    data-slot={slot}
                    data-date={d.value}
                    className={`relative border-l border-[#f0ebe4] p-1 transition-colors ${
                      isTarget && !isOccupied ? 'bg-[#e8f5e9]/60' : isTarget && isOccupied ? 'bg-red-50' : ''
                    }`}
                    style={{ minHeight: 64 }}
                  >
                    {apt && !isDragSource && (
                      <div
                        className={`ripple-btn group cursor-grab rounded-lg p-1.5 text-xs transition-all active:cursor-grabbing ${
                          apt.status === 'completed'
                            ? 'bg-[#e8f5e9]'
                            : 'bg-[#fff3e0]'
                        }`}
                        onPointerDown={(e) => apt.status !== 'completed' && handlePointerDown(e, apt)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#3e3228]">
                            {getPetAvatar(apt.petId)} {getPetName(apt.petId)}
                          </span>
                          {apt.status === 'completed' && (
                            <span className="rounded-[3px] bg-[#4caf50] px-1 py-0.5 text-[10px] font-bold text-white">
                              已完成
                            </span>
                          )}
                        </div>
                        <div className="text-[#7a6e62]">{getServiceName(apt.serviceId)}</div>
                        <div className="text-[#a09488]">{apt.timeSlot}</div>
                        {apt.status === 'completed' && !getAppointmentReview(apt.id) && (
                          <button
                            className="ripple-btn mt-1 w-full rounded bg-[#4caf50] px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-[#388e3c]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewAptId(apt.id);
                            }}
                          >
                            去评价
                          </button>
                        )}
                        {apt.status === 'pending' && (
                          <button
                            className="ripple-btn mt-1 w-full rounded bg-[#ff9800] px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-[#f57c00]"
                            onClick={(e) => {
                              e.stopPropagation();
                              completeAppointment(apt.id);
                            }}
                          >
                            标记完成
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {dragging && (
        <div
          ref={ghostRef}
          className="drag-ghost"
          style={{
            left: dragPos.x - 80,
            top: dragPos.y - 24,
            padding: '8px 12px',
            minWidth: 140,
          }}
        >
          <div className="text-sm font-semibold text-[#3e3228]">
            {getPetAvatar(dragging.petId)} {getPetName(dragging.petId)}
          </div>
          <div className="text-xs text-[#7a6e62]">{getServiceName(dragging.serviceId)}</div>
          <div className="text-xs text-[#a09488]">{dragging.timeSlot}</div>
        </div>
      )}

      {reviewAptId && (
        <ReviewForm
          appointmentId={reviewAptId}
          onClose={() => setReviewAptId(null)}
        />
      )}
    </div>
  );
}
