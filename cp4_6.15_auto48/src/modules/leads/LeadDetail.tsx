import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  PhoneCall,
  Mail,
  Users,
  Bell,
  X,
  Plus,
  Tag,
} from 'lucide-react';
import type { FollowUpMethod, FollowUpRecord, LeadSource, LeadStatus } from '@/types';
import { useCRM } from '@/context/CRMContext';
import { cn } from '@/lib/utils';

const sourceColors: Record<LeadSource, string> = {
  '线上广告': 'bg-blue-500',
  '线下展会': 'bg-green-500',
  '朋友推荐': 'bg-orange-500',
  '主动搜索': 'bg-purple-500',
};

const sourceBgColors: Record<LeadSource, string> = {
  '线上广告': 'bg-blue-50 text-blue-700',
  '线下展会': 'bg-green-50 text-green-700',
  '朋友推荐': 'bg-orange-50 text-orange-700',
  '主动搜索': 'bg-purple-50 text-purple-700',
};

const statusColors: Record<LeadStatus, string> = {
  '新建': 'bg-gray-100 text-gray-700',
  '跟进中': 'bg-blue-100 text-blue-700',
  '已转化': 'bg-green-100 text-green-700',
  '已流失': 'bg-red-100 text-red-700',
};

const methodIcons: Record<FollowUpMethod, typeof MessageSquare> = {
  '电话': PhoneCall,
  '微信': MessageSquare,
  '邮件': Mail,
  '面谈': Users,
};

const methodLabels: Record<FollowUpMethod, string> = {
  '电话': '电话沟通',
  '微信': '微信联系',
  '邮件': '邮件往来',
  '面谈': '面访洽谈',
};

interface TimelineItemProps {
  record: FollowUpRecord;
  isNew: boolean;
  isTodayReminder: boolean;
}

function TimelineItem({ record, isNew, isTodayReminder }: TimelineItemProps) {
  const MethodIcon = methodIcons[record.method];
  const [isHighlighted, setIsHighlighted] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setIsHighlighted(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <div
      className={cn(
        'relative pl-8 pb-6 last:pb-0',
        'transition-all duration-300 ease-out',
        isHighlighted && 'animate-highlight rounded-lg -ml-4 pl-12 pr-4 py-3'
      )}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div
        className={cn(
          'absolute left-0 top-1 -translate-x-1/2 w-8 h-8 rounded-full',
          'bg-white border-2 border-gray-200 flex items-center justify-center',
          'transition-all duration-300 ease-out'
        )}
      >
        {isTodayReminder ? (
          <Bell className="w-4 h-4 text-orange-500 animate-bell-swing" />
        ) : (
          <MethodIcon className="w-4 h-4 text-gray-500" />
        )}
      </div>

      <div className={cn(
        'bg-white border border-gray-200 rounded-lg p-4',
        'transition-all duration-300 ease-out',
        'hover:shadow-md hover:border-gray-300',
        isHighlighted && 'ring-2 ring-indigo-200'
      )}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <MethodIcon className="w-4 h-4 text-indigo-600" />
            <span className="font-medium text-gray-900">{methodLabels[record.method]}</span>
            {isTodayReminder && (
              <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                <Bell className="w-3 h-3 animate-bell-swing" />
                今日提醒
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            {record.date}
          </div>
        </div>

        <p className="text-gray-700 text-sm mb-3 leading-relaxed">{record.summary}</p>

        {record.nextReminderDate && (
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">下次提醒：</span>
            <span className={cn(
              'font-medium',
              isTodayReminder ? 'text-orange-600' : 'text-gray-700'
            )}>
              {record.nextReminderDate}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    method: FollowUpMethod;
    summary: string;
    nextReminderDate?: string;
  }) => void;
}

function FollowUpModal({ isOpen, onClose, onSubmit }: FollowUpModalProps) {
  const [formData, setFormData] = useState({
    method: '电话' as FollowUpMethod,
    summary: '',
    nextReminderDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.summary.trim()) return;
    onSubmit({
      method: formData.method,
      summary: formData.summary,
      nextReminderDate: formData.nextReminderDate || undefined,
    });
    setFormData({ method: '电话', summary: '', nextReminderDate: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">添加跟进记录</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 ease-out"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">跟进方式</label>
            <div className="grid grid-cols-4 gap-2">
              {(['电话', '微信', '邮件', '面谈'] as FollowUpMethod[]).map(method => {
                const Icon = methodIcons[method];
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, method }))}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all duration-300 ease-out',
                      formData.method === method
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{method}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">跟进摘要</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 ease-out resize-none"
              placeholder="请输入本次跟进的内容摘要..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">下次提醒日期（可选）</label>
            <input
              type="date"
              value={formData.nextReminderDate}
              onChange={(e) => setFormData(prev => ({ ...prev, nextReminderDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 ease-out"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300 ease-out"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all duration-300 ease-out hover:shadow-md"
            >
              提交
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeadDetail({ leadId, onBack }: { leadId: string; onBack: () => void }) {
  const { getLeadById, addFollowUpRecord, updateLeadStatus } = useCRM();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecordId, setNewRecordId] = useState<string | null>(null);

  const lead = getLeadById(leadId);

  const today = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const sortedRecords = useMemo(() => {
    if (!lead) return [];
    return [...lead.followUpRecords].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [lead]);

  const handleAddRecord = useCallback((data: {
    method: FollowUpMethod;
    summary: string;
    nextReminderDate?: string;
  }) => {
    addFollowUpRecord(leadId, data);
    updateLeadStatus(leadId, '跟进中' as LeadStatus);
    setIsModalOpen(false);
    const updatedLead = getLeadById(leadId);
    if (updatedLead && updatedLead.followUpRecords.length > 0) {
      const newId = updatedLead.followUpRecords[0].id;
      setNewRecordId(newId);
      setTimeout(() => setNewRecordId(null), 3000);
    }
  }, [addFollowUpRecord, leadId, getLeadById, updateLeadStatus]);

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">线索不存在</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 ease-out"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 ease-out"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回列表</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all duration-300 ease-out hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              添加跟进
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 animate-fade-in-up">
          <div className="flex items-start gap-6">
            <div className={cn(
              'w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0',
              sourceColors[lead.source]
            )}>
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{lead.companyName}</h1>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={cn(
                  'px-3 py-1 text-sm font-medium rounded-lg',
                  sourceBgColors[lead.source]
                )}>
                  <Tag className="w-3.5 h-3.5 inline mr-1" />
                  {lead.source}
                </span>
                <span className={cn(
                  'px-3 py-1 text-sm font-medium rounded-lg',
                  statusColors[lead.status]
                )}>
                  {lead.status}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  创建于 {lead.createdAt}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">联系人</p>
                    <p className="font-medium text-gray-900">{lead.contactPerson}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">手机号</p>
                    <p className="font-medium text-gray-900">{lead.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">跟进次数</p>
                    <p className="font-medium text-gray-900">{lead.followUpRecords.length} 次</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            互动时间线
            {sortedRecords.length > 0 && (
              <span className="text-sm font-normal text-gray-500">
                共 {sortedRecords.length} 条记录
              </span>
            )}
          </h2>

          {sortedRecords.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无跟进记录</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors duration-200 ease-out"
              >
                添加第一条跟进记录
              </button>
            </div>
          ) : (
            <div className="relative">
              {sortedRecords.map((record, index) => (
                <div key={record.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in-up">
                  <TimelineItem
                    record={record}
                    isNew={record.id === newRecordId}
                    isTodayReminder={record.nextReminderDate === today}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FollowUpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddRecord}
      />
    </div>
  );
}
