import React, { useState, useCallback } from 'react';
import { useSeatStore } from '../../../stores/seatStore';
import { getEmployeeColor, getNameInitials } from '../../../assets/data';

interface SwapCardProps {
  requestId: string;
  employeeId: string;
  fromSeatId: string;
  toSeatId: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const SwapCard: React.FC<SwapCardProps> = ({
  requestId,
  employeeId,
  fromSeatId,
  toSeatId,
  onApprove,
  onReject,
}) => {
  const employees = useSeatStore((s) => s.employees);
  const seats = useSeatStore((s) => s.seats);
  const [isRemoving, setIsRemoving] = useState(false);

  const employee = employees.find((e) => e.id === employeeId);
  const fromSeat = seats.find((s) => s.id === fromSeatId);
  const toSeat = seats.find((s) => s.id === toSeatId);
  const toEmployee = toSeat?.employeeId
    ? employees.find((e) => e.id === toSeat.employeeId)
    : null;

  const color = employee ? getEmployeeColor(employee.id) : '#78909C';

  const handleApprove = useCallback(() => {
    setIsRemoving(true);
    setTimeout(() => {
      onApprove(requestId);
    }, 300);
  }, [requestId, onApprove]);

  const handleReject = useCallback(() => {
    setIsRemoving(true);
    setTimeout(() => {
      onReject(requestId);
    }, 300);
  }, [requestId, onReject]);

  if (!employee) return null;

  return (
    <div
      className={`swap-card ${isRemoving ? 'removing' : ''}`}
      style={{
        backgroundColor: '#2D2D44',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              backgroundColor: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              color: '#FFFFFF',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {getNameInitials(employee.name)}
          </div>
          <span style={{ fontSize: 14, color: '#E0E0E0' }}>{employee.name}</span>
        </div>

        <span style={{ fontSize: 24, color: '#888888', flexShrink: 0 }}>→</span>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'flex-end' }}>
          <span style={{ fontSize: 14, color: '#E0E0E0' }}>
            {toSeat?.seatNumber || ''}
          </span>
          {toEmployee && (
            <span style={{ fontSize: 12, color: '#888888' }}>
              {toEmployee.name}
            </span>
          )}
          {!toEmployee && (
            <span style={{ fontSize: 12, color: '#66BB6A' }}>空闲</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleApprove}
          style={{
            flex: 1,
            padding: '8px 0',
            backgroundColor: '#4CAF50',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 18,
            fontWeight: 500,
            transition: 'transform 0.2s ease',
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          批准
        </button>
        <button
          onClick={handleReject}
          style={{
            flex: 1,
            padding: '8px 0',
            backgroundColor: '#F44336',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 18,
            fontWeight: 500,
            transition: 'transform 0.2s ease',
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          拒绝
        </button>
      </div>
    </div>
  );
};

const SwapRequestPanel: React.FC = () => {
  const swapRequests = useSeatStore((s) => s.swapRequests);
  const approveSwap = useSeatStore((s) => s.approveSwap);
  const rejectSwap = useSeatStore((s) => s.rejectSwap);

  const pendingRequests = swapRequests.filter((r) => r.status === 'pending');

  return (
    <div
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'rgba(26, 26, 44, 0.85)',
      }}
    >
      <div
        style={{
          fontSize: 15,
          color: '#E0E0E0',
          fontWeight: 600,
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        换座审批
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {pendingRequests.length === 0 && (
          <div style={{ fontSize: 14, color: '#666666', padding: '24px 0', textAlign: 'center' }}>
            暂无待审批的换座申请
          </div>
        )}
        {pendingRequests.map((req) => (
          <SwapCard
            key={req.id}
            requestId={req.id}
            employeeId={req.employeeId}
            fromSeatId={req.fromSeatId}
            toSeatId={req.toSeatId}
            onApprove={approveSwap}
            onReject={rejectSwap}
          />
        ))}
      </div>
    </div>
  );
};

export default SwapRequestPanel;
