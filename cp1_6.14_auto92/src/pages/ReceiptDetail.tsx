import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  CreditCard,
  DollarSign,
  Percent,
  FileEdit,
  CheckCircle,
  Clock,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import type { Customer, Receipt, ReceiptStatus, PaymentInfo } from '../../shared/types';
import { customerApi, receiptApi } from '@/api';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDate, formatReceiptStatus, getStatusColorClass } from '@/utils/format';
import { exportReceiptToPDF } from '@/utils/pdf';

const paymentMethods = [
  { value: 'cash', label: '现金' },
  { value: 'bank', label: '银行转账' },
  { value: 'wechat', label: '微信支付' },
  { value: 'alipay', label: '支付宝' },
  { value: 'card', label: '银行卡' },
];

const statusButtons: {
  value: ReceiptStatus;
  label: string;
  icon: typeof CheckCircle;
  activeClass: string;
}[] = [
  {
    value: 'pending',
    label: '待支付',
    icon: Clock,
    activeClass: 'bg-yellow-500 text-white',
  },
  {
    value: 'paid',
    label: '已支付',
    icon: CheckCircle,
    activeClass: 'bg-green-500 text-white',
  },
  {
    value: 'overdue',
    label: '逾期',
    icon: AlertTriangle,
    activeClass: 'bg-red-500 text-white',
  },
  {
    value: 'partial',
    label: '部分付款',
    icon: Wallet,
    activeClass: 'bg-blue-500 text-white',
  },
];

