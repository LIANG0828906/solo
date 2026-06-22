// 预约表单组件
// 包含资源选择、日期时间选择器、时长选择、备注输入
// 数据流向：接收用户输入 -> 提交至 AppContext -> 校验冲突后更新状态
// 被调用方：src/pages/Dashboard.tsx
// 调用方：src/context/AppContext.tsx

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Resource, RESOURCE_TYPE_LABELS } from '@/types';
import { format, addHours, setHours, setMinutes } from 'date-fns';

interface ReservationFormProps {
  visible: boolean;
  preselectedResource?: Resource | null;
  preselectedDate?: Date | null;
  preselectedHour?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const DURATION_OPTIONS = [
  { value: 0.5, label: '30分钟' },
  { value: 1, label: '1小时' },
  { value: 1.5, label: '1.5小时' },
  { value: 2, label: '2小时' },
  { value: 3, label: '3小时' },
  { value: 4, label: '4小时' },
  { value: 8, label: '全天(8小时)' },
];

export default function ReservationForm({
  visible,
  preselectedResource,
  preselectedDate,
  preselectedHour = 9,
  onClose,
  onSuccess,
}: ReservationFormProps) {
  const { state, addReservation } = useApp();

  const [resourceId, setResourceId] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [duration, setDuration] = useState(1);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      if (preselectedResource) {
        setResourceId(preselectedResource.id);
      } else if (state.resources.length > 0) {
        setResourceId(state.resources[0].id);
      }

      if (preselectedDate) {
        setDateStr(format(preselectedDate, 'yyyy-MM-dd'));
      } else {
        setDateStr(format(new Date(), 'yyyy-MM-dd'));
      }

      setStartHour(preselectedHour);
      setStartMinute(0);
      setDuration(1);
      setNote('');
      setError(null);
    }
  }, [visible, preselectedResource, preselectedDate, preselectedHour, state.resources]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!resourceId || !dateStr) {
      setError('请选择资源和日期');
      triggerShake();
      return;
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const startTime = new Date(year, month - 1, day, startHour, startMinute);
    const endTime = addHours(startTime, duration);

    if (!state.currentUser) {
      setError('请先登录');
      triggerShake();
      return;
    }

    const result = addReservation({
      resourceId,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      startTime,
      endTime,
      note,
    });

    if (!result.success) {
      setError(result.error || '预约失败');
      triggerShake();
      return;
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onSuccess?.();
      onClose();
    }, 1500);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  if (!visible) return null;

  return (
    <div className="form-overlay" onClick={onClose}>
      <div
        className={`form-modal ${isShaking ? 'shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="form-header">
          <h3>预约资源</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>选择资源</label>
            <select value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
              {state.resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({RESOURCE_TYPE_LABELS[r.type]})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>日期</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>开始时间</label>
              <div className="time-selector">
                <select value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}>
                  {Array.from({ length: 13 }, (_, i) => i + 8).map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="time-separator">:</span>
                <select value={startMinute} onChange={(e) => setStartMinute(Number(e.target.value))}>
                  {[0, 30].map((m) => (
                    <option key={m} value={m}>
                      {m.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>时长</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>备注（可选）</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="请输入备注信息..."
              rows={3}
            />
          </div>

          {error && (
            <div className={`error-message ${isShaking ? 'shake' : ''}`}>
              ⚠️ {error}
            </div>
          )}

          {showSuccess && (
            <div className="success-message">
              ✅ 预约成功！
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-submit">
              确认预约
            </button>
          </div>
        </form>

        <style>{`
          .form-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.2s ease;
          }

          .form-modal {
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 480px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .form-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid #E0E0E0;
          }

          .form-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #333;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
            line-height: 1;
            padding: 0;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background 0.15s;
          }

          .close-btn:hover {
            background: #f5f5f5;
            color: #333;
          }

          form {
            padding: 24px;
          }

          .form-group {
            margin-bottom: 16px;
          }

          .form-row {
            display: flex;
            gap: 16px;
          }

          .form-row .form-group {
            flex: 1;
          }

          label {
            display: block;
            margin-bottom: 6px;
            font-size: 13px;
            font-weight: 500;
            color: #555;
          }

          select,
          input[type="date"],
          textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #E0E0E0;
            border-radius: 4px;
            font-size: 14px;
            color: #333;
            background: white;
            transition: border-color 0.15s;
            font-family: inherit;
          }

          select:focus,
          input[type="date"]:focus,
          textarea:focus {
            outline: none;
            border-color: #1E88E5;
          }

          .time-selector {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .time-selector select {
            flex: 1;
          }

          .time-separator {
            font-weight: 600;
            color: #666;
          }

          textarea {
            resize: vertical;
            min-height: 70px;
          }

          .error-message {
            background: #fef2f2;
            color: #dc2626;
            padding: 10px 14px;
            border-radius: 4px;
            font-size: 13px;
            margin-bottom: 16px;
            border: 1px solid #fecaca;
          }

          .error-message.shake {
            animation: shake 0.5s ease;
          }

          .shake {
            animation: shake 0.5s ease;
          }

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }

          .success-message {
            background: #f0fdf4;
            color: #16a34a;
            padding: 10px 14px;
            border-radius: 4px;
            font-size: 13px;
            margin-bottom: 16px;
            border: 1px solid #bbf7d0;
            animation: fadeIn 0.3s ease;
          }

          .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 8px;
          }

          .btn-cancel,
          .btn-submit {
            padding: 10px 20px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            border: none;
            font-family: inherit;
          }

          .btn-cancel {
            background: #f5f5f5;
            color: #666;
          }

          .btn-cancel:hover {
            background: #e5e5e5;
            transform: scale(1.05);
          }

          .btn-submit {
            background: #1E88E5;
            color: white;
          }

          .btn-submit:hover {
            background: #1976D2;
            transform: scale(1.05);
          }

          .btn-submit:active,
          .btn-cancel:active {
            transform: scale(0.95);
          }

          @media (max-width: 480px) {
            .form-modal {
              width: 95%;
              margin: 10px;
            }

            .form-row {
              flex-direction: column;
              gap: 12px;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
