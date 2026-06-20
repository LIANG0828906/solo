import { useState } from 'react';
import { DeviceStatus } from '../types';
import '../styles/Modal.css';

interface AddDeviceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const iconOptions = [
  '🧹', '🔩', '🔥', '📽️', '☕', '🪛', '📺', '🎮',
  '🎤', '💡', '🔧', '⚡', '🧺', '🧰', '🎨', '🎧',
];

function AddDeviceModal({ onClose, onSuccess }: AddDeviceModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🧹');
  const [status, setStatus] = useState<DeviceStatus>('available');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('请输入设备名称');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          icon,
          status,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || '添加失败，请重试');
      }
    } catch (err) {
      setErrorMessage('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>添加新设备</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>设备名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：吸尘器"
              required
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>选择图标</label>
            <div className="icon-picker">
              {iconOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`icon-option ${icon === emoji ? 'selected' : ''}`}
                  onClick={() => setIcon(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>初始状态</label>
            <div className="status-picker">
              {(['available', 'borrowed', 'maintenance'] as DeviceStatus[]).map((s) => (
                <label key={s} className="status-option">
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                  />
                  <span className={`status-dot ${s}`} />
                  <span className="status-label">
                    {s === 'available' ? '可用' : s === 'borrowed' ? '借用中' : '维修中'}
                  </span>
                </label>
              ))}
            </div>
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
              {isSubmitting ? '添加中...' : '添加设备'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddDeviceModal;
