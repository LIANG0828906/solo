import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  Trash2,
  Save,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  FileSpreadsheet,
  GitCompare,
  ArrowLeftRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuoteStore } from '../store';
import type { QuoteItem, QuoteVersionStatus, QuoteVersion } from '../types';

const statusConfig: Record<
  QuoteVersionStatus,
  { label: string; className: string; icon: typeof FileText }
> = {
  draft: { label: '草稿', className: 'bg-gray-100 text-gray-700', icon: FileText },
  sent: { label: '已发送', className: 'bg-blue-100 text-blue-700', icon: Send },
  accepted: { label: '已接受', className: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-700', icon: XCircle },
};

function createEmptyItem(): QuoteItem {
  return {
    id: uuidv4(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 0.13,
  };
}

function calculateItemSubtotal(item: QuoteItem): number {
  return item.quantity * item.unitPrice * (1 + item.taxRate);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function QuoteEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const quotes = useQuoteStore((state) => state.quotes);
  const createQuote = useQuoteStore((state) => state.createQuote);
  const saveVersion = useQuoteStore((state) => state.saveVersion);
  const compareVersions = useQuoteStore((state) => state.compareVersions);
  const createInvoice = useQuoteStore((state) => state.createInvoice);

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersionA, setSelectedVersionA] = useState<string | null>(null);
  const [selectedVersionB, setSelectedVersionB] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<QuoteVersionStatus>('draft');
  const [projectName, setProjectName] = useState('');
  const [quoteDate, setQuoteDate] = useState('');

  const quote = useMemo(() => {
    if (!projectId) return undefined;
    return quotes.find((q) => q.projectId === projectId);
  }, [projectId, quotes]);

  const currentVersion = useMemo(() => {
    if (!quote) return undefined;
    return quote.versions.find((v) => v.id === quote.currentVersionId);
  }, [quote]);

  useEffect(() => {
    if (quote && currentVersion) {
      setItems(
        currentVersion.items.map((item) => ({ ...item }))
      );
      setCurrentStatus(currentVersion.status);
      setProjectName(quote.projectName);
      setQuoteDate(quote.quoteDate);
    }
  }, [quote, currentVersion]);

  const totalAmount = useMemo(() => {
    return items.reduce((total, item) => total + calculateItemSubtotal(item), 0);
  }, [items]);

  const diffResult = useMemo(() => {
    if (!compareMode || !quote || !selectedVersionA || !selectedVersionB) {
      return null;
    }
    const versionA = quote.versions.find((v) => v.id === selectedVersionA);
    const versionB = quote.versions.find((v) => v.id === selectedVersionB);
    if (!versionA || !versionB) return null;
    return compareVersions(versionA, versionB);
  }, [compareMode, quote, selectedVersionA, selectedVersionB, compareVersions]);

  const getItemDiffType = (item: QuoteItem): 'added' | 'removed' | 'modified' | null => {
    if (!diffResult) return null;
    if (diffResult.added.some((a) => a.description === item.description)) return 'added';
    if (diffResult.removed.some((r) => r.description === item.description)) return 'removed';
    if (diffResult.modified.some((m) => m.description === item.description)) return 'modified';
    return null;
  };

  const handleAddItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSaveVersion = () => {
    if (!quote || !projectId) return;
    const validItems = items.filter((item) => item.description.trim() !== '');
    const newVersion = saveVersion(quote.id, validItems, currentStatus);
    if (newVersion) {
      setItems(
        newVersion.items.map((item) => ({ ...item }))
      );
    }
  };

  const handleCreateInvoice = () => {
    if (!quote || !currentVersion) return;
    createInvoice(quote.id, currentVersion.id);
    alert('发票已生成！');
  };

  const handleStatusChange = (status: QuoteVersionStatus) => {
    setCurrentStatus(status);
  };

  if (!quote) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileSpreadsheet className="mx-auto h-16 w-16 text-gray-400" />
          <p className="mt-4 text-gray-600">暂无报价单</p>
          <button
            onClick={() => {
              if (projectId) {
                createQuote(projectId, '新项目');
              }
            }}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            创建报价单
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{projectName}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>报价日期：{formatDate(quoteDate)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveVersion}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
          >
            <Save className="h-4 w-4" />
            保存新版本
          </button>
          <button
            onClick={handleCreateInvoice}
            className="flex items-center gap-2 rounded-lg border border-green-600 px-4 py-2 text-green-600 transition-all duration-200 hover:bg-green-50"
          >
            <FileText className="h-4 w-4" />
            生成发票
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">状态管理</h2>
          <div className="flex items-center gap-2">
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status as QuoteVersionStatus)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200',
                    currentStatus === status
                      ? config.className
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800">报价明细</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">描述</th>
                <th className="w-28 px-4 py-3 text-right text-sm font-medium text-gray-600">数量</th>
                <th className="w-32 px-4 py-3 text-right text-sm font-medium text-gray-600">单价</th>
                <th className="w-24 px-4 py-3 text-right text-sm font-medium text-gray-600">税率(%)</th>
                <th className="w-36 px-4 py-3 text-right text-sm font-medium text-gray-600">小计</th>
                <th className="w-16 px-4 py-3 text-center text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const diffType = getItemDiffType(item);
                const subtotal = calculateItemSubtotal(item);
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'transition-colors',
                      diffType === 'added' && 'bg-green-50',
                      diffType === 'removed' && 'bg-red-50',
                      diffType === 'modified' && 'bg-yellow-50'
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                        placeholder="请输入描述"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        min="0"
                        step="1"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-right text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        min="0"
                        step="0.01"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-right text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={(item.taxRate * 100).toFixed(0)}
                        onChange={(e) =>
                          handleUpdateItem(
                            item.id,
                            'taxRate',
                            (parseFloat(e.target.value) || 0) / 100
                          )
                        }
                        min="0"
                        max="100"
                        step="1"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-right text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(subtotal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    暂无明细，点击下方按钮添加
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleAddItem}
            className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
          >
            <Plus className="h-4 w-4" />
            添加明细行
          </button>
        </div>
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-end">
            <span className="text-gray-600">总金额：</span>
            <span className="ml-2 text-2xl font-bold text-blue-600">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800">版本管理</h2>
          <button
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedVersionA(null);
              setSelectedVersionB(null);
            }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all duration-200',
              compareMode
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <GitCompare className="h-4 w-4" />
            {compareMode ? '退出对比' : '版本对比'}
          </button>
        </div>

        {compareMode && (
          <div className="border-b border-gray-200 bg-blue-50 p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">版本 A</label>
                <select
                  value={selectedVersionA || ''}
                  onChange={(e) => setSelectedVersionA(e.target.value || null)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">请选择版本</option>
                  {quote.versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      版本 {v.version} - {formatDate(v.createdAt)}
                    </option>
                  ))}
                </select>
              </div>
              <ArrowLeftRight className="mt-6 h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">版本 B</label>
                <select
                  value={selectedVersionB || ''}
                  onChange={(e) => setSelectedVersionB(e.target.value || null)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">请选择版本</option>
                  {quote.versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      版本 {v.version} - {formatDate(v.createdAt)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {diffResult && (
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-green-200"></span>
                  新增 {diffResult.added.length}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-red-200"></span>
                  删除 {diffResult.removed.length}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-yellow-200"></span>
                  修改 {diffResult.modified.length}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {quote.versions
            .slice()
            .reverse()
            .map((version: QuoteVersion) => {
              const isCurrent = version.id === quote.currentVersionId;
              const statusInfo = statusConfig[version.status];
              const StatusIcon = statusInfo.icon;
              return (
                <div
                  key={version.id}
                  className={cn(
                    'flex items-center justify-between p-4 transition-colors',
                    isCurrent && 'bg-blue-50',
                    compareMode &&
                      (version.id === selectedVersionA || version.id === selectedVersionB) &&
                      'ring-2 ring-blue-400 ring-inset'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700">
                      V{version.version}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        版本 {version.version}
                        {isCurrent && (
                          <span className="ml-2 text-xs text-blue-600">(当前)</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(version.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      {formatCurrency(version.totalAmount)}
                    </span>
                    <span
                      className={cn(
                        'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                        statusInfo.className
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
