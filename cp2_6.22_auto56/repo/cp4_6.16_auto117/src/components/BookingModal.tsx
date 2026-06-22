import { useState, useEffect } from 'react';
import type { Room, Booking, Team } from '../types';
import { generateTimeSlots, parseTime, getTodayString } from '../utils/dateUtils';
import { useHubDeskStore } from '../store';

interface BookingModalProps {
  room: Room | null;
  booking?: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  initialStartTime?: string;
  initialEndTime?: string;
  initialDate?: string;
}

export default function BookingModal({
  room,
  booking,
  isOpen,
  onClose,
  initialStartTime,
  initialEndTime,
  initialDate,
}: BookingModalProps) {
  const { teams, addBooking, updateBooking, deleteBooking, isTimeSlotAvailable } = useHubDeskStore();
  
  const [formData, setFormData] = useState({
    date: getTodayString(),
    startTime: '09:00',
    endTime: '10:00',
    teamId: '',
    purpose: '',
  });
  
  const [isClosing, setIsClosing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      if (booking) {
        setFormData({
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          teamId: booking.teamId,
          purpose: booking.purpose,
        });
      } else {
        setFormData({
          date: initialDate || getTodayString(),
          startTime: initialStartTime || '09:00',
          endTime: initialEndTime || '10:00',
          teamId: teams[0]?.id || '',
          purpose: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, booking, initialDate, initialStartTime, initialEndTime, teams]);

  const timeSlots = generateTimeSlots(8, 22, 30);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) newErrors.date = '请选择日期';
    if (!formData.teamId) newErrors.teamId = '请选择团队';
    if (!formData.purpose.trim()) newErrors.purpose = '请填写用途';
    
    const start = parseTime(formData.startTime);
    const end = parseTime(formData.endTime);
    if (start >= end) newErrors.time = '结束时间必须晚于开始时间';
    
    if (room && !isTimeSlotAvailable(room.id, formData.date, formData.startTime, formData.endTime, booking?.id)) {
      newErrors.time = '该时段已被预订';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !room) return;
    
    if (booking) {
      updateBooking(booking.id, {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        teamId: formData.teamId,
        purpose: formData.purpose,
      });
    } else {
      addBooking({
        roomId: room.id,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        teamId: formData.teamId,
        purpose: formData.purpose,
      });
    }
    
    handleClose();
  };

  const handleDelete = () => {
    if (booking && window.confirm('确定要取消此预订吗？')) {
      deleteBooking(booking.id);
      handleClose();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen || !room) return null;

  return (
    <>
      <div className="modal-overlay" onClick={handleBackdropClick}>
        <div className={`modal-content ${isClosing ? 'closing' : ''}`}>
          <div className="modal-header">
            <h2 className="modal-title">
              {booking ? '编辑预订' : '预订会议室'}
            </h2>
            <button className="modal-close" onClick={handleClose}>
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div className="room-info-bar">
              <span className="room-icon">🏢</span>
              <div>
                <div className="room-name">{room.name}</div>
                <div className="room-capacity">容纳 {room.capacity} 人 · {room.floor}层</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-row">
                <div className="form-group">
                  <label>选择日期 *</label>
                  <input
                    type="date"
                    value={formData.date}
                    min={getTodayString()}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={errors.date ? 'error' : ''}
                  />
                  {errors.date && <span className="error-message">{errors.date}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>开始时间 *</label>
                  <select
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  >
                    {timeSlots.slice(0, -1).map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>结束时间 *</label>
                  <select
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  >
                    {timeSlots.slice(1).map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
              {errors.time && <span className="error-message">{errors.time}</span>}

              <div className="form-row">
                <div className="form-group">
                  <label>选择团队 *</label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                    className={errors.teamId ? 'error' : ''}
                  >
                    <option value="">请选择团队</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {errors.teamId && <span className="error-message">{errors.teamId}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>会议用途 *</label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="请输入会议用途"
                    rows={3}
                    className={errors.purpose ? 'error' : ''}
                  />
                  {errors.purpose && <span className="error-message">{errors.purpose}</span>}
                </div>
              </div>

              <div className="modal-actions">
                {booking && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDelete}
                  >
                    取消预订
                  </button>
                )}
                <div className="action-buttons">
                  <button type="button" className="btn btn-secondary" onClick={handleClose}>
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {booking ? '保存修改' : '确认预订'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .modal-body {
          padding: var(--spacing-lg);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--color-border);
        }

        .modal-title {
          font-size: var(--font-size-lg);
          font-weight: 600;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border: none;
          background: var(--color-bg-primary);
          border-radius: var(--radius-button);
          font-size: var(--font-size-base);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .modal-close:hover {
          background: #e5e7eb;
        }

        .room-info-bar {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-bg-primary);
          border-radius: var(--radius-card);
          margin-bottom: var(--spacing-lg);
        }

        .room-icon {
          font-size: var(--font-size-2xl);
        }

        .room-info-bar .room-name {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .room-capacity {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .booking-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .form-row:first-child,
        .form-row:last-child {
          grid-template-columns: 1fr;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .form-group label {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-button);
          font-size: var(--font-size-base);
          background: white;
          transition: all var(--transition-fast);
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input.error,
        .form-group select.error,
        .form-group textarea.error {
          border-color: var(--color-danger);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .error-message {
          font-size: var(--font-size-xs);
          color: var(--color-danger);
        }

        .modal-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border-light);
        }

        .action-buttons {
          display: flex;
          gap: var(--spacing-sm);
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .modal-actions {
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .action-buttons {
            width: 100%;
          }

          .action-buttons .btn {
            flex: 1;
          }
        }
      `}</style>
    </>
  );
}