export default function ReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addNotification } = useAppStore();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');
  const [partialMethod, setPartialMethod] = useState('cash');
  const [partialDate, setPartialDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const receiptData = await receiptApi.getReceiptById(id);
      setReceipt(receiptData);
      try {
        const customerData = await customerApi.getCustomerById(receiptData.customerId);
        setCustomer(customerData);
      } catch {
        setCustomer(null);
      }
      if (receiptData.paymentInfo?.amount) {
        setPartialAmount(receiptData.paymentInfo.amount.toString());
      }
      if (receiptData.paymentInfo?.method) {
        setPartialMethod(receiptData.paymentInfo.method);
      }
      if (receiptData.paymentInfo?.date) {
        setPartialDate(receiptData.paymentInfo.date);
      }
    } catch {
      addNotification('加载收据详情失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPDF = async () => {
    if (!receipt) return;
    setPdfExporting(true);
    try {
      exportReceiptToPDF(receipt, customer || undefined);
      addNotification('PDF导出成功', 'success');
    } catch {
      addNotification('PDF导出失败', 'error');
    } finally {
      setTimeout(() => {
        setPdfExporting(false);
      }, 1000);
    }
  };

  const handleStatusChange = async (newStatus: ReceiptStatus) => {
    if (!receipt || !id) return;

    let paymentInfo: PaymentInfo | undefined;

    if (newStatus === 'paid') {
      paymentInfo = {
        date: new Date().toISOString().split('T')[0],
        method: partialMethod,
        amount: receipt.totalAmount,
      };
    } else if (newStatus === 'partial') {
      const amount = parseFloat(partialAmount);
      if (!partialAmount || isNaN(amount) || amount <= 0) {
        addNotification('请输入有效的付款金额', 'error');
        return;
      }
      if (amount > receipt.totalAmount) {
        addNotification('付款金额不能超过总金额', 'error');
        return;
      }
      if (!partialDate) {
        addNotification('请选择付款日期', 'error');
        return;
      }
      paymentInfo = {
        date: partialDate,
        method: partialMethod,
        amount,
      };
    }

    setUpdatingStatus(true);
    try {
      const updated = await receiptApi.updateStatus(id, newStatus, paymentInfo);
      setReceipt(updated);
      addNotification(`状态已更新为${formatReceiptStatus(newStatus)}`, 'success');
    } catch {
      addNotification('更新状态失败', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'service' ? '服务' : '产品';
  };

  const getMethodLabel = (method: string) => {
    const found = paymentMethods.find((m) => m.value === method);
    return found ? found.label : method;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center text-gray-500">收据不存在</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/receipts')}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="返回列表"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">收据详情</h1>
        </div>
        <button
          onClick={handleExportPDF}
          className={`btn btn-primary flex items-center gap-2 ${pdfExporting ? 'pdf-downloading' : ''}`}
        >
          <FileText size={18} />
          导出PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">收据编号</p>
                <p className="font-mono text-xl font-bold text-gray-800">
                  {receipt.receiptNo}
                </p>
              </div>
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColorClass(
                  receipt.status
                )}`}
              >
                {formatReceiptStatus(receipt.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">客户</p>
                  <p className="font-medium text-gray-800">{receipt.customerName}</p>
                  {customer && (
                    <>
                      <p className="text-sm text-gray-500 mt-1">{customer.company}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FileEdit size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">交易类型</p>
                  <p className="font-medium text-gray-800">
                    {getTypeLabel(receipt.transactionType)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">金额</p>
                  <p className="font-medium text-gray-800">
                    {formatCurrency(receipt.amount)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Percent size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">税率</p>
                  <p className="font-medium text-gray-800">
                    {(receipt.taxRate * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <CreditCard size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">税额</p>
                  <p className="font-medium text-gray-800">
                    {formatCurrency(receipt.taxAmount)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Calendar size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">日期</p>
                  <p className="font-medium text-gray-800">
                    {formatDate(receipt.date)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-lg text-gray-600">总金额</span>
                <span className="text-3xl font-bold text-gray-800">
                  {formatCurrency(receipt.totalAmount)}
                </span>
              </div>
            </div>

            {receipt.note && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">备注</p>
                <p className="text-gray-700 whitespace-pre-wrap">{receipt.note}</p>
              </div>
            )}
          </div>

          {(receipt.status === 'paid' || receipt.status === 'partial') &&
            receipt.paymentInfo && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">付款信息</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {receipt.paymentInfo.date && (
                    <div>
                      <p className="text-sm text-gray-500">付款日期</p>
                      <p className="font-medium text-gray-800">
                        {formatDate(receipt.paymentInfo.date)}
                      </p>
                    </div>
                  )}
                  {receipt.paymentInfo.method && (
                    <div>
                      <p className="text-sm text-gray-500">付款方式</p>
                      <p className="font-medium text-gray-800">
                        {getMethodLabel(receipt.paymentInfo.method)}
                      </p>
                    </div>
                  )}
                  {receipt.paymentInfo.amount !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">付款金额</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(receipt.paymentInfo.amount)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">状态管理</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">当前状态</p>
              <span
                className={`inline-block w-full text-center px-4 py-3 rounded-lg text-base font-semibold ${getStatusColorClass(
                  receipt.status
                )}`}
              >
                {formatReceiptStatus(receipt.status)}
              </span>
            </div>

            <div className="space-y-2">
              {statusButtons.map((btn) => {
                const Icon = btn.icon;
                const isActive = receipt.status === btn.value;
                return (
                  <button
                    key={btn.value}
                    onClick={() => handleStatusChange(btn.value)}
                    disabled={updatingStatus || isActive}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                      isActive
                        ? btn.activeClass
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
                    }`}
                  >
                    <Icon size={16} />
                    {btn.label}
                  </button>
                );
              })}
            </div>

            {receipt.status === 'partial' && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    付款金额
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入付款金额"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    付款方式
                  </label>
                  <select
                    value={partialMethod}
                    onChange={(e) => setPartialMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    付款日期
                  </label>
                  <input
                    type="date"
                    value={partialDate}
                    onChange={(e) => setPartialDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => handleStatusChange('partial')}
                  disabled={updatingStatus}
                  className="w-full btn btn-primary"
                >
                  更新部分付款
                </button>
              </div>
            )}

            {(receipt.status === 'pending' || receipt.status === 'overdue') && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    付款方式
                  </label>
                  <select
                    value={partialMethod}
                    onChange={(e) => setPartialMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate(`/receipts/${receipt.id}/edit`)}
            className="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
            <FileEdit size={18} />
            编辑收据
          </button>
        </div>
      </div>
    </div>
  );
}
