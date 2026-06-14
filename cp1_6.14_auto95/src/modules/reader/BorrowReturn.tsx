import { useState } from 'react';
import { Search, BookOpen, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { getBooks, borrowBook, returnBook, getReaderLoans } from '../../api';
import Skeleton from '../../components/Skeleton';
import type { Book, Loan, User as UserType } from '../../types';

type Mode = 'borrow' | 'return';

export default function BorrowReturn() {
  const [mode, setMode] = useState<Mode>('borrow');
  const [isbn, setIsbn] = useState('');
  const [book, setBook] = useState<Book | null>(null);
  const [matchingLoan, setMatchingLoan] = useState<Loan | null>(null);
  const [searching, setSearching] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSearch = async () => {
    if (!isbn.trim()) return;
    setBook(null);
    setMatchingLoan(null);
    setSearching(true);
    setToast(null);

    try {
      const books = await import('../../api').then((m) => m.getBooks());
      const found = books.find((b) => b.isbn === isbn.trim());
      if (!found) {
        setToast({ type: 'error', msg: '未找到该ISBN对应的图书' });
        return;
      }
      setBook(found);

      if (mode === 'return') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user: UserType = JSON.parse(userStr);
          const loans = await getReaderLoans(user.id);
          const loan = loans.find(
            (l) => l.bookId === found.id && (l.status === 'borrowed' || l.status === 'overdue')
          );
          setMatchingLoan(loan || null);
        }
      }
    } catch {
      setToast({ type: 'error', msg: '搜索失败，请稍后再试' });
    } finally {
      setSearching(false);
    }
  };

  const handleBorrow = async () => {
    if (!book) return;
    setProcessing(true);
    try {
      const res = await borrowBook(book.id);
      if (res.success) {
        setToast({ type: 'success', msg: '借阅成功！' });
        setBook((prev) => prev ? { ...prev, availableQuantity: prev.availableQuantity - 1 } : prev);
      } else {
        setToast({ type: 'error', msg: res.message || '借阅失败' });
      }
    } catch {
      setToast({ type: 'error', msg: '借阅失败' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReturn = async () => {
    if (!matchingLoan) return;
    setProcessing(true);
    try {
      const res = await returnBook(matchingLoan.id);
      if (res.success) {
        setToast({ type: 'success', msg: '还书成功！' });
        setMatchingLoan(null);
      } else {
        setToast({ type: 'error', msg: res.message || '还书失败' });
      }
    } catch {
      setToast({ type: 'error', msg: '还书失败' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page-enter pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-accent mb-6">借还操作</h1>

        {toast && (
          <div
            className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
              toast.type === 'success' ? 'toast-success' : 'toast-error'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setMode('borrow'); setBook(null); setMatchingLoan(null); setToast(null); }}
            className={`btn-press flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'borrow' ? 'bg-accent text-white' : 'bg-white text-gray-600 border border-secondary/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            借书
          </button>
          <button
            onClick={() => { setMode('return'); setBook(null); setMatchingLoan(null); setToast(null); }}
            className={`btn-press flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'return' ? 'bg-accent text-white' : 'bg-white text-gray-600 border border-secondary/60'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            还书
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 border border-secondary/30 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输入ISBN
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="请输入ISBN号"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary/60 bg-bg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="btn-press px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {searching ? '搜索中...' : '搜索'}
            </button>
          </div>

          {searching && <Skeleton className="h-32 w-full mt-4" />}

          {book && !searching && (
            <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
              <div className="flex gap-4">
                <img
                  src={book.cover}
                  alt={book.title}
                  className="img-fade-in w-20 h-28 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-accent">{book.title}</h3>
                  <p className="text-sm text-gray-500">{book.author}</p>
                  <p className="text-xs text-gray-400 mt-1">ISBN: {book.isbn}</p>
                  <span
                    className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                      book.availableQuantity > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    在架 {book.availableQuantity} 本
                  </span>
                </div>
              </div>

              {mode === 'borrow' && (
                <button
                  onClick={handleBorrow}
                  disabled={processing || book.availableQuantity === 0}
                  className="btn-press mt-4 w-full py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50"
                >
                  {processing ? '处理中...' : book.availableQuantity === 0 ? '暂无在架' : '确认借阅'}
                </button>
              )}

              {mode === 'return' && (
                <>
                  {matchingLoan ? (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        借阅日期：{new Date(matchingLoan.borrowDate).toLocaleDateString()} | 应还日期：{new Date(matchingLoan.dueDate).toLocaleDateString()}
                      </p>
                      <button
                        onClick={handleReturn}
                        disabled={processing}
                        className="btn-press w-full py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50"
                      >
                        {processing ? '处理中...' : '确认归还'}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">未找到该书的借阅记录</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
