import React, { useState, useEffect, useCallback } from 'react';
import './ApprovalPage.css';

interface Employee {
  id: string;
  name: string;
  annualLeaveBalance: number;
}

interface TimeSheet {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hours: number;
  remark: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface Notification {
  id: number;
  message: string;
}

let notifId = 0;

const ApprovalPage: React.FC = () => {
  const [timesheets, setTimesheets] = useState<TimeSheet[]>([]);
  const [allTimesheets, setAllTimesheets] = useState<TimeSheet[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const showNotification = useCallback((message: string) => {
    const id = ++notifId;
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await fetch('/api/leaves');
      const data = await res.json();
      setEmployees(data);
    } catch {}
  }, []);

  const fetchTimesheets = useCallback(async () => {
    try {
      const res = await fetch('/api/timesheets?status=pending');
      const data = await res.json();
      setTimesheets(data);
    } catch {}
  }, []);

  const fetchFiltered = useCallback(async () => {
    if (!filterEmployee && !filterMonth) {
      setAllTimesheets([]);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (filterEmployee) params.set('employee', filterEmployee);
      if (filterMonth) params.set('month', filterMonth);
      const res = await fetch(`/api/timesheets?${params.toString()}`);
      const data = await res.json();
      setAllTimesheets(data);
    } catch {}
  }, [filterEmployee, filterMonth]);

  useEffect(() => {
    fetchLeaves();
    fetchTimesheets();
  }, [fetchLeaves, fetchTimesheets]);

  useEffect(() => {
    fetchFiltered();
  }, [fetchFiltered]);

  const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/timesheets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          showNotification(data.error || '年假余额不足');
        } else {
          showNotification(data.error || '操作失败');
        }
        setProcessing(null);
        return;
      }

      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees);
      }

      setTimesheets((prev) => prev.filter((t) => t.id !== id));
      if (filterEmployee || filterMonth) {
        fetchFiltered();
      }
    } catch {
      showNotification('网络错误');
    }
    setProcessing(null);
  };

  const getMonthOptions = () => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      opts.push({ value: val, label });
    }
    return opts;
  };

  return (
    <div className="approval-page">
      <h2 className="page-title">审批管理</h2>

      <div className="notifications">
        {notifications.map((n) => (
          <div key={n.id} className="notification">
            {n.message}
          </div>
        ))}
      </div>

      <div className="card balance-card">
        <h3 className="section-title">假期余额</h3>
        <div className="balance-grid">
          {employees.map((emp) => (
            <div key={emp.id} className="balance-item">
              <span className="balance-name">{emp.name}</span>
              <span className="balance-value">{emp.annualLeaveBalance}天</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card pending-card">
        <h3 className="section-title">待审批工时</h3>
        {timesheets.length === 0 ? (
          <div className="empty-state">暂无待审批记录</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>员工姓名</th>
                  <th>日期</th>
                  <th>工时</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((t) => (
                  <tr key={t.id}>
                    <td>{t.employeeName}</td>
                    <td>{t.date}</td>
                    <td>{t.hours}h</td>
                    <td>{t.remark || '-'}</td>
                    <td className="action-cell">
                      <button
                        className="btn btn-approve"
                        onClick={() => handleApproval(t.id, 'approved')}
                        disabled={processing === t.id}
                      >
                        通过
                      </button>
                      <button
                        className="btn btn-reject"
                        onClick={() => handleApproval(t.id, 'rejected')}
                        disabled={processing === t.id}
                      >
                        驳回
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card history-card">
        <h3 className="section-title">历史查询</h3>
        <div className="filter-row">
          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="form-select"
          >
            <option value="">全部员工</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.name}>{emp.name}</option>
            ))}
          </select>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="form-select"
          >
            <option value="">全部月份</option>
            {getMonthOptions().map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {allTimesheets.length === 0 && (filterEmployee || filterMonth) ? (
          <div className="empty-state">无匹配记录</div>
        ) : allTimesheets.length === 0 ? (
          <div className="empty-state hint">请选择筛选条件查看历史记录</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>员工姓名</th>
                  <th>日期</th>
                  <th>工时</th>
                  <th>备注</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {allTimesheets.map((t) => (
                  <tr key={t.id} className={`row-${t.status}`}>
                    <td>{t.employeeName}</td>
                    <td>{t.date}</td>
                    <td>{t.hours}h</td>
                    <td>{t.remark || '-'}</td>
                    <td>
                      <span className={`status-badge status-${t.status}`}>
                        {t.status === 'approved' ? '已通过' : t.status === 'rejected' ? '已驳回' : '待审批'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalPage;
