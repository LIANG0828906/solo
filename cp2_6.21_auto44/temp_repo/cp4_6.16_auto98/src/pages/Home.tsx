import { useState, useMemo } from 'react';
import { Plus, Users, DollarSign, Clock, CheckCircle, FileText } from 'lucide-react';
import StatCard from '@/components/StatCard';
import Modal from '@/components/Modal';
import ClientCard from '@/modules/client/components/ClientCard';
import { useClientStore } from '@/modules/client/store';
import { useQuoteStore } from '@/modules/quote/store';
import type { Invoice } from '@/modules/quote/types';
import { cn } from '@/lib/utils';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

const emptyClientForm: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  notes: '',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

const timelineStatusColors: Record<string, string> = {
  unsent: 'bg-gray-400',
  sent: 'bg-gray-500',
  partial: 'bg-blue-500',
  paid: 'bg-green-500',
};

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

export default function Home() {
  const { clients, projects } = useClientStore();
  const { invoices, quotes } = useQuoteStore();
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState<ClientFormData>(emptyClientForm);
  const addClient = useClientStore((state) => state.addClient);

  const stats = useMemo(() => {
    const totalQuoteAmount = quotes.reduce((sum, quote) => {
      const currentVersion = quote.versions.find(
        (v) => v.id === quote.currentVersionId
      );
      return sum + (currentVersion?.totalAmount || 0);
    }, 0);

    const pendingAmount = invoices
      .filter((i) => i.status !== 'paid')
      .reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

    const paidAmount = invoices.reduce((sum, i) => sum + i.paidAmount, 0);

    const inProgressProjects = projects.length;

    return {
      totalQuoteAmount,
      pendingAmount,
      paidAmount,
      inProgressProjects,
    };
  }, [quotes, invoices, projects]);

  const handleAddClient = () => {
    if (!clientForm.name.trim()) return;
    addClient({
      name: clientForm.name,
      email: clientForm.email,
      phone: clientForm.phone,
      notes: clientForm.notes,
    });
    setIsAddClientModalOpen(false);
    setClientForm(emptyClientForm);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            自由职业者项目管理
          </h1>
          <p className="mt-2 text-gray-600">管理您的客户、项目和报价</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="总报价金额"
            value={stats.totalQuoteAmount}
            prefix="¥"
            className="from-blue-50 to-blue-100"
          />
          <StatCard
            title="待收款金额"
            value={stats.pendingAmount}
            prefix="¥"
            className="from-amber-50 to-amber-100"
          />
          <StatCard
            title="已结清金额"
            value={stats.paidAmount}
            prefix="¥"
            className="from-green-50 to-green-100"
          />
          <StatCard
            title="进行中项目数"
            value={stats.inProgressProjects}
            suffix="个"
            className="from-purple-50 to-purple-100"
          />
        </div>

        <div className="mb-8 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border p-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">支付看板</h2>
          </div>
          <PaymentTimeline invoices={invoices} />
          <div className="border-t border-border p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm text-gray-500">待收金额</p>
                <p className="mt-1 text-xl font-bold text-amber-600">
                  {formatCurrency(stats.pendingAmount)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm text-gray-500">已收金额</p>
                <p className="mt-1 text-xl font-bold text-green-600">
                  {formatCurrency(stats.paidAmount)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm text-gray-500">总开票金额</p>
                <p className="mt-1 text-xl font-bold text-primary">
                  {formatCurrency(
                    invoices.reduce((sum, i) => sum + i.totalAmount, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">我的客户</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {clients.length}
            </span>
          </div>
          <button
            onClick={() => setIsAddClientModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 hover:-translate-y-px"
          >
            <Plus size={16} />
            添加客户
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>

        {clients.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">暂无客户</p>
            <button
              onClick={() => setIsAddClientModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90"
            >
              <Plus size={16} />
              添加第一个客户
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onConfirm={handleAddClient}
        title="添加客户"
        confirmText="添加"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientForm.name}
              onChange={(e) =>
                setClientForm({ ...clientForm, name: e.target.value })
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="请输入客户名称"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              邮箱
            </label>
            <input
              type="email"
              value={clientForm.email}
              onChange={(e) =>
                setClientForm({ ...clientForm, email: e.target.value })
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="请输入邮箱地址"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              电话
            </label>
            <input
              type="tel"
              value={clientForm.phone}
              onChange={(e) =>
                setClientForm({ ...clientForm, phone: e.target.value })
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="请输入联系电话"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              备注
            </label>
            <textarea
              value={clientForm.notes}
              onChange={(e) =>
                setClientForm({ ...clientForm, notes: e.target.value })
              }
              rows={3}
              className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="请输入备注信息"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
