import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, CheckCircle } from 'lucide-react';
import type { DashboardStats, Receipt } from '../../shared/types';
import { dashboardApi, receiptApi } from '@/api';
import { useAppStore } from '@/store/useAppStore';
import StatCard from '@/components/StatCard';

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: '待付款', className: 'bg-orange-100 text-orange-700' },
  paid: { label: '已付款', className: 'bg-green-100 text-green-700' },
  overdue: { label: '已逾期', className: 'bg-red-100 text-red-700' },
  partial: { label: '部分付款', className: 'bg-blue-100 text-blue-700' },
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addNotification } = useAppStore();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch {
      addNotification('加载仪表盘数据失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleViewReceipt = (id: string) => {
    navigate(`/receipts/${id}`);
  };

  const handleMarkPaid = async (id: string) => {
    if (!confirm('确定要将此收据标记为已付款吗？')) return;
    setMarkingId(id);
    try {
      await receiptApi.updateStatus(id, 'paid', {
        date: new Date().toISOString().split('T')[0],
        method: 'cash',
      });
      addNotification('收据已标记为已付款', 'success');
      fetchStats();
    } catch {
      addNotification('标记付款失败', 'error');
    } finally {
      setMarkingId(null);
    }
  };

  const formatAmount = (amount: number) => {
    return '¥' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">仪表盘</h1>

      {loading && !stats ? (
        <div className="card p-8 text-center text-gray-500">加载中...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="本月待收款"
              value={stats?.monthPending || 0}
              gradientType="pending"
              prefix="¥"
            />
            <StatCard
              title="本月已收款"
              value={stats?.monthPaid || 0}
              gradientType="paid"
              prefix="¥"
            />
            <StatCard
              title="逾期收款"
              value={stats?.overdueTotal || 0}
              gradientType="overdue"
              prefix="¥"
            />
            <StatCard
              title="客户总数"
              value={stats?.customerCount || 0}
              gradientType="customer"
            />
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">近期收据</h2>
            {!stats?.recentReceipts || stats.recentReceipts.length === 0 ? (
              <div className="py-8 text-center text-gray-500">暂无收据数据</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">客户</th>
                      <th className="pb-3 font-medium">日期</th>
                      <th className="pb-3 font-medium">金额</th>
                      <th className="pb-3 font-medium">状态</th>
                      <th className="pb-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentReceipts.map((receipt: Receipt) => (
                      <tr
                        key={receipt.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4">
                          <p className="font-medium text-gray-800">{receipt.customerName}</p>
                          <p className="text-sm text-gray-400">#{receipt.receiptNo}</p>
                        </td>
                        <td className="py-4 text-gray-600">{formatDate(receipt.date)}</td>
                        <td className="py-4 font-medium text-gray-800">
                          {formatAmount(receipt.totalAmount)}
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                              statusLabels[receipt.status]?.className || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {statusLabels[receipt.status]?.label || receipt.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewReceipt(receipt.id)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <Eye size={16} />
                            </button>
                            {receipt.status !== 'paid' && (
                              <button
                                onClick={() => handleMarkPaid(receipt.id)}
                                disabled={markingId === receipt.id}
                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="标记付款"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
