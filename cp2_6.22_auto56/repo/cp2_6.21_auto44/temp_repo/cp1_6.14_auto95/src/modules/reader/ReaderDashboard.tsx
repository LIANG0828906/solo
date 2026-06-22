import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Calendar, RotateCcw, User } from 'lucide-react';
import { getReaderLoans, returnBook } from '../../api';
import { TableSkeleton } from '../../components/Skeleton';
import type { Loan, User as UserType } from '../../types';

export default function ReaderDashboard() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user: UserType | null = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getReaderLoans(user.id)
      .then(setLoans)
      .catch(() => setLoans([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleReturn = async (loanId: string) => {
    setReturningId(loanId);
    setConfirmId(null);
    try {
      const res = await returnBook(loanId);
      if (res.success) {
        setToast({ type: 'success', msg: '还书成功！' });
        setLoans((prev) =>
          prev.map((l) =>
            l.id === loanId ? { ...l, status: 'returned' as const, returnDate: new Date().toISOString() } : l
          )
        );
      } else {
        setToast({ type: 'error', msg: res.message || '还书失败' });
      }
    } catch {
      setToast({ type: 'error', msg: '还书失败，请稍后再试' });
    } finally {
      setReturningId(null);
    }
  };

  const activeLoans = loans.filter((l) => l.status === 'borrowed' || l.status === 'overdue');
  const returnedLoans = loans.filter((l) => l.status === 'returned');

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  return (
    <div className="page-enter pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-4xl">
        {toast && (
          <div
            className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === 'success' ? 'toast-success' : 'toast-error'
            }`}
          >
            {toast.msg}
          </div>
        )}

        <div className="bg-white rounded-xl p-6 border border-secondary/30 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-10 h-10 text-primary" />
            <div>
              <h2 className="text-lg font-bold text-accent">{user?.name || '读者'}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-primary" />
              当前借阅 {activeLoans.length} 本
            </span>
          </div>
        </div>

        <h2 className="text-lg font-bold text-accent mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          当前借阅
        </h2>

        {loading ? (
          <div className="bg-white rounded-xl p-6 border border-secondary/30 mb-8">
            <TableSkeleton rows={3} />
          </div>
        ) : activeLoans.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-secondary/30 mb-8 text-center text-gray-400">
            暂无借阅记录
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {activeLoans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white rounded-xl p-4 border border-secondary/30 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {loan.book?.title || `图书 #${loan.bookId}`}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      借阅：{new Date(loan.borrowDate).toLocaleDateString()}
                    </span>
                    <span className={`flex items-center gap-1 ${isOverdue(loan.dueDate) ? 'text-red-500 font-medium' : ''}`}>
                      <Clock className="w-3 h-3" />
                      应还：{new Date(loan.dueDate).toLocaleDateString()}
                      {isOverdue(loan.dueDate) && ' (逾期)'}
                    </span>
                  </div>
                </div>

                {confirmId === loan.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReturn(loan.id)}
                      disabled={returningId === loan.id}
                      className="btn-press px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
                    >
                      {returningId === loan.id ? '处理中...' : '确认还书'}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="btn-press px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(loan.id)}
                    className="btn-press flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-accent text-white hover:bg-accent/90 shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    还书
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <h2 className="text-lg font-bold text-accent mb-4">借阅历史</h2>
        {returnedLoans.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-secondary/30 text-center text-gray-400">
            暂无历史记录
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-secondary">
            {returnedLoans.map((loan) => (
              <div key={loan.id} className="mb-4 relative">
                <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-primary" />
                <div className="bg-white rounded-xl p-4 border border-secondary/30 shadow-sm">
                  <p className="font-medium text-gray-800 text-sm">
                    {loan.book?.title || `图书 #${loan.bookId}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(loan.borrowDate).toLocaleDateString()} - {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
