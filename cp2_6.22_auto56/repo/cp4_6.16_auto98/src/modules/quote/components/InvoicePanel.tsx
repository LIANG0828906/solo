import { useState, useMemo } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  Clock,
  DollarSign,
  Send,
  X,
  Eye,
  Calendar,
  Hash,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuoteStore } from '../store';
import type { Invoice, InvoiceStatus, QuoteItem, QuoteVersion } from '../types';

const statusConfig: Record<
  InvoiceStatus,
  { label: string; bgColor: string; textColor: string; dotColor: string }
> = {
  unsent: {
    label: '未发送',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    dotColor: 'bg-gray-400',
  },
  sent: {
    label: '已发送',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    dotColor: 'bg-blue-500',
  },
  partial: {
    label: '部分付款',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
    dotColor: 'bg-amber-500',
  },
  paid: {
    label: '已结清',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    dotColor: 'bg-green-500',
  },
};

const timelineStatusColors: Record<InvoiceStatus, string> = {
  unsent: 'bg-gray-400',
  sent: 'bg-gray-500',
  partial: 'bg-blue-500',
  paid: 'bg-green-500',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount);
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.bgColor,
        config.textColor
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  );
}

function StatusDropdown({
  status,
  onChange,
}: {
  status: InvoiceStatus;
  onChange: (status: InvoiceStatus) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const statuses: InvoiceStatus[] = ['unsent', 'sent', 'partial', 'paid'];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
      >
        切换状态
        <ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-32 rounded-md border border-gray-200 bg-white shadow-lg">
            {statuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50',
                  status === s ? 'bg-gray-50 font-medium' : ''
                )}
              >
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    statusConfig[s].dotColor
                  )}
                />
                {statusConfig[s].label}
                {status === s && <Check className="ml-auto h-4 w-4 text-green-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InvoiceDetail({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) {
  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">发票明细</h4>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">发票号：</span>
          <span className="font-medium">{invoice.invoiceNumber}</span>
        </div>
        <div>
          <span className="text-gray-500">合同号：</span>
          <span className="font-medium">{invoice.contractNumber}</span>
        </div>
        <div>
          <span className="text-gray-500">开票日期：</span>
          <span>{formatDate(invoice.invoiceDate)}</span>
        </div>
        <div>
          <span className="text-gray-500">状态：</span>
          <StatusBadge status={invoice.status} />
        </div>
      </div>
      <div className="mb-4">
        <h5 className="mb-2 text-sm font-medium text-gray-700">明细项目</h5>
        <div className="overflow-hidden rounded-md border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  描述
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">
                  数量
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">
                  单价
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">
                  税率
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">
                  小计
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => {
                const subtotal = item.quantity * item.unitPrice;
                const tax = subtotal * item.taxRate;
                const total = subtotal + tax;
                return (
                  <tr
                    key={item.id}
                    className="border-t border-gray-200 bg-white"
                  >
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {(item.taxRate * 100).toFixed(0)}%
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <div className="text-sm text-gray-500">
          已付款：
          <span className="font-medium text-green-600">
            {formatCurrency(invoice.paidAmount)}
          </span>
        </div>
        <div className="text-sm">
          总金额：
          <span className="text-lg font-bold text-primary">
            {formatCurrency(invoice.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}

function InvoiceCard({
  invoice,
  isExpanded,
  onToggle,
  onStatusChange,
}: {
  invoice: Invoice;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: InvoiceStatus) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div
        className="cursor-pointer p-4 transition-colors hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-semibold text-gray-900">
                {invoice.invoiceNumber}
              </span>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="mb-2 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />
                {invoice.contractNumber}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(invoice.invoiceDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-lg font-bold text-primary">
                {formatCurrency(invoice.totalAmount)}
              </span>
              {invoice.paidAmount > 0 && (
                <span className="text-sm text-green-600">
                  (已付 {formatCurrency(invoice.paidAmount)})
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="查看明细"
            >
              <Eye className="h-4 w-4" />
            </button>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end">
          <StatusDropdown
            status={invoice.status}
            onChange={(s) => onStatusChange(s)}
          />
        </div>
      </div>
      {isExpanded && <InvoiceDetail invoice={invoice} onClose={onToggle} />}
    </div>
  );
}

function PaymentTimeline({ invoices }: { invoices: Invoice[] }) {
  const recentEvents = useMemo(() => {
    const allEvents = invoices.flatMap((invoice) =>
      invoice.paymentEvents.map((event) => ({
        ...event,
        invoiceNumber: invoice.invoiceNumber,
      }))
    );
    return allEvents
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 5)
      .reverse();
  }, [invoices]);

  if (recentEvents.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-gray-400">
        <div className="text-center">
          <Clock className="mx-auto mb-2 h-10 w-10 opacity-50" />
          <p className="text-sm">暂无支付记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="relative">
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200" />
        <div className="relative flex items-end justify-between">
          {recentEvents.map((event, index) => {
            const isLatest = index === recentEvents.length - 1;
            return (
              <div
                key={event.id}
                className="relative flex flex-1 flex-col items-center"
              >
                <div className="relative z-10">
                  <div
                    className={cn(
                      'relative flex h-12 w-12 items-center justify-center rounded-full border-4 border-white shadow-md',
                      timelineStatusColors[event.status]
                    )}
                  >
                    {isLatest && (
                      <div
                        className={cn(
                          'absolute inset-0 rounded-full animate-ping opacity-75',
                          timelineStatusColors[event.status]
                        )}
                        style={{ animationDuration: '2s' }}
                      />
                    )}
                    <DollarSign className="relative h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs font-medium text-gray-900">
                    {formatCurrency(event.amount)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(event.date)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {event.invoiceNumber}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CreateInvoiceModal({
  onClose,
  onCreate,
  quotes,
}: {
  onClose: () => void;
  onCreate: (
    quoteId: string,
    quoteVersionId: string,
    itemIds?: string[]
  ) => void;
  quotes: { id: string; projectName: string; versions: QuoteVersion[] }[];
}) {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isPartial, setIsPartial] = useState(false);

  const selectedQuote = quotes.find((q) => q.id === selectedQuoteId);
  const selectedVersion = selectedQuote?.versions.find(
    (v) => v.id === selectedVersionId
  );

  const handleItemToggle = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedVersion) {
      const allIds = selectedVersion.items.map((item) => item.id);
      setSelectedItemIds(
        selectedItemIds.length === allIds.length ? [] : allIds
      );
    }
  };

  const handleCreate = () => {
    if (!selectedQuoteId || !selectedVersionId) return;
    onCreate(
      selectedQuoteId,
      selectedVersionId,
      isPartial ? selectedItemIds : undefined
    );
    onClose();
  };

  const canCreate =
    selectedQuoteId &&
    selectedVersionId &&
    (!isPartial || selectedItemIds.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">
            创建发票
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              选择报价单
            </label>
            <select
              value={selectedQuoteId}
              onChange={(e) => {
                setSelectedQuoteId(e.target.value);
                setSelectedVersionId('');
                setSelectedItemIds([]);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">请选择报价单</option>
              {quotes.map((quote) => (
                <option key={quote.id} value={quote.id}>
                  {quote.projectName}
                </option>
              ))}
            </select>
          </div>
          {selectedQuote && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                选择版本
              </label>
              <select
                value={selectedVersionId}
                onChange={(e) => {
                  setSelectedVersionId(e.target.value);
                  setSelectedItemIds([]);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">请选择版本</option>
                {selectedQuote.versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    版本 {version.version} (
                    {formatDate(version.createdAt)})
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedVersion && selectedVersion.items.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  部分开票
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isPartial}
                    onChange={(e) => setIsPartial(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  启用部分开票
                </label>
              </div>
              {isPartial && (
                <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200">
                  <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={
                        selectedItemIds.length ===
                        selectedVersion.items.length
                      }
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      全选
                    </span>
                  </div>
                  {selectedVersion.items.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(item.id)}
                        onChange={() => handleItemToggle(item.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="flex-1 text-sm">{item.description}</span>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(
                          item.quantity *
                            item.unitPrice *
                            (1 + item.taxRate)
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium text-white',
              canCreate
                ? 'bg-primary hover:bg-primary/90'
                : 'cursor-not-allowed bg-gray-300'
            )}
          >
            创建发票
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePanel() {
  const {
    invoices,
    quotes,
    createInvoice,
    updateInvoiceStatus,
  } = useQuoteStore();
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort(
      (a, b) =>
        new Date(b.invoiceDate).getTime() -
        new Date(a.invoiceDate).getTime()
    );
  }, [invoices]);

  const handleToggleExpand = (invoiceId: string) => {
    setExpandedInvoiceId((prev) =>
      prev === invoiceId ? null : invoiceId
    );
  };

  const handleStatusChange = (
    invoiceId: string,
    status: InvoiceStatus
  ) => {
    updateInvoiceStatus(invoiceId, status);
  };

  const handleCreateInvoice = (
    quoteId: string,
    quoteVersionId: string,
    itemIds?: string[]
  ) => {
    createInvoice(quoteId, quoteVersionId, itemIds);
  };

  return (
    <div className="flex h-full flex-col gap-4 lg:flex-row">
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-card">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              发票列表
            </h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {invoices.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            新建发票
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {sortedInvoices.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-gray-400">
                <FileText className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>暂无发票</p>
                <p className="mt-1 text-sm">点击上方按钮创建第一张发票</p>
              </div>
            </div>
          ) : (
            sortedInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                isExpanded={expandedInvoiceId === invoice.id}
                onToggle={() => handleToggleExpand(invoice.id)}
                onStatusChange={(status) =>
                  handleStatusChange(invoice.id, status)
                }
              />
            ))
          )}
        </div>
      </div>

      <div className="flex w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-card lg:w-96">
        <div className="flex items-center gap-2 border-b border-gray-200 p-4">
          <FileCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">
            支付看板
          </h2>
        </div>
        <div className="flex-1">
          <PaymentTimeline invoices={invoices} />
        </div>
        <div className="border-t border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-500">待收金额</p>
              <p className="mt-1 text-xl font-bold text-amber-600">
                {formatCurrency(
                  invoices
                    .filter((i) => i.status !== 'paid')
                    .reduce(
                      (sum, i) => sum + (i.totalAmount - i.paidAmount),
                      0
                    )
                )}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-500">已收金额</p>
              <p className="mt-1 text-xl font-bold text-green-600">
                {formatCurrency(
                  invoices.reduce((sum, i) => sum + i.paidAmount, 0)
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-sm text-gray-500">总开票金额</p>
            <p className="mt-1 text-xl font-bold text-primary">
              {formatCurrency(
                invoices.reduce((sum, i) => sum + i.totalAmount, 0)
              )}
            </p>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateInvoice}
          quotes={quotes}
        />
      )}
    </div>
  );
}
