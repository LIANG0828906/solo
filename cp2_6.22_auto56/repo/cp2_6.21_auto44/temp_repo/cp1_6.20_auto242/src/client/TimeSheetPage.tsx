import React, { useState, useEffect, useCallback } from 'react';
import './TimeSheetPage.css';

interface Employee {
  id: string;
  name: string;
}

const TimeSheetPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [hours, setHours] = useState(8);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [shakeError, setShakeError] = useState(false);

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then((data: Employee[]) => {
        setEmployees(data);
        if (data.length > 0) setEmployeeId(data[0].id);
      })
      .catch(() => {});
  }, []);

  const getDateLimits = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const maxDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    return { min: firstDay, max: maxDate };
  }, []);

  const isWeekend = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setShakeError(false);

    if (!date) {
      setError('请选择日期');
      setShakeError(true);
      return;
    }

    if (isWeekend(date)) {
      setError('不能提交周末的工时');
      setShakeError(true);
      return;
    }

    if (hours < 0.5 || hours > 24) {
      setError('工时必须在0.5-24小时之间');
      setShakeError(true);
      return;
    }

    if (remark.length > 100) {
      setError('备注不能超过100字');
      setShakeError(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, date, hours, remark }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '提交失败');
        setShakeError(true);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setRemark('');
      setHours(8);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError('网络错误');
      setShakeError(true);
    }
    setSubmitting(false);
  };

  const { min, max } = getDateLimits();

  return (
    <div className="timesheet-page">
      <h2 className="page-title">工时填写</h2>
      <div className={`card form-card ${shakeError ? 'shake' : ''} ${success ? 'success-flash' : ''}`}>
        {success && (
          <div className="success-check">
            <svg viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>员工姓名</label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="form-select">
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError('');
              }}
              min={min}
              max={max}
              className="form-input date-input"
            />
          </div>

          <div className="form-group">
            <label>工时（小时）</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value))}
              min={0.5}
              max={24}
              step={0.5}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>备注</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              maxLength={100}
              placeholder="请输入备注（100字以内）"
              className="form-textarea"
              rows={3}
            />
            <span className="char-count">{remark.length}/100</span>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '提交中...' : '提交工时'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TimeSheetPage;
