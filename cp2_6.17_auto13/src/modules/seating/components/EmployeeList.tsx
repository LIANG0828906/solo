import React, { useCallback } from 'react';
import { useSeatStore } from '../../../stores/seatStore';
import { getEmployeeColor, getNameInitials } from '../../../assets/data';

const EmployeeItem: React.FC<{
  employeeId: string;
  name: string;
}> = ({ employeeId, name }) => {
  const color = getEmployeeColor(employeeId);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('application/employee', employeeId);
      e.dataTransfer.effectAllowed = 'move';
      const el = e.currentTarget.cloneNode(true) as HTMLElement;
      el.style.transform = 'scale(0.8)';
      el.style.opacity = '0.6';
      el.style.position = 'absolute';
      el.style.top = '-9999px';
      document.body.appendChild(el);
      e.dataTransfer.setDragImage(el, 18, 18);
      requestAnimationFrame(() => document.body.removeChild(el));
    },
    [employeeId]
  );

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        cursor: 'grab',
        transition: 'background-color 0.15s ease',
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = '#3A3A55';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          color: '#FFFFFF',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {getNameInitials(name)}
      </div>
      <span style={{ fontSize: 14, color: '#E0E0E0' }}>{name}</span>
    </div>
  );
};

const EmployeeList: React.FC = () => {
  const seats = useSeatStore((s) => s.seats);
  const employees = useSeatStore((s) => s.employees);

  const assignedIds = new Set(
    seats.filter((s) => s.employeeId).map((s) => s.employeeId)
  );
  const unassigned = employees.filter((e) => !assignedIds.has(e.id));

  return (
    <div
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
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
        未分配员工
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {unassigned.length === 0 && (
          <div style={{ fontSize: 14, color: '#666666', padding: '16px 0', textAlign: 'center' }}>
            所有员工已就位
          </div>
        )}
        {unassigned.map((emp) => (
          <EmployeeItem key={emp.id} employeeId={emp.id} name={emp.name} />
        ))}
      </div>
    </div>
  );
};

export default EmployeeList;
