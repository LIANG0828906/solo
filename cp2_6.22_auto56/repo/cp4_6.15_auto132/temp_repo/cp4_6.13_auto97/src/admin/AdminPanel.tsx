import React, { useState, useEffect } from 'react';
import type { Member } from '../App';

interface Book {
  isbn: string;
  title: string;
  author: string;
  category: string;
  total_copies: number;
  available_copies: number;
}

interface MemberInfo {
  id: string;
  name: string;
  email: string;
  registration_date: string;
  points: number;
  total_borrows: number;
  active_borrows: number;
}

interface WeeklyStat {
  week: string;
  borrow_count: number;
  active_members: number;
}

interface BorrowRecord {
  id: string;
  member_id: string;
  book_id: string;
  title: string;
  author: string;
  category: string;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  fine: number;
  fine_paid: number;
}

interface Props {
  addToast: (msg: string, type: 'success' | 'error') => void;
}

type AdminTab = 'members' | 'books' | 'borrow';

export default function AdminPanel({ addToast }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>('borrow');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [borrowMemberId, setBorrowMemberId] = useState('');
  const [borrowBookIsbn, setBorrowBookIsbn] = useState('');
  const [borrowAction, setBorrowAction] = useState<'borrow' | 'return'>('borrow');
  const [newBook, setNewBook] = useState({ isbn: '', title: '', author: '', category: '小说', total_copies: 1 });
  const token = localStorage.getItem('library_token');

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members', { headers: { Authorization: `Bearer ${token}` } });
      setMembers(await res.json());
    } catch {}
  };

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books');
      setBooks(await res.json());
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats/weekly', { headers: { Authorization: `Bearer ${token}` } });
      setWeeklyStats(await res.json());
    } catch {}
  };

  const fetchAllRecords = async () => {
    try {
      const membersRes = await fetch('/api/members', { headers: { Authorization: `Bearer ${token}` } });
      const membersData = await membersRes.json();
      const allRecords: BorrowRecord[] = [];
      for (const m of membersData) {
        const recRes = await fetch(`/api/member/${m.id}/records`, { headers: { Authorization: `Bearer ${token}` } });
        const recData = await recRes.json();
        allRecords.push(...recData);
      }
      setRecords(allRecords.sort((a, b) => b.borrow_date.localeCompare(a.borrow_date)));
    } catch {}
  };

  useEffect(() => {
    fetchMembers();
    fetchBooks();
    fetchStats();
    fetchAllRecords();
  }, []);

  const handleBorrowReturn = async () => {
    if (!borrowMemberId.trim() || !borrowBookIsbn.trim()) {
      addToast('请输入会员ID和图书ISBN', 'error');
      return;
    }
    const url = borrowAction === 'borrow' ? '/api/borrow' : '/api/return';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ member_id: borrowMemberId, book_id: borrowBookIsbn }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = borrowAction === 'borrow'
          ? '借出成功！'
          : `归还成功！${data.fine > 0 ? ` 逾期${data.overdue_days}天，罚金¥${data.fine.toFixed(2)}` : ''}`;
        addToast(msg);
        setBorrowMemberId('');
        setBorrowBookIsbn('');
        fetchBooks();
        fetchAllRecords();
        fetchMembers();
      } else {
        addToast(data.error || '操作失败', 'error');
      }
    } catch {
      addToast('网络错误', 'error');
    }
  };

  const handleAddBook = async () => {
    const { isbn, title, author, category, total_copies } = newBook;
    if (!isbn || !title || !author) {
      addToast('请填写所有必填信息', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/add-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newBook),
      });
      const data = await res.json();
      if (data.success) {
        addToast('图书添加成功！');
        setNewBook({ isbn: '', title: '', author: '', category: '小说', total_copies: 1 });
        fetchBooks();
      } else {
        addToast(data.error || '添加失败', 'error');
      }
    } catch {
      addToast('网络错误', 'error');
    }
  };

  const maxBorrowCount = Math.max(...weeklyStats.map(s => s.borrow_count), 1);

  const sidebarItems = [
    { key: 'members' as AdminTab, icon: '👥', label: '会员管理' },
    { key: 'books' as AdminTab, icon: '📚', label: '图书管理' },
    { key: 'borrow' as AdminTab, icon: '📋', label: '借还登记' },
  ];

  return (
    <div className="admin-layout" style={{ marginTop: 64 }}>
      <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ position: 'fixed', top: 14, left: 16, zIndex: 1001 }}>
        ☰
      </button>

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {sidebarItems.map(item => (
          <button
            key={item.key}
            className={`sidebar-item ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </aside>

      <main className="admin-content">
        {activeTab === 'members' && (
          <div>
            <h2 className="section-title">👥 会员管理</h2>

            <div className="card-static" style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>📊 每周借阅统计</h3>
              {weeklyStats.length > 0 ? (
                <div className="stats-bar">
                  {weeklyStats.slice(0, 8).reverse().map(s => (
                    <div key={s.week} className="stats-bar-item">
                      <div className="bar-value">{s.borrow_count}</div>
                      <div className="bar" style={{ height: `${(s.borrow_count / maxBorrowCount) * 150}px` }} />
                      <div className="bar-label">{s.week.slice(-2)}周</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>暂无统计数据</div>
              )}
            </div>

            <div className="card-static" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>姓名</th>
                    <th>邮箱</th>
                    <th>注册日期</th>
                    <th>积分</th>
                    <th>总借阅</th>
                    <th>在借</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id}>
                      <td>{m.id}</td>
                      <td>{m.name}</td>
                      <td>{m.email}</td>
                      <td>{m.registration_date}</td>
                      <td style={{ fontWeight: 600, color: '#3b82f6' }}>{m.points}</td>
                      <td>{m.total_borrows}</td>
                      <td>
                        {m.active_borrows > 0 ? (
                          <span style={{ color: '#3b82f6', fontWeight: 500 }}>{m.active_borrows}</span>
                        ) : 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'books' && (
          <div>
            <h2 className="section-title">📚 图书管理</h2>

            <div className="card-static" style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>➕ 新增图书</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
                  <input className="form-input" placeholder="ISBN" value={newBook.isbn} onChange={e => setNewBook({ ...newBook, isbn: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
                  <input className="form-input" placeholder="书名" value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
                  <input className="form-input" placeholder="作者" value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} />
                </div>
                <div className="form-group" style={{ minWidth: 120, marginBottom: 0 }}>
                  <select className="form-input" value={newBook.category} onChange={e => setNewBook({ ...newBook, category: e.target.value })}>
                    <option value="小说">小说</option>
                    <option value="科技">科技</option>
                    <option value="历史">历史</option>
                    <option value="艺术">艺术</option>
                  </select>
                </div>
                <div className="form-group" style={{ minWidth: 80, marginBottom: 0 }}>
                  <input className="form-input" type="number" min="1" value={newBook.total_copies} onChange={e => setNewBook({ ...newBook, total_copies: parseInt(e.target.value) || 1 })} />
                </div>
                <button className="btn btn-primary" onClick={handleAddBook}>添加</button>
              </div>
            </div>

            <div className="card-static" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ISBN</th>
                    <th>书名</th>
                    <th>作者</th>
                    <th>类别</th>
                    <th>总数</th>
                    <th>可借</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(b => (
                    <tr key={b.isbn}>
                      <td style={{ fontSize: 12 }}>{b.isbn}</td>
                      <td style={{ fontWeight: 500 }}>{b.title}</td>
                      <td>{b.author}</td>
                      <td><span className={`category-tag category-${b.category}`}>{b.category}</span></td>
                      <td>{b.total_copies}</td>
                      <td style={{ color: b.available_copies > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {b.available_copies}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'borrow' && (
          <div>
            <h2 className="section-title">📋 借还登记</h2>

            <div className="card-static" style={{ marginBottom: 24 }}>
              <div className="admin-borrow-form">
                <div className="form-group">
                  <label>会员ID</label>
                  <input
                    className="form-input"
                    placeholder="扫描或输入会员ID"
                    value={borrowMemberId}
                    onChange={e => setBorrowMemberId(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>图书ISBN</label>
                  <input
                    className="form-input"
                    placeholder="扫描或输入ISBN"
                    value={borrowBookIsbn}
                    onChange={e => setBorrowBookIsbn(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 'none' }}>
                  <label>操作</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className={`btn ${borrowAction === 'borrow' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                      onClick={() => setBorrowAction('borrow')}
                    >
                      借出
                    </button>
                    <button
                      className={`btn ${borrowAction === 'return' ? 'btn-success' : 'btn-outline'} btn-sm`}
                      onClick={() => setBorrowAction('return')}
                    >
                      归还
                    </button>
                  </div>
                </div>
                <div className="form-group" style={{ flex: 'none', alignSelf: 'flex-end' }}>
                  <button
                    className={`btn ${borrowAction === 'borrow' ? 'btn-primary' : 'btn-success'} btn-lg`}
                    onClick={handleBorrowReturn}
                  >
                    {borrowAction === 'borrow' ? '📖 确认借出' : '📖 确认归还'}
                  </button>
                </div>
              </div>
            </div>

            <div className="card-static">
              <h3 style={{ marginBottom: 12, fontSize: 16 }}>近期借还记录</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>会员</th>
                      <th>书名</th>
                      <th>借出日期</th>
                      <th>应还日期</th>
                      <th>归还日期</th>
                      <th>状态</th>
                      <th>罚金</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.slice(0, 30).map(r => {
                      const isOverdue = !r.return_date && new Date() > new Date(r.due_date);
                      const isFined = r.fine > 0;
                      return (
                        <tr key={r.id}>
                          <td>{r.member_id}</td>
                          <td>{r.title}</td>
                          <td>{r.borrow_date}</td>
                          <td>{r.due_date}</td>
                          <td>{r.return_date || '-'}</td>
                          <td>
                            {r.return_date ? (
                              isFined ? (
                                <span className="status-badge status-fined">逾期已还</span>
                              ) : (
                                <span className="status-badge status-returned">已还</span>
                              )
                            ) : isOverdue ? (
                              <span className="status-badge status-overdue">逾期</span>
                            ) : (
                              <span className="status-badge status-borrowing">在借</span>
                            )}
                          </td>
                          <td style={{ color: r.fine > 0 ? '#ef4444' : 'inherit' }}>
                            {r.fine > 0 ? `¥${r.fine.toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
