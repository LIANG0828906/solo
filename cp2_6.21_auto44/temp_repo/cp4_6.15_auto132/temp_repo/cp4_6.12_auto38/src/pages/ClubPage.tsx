import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Book, Member, BorrowRecord } from '../types';
import { getBooks, getClubMembers, addBorrowRecord, getMemberBorrowHistory } from '../api';
import BookCard from '../components/BookCard';

interface BorrowFormState {
  bookId: string;
  fromMemberId: string;
  toMemberId: string;
  borrowDate: string;
  type: 'borrow' | 'return';
  note: string;
}

function ClubPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastExiting, setToastExiting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberHistory, setMemberHistory] = useState<BorrowRecord[]>([]);
  const [formState, setFormState] = useState<BorrowFormState>({
    bookId: '',
    fromMemberId: '',
    toMemberId: '',
    borrowDate: new Date().toISOString().split('T')[0],
    type: 'borrow',
    note: ''
  });

  const fetchData = async () => {
    const [booksData, membersData] = await Promise.all([
      getBooks(),
      getClubMembers()
    ]);
    setBooks(booksData);
    setMembers(membersData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMemberBookCount = (memberId: string) => {
    return books.filter((b) => b.currentHolderId === memberId).length;
  };

  const handleMemberClick = async (member: Member) => {
    setSelectedMember(member);
    const history = await getMemberBorrowHistory(member.id);
    setMemberHistory(history);
  };

  const showSuccessToast = () => {
    setShowToast(true);
    setTimeout(() => {
      setToastExiting(true);
      setTimeout(() => {
        setShowToast(false);
        setToastExiting(false);
      }, 400);
    }, 2000);
  };

  const handleSubmitBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.bookId || !formState.toMemberId) return;

    await addBorrowRecord({
      bookId: formState.bookId,
      fromMemberId: formState.fromMemberId || formState.toMemberId,
      toMemberId: formState.toMemberId,
      borrowDate: formState.borrowDate,
      type: formState.type,
      note: formState.note || undefined
    });

    setShowModal(false);
    setFormState({
      bookId: '',
      fromMemberId: '',
      toMemberId: '',
      borrowDate: new Date().toISOString().split('T')[0],
      type: 'borrow',
      note: ''
    });
    showSuccessToast();
    fetchData();
  };

  const currentUser = members[0];

  return (
    <div className="app-layout">
      <nav className="navbar">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="navbar-title">📚 读书俱乐部</div>
        </Link>
        {currentUser && (
          <div className="navbar-user">
            <img src={currentUser.avatar} alt={currentUser.name} />
          </div>
        )}
      </nav>

      <div className="main-container">
        <aside className="members-sidebar">
          <div className="members-sidebar-title">俱乐部成员</div>
          <div className="members-list">
            {members.map((member) => {
              const bookCount = getMemberBookCount(member.id);
              return (
                <div
                  key={member.id}
                  className="member-avatar-wrapper"
                  onClick={() => handleMemberClick(member)}
                >
                  <div className="member-avatar">
                    <img src={member.avatar} alt={member.name} />
                  </div>
                  {bookCount > 0 && (
                    <div
                      className={`member-badge ${bookCount > 9 ? 'small-font' : ''}`}
                    >
                      {bookCount}
                    </div>
                  )}
                  <div className="member-tooltip">
                    {member.name} · {member.role}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="books-content">
          <div className="books-header">
            <h2>漂流书籍</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              + 新建借阅记录
            </button>
          </div>

          <div className="books-grid">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">新建借阅记录</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitBorrow}>
              <div className="form-group">
                <label className="form-label">书籍</label>
                <select
                  className="form-select"
                  value={formState.bookId}
                  onChange={(e) =>
                    setFormState({ ...formState, bookId: e.target.value })
                  }
                  required
                >
                  <option value="">请选择书籍</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">出借人</label>
                  <select
                    className="form-select"
                    value={formState.fromMemberId}
                    onChange={(e) =>
                      setFormState({ ...formState, fromMemberId: e.target.value })
                    }
                  >
                    <option value="">请选择出借人</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">借阅人 / 归还人</label>
                  <select
                    className="form-select"
                    value={formState.toMemberId}
                    onChange={(e) =>
                      setFormState({ ...formState, toMemberId: e.target.value })
                    }
                    required
                  >
                    <option value="">请选择</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">类型</label>
                  <select
                    className="form-select"
                    value={formState.type}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        type: e.target.value as 'borrow' | 'return'
                      })
                    }
                  >
                    <option value="borrow">借出</option>
                    <option value="return">归还</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formState.borrowDate}
                    onChange={(e) =>
                      setFormState({ ...formState, borrowDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">备注</label>
                <textarea
                  className="form-textarea"
                  placeholder="添加备注信息..."
                  maxLength={200}
                  value={formState.note}
                  onChange={(e) =>
                    setFormState({ ...formState, note: e.target.value })
                  }
                />
                <div className="char-count">{formState.note.length}/200</div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  提交
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showToast && (
        <div className={`toast ${toastExiting ? 'exit' : ''}`}>
          ✓ 借阅记录创建成功！
        </div>
      )}

      {selectedMember && (
        <>
          <div
            className="modal-overlay"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onClick={() => setSelectedMember(null)}
          />
          <div className="member-drawer">
            <div className="member-drawer-header">
              <div className="drawer-avatar">
                <img src={selectedMember.avatar} alt={selectedMember.name} />
              </div>
              <div className="drawer-info">
                <h3>{selectedMember.name}</h3>
                <p>{selectedMember.role} · 当前持有 {getMemberBookCount(selectedMember.id)} 本书</p>
              </div>
              <button
                className="drawer-close"
                onClick={() => setSelectedMember(null)}
              >
                ×
              </button>
            </div>
            <div className="member-drawer-body">
              <h3 className="section-title">借阅历史</h3>
              {memberHistory.length === 0 ? (
                <p style={{ color: '#999' }}>暂无借阅记录</p>
              ) : (
                memberHistory.map((record) => {
                  const book = books.find((b) => b.id === record.bookId);
                  return (
                    <div
                      key={record.id}
                      className={`drawer-history-item ${record.type}`}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 4,
                          color: record.type === 'borrow' ? '#2196f3' : '#4caf50'
                        }}
                      >
                        {record.type === 'borrow' ? '📥 借出' : '📤 归还'} ·{' '}
                        {book?.title || '未知书籍'}
                      </div>
                      <div style={{ fontSize: 13, color: '#777' }}>
                        {record.borrowDate}
                        {record.note && ` · ${record.note}`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ClubPage;
