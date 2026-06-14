import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Customer, Receipt, ReceiptStatus } from '../../shared/types';
import { customerApi, receiptApi } from '@/api';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDate, formatReceiptStatus, getStatusColorClass } from '@/utils/format';
import { exportReceiptToPDF } from '@/utils/pdf';

const statusOptions: { value: ReceiptStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'overdue', label: '逾期' },
  { value: 'partial', label: '部分付款' },
];

const PAGE_SIZE = 10;

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [customerId, setCustomerId] = useState('');
  const [status, setStatus] = useState<ReceiptStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    customerId: '',
    status: 'all' as ReceiptStatus | 'all',
    startDate: '',
    endDate: '',
  });
  const [pdfExportingId, setPdfExportingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addNotification } = useAppStore();

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await customerApi.searchCustomers();
      setCustomers(data);
    } catch {
      addNotification('加载客户列表失败', 'error');
    }
  }, [addNotification]);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        customerId?: string;
        status?: ReceiptStatus;
        startDate?: string;
        endDate?: string;
        page: number;
        pageSize: number;
      } = {
        page,
        pageSize: PAGE_SIZE,
      };
      if (appliedFilters.customerId) {
        params.customerId = appliedFilters.customerId;
      }
      if (appliedFilters.status !== 'all') {
        params.status = appliedFilters.status;
      }
      if (appliedFilters.startDate) {
        params.startDate = appliedFilters.startDate;
      }
      if (appliedFilters.endDate) {
        params.endDate = appliedFilters.endDate;
      }
      const data = await receiptApi.getReceipts(params);
      setReceipts(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      addNotification('加载收据列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters, addNotification]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters({ customerId, status, startDate, endDate });
  };

  const handleReset = () => {
    setCustomerId('');
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setAppliedFilters({ customerId: '', status: 'all', startDate: '', endDate: '' });
  };

  const handleView = (id: string) => {
    navigate(`/receipts/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/receipts/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该收据吗？')) return;
    try {
      await receiptApi.deleteReceipt(id);
      addNotification('收据删除成功', 'success');
      fetchReceipts();
    } catch {
      addNotification('删除收据失败', 'error');
    }
  };

  const handleExportPDF = async (receipt: Receipt) => {
    setPdfExportingId(receipt.id);
    try {
      let customer: Customer | undefined;
      try {
        customer = await customerApi.getCustomerById(receipt.customerId);
      } catch {
        customer = undefined;
      }
      exportReceiptToPDF(receipt, customer);
      addNotification('PDF导出成功', 'success');
    } catch {
      addNotification('PDF导出失败', 'error');
    } finally {
      setTimeout(() => {
        setPdfExportingId(null);
      }, 1000);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'service' ? '服务' : '产品';
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">收据管理</h1>
        <button
          onClick={() => navigate('/receipts/new')}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新建收据
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客户</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部客户</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReceiptStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="btn btn-primary flex items-center gap-2 flex-1"
            >
              <Search size={16} />
              搜索
            </button>
            <button onClick={handleReset} className="btn btn-secondary flex-1">
              重置
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">加载中...</div>
      ) : receipts.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">暂无收据数据</div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 font-medium">编号</th>
                    <th className="px-4 py-3 font-medium">客户</th>
                    <th className="px-4 py-3 font-medium">类型</th>
                    <th className="px-4 py-3 font-medium text-right">金额</th>
                    <th className="px-4 py-3 font-medium text-right">税额</th>
                    <th className="px-4 py-3 font-medium text-right">总金额</th>
                    <th className="px-4 py-3 font-medium">日期</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="list-item border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-700">{receipt.receiptNo}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{receipt.customerName}</td>
                      <td className="px-4 py-3 text-gray-600">{getTypeLabel(receipt.transactionType)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(receipt.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(receipt.taxAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {formatCurrency(receipt.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(receipt.date)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColorClass(
                            receipt.status
                          )}`}
                        >
                          {formatReceiptStatus(receipt.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleView(receipt.id)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="查看"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(receipt.id)}
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(receipt.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => handleExportPDF(receipt)}
                            className={`p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors ${
                              pdfExportingId === receipt.id ? 'pdf-downloading' : ''
                            }`}
                            title="导出PDF"
                          >
                            <FileText size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              共 {total} 条，第 {page} / {totalPages} 页
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
