import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { getAllLoans, addLateFee } from '../../api';
import { TableSkeleton } from '../../components/Skeleton';
import type { Loan } from '../../types';

export default function LoanRecords() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [feeLoanId, setFeeLoanId] = useState<string | null>(null);
  const [feeAmount, setFeeAmount] = useState('0.5');
  const [addingFee, setAddingFee] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAllLoans()
      .then(setLoans)
      .catch(() => setLoans([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAddFee = async (loanId: string) => {
    setAddingFee(true);
    try {
      const res = await addLateFee(loanId, parseFloat(feeAmount));
      if (res.success) {
        setLoans((prev) =>
          prev.map((l) =>
            l.id === loanId ? { ...l, lateFee: l.lateFee + parseFloat(feeAmount) } : l
          )
        );
        setFeeLoanId(null);
      }
    } catch {
      // error handled silently
    } finally {
      setAddingFee(false);
    }
  };

  const statusLabel = (status: Loan['status']) => {
    const map = {
      borrowed: { text: '借阅中', cls: 'bg-yellow-100 text-yellow-700' },
      returned: { text: '已归还', cls: 'bg-green-100 text-green-700' },
      overdue: { text: '逾期', cls: 'bg-red-100 text-red-600' },
    };
    const s = map[status];
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.text}</span>;
  };

  return (
    <div className="bg-white rounded-xl border border-secondary/30 shadow-sm">
      <div className="p-4 border-b border-secondary/30">
        <h2 className="text-lg font-bold text-accent">借阅记录</h2>
      </div>

      {loading ? (
        <div className="p-4"><TableSkeleton rows={6} /></div>
      ) : loans.length === 0 ? (
        <div className="p-8 text-center text-gray-400">暂无借阅记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600">读者</th>
                <th className="text-left px-4 py-3 text-gray-600">图书</th>
                <th className="text-left px-4 py-3 text-gray-600">借阅日期</th>
                <th className="text-left px-4 py-3 text-gray-600">应还日期</th>
                <th className="text-left px-4 py-3 text-gray-600">状态</th>
                <th className="text-left px-4 py-3 text-gray-600">逾期费</th>
                <th className="text-left px-4 py-3 text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id} className="border-t border-secondary/20 hover:bg-secondary/10">
                  <td className="px-4 py-3 text-gray-700">{loan.reader?.name || loan.readerId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{loan.book?.title || loan.bookId}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(loan.borrowDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(loan.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{statusLabel(loan.status)}</td>
                  <td className="px-4 py-3 text-red-500 font-medium">
                    {loan.lateFee > 0 ? `¥${loan.lateFee.toFixed(1)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {feeLoanId === loan.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={feeAmount}
                          onChange={(e) => setFeeAmount(e.target.value)}
                          className="w-20 px-2 py-1 rounded border border-secondary/60 text-sm"
                        />
                        <button
                          onClick={() => handleAddFee(loan.id)}
                          disabled={addingFee}
                          className="btn-press px-2 py-1 rounded bg-accent text-white text-xs hover:bg-accent/90"
                        >
                          {addingFee ? '...' : '确认'}
                        </button>
                        <button
                          onClick={() => setFeeLoanId(null)}
                          className="btn-press px-2 py-1 rounded bg-gray-100 text-gray-500 text-xs"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setFeeLoanId(loan.id)}
                        className="btn-press flex items-center gap-1 px-2 py-1 rounded text-primary hover:bg-secondary/60 text-xs"
                      >
                        <DollarSign className="w-3 h-3" />
                        加逾期费
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
