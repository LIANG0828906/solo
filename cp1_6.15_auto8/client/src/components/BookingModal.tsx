import { useState, useEffect } from 'react';
import { Device } from '../types';
import { formatDate, addDays } from '../utils/dateUtils';
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

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDay = addDays(today, 7);
    setMinDate(formatDate(today));
    setMaxDate(formatDate(maxDay));
    setDate(formatDate(today));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !userName.trim()) {
      setErrorMessage('请填写完整信息');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setIsSubmitting(true);
    try {
      const checkRes = await fetch(
        `/api/bookings/check?deviceId=${device.id}&date=${date}`
      );
      const checkData = await checkRes.json();

      if (checkData.conflict) {
        setErrorMessage(`该设备在 ${date} 已被 ${checkData.booking.userName} 预约`);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setIsSubmitting(false);
        return;
      }

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
          <h2>预约 {device.icon} {device.name}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>预约日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={minDate}
              max={maxDate}
              required
            />
            <span className="form-hint">只能选择未来7天内的日期</span>
          </div>

          <div className="form-group">
            <label>您的昵称</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="请输入您的称呼"
              required
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label>备注（可选）</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="借用用途或其他说明"
              rows={3}
              maxLength={100}
            />
          </div>

          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : '确认预约'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;
