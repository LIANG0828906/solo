import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Member } from '../App';

interface BorrowRecord {
  id: string;
  book_id: string;
  title: string;
  author: string;
  category: string;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  fine: number;
  fine_paid: number;
  overdue_days?: number;
  status?: string;
}

interface Reservation {
  id: string;
  book_id: string;
  title: string;
  author: string;
  category: string;
  reserve_date: string;
  expire_date: string;
  status: string;
}

interface Props {
  member: Member;
  setMember: (m: Member) => void;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export default function MemberDashboard({ member, setMember, addToast }: Props) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'fines' | 'reservations'>('current');
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [fines, setFines] = useState<{ records: BorrowRecord[]; totalFine: number }>({ records: [], totalFine: 0 });
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedFines, setSelectedFines] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('library_token');

  const fetchRecords = async () => {
    try {
      const res = await fetch(`/api/member/${member.id}/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRecords(data);
    } catch {
      addToast('获取借阅记录失败', 'error');
    }
  };

  const fetchFines = async () => {
    try {
      const res = await fetch(`/api/member/${member.id}/fines`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFines(data);
    } catch {
      addToast('获取罚金信息失败', 'error');
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await fetch(`/api/reservations/${member.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReservations(data);
    } catch {
      addToast('获取预约信息失败', 'error');
    }
  };

  const fetchMemberInfo = async () => {
    try {
      const res = await fetch(`/api/member/${member.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMember({ ...member, points: data.points });
    } catch {}
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchRecords(), fetchFines(), fetchReservations(), fetchMemberInfo()]);
      setLoading(false);
    };
    load();
  }, [member.id]);

  const handlePayFines = async () => {
    if (selectedFines.size === 0) {
      addToast('请选择要缴纳的罚金', 'error');
      return;
    }
    try {
      const res = await fetch('/api/pay-fines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ member_id: member.id, record_ids: Array.from(selectedFines) }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('缴费成功！');
        setSelectedFines(new Set());
        fetchFines();
      }
    } catch {
      addToast('缴费失败', 'error');
    }
  };

  const toggleFine = (id: string) => {
    setSelectedFines(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const today = new Date();
  const currentBorrows = records.filter(r => !r.return_date);
  const historyRecords = records.filter(r => r.return_date);

  const activeBorrowsWithOverdue = currentBorrows.map(r => {
    const dueDate = new Date(r.due_date);
    const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return { ...r, overdue_days: diffDays > 0 ? diffDays : 0, isOverdue: diffDays > 0 };
  });

  const pointsPercent = Math.min((member.points % 100), 100);
  const level = Math.floor(member.points / 100) + 1;
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (pointsPercent / 100) * circumference;

  const sortField = useState<'borrow_date' | 'return_date'>('borrow_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedHistory = [...historyRecords].sort((a, b) => {
    const va = a.return_date || a.borrow_date;
    const vb = b.return_date || b.borrow_date;
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  if (loading) {
    return <div className="main-content" style={{ textAlign: 'center', padding: 60 }}>加载中...</div>;
  }

  return (
    <div className="main-content">
      <div className="member-dashboard">
        <div className="dashboard-header">
          <div className="member-avatar">👤</div>
          <div className="member-info" style={{ flex: 1 }}>
            <h2>{member.name}</h2>
            <div className="member-since">注册日期：{member.registration_date}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="points-ring">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#3b82f6" strokeWidth="6"
                  strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
              </svg>
              <div className="points-text">
                <div className="value">{member.points}</div>
                <div className="label">积分</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              <div>Lv.{level}</div>
              <div>{pointsPercent}/100</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{member.points >= 100 ? '已升级借阅' : '100分升级'}</div>
            </div>
          </div>
        </div>

        {fines.totalFine > 0 && (
          <div className="fine-summary" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('fines')}>
            <div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>未缴罚金</div>
              <div className="fine-amount">¥{fines.totalFine.toFixed(2)}</div>
            </div>
            <button className="btn btn-danger btn-sm">查看详情 →</button>
          </div>
        )}

        <div className="member-nav">
          <button className={`nav-tab ${activeTab === 'current' ? 'active' : ''}`} onClick={() => setActiveTab('current')}>
            📖 当前借阅 ({currentBorrows.length})
          </button>
          <button className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            📋 借阅历史
          </button>
          <button className={`nav-tab ${activeTab === 'fines' ? 'active' : ''}`} onClick={() => setActiveTab('fines')}>
            💰 罚金明细
          </button>
          <button className={`nav-tab ${activeTab === 'reservations' ? 'active' : ''}`} onClick={() => setActiveTab('reservations')}>
            📌 我的预约 ({reservations.length})
          </button>
          <button className="nav-tab" onClick={() => navigate('/search')} style={{ marginLeft: 'auto', background: '#06b6d4', color: 'white', borderColor: '#06b6d4' }}>
            🔍 搜索图书
          </button>
        </div>

        {activeTab === 'current' && (
          <div>
            <h3 className="section-title">📖 当前借阅</h3>
            {activeBorrowsWithOverdue.length === 0 ? (
              <div className="card-static" style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                暂无借阅记录，去搜索图书借阅吧！
              </div>
            ) : (
              <div className="borrow-cards">
                {activeBorrowsWithOverdue.map(r => (
                  <div key={r.id} className={`card borrow-card ${r.isOverdue ? 'overdue' : ''}`}>
                    {r.isOverdue && (
                      <div className="overdue-badge">逾期 {r.overdue_days} 天</div>
                    )}
                    <div className="card-header">
                      <span className={`category-tag category-${r.category}`}>{r.category}</span>
                    </div>
                    <div className="book-title">{r.title}</div>
                    <div className="book-author">{r.author}</div>
                    <div className="date-info">
                      <span>借出：{r.borrow_date}</span>
                      <span className={`due-date${r.isOverdue ? '' : ''}`} style={r.isOverdue ? { color: '#ef4444', fontWeight: 600 } : {}}>
                        应还：{r.due_date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h3 className="section-title">
              📋 借阅历史
              <button className="btn btn-outline btn-sm" onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} style={{ marginLeft: 8 }}>
                {sortDir === 'desc' ? '↓ 最新' : '↑ 最早'}
              </button>
            </h3>
            {sortedHistory.length === 0 ? (
              <div className="card-static" style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                暂无历史记录
              </div>
            ) : (
              <div className="card-static" style={{ overflowX: 'auto' }}>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>书名</th>
                      <th>类别</th>
                      <th>借出日期</th>
                      <th>归还日期</th>
                      <th>状态</th>
                      <th>罚金</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHistory.map(r => (
                      <tr key={r.id}>
                        <td>{r.title}</td>
                        <td><span className={`category-tag category-${r.category}`}>{r.category}</span></td>
                        <td>{r.borrow_date}</td>
                        <td>{r.return_date || '-'}</td>
                        <td>
                          {r.fine > 0 ? (
                            <span className="status-badge status-fined">逾期</span>
                          ) : (
                            <span className="status-badge status-returned">已还</span>
                          )}
                        </td>
                        <td style={{ color: r.fine > 0 ? '#ef4444' : 'inherit' }}>
                          {r.fine > 0 ? `¥${r.fine.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fines' && (
          <div>
            <h3 className="section-title">💰 罚金明细</h3>
            {fines.records.length === 0 ? (
              <div className="card-static" style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                暂无罚金记录 🎉
              </div>
            ) : (
              <>
                <div className="card-static" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontWeight: 600 }}>未缴罚金总额：<span style={{ color: '#ef4444', fontSize: 20 }}>¥{fines.totalFine.toFixed(2)}</span></span>
                    <button className="btn btn-danger btn-sm" onClick={handlePayFines} disabled={selectedFines.size === 0}>
                      缴纳选中 ({selectedFines.size})
                    </button>
                  </div>
                  {fines.records.map(r => (
                    <div key={r.id} className="fine-detail-row">
                      <input
                        type="checkbox"
                        className="fine-checkbox"
                        checked={selectedFines.has(r.id)}
                        onChange={() => toggleFine(r.id)}
                        disabled={r.fine_paid === 1}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{r.title}</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>
                          {r.overdue_days ? `逾期 ${r.overdue_days} 天` : `罚金 ¥${r.fine.toFixed(2)}`}
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, color: '#ef4444' }}>
                        ¥{r.fine.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div>
            <h3 className="section-title">📌 我的预约</h3>
            {reservations.length === 0 ? (
              <div className="card-static" style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                暂无预约记录
              </div>
            ) : (
              reservations.map(r => (
                <div key={r.id} className="reserve-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.title}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>{r.author}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      预约至 {new Date(r.expire_date).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
