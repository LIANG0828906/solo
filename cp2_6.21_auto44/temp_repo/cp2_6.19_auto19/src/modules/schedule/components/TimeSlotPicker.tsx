import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import type { TimeSlot } from '../../../types';
import { useScheduleStore } from '../store/scheduleStore';
import { useGroupBuyStore } from '../../groupBuy/store/groupBuyStore';

interface TimeSlotPickerProps {
  groupId: string;
  onClose: () => void;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ groupId, onClose }) => {
  const { fetchSlots, confirmSlot, loading } = useScheduleStore();
  const { groupBuys } = useGroupBuyStore();
  const [selectedDate, setSelectedDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const group = groupBuys.find((g) => g.id === groupId);
  const availableDates = group?.availableSlots
    ? [...new Set(group.availableSlots.map((s) => s.date))].sort()
    : [];

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const getSlotsForDate = (date: string): TimeSlot[] => {
    if (!group) return [];
    return group.availableSlots.filter((s) => s.date === date);
  };

  const handleConfirm = async () => {
    if (!selectedSlotId) return;
    await confirmSlot(groupId, selectedSlotId);
    onClose();
  };

  const isSlotDisabled = (slot: TimeSlot) => {
    return slot.currentCount >= slot.maxCapacity;
  };

  const isSlotAssigned = (slotId: string) => {
    return group?.assignedSlot?.id === slotId;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
        <h2 style={styles.title}>选择取货时段</h2>
        <button style={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div style={styles.content}>
        <div style={styles.dateTabs}>
          {availableDates.map((date) => (
            <div
              key={date}
              style={{
                ...styles.dateTab,
                ...(selectedDate === date ? styles.dateTabActive : {}),
              }}
              onClick={() => setSelectedDate(date)}
            >
              <div style={styles.dateDay}>{dayjs(date).format('MM/DD')}</div>
              <div style={styles.dateWeek}>{dayjs(date).format('周ddd')}</div>
            </div>
          ))}
        </div>

        <div style={styles.slotGrid}>
          {getSlotsForDate(selectedDate).map((slot) => {
            const disabled = isSlotDisabled(slot);
            const assigned = isSlotAssigned(slot.id);
            return (
              <div
                key={slot.id}
                style={{
                  ...styles.slotItem,
                  ...(disabled ? styles.slotDisabled : {}),
                  ...(assigned ? styles.slotAssigned : {}),
                  ...(selectedSlotId === slot.id ? styles.slotSelected : {}),
                }}
                onClick={() => !disabled && !assigned && setSelectedSlotId(slot.id)}
              >
                <div style={styles.slotTime}>
                  {slot.startTime} - {slot.endTime}
                </div>
                <div style={styles.slotCapacity}>
                  {assigned ? '已分配' : `${slot.currentCount}/${slot.maxCapacity}人`}
                </div>
              </div>
            );
          })}
        </div>

        {group?.assignedSlot && (
          <div style={styles.assignedInfo}>
            <span style={styles.assignedLabel}>当前分配：</span>
            <span style={styles.assignedText}>
              {dayjs(group.assignedSlot.date).format('MM月DD日')} {group.assignedSlot.startTime}-{group.assignedSlot.endTime}
            </span>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <button
          style={{ ...styles.confirmBtn, opacity: !selectedSlotId ? 0.6 : 1 }}
          onClick={handleConfirm}
          disabled={!selectedSlotId || loading}
        >
          {loading ? '确认中...' : '确认选择'}
        </button>
      </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFF8E7',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #E0D5C0',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#333',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#999',
    padding: 0,
    lineHeight: 1,
  },
  content: {
    padding: '20px',
    flex: 1,
    overflowY: 'auto',
  },
  dateTabs: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '12px',
    borderBottom: '1px solid #E0D5C0',
    marginBottom: '16px',
  },
  dateTab: {
    minWidth: '60px',
    padding: '8px 12px',
    textAlign: 'center',
    borderRadius: '8px',
    backgroundColor: '#FFF',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  dateTabActive: {
    backgroundColor: '#FF7E67',
  },
  dateDay: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  dateWeek: {
    fontSize: '11px',
    color: '#999',
    marginTop: '2px',
  },
  slotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  slotItem: {
    padding: '16px',
    backgroundColor: '#FFF',
    borderRadius: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '2px solid transparent',
  },
  slotSelected: {
    borderColor: '#4A90D9',
  },
  slotAssigned: {
    backgroundColor: '#4A90D9',
    cursor: 'default',
  },
  slotDisabled: {
    backgroundColor: '#F0F0F0',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  slotTime: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '4px',
  },
  slotCapacity: {
    fontSize: '12px',
    color: '#666',
  },
  assignedInfo: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#E8F4FD',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  assignedLabel: {
    fontSize: '12px',
    color: '#4A90D9',
  },
  assignedText: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#4A90D9',
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid #E0D5C0',
  },
  confirmBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#FF7E67',
    color: '#FFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
};
