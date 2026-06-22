import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  FileEdit,
  DollarSign,
  Percent,
  Calendar,
  FileText,
  Eye,
} from 'lucide-react';
import type { Customer, Receipt, TransactionType } from '../../shared/types';
import { customerApi, receiptApi } from '@/api';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDate } from '@/utils/format';

const taxRateOptions = [
  { value: 0, label: '0%' },
  { value: 0.06, label: '6%' },
  { value: 0.09, label: '9%' },
  { value: 0.13, label: '13%' },
];

interface FormData {
  customerId: string;
  transactionType: TransactionType;
  amount: string;
  taxRate: number;
  date: string;
  note: string;
}

interface FormErrors {
  customerId?: string;
  amount?: string;
}

export default function ReceiptForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addNotification } = useAppStore();
  const isEdit = !!id;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    transactionType: 'service',
    amount: '',
    taxRate: 0.06,
    date: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const taxAmount = useMemo(() => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return 0;
    return amount * formData.taxRate;
  }, [formData.amount, formData.taxRate]);

  const totalAmount = useMemo(() => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return 0;
    return amount + taxAmount;
  }, [formData.amount, taxAmount]);

  const previewReceiptNo = useMemo(() => {
    const dateStr = formData.date.replace(/-/g, '');
    return `RCT-${dateStr}-NNN`;
  }, [formData.date]);

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await customerApi.searchCustomers();
      setCustomers(data);
    } catch {
      addNotification('加载客户列表失败', 'error');
    }
  }, [addNotification]);

  const fetchReceipt = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await receiptApi.getReceiptById(id);
      setFormData({
        customerId: data.customerId,
        transactionType: data.transactionType,
        amount: data.amount.toString(),
        taxRate: data.taxRate,
        date: data.date,
        note: data.note || '',
      });
    } catch {
      addNotification('加载收据数据失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addNotification]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (isEdit) {
      fetchReceipt();
    }
  }, [isEdit, fetchReceipt]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.customerId) {
      newErrors.customerId = '请选择客户';
    }
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = '请输入有效的金额（大于0）';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === 'taxRate') {
        return { ...prev, [name]: parseFloat(value) };
      }
      return { ...prev, [name]: value };
    });
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTypeChange = (type: TransactionType) => {
    setFormData((prev) => ({ ...prev, transactionType: type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const customer = customers.find((c) => c.id === formData.customerId);
      if (!customer) {
        addNotification('请选择有效的客户', 'error');
        return;
      }

      const amount = parseFloat(formData.amount);
      const payload = {
        customerId: formData.customerId,
        customerName: customer.name,
        transactionType: formData.transactionType,
        amount,
        taxRate: formData.taxRate,
        taxAmount: taxAmount,
        totalAmount,
        date: formData.date,
        note: formData.note,
      };

      let receipt: Receipt;
      if (isEdit && id) {
        receipt = await receiptApi.updateReceipt(id, payload);
        addNotification('收据更新成功', 'success');
      } else {
        receipt = await receiptApi.createReceipt(payload);
        addNotification('收据创建成功', 'success');
      }
      navigate(`/receipts/${receipt.id}`);
    } catch {
      addNotification(isEdit ? '更新收据失败' : '创建收据失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'service' ? '服务' : '产品';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/receipts')}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="返回列表"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? '编辑收据' : '新建收据'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    客户 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <select
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.customerId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">请选择客户</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} - {c.company}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.customerId && (
                    <p className="mt-1 text-sm text-red-500">{errors.customerId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    交易类型
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('service')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        formData.transactionType === 'service'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <FileEdit size={16} />
                      服务
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('product')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        formData.transactionType === 'product'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <FileText size={16} />
                      产品
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    金额 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="请输入金额"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.amount ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    税率
                  </label>
                  <div className="relative">
                    <Percent
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <select
                      name="taxRate"
                      value={formData.taxRate}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {taxRateOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日期
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows={4}
                  placeholder="请输入备注信息（可选）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/receipts')}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center gap-2"
                  disabled={submitting}
                >
                  <Save size={16} />
                  {submitting ? '提交中...' : isEdit ? '保存修改' : '创建收据'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="card p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye size={18} className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">预览</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">收据编号</p>
                <p className="font-mono font-bold text-gray-800">{previewReceiptNo}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">客户</p>
                <p className="font-medium text-gray-800">
                  {formData.customerId
                    ? customers.find((c) => c.id === formData.customerId)?.name ||
                      '未选择'
                    : '未选择'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">交易类型</p>
                <p className="font-medium text-gray-800">
                  {getTypeLabel(formData.transactionType)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">金额</span>
                    <span className="font-medium text-gray-800">
                      {formatCurrency(parseFloat(formData.amount) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      税率 ({(formData.taxRate * 100).toFixed(0)}%)
                    </span>
                    <span className="font-medium text-gray-800">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="text-sm font-medium text-gray-700">总金额</span>
                    <span className="text-xl font-bold text-gray-800">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">日期</p>
                <p className="font-medium text-gray-800">
                  {formData.date ? formatDate(formData.date) : '未选择'}
                </p>
              </div>

              {formData.note && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">备注</p>
                  <p className="font-medium text-gray-800 whitespace-pre-wrap">
                    {formData.note}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
