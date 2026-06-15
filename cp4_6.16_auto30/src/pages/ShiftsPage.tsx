import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useShiftsStore, SHIFT_LABELS, SHIFT_HOURS, SHIFT_COLORS, ShiftType, serializeDate } from '../shifts';
import { useWorkersStore, ROLE_COLORS, ROLE_LABELS } from '../workers';

interface DragData {
  workerId: string;
  fromDate: string;
  fromShift: ShiftType;
}

export default function ShiftsPage() {
  const { currentWeekStart, getWeekDays, nextWeek, prevWeek, moveWorker, hasConflict, setConflict, exportWeekJSON, getWorkersForShift, conflictInfo } = useShiftsStore();
  const { workers, getWorker } = useWorkersStore();
  const [dragData, setDragData] = useState<DragData | null>(null);
  const [dropTarget, setDropTarget] = useState<{ date: string; shift: ShiftType } | null>(null);

  const weekDays = useMemo(() => getWeekDays(), [currentWeekStart, getWeekDays]);
  const shifts: ShiftType[] = ['morning', 'evening', 'night'];

  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${format(start, 'yyyy年MM月dd日', { locale: zhCN })} - ${format(end, 'MM月dd日', { locale: zhCN })}`;
  }, [weekDays]);

  const handleDragStart = useCallback((e: React.DragEvent, workerId: string, date: string, shift: ShiftType) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragData({ workerId, fromDate: date, fromShift: shift });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragData(null);
    setDropTarget(null);
    setConflict(null);
  }, [setConflict]);

  const handleDragOver = useCallback((e: React.DragEvent, date: string, shift: ShiftType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragData) return;

    if (dragData.workerId && (dragData.fromDate !== date || dragData.fromShift !== shift)) {
      const isConflict = hasConflict(date, shift, dragData.workerId);
      if (isConflict) {
        setConflict({ date, shift });
        setDropTarget(null);
      } else {
        setDropTarget({ date, shift });
        setConflict(null);
      }
    }
  }, [dragData, hasConflict, setConflict]);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toDate: string, toShift: ShiftType) => {
    e.preventDefault();
    if (!dragData) return;

    const result = moveWorker(
      dragData.fromDate,
      dragData.fromShift,
      dragData.workerId,
      toDate,
      toShift
    );

    if (result.conflict) {
      setConflict({ date: toDate, shift: toShift });
      setTimeout(() => setConflict(null), 600);
    }

    setDragData(null);
    setDropTarget(null);
  }, [dragData, moveWorker, setConflict]);

  const handleExport = () => {
    const json = exportWeekJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `排班表_${format(weekDays[0], 'yyyy-MM-dd')}_${format(weekDays[6], 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderWorkerCard = (workerId: string, date: string, shift: ShiftType) => {
    const worker = getWorker(workerId);
    if (!worker) return null;

    const isDragging = dragData?.workerId === workerId;

    return (
      <div
        key={workerId}
        draggable
        onDragStart={(e) => handleDragStart(e, workerId, date, shift)}
        onDragEnd={handleDragEnd}
        className={`bounce-animation ${isDragging ? 'worker-card-dragging' : ''}`}
        style={{
          padding: '6px 8px',
          borderRadius: '6px',
          background: `linear-gradient(135deg, ${ROLE_COLORS[worker.role]} 0%, rgba(255,255,255,0.2) 100%)`,
          color: 'white',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'grab',
          border: '1px solid rgba(255,255,255,0.3)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.5)',
          flexShrink: 0,
          background: '#F4E4C1',
        }}>
          <img src={worker.avatar} alt={worker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{worker.name}</span>
      </div>
    );
  };

  const renderShiftSlot = (date: string, shift: ShiftType) => {
    const workerIds = getWorkersForShift(date, shift);
    const dateKey = serializeDate(new Date(date));
    const isDropTarget = dropTarget?.date === dateKey && dropTarget?.shift === shift;
    const isConflict = conflictInfo?.date === dateKey && conflictInfo?.shift === shift;

    return (
      <div
        key={`${dateKey}-${shift}`}
        onDragOver={(e) => handleDragOver(e, dateKey, shift)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, dateKey, shift)}
        className={`${isConflict ? 'shift-slot-highlight conflict-flash' : ''} ${isDropTarget ? 'shift-slot-drop-target' : ''}`}
        style={{
          minHeight: '80px',
          padding: '8px',
          borderRadius: '6px',
          background: 'rgba(244, 228, 193, 0.1)',
          border: '2px dashed rgba(201, 168, 76, 0.3)',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          alignContent: 'flex-start',
        }}
      >
        {workerIds.length === 0 ? (
          <span style={{ color: 'rgba(232, 213, 183, 0.3)', fontSize: '11px', fontStyle: 'italic' }}>
            拖拽员工至此
          </span>
        ) : (
          workerIds.map((wid) => renderWorkerCard(wid, dateKey, shift))
        )}
      </div>
    );
  };

  const renderDesktopView = () => (
    <div className="glass-card" style={{ padding: '20px', overflow: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(7, 1fr)', gap: '12px' }}>
        <div style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#C9A84C' }}>
          班次
        </div>
        {weekDays.map((day) => {
          const dateKey = serializeDate(day);
          const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
          return (
            <div key={dateKey} style={{
              padding: '12px',
              textAlign: 'center',
              background: isToday ? 'linear-gradient(135deg, rgba(46,74,46,0.6) 0%, rgba(61,107,61,0.4) 100%)' : 'rgba(201, 168, 76, 0.1)',
              borderRadius: '8px',
              border: isToday ? '2px solid #C9A84C' : '1px solid rgba(201, 168, 76, 0.2)',
            }}>
              <div style={{ fontWeight: 700, color: isToday ? '#E8C56D' : '#e8d5b7', fontSize: '14px' }}>
                {format(day, 'EEEE', { locale: zhCN })}
              </div>
              <div style={{ fontSize: '12px', color: isToday ? '#C9A84C' : 'rgba(232,213,183,0.7)', marginTop: '4px' }}>
                {format(day, 'MM/dd')}
              </div>
            </div>
          );
        })}

        {shifts.map((shift) => (
          <>
            <div key={shift} style={{
              padding: '12px 8px',
              borderRadius: '8px',
              background: SHIFT_COLORS[shift],
              color: 'white',
              fontWeight: 600,
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              <div style={{ fontSize: '14px' }}>{SHIFT_LABELS[shift]}</div>
              <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>{SHIFT_HOURS[shift]}</div>
            </div>
            {weekDays.map((day) => (
              <div key={`${serializeDate(day)}-${shift}-col`}>
                {renderShiftSlot(format(day, 'yyyy-MM-dd'), shift)}
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  );

  const renderMobileView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {weekDays.map((day) => {
        const dateKey = serializeDate(day);
        const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
        return (
          <div key={dateKey} className="glass-card" style={{ padding: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              marginBottom: '14px',
              borderRadius: '8px',
              background: isToday ? 'linear-gradient(135deg, rgba(46,74,46,0.6) 0%, rgba(61,107,61,0.4) 100%)' : 'rgba(201, 168, 76, 0.1)',
              border: isToday ? '2px solid #C9A84C' : '1px solid rgba(201, 168, 76, 0.2)',
            }}>
              <span style={{ fontWeight: 700, color: isToday ? '#E8C56D' : '#e8d5b7' }}>
                {format(day, 'EEEE', { locale: zhCN })}
              </span>
              <span style={{ fontSize: '14px', color: isToday ? '#C9A84C' : 'rgba(232,213,183,0.7)' }}>
                {format(day, 'MM月dd日')}
              </span>
            </div>
            {shifts.map((shift) => (
              <div key={shift} style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: SHIFT_COLORS[shift],
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '13px',
                  marginBottom: '8px',
                }}>
                  <span style={{ marginRight: '8px' }}>{SHIFT_LABELS[shift]}</span>
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>{SHIFT_HOURS[shift]}</span>
                </div>
                {renderShiftSlot(format(day, 'yyyy-MM-dd'), shift)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: '#E8C56D', fontFamily: 'Cinzel, serif', fontSize: '32px', textShadow: '0 0 20px rgba(201,168,76,0.4)' }}>
            📜 排班表
          </h1>
          <p style={{ color: '#C9A84C', marginTop: '6px', fontSize: '15px' }}>{weekLabel}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={prevWeek}>◀ 上一周</button>
          <button className="btn btn-primary" onClick={() => useShiftsStore.getState().setCurrentWeek(new Date())}>
            本周
          </button>
          <button className="btn" onClick={nextWeek}>下一周 ▶</button>
          <button className="btn btn-primary" onClick={handleExport}>
            📥 导出JSON
          </button>
        </div>
      </div>

      {workers.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📜</div>
          <p style={{ color: '#e8d5b7', fontSize: '18px', opacity: 0.8 }}>暂无冒险者可以排班</p>
          <p style={{ color: '#C9A84C', marginTop: '8px' }}>请先前往员工管理页面招募冒险者！</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'none' }}>{/* 占位符 */}</div>
          <div style={{ display: 'block' }} className="desktop-view">
            <style>{`
              @media (max-width: 900px) {
                .desktop-view { display: none !important; }
                .mobile-view { display: flex !important; }
              }
              @media (min-width: 901px) {
                .desktop-view { display: block !important; }
                .mobile-view { display: none !important; }
              }
            `}</style>
            {renderDesktopView()}
          </div>
          <div className="mobile-view" style={{ display: 'none' }}>
            {renderMobileView()}
          </div>
        </>
      )}
    </div>
  );
}
