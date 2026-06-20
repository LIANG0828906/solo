import { useState, useEffect, useCallback } from 'react';
import { FileDown, Loader2, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import type { Customer, Receipt, Statement } from '../../shared/types';
import { customerApi, statementApi, receiptApi } from '@/api';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDate, formatDateTime, formatReceiptStatus, getStatusColorClass } from '@/utils/format';
import { exportStatementToPDF } from '@/utils/pdf';

type QuickRange = 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | null;

interface StatusSummary {
  count: number;
  totalAmount: number;
  totalTax: number;
  grandTotal: number;
  paidTotal: number;
  pendingTotal: number;
  overdueTotal: number;
}

export default function StatementsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickRange, setQuickRange] = useState<QuickRange>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [statement, setStatement] = useState<Statement | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [generatedAt, setGeneratedAt] = useState('');
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const { addNotification } = useAppStore();

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await customerApi.searchCustomers();
      setCustomers(data);
    } catch {
      addNotification('加载客户列表失败', 'error');
    }
  }, [addNotification]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const setDateRange = (range: QuickRange) => {
    setQuickRange(range);
    const now = dayjs();

    switch (range) {
      case 'thisMonth':
        setStartDate(now.startOf('month').format('YYYY-MM-DD'));
        setEndDate(now.endOf('month').format('YYYY-MM-DD'));
        break;
      case 'lastMonth':
        setStartDate(now.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'));
        setEndDate(now.subtract(1, 'month').endOf('month').format('YYYY-MM-DD'));
        break;
      case 'thisQuarter':
        setStartDate(now.startOf('quarter').format('YYYY-MM-DD'));
        setEndDate(now.endOf('quarter').format('YYYY-MM-DD'));
        break;
      case 'lastQuarter':
        setStartDate(now.subtract(1, 'quarter').startOf('quarter').format('YYYY-MM-DD'));
        setEndDate(now.subtract(1, 'quarter').endOf('quarter').format('YYYY-MM-DD'));
        break;
      default:
        break;
    }
  };

  const calculateSummary = (receiptList: Receipt[]): StatusSummary => {
    let paidTotal = 0;
    let pendingTotal = 0;
    let overdueTotal = 0;
    let totalAmount = 0;
    let totalTax = 0;

    for (const receipt of receiptList) {
      totalAmount += receipt.amount;
      totalTax += receipt.taxAmount;

      switch (receipt.status) {
        case 'paid':
          paidTotal += receipt.totalAmount;
          break;
        case 'pending':
        case 'partial':
          pendingTotal += receipt.totalAmount;
          break;
        case 'overdue':
          overdueTotal += receipt.totalAmount;
          break;
      }
    }

    return {
      count: receiptList.length,
      totalAmount,
      totalTax,
      grandTotal: totalAmount + totalTax,
      paidTotal,
      pendingTotal,
      overdueTotal,
    };
  };

  const handleGenerate = async () => {
    if (!customerId) {
      addNotification('请选择客户', 'error');
      return;
    }
    if (!startDate || !endDate) {
      addNotification('请选择日期范围', 'error');
      return;
    }
    if (startDate > endDate) {
      addNotification('开始日期不能晚于结束日期', 'error');
      return;
    }

    setGenerating(true);
    setLoadingReceipts(true);
    try {
      await statementApi.generateStatement(customerId, startDate, endDate);
      const stmt = await statementApi.getStatement(customerId, startDate, endDate);
      setStatement(stmt);

      const receiptResult = await receiptApi.getReceipts({
        customerId,
        startDate,
        endDate,
        page: 1,
        pageSize: 1000,
      });
      setReceipts(receiptResult.data);
      setGeneratedAt(new Date().toISOString());
      addNotification('对账单生成成功', 'success');
    } catch {
      addNotification('对账单生成失败', 'error');
    } finally {
      setGenerating(false);
      setLoadingReceipts(false);
    }
  };

  const handleExportPDF = async () => {
    if (!statement) return;
    setPdfDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      exportStatementToPDF(statement);
      addNotification('PDF导出成功', 'success');
    } catch {
      addNotification('PDF导出失败', 'error');
    } finally {
      setTimeout(() => {
        setPdfDownloading(false);
      }, 1000);
    }
  };

  const summary = statement ? calculateSummary(receipts) : null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">对账单</h1>

      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">生成参数</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">时间范围快捷选择</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'thisMonth', label: '本月' },
              { value: 'lastMonth', label: '上月' },
              { value: 'thisQuarter', label: '本季度' },
              { value: 'lastQuarter', label: '上季度' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value as QuickRange)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  quickRange === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar size={14} className="inline mr-1" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              客户 <span className="text-red-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择客户</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setQuickRange(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setQuickRange(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn btn-primary flex items-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              生成中...
            </>
          ) : (
            '生成对账单'
          )}
        </button>
      </div>

      {(generating || loadingReceipts) && !statement ? (
        <div className="card p-8 text-center text-gray-500">
          <Loader2 size={32} className="animate-spin mx-auto mb-4" />
          <p>正在生成对账单...</p>
        </div>
      ) : statement && summary ? (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {statement.customerName}
                </h2>
                <p className="text-gray-500 text-sm">
                  账期：{formatDate(statement.startDate)} 至 {formatDate(statement.endDate)}
                </p>
                <p className="text-gray-500 text-sm">
                  生成时间：{formatDateTime(generatedAt)}
                </p>
              </div>
              <button
                onClick={handleExportPDF}
                disabled={pdfDownloading}
                className={`btn btn-primary flex items-center gap-2 ${pdfDownloading ? 'pdf-downloading' : ''}`}
              >
                <FileDown size={18} />
                {pdfDownloading ? '导出中...' : '导出PDF'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">笔数</p>
                <p className="text-xl font-bold text-gray-800">{summary.count}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">总金额</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(summary.totalAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">总税额</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(summary.totalTax)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">价税合计</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(summary.grandTotal)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-green-600 mb-1">已收款</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(summary.paidTotal)}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-xs text-yellow-600 mb-1">待收款</p>
                <p className="text-xl font-bold text-yellow-700">{formatCurrency(summary.pendingTotal)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-xs text-red-600 mb-1">逾期金额</p>
                <p className="text-xl font-bold text-red-700">{formatCurrency(summary.overdueTotal)}</p>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">明细列表</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3 font-medium">收据编号</th>
                    <th className="px-6 py-3 font-medium">日期</th>
                    <th className="px-6 py-3 font-medium">摘要</th>
                    <th className="px-6 py-3 font-medium text-right">金额</th>
                    <th className="px-6 py-3 font-medium text-right">税率</th>
                    <th className="px-6 py-3 font-medium text-right">税额</th>
                    <th className="px-6 py-3 font-medium text-right">总金额</th>
                    <th className="px-6 py-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        暂无明细数据
                      </td>
                    </tr>
                  ) : (
                    receipts.map((receipt) => (
                      <tr
                        key={receipt.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-sm text-gray-800">
                          {receipt.receiptNo}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(receipt.date)}
                        </td>
                        <td className="px-6 py-4 text-gray-800">
                          {receipt.note || `${receipt.transactionType === 'service' ? '服务费' : '商品'}`}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-800">
                          {formatCurrency(receipt.amount)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {(receipt.taxRate * 100).toFixed(0)}%
                        </td>
                        <td className="px-6 py-4 text-right text-gray-800">
                          {formatCurrency(receipt.taxAmount)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-800">
                          {formatCurrency(receipt.totalAmount)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColorClass(receipt.status)}`}
                          >
                            {formatReceiptStatus(receipt.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
