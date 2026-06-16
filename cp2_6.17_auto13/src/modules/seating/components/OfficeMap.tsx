import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSeatStore } from '../../../stores/seatStore';
import { getEmployeeColor, getNameInitials, Seat } from '../../../assets/data';
import { createCustomDragGhost } from '../../../dragGhost';

const SEAT_SIZE = 80;
const SEAT_GAP = 8;
const CELL_SIZE = SEAT_SIZE + SEAT_GAP;

interface SeatCardProps {
  seatId: string;
  seatNumber: string;
  employeeId: string | null;
  status: string;
  col: number;
  row: number;
  onSeatClick: (seatId: string) => void;
  animTranslate: { dx: number; dy: number } | null;
  animating: boolean;
  swapDone: (seatId: string) => void;
  setSeatRef: (seatId: string, el: HTMLDivElement | null) => void;
}

const SeatCard: React.FC<SeatCardProps> = ({
  seatId,
  seatNumber,
  employeeId,
  status,
  col,
  row,
  onSeatClick,
  animTranslate,
  animating,
  swapDone,
  setSeatRef,
}) => {
  const employees = useSeatStore((s) => s.employees);
  const assignSeat = useSeatStore((s) => s.assignSeat);
  const [isDragOver, setIsDragOver] = useState(false);
  const [animClass, setAnimClass] = useState('');

  const employee = employees.find((e) => e.id === employeeId);
  const color = employee ? getEmployeeColor(employee.id) : '#2A2A3E';
  const isFree = status === 'free';

  useEffect(() => {
    let timer: number | null = null;
    if (animating && animTranslate) {
      timer = window.setTimeout(() => {
        swapDone(seatId);
      }, 500);
    }
    return () => {
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [animating, animTranslate, seatId, swapDone]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!isDragOver) setIsDragOver(true);
    },
    [isDragOver]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const data = e.dataTransfer.getData('application/employee');
      const sourceSeatId = e.dataTransfer.getData('application/sourceSeatId');

      if (isFree && data) {
        assignSeat(seatId, data);
        setAnimClass('seat-spring');
        setTimeout(() => setAnimClass(''), 300);

        if (sourceSeatId) {
          const removeSeat = useSeatStore.getState().removeSeat;
          removeSeat(sourceSeatId);
        }
      } else if (!isFree && data) {
        setAnimClass('seat-shake');
        setTimeout(() => setAnimClass(''), 1000);
      }
    },
    [seatId, isFree, assignSeat]
  );

  const handleClick = useCallback(() => {
    if (animating) return;
    onSeatClick(seatId);
  }, [seatId, onSeatClick, animating]);

  const borderStyle = isDragOver && isFree
    ? '2px solid #4CAF50'
    : '1px solid #333344';

  const transformStyle = animating && animTranslate
    ? `translate(${animTranslate.dx}px, ${animTranslate.dy}px)`
    : undefined;

  return (
    <div
      ref={(el) => setSeatRef(seatId, el)}
      className={`${animClass} ${animating ? 'seat-card-transition' : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: SEAT_SIZE,
        height: SEAT_SIZE,
        borderRadius: 8,
        backgroundColor: employeeId ? color : '#2A2A3E',
        border: borderStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: animating ? 'default' : 'pointer',
        position: 'absolute',
        left: col * CELL_SIZE,
        top: row * CELL_SIZE,
        transition: isDragOver && isFree ? 'border 0.15s ease' : 'none',
        transform: transformStyle,
        userSelect: 'none',
        zIndex: animating ? 10 : 1,
      }}
      draggable={!!employeeId && !animating}
      onDragStart={(e) => {
        if (employeeId && !animating) {
          e.dataTransfer.setData('application/employee', employeeId);
          e.dataTransfer.setData('application/sourceSeatId', seatId);
          e.dataTransfer.effectAllowed = 'move';
          const target = e.currentTarget as HTMLElement;
          createCustomDragGhost(target, SEAT_SIZE, SEAT_SIZE, e.nativeEvent);
        }
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 4,
          left: 6,
          fontSize: 10,
          color: '#FFFFFF',
          opacity: 0.7,
        }}
      >
        {seatNumber}
      </span>
      {employee && (
        <>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              backgroundColor: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#FFFFFF',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {getNameInitials(employee.name)}
          </div>
          <span
            style={{
              fontSize: 12,
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            {getNameInitials(employee.name)}
          </span>
        </>
      )}
      {status === 'pending_approval' && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#FFCA28',
          }}
        />
      )}
    </div>
  );
};

const SeatDetailModal: React.FC<{
  seatId: string;
  onClose: () => void;
  onRequestSwap: (employeeId: string, fromSeatId: string) => void;
}> = ({ seatId, onClose, onRequestSwap }) => {
  const seats = useSeatStore((s) => s.seats);
  const employees = useSeatStore((s) => s.employees);
  const removeSeat = useSeatStore((s) => s.removeSeat);

  const seat = seats.find((s) => s.id === seatId);
  if (!seat) return null;

  const employee = employees.find((e) => e.id === seat.employeeId);
  const color = employee ? getEmployeeColor(employee.id) : '#2A2A3E';

  const handleRemove = () => {
    removeSeat(seatId);
    onClose();
  };

  const handleSwapRequest = () => {
    if (employee) {
      onRequestSwap(employee.id, seatId);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#00000066',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#2D2D44',
          borderRadius: 16,
          padding: 24,
          minWidth: 280,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {employee && (
          <>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#FFFFFF',
                fontWeight: 600,
              }}
            >
              {getNameInitials(employee.name)}
            </div>
            <div style={{ fontSize: 18, color: '#E0E0E0', fontWeight: 600 }}>
              {employee.name}
            </div>
            <div style={{ fontSize: 14, color: '#888888' }}>
              当前座位: {seat.seatNumber}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={handleSwapRequest}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#2196F3',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                申请换座
              </button>
              <button
                onClick={handleRemove}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#F44336',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                移除员工
              </button>
            </div>
          </>
        )}
        {!employee && (
          <>
            <div style={{ fontSize: 16, color: '#888888' }}>空闲座位</div>
            <div style={{ fontSize: 14, color: '#888888' }}>
              工位编号: {seat.seatNumber}
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '8px 20px',
                backgroundColor: '#333344',
                color: '#E0E0E0',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              关闭
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const ConfirmSwapDialog: React.FC<{
  employeeId: string;
  fromSeatId: string;
  toSeatId: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ employeeId, fromSeatId, toSeatId, onConfirm, onCancel }) => {
  const seats = useSeatStore((s) => s.seats);
  const employees = useSeatStore((s) => s.employees);

  const employee = employees.find((e) => e.id === employeeId);
  const fromSeat = seats.find((s) => s.id === fromSeatId);
  const toSeat = seats.find((s) => s.id === toSeatId);

  if (!employee || !fromSeat || !toSeat) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#00000066',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1002,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#2D2D44',
          borderRadius: 12,
          padding: 24,
          minWidth: 300,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h3 style={{ color: '#E0E0E0', fontSize: 16, margin: 0, textAlign: 'center' }}>
          确认换座申请
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            gap: 16,
            padding: '12px 0',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#888888' }}>当前座位</span>
            <span style={{ fontSize: 16, color: '#E0E0E0', fontWeight: 600 }}>
              {fromSeat.seatNumber}
            </span>
          </div>
          <span style={{ fontSize: 24, color: '#888888' }}>→</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#888888' }}>目标座位</span>
            <span style={{ fontSize: 16, color: '#66BB6A', fontWeight: 600 }}>
              {toSeat.seatNumber}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#888888', textAlign: 'center' }}>
          申请人: <span style={{ color: '#E0E0E0' }}>{employee.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '8px 0',
              backgroundColor: '#333344',
              color: '#E0E0E0',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '8px 0',
              backgroundColor: '#2196F3',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            确认提交
          </button>
        </div>
      </div>
    </div>
  );
};

const SwapSeatDialog: React.FC<{
  employeeId: string;
  fromSeatId: string;
  onClose: () => void;
}> = ({ employeeId, fromSeatId, onClose }) => {
  const seats = useSeatStore((s) => s.seats);
  const submitSwap = useSeatStore((s) => s.submitSwap);
  const employees = useSeatStore((s) => s.employees);
  const [pendingSeatId, setPendingSeatId] = useState<string | null>(null);

  const freeSeats = seats.filter((s) => s.status === 'free');
  const employee = employees.find((e) => e.id === employeeId);

  const handleSelect = (toSeatId: string) => {
    const targetSeat = seats.find((s) => s.id === toSeatId);
    if (!targetSeat || targetSeat.status !== 'free') {
      alert('该座位已被占用，请重新选择');
      return;
    }
    setPendingSeatId(toSeatId);
  };

  const handleConfirm = () => {
    if (!pendingSeatId || !employee) return;
    const targetSeat = seats.find((s) => s.id === pendingSeatId);
    if (!targetSeat || targetSeat.status !== 'free') {
      alert('该座位已被占用，请重新选择');
      setPendingSeatId(null);
      return;
    }
    submitSwap(employeeId, fromSeatId, pendingSeatId);
    onClose();
  };

  const handleCancelConfirm = () => {
    setPendingSeatId(null);
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#00000066',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          animation: 'fadeIn 0.2s ease',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#2D2D44',
            borderRadius: 12,
            padding: 20,
            minWidth: 260,
            maxHeight: 400,
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <h3 style={{ color: '#E0E0E0', fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
            选择目标座位
          </h3>
          {freeSeats.length === 0 && (
            <div style={{ color: '#888888', fontSize: 14, textAlign: 'center', padding: 16 }}>
              没有可用的空闲座位
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {freeSeats.map((seat) => (
              <div
                key={seat.id}
                onClick={() => handleSelect(seat.id)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#3A3A55',
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: '#E0E0E0',
                  fontSize: 14,
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#4A4A66';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#3A3A55';
                }}
              >
                {seat.seatNumber}
              </div>
            ))}
          </div>
        </div>
      </div>
      {pendingSeatId && (
        <ConfirmSwapDialog
          employeeId={employeeId}
          fromSeatId={fromSeatId}
          toSeatId={pendingSeatId}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
        />
      )}
    </>
  );
};

const OfficeMap: React.FC = () => {
  const seats = useSeatStore((s) => s.seats);
  const lastApprovedSwap = useSeatStore((s) => s.lastApprovedSwap);
  const clearLastApprovedSwap = useSeatStore((s) => s.clearLastApprovedSwap);

  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [swapDialogData, setSwapDialogData] = useState<{
    employeeId: string;
    fromSeatId: string;
  } | null>(null);

  const seatRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [animatingSeats, setAnimatingSeats] = useState<
    Record<string, { dx: number; dy: number } | null>
  >({});
  const [swapping, setSwapping] = useState(false);

  const handleSeatClick = useCallback((seatId: string) => {
    setSelectedSeatId(seatId);
  }, []);

  const handleRequestSwap = useCallback((employeeId: string, fromSeatId: string) => {
    setSwapDialogData({ employeeId, fromSeatId });
    setSelectedSeatId(null);
  }, []);

  const setSeatRef = useCallback((seatId: string, el: HTMLDivElement | null) => {
    if (el) {
      seatRefs.current.set(seatId, el);
    } else {
      seatRefs.current.delete(seatId);
    }
  }, []);

  const swapDone = useCallback((seatId: string) => {
    setAnimatingSeats((prev) => {
      const next = { ...prev };
      next[seatId] = null;
      const anyAnimating = Object.values(next).some((v) => v !== null);
      if (!anyAnimating) {
        setTimeout(() => setSwapping(false), 50);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (lastApprovedSwap && !swapping) {
      const { fromSeatId, toSeatId } = lastApprovedSwap;
      const fromEl = seatRefs.current.get(fromSeatId);
      const toEl = seatRefs.current.get(toSeatId);

      if (fromEl && toEl) {
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const dx = toRect.left - fromRect.left;
        const dy = toRect.top - fromRect.top;

        setSwapping(true);
        setAnimatingSeats({
          [fromSeatId]: { dx, dy },
          [toSeatId]: { dx: -dx, dy: -dy },
        });
      }

      clearLastApprovedSwap();
    }
  }, [lastApprovedSwap, swapping, clearLastApprovedSwap]);

  const gridWidth = 5 * CELL_SIZE - SEAT_GAP + 8;
  const gridHeight = 4 * CELL_SIZE - SEAT_GAP + 8;

  return (
    <div
      style={{
        position: 'relative',
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 15,
          color: '#888888',
          marginBottom: 12,
        }}
      >
        办公区平面图
      </div>
      <div
        style={{
          position: 'relative',
          width: gridWidth,
          height: gridHeight,
          backgroundImage:
            'linear-gradient(#333344 1px, transparent 1px), linear-gradient(90deg, #333344 1px, transparent 1px)',
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          padding: 4,
          borderRadius: 8,
        }}
      >
        {seats.map((seat: Seat) => (
          <SeatCard
            key={seat.id}
            seatId={seat.id}
            seatNumber={seat.seatNumber}
            employeeId={seat.employeeId}
            status={seat.status}
            col={seat.position.x}
            row={seat.position.y}
            onSeatClick={handleSeatClick}
            animTranslate={animatingSeats[seat.id] || null}
            animating={!!animatingSeats[seat.id]}
            swapDone={swapDone}
            setSeatRef={setSeatRef}
          />
        ))}
      </div>

      {selectedSeatId && (
        <SeatDetailModal
          seatId={selectedSeatId}
          onClose={() => setSelectedSeatId(null)}
          onRequestSwap={handleRequestSwap}
        />
      )}

      {swapDialogData && (
        <SwapSeatDialog
          employeeId={swapDialogData.employeeId}
          fromSeatId={swapDialogData.fromSeatId}
          onClose={() => setSwapDialogData(null)}
        />
      )}
    </div>
  );
};

export default OfficeMap;
