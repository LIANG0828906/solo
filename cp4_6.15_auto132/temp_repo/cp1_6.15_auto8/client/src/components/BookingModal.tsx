import { useState, useEffect, useCallback } from 'react';
import { Device } from '../types';
import { formatDate, addDays } from '../utils/dateUtils';
import useDebounce from '../hooks/useDebounce';
import '../styles/Modal.css';

interface BookingModalProps {
  device: Device;
  onClose: () => void;
  onSuccess: () => void;
}

function BookingModal({ device, onClose, onSuccess }: BookingModalProps) {
  const [date, setDate] = useState('');
  const [userName, setUserName] = useState('');
  const [note, setNote] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [conflictWarning, setConflictWarning] = useState('');

  const debouncedDate = useDebounce(date, 150);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDay = addDays(today, 7);
    setMinDate(formatDate(today));
    setMaxDate(formatDate(maxDay));
    setDate(formatDate(today));
  }, []);

  const checkConflict = useCallback(async (checkDate: string) => {
    if (!checkDate || !device.id) return;
    const startTime = performance.now();
    setIsChecking(true);
    setConflictWarning('');

    try {
      const res = await fetch(
        `/api/bookings/check?deviceId=${device.id}&date=${checkDate}`
      );
      const data = await res.json();

      const elapsed = performance.now() - startTime;
      if (elapsed > 100) {
        console.warn(`[Performance] Conflict check took ${elapsed.toFixed(0)}ms (>100ms threshold)`);
      }

      if (data.conflict) {
        setConflictWarning(`⚠️ ${checkDate} 已被 ${data.booking.userName} 预约`);
      }
    } catch (err) {
      console.error('Conflict check failed:', err);
    } finally {
      setIsChecking(false);
    }
  }, [device.id]);

  useEffect(() => {
    if (debouncedDate) {
      checkConflict(debouncedDate);
    }
  }, [debouncedDate, checkConflict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !userName.trim()) {
      setErrorMessage('请填写完整信息');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    if (conflictWarning) {
      setErrorMessage(conflictWarning.replace('⚠️ ', ''));
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: device.id,
          date,
          userName: userName.trim(),
          note: note.trim(),
        }),
      });

      if (res.ok) {
        onSuccess();
      } else if (res.status === 409) {
        const data = await res.json();
        setErrorMessage(data.error || '该时段已被预约');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || '预约失败，请重试');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (err) {
      setErrorMessage('网络错误，请稍后重试');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className={`modal-content booking-modal ${isShaking ? 'shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <span className="booking-header-icon">{device.icon}</span>
            预约 {device.name}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>预约日期</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setErrorMessage('');
                }}
                min={minDate}
                max={maxDate}
                required
                className={conflictWarning ? 'input-error' : ''}
              />
              {isChecking && <span className="checking-indicator">检测中...</span>}
            </div>
            <span className="form-hint">📅 只能选择未来7天内的日期</span>
            {conflictWarning && (
              <div className="conflict-warning">{conflictWarning}</div>
            )}
          </div>

          <div className="form-group">
            <label>您的昵称</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setErrorMessage('');
              }}
              placeholder="请输入您的称呼（如：爸爸）"
              required
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label>备注（可选）</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="借用用途或其他说明..."
              rows={3}
              maxLength={100}
            />
            <span className="form-hint">{note.length}/100</span>
          </div>

          {errorMessage && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              {errorMessage}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || isChecking || !!conflictWarning}
            >
              {isSubmitting ? '⏳ 提交中...' : '✅ 确认预约'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;
