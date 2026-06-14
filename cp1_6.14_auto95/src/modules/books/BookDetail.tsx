import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, User, Hash, Tag, Calendar } from 'lucide-react';
import { getBookDetail, borrowBook, getReaderLoans } from '../../api';
import Skeleton from '../../components/Skeleton';
import type { Book, Loan, User as UserType } from '../../types';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getBookDetail(id)
      .then((data) => {
        setBook(data);
        setLoans(data.loans || []);
      })
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleBorrow = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user: UserType = JSON.parse(userStr);

    try {
      const readerLoans = await getReaderLoans(user.id);
      const hasOverdue = readerLoans.some((l) => l.status === 'overdue');
      if (hasOverdue) {
        setToast({ type: 'error', msg: '您有逾期未还图书，请先归还' });
        return;
      }
      const activeLoans = readerLoans.filter((l) => l.status === 'borrowed');
      if (activeLoans.length >= 5) {
        setToast({ type: 'error', msg: '已达最大借阅数量（5本）' });
        return;
      }
    } catch {
      // fallback: proceed with borrow
    }

    setBorrowing(true);
    try {
      const res = await borrowBook(id!);
      if (res.success) {
        setToast({ type: 'success', msg: '借阅成功！' });
        setBook((prev) =>
          prev ? { ...prev, availableQuantity: prev.availableQuantity - 1 } : prev
        );
      } else {
        setToast({ type: 'error', msg: res.message || '借阅失败' });
      }
    } catch {
      setToast({ type: 'error', msg: '借阅失败，请稍后再试' });
    } finally {
      setBorrowing(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-20 pb-10 px-4 container mx-auto">
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="md:flex gap-8">
          <Skeleton className="w-full md:w-72 aspect-[3/4] mb-4 md:mb-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="pt-20 pb-10 px-4 text-center">
        <p className="text-gray-500">图书未找到</p>
      </div>
    );
  }

  const infoItems = [
    { icon: User, label: '作者', value: book.author },
    { icon: Hash, label: 'ISBN', value: book.isbn },
    { icon: Tag, label: '分类', value: book.category },
  ];

  return (
    <div className="page-enter pt-20 pb-10 px-4">
      <div className="container mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="btn-press flex items-center gap-1 text-gray-500 hover:text-accent mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        {toast && (
          <div
            className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === 'success' ? 'toast-success' : 'toast-error'
            }`}
          >
            {toast.msg}
          </div>
        )}

        <div className="md:flex gap-8">
          <div className="w-full md:w-72 shrink-0 mb-6 md:mb-0">
            <img
              src={book.cover}
              alt={book.title}
              className="img-fade-in w-full rounded-xl shadow-md"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-accent mb-4">{book.title}</h1>

            <div className="space-y-2 mb-4">
              {infoItems.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2 text-gray-600">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium w-12">{label}</span>
                  <span className="text-sm">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mb-4 text-sm">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                馆藏 {book.totalQuantity} 本
              </span>
              <span
                className={`px-3 py-1 rounded-full ${
                  book.availableQuantity > 0
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                在架 {book.availableQuantity} 本
              </span>
            </div>

            <div className="bg-secondary/30 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-accent mb-2">简介</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{book.description}</p>
            </div>

            <button
              onClick={handleBorrow}
              disabled={borrowing || book.availableQuantity === 0}
              className="btn-press px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {borrowing ? '借阅中...' : book.availableQuantity === 0 ? '暂无在架' : '借阅此书'}
            </button>
          </div>
        </div>

        {loans.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-accent mb-4">借阅历史</h2>
            <div className="bg-white rounded-xl border border-secondary/30 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/30">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600">借阅人</th>
                    <th className="text-left px-4 py-3 text-gray-600">借阅日期</th>
                    <th className="text-left px-4 py-3 text-gray-600">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr key={loan.id} className="border-t border-secondary/20">
                      <td className="px-4 py-3">{loan.readerId}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(loan.borrowDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            loan.status === 'returned'
                              ? 'bg-green-100 text-green-700'
                              : loan.status === 'overdue'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {loan.status === 'returned'
                            ? '已归还'
                            : loan.status === 'overdue'
                            ? '逾期'
                            : '借阅中'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
