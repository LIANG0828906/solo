import { useState, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  Filter,
  Plus,
  Phone,
  User,
  Building2,
  MessageSquare,
  UserCheck,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import { useCRM, type Lead, type LeadSource, type LeadStatus } from '@/context/CRMContext';
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
  '待跟进': 'bg-gray-100 text-gray-700',
  '跟进中': 'bg-blue-100 text-blue-700',
  '已成交': 'bg-green-100 text-green-700',
  '已流失': 'bg-red-100 text-red-700',
};

interface LeadCardProps {
  lead: Lead;
  onFollowUp: (id: string) => void;
  onConvert: (id: string) => void;
  onMarkLost: (id: string) => void;
  onClick: (id: string) => void;
}

function LeadCard({ lead, onFollowUp, onConvert, onMarkLost, onClick }: LeadCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);

  const handleAction = useCallback((action: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionType(action);
    setTimeout(() => setActionType(null), 300);

    if (action === 'followUp') onFollowUp(id);
    else if (action === 'convert') onConvert(id);
    else if (action === 'lost') onMarkLost(id);
  }, [onFollowUp, onConvert, onMarkLost]);

  return (
    <div
      className={cn(
        'relative bg-white border border-gray-200 rounded-xl p-5 cursor-pointer overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5',
        isHovered && 'shadow-md'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(lead.id)}
    >
      <div className={cn(
        'absolute top-0 left-0 w-2 h-full',
        sourceColors[lead.source]
      )} />

      <div className="ml-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-md',
              sourceBgColors[lead.source]
            )}>
              {lead.source}
            </span>
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-md',
              statusColors[lead.status]
            )}>
              {lead.status}
            </span>
          </div>
          <span className="text-xs text-gray-400">{lead.createdAt}</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          {lead.companyName}
        </h3>

        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span>{lead.contactPerson}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <span>{lead.phone}</span>
          </div>
        </div>

        {lead.followUpRecords.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              已跟进 {lead.followUpRecords.length} 次
            </p>
          </div>
        )}
      </div>

      <div className={cn(
        'absolute right-0 top-0 h-full flex flex-col justify-center gap-2 pr-3',
        'transform transition-all duration-300 ease-out',
        isHovered ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}>
        <button
          onClick={(e) => handleAction('followUp', lead.id, e)}
          className={cn(
            'p-2 rounded-lg bg-blue-500 text-white',
            'transition-all duration-300 ease-out hover:bg-blue-600',
            actionType === 'followUp' && 'scale-90'
          )}
          title="跟进"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => handleAction('convert', lead.id, e)}
          className={cn(
            'p-2 rounded-lg bg-green-500 text-white',
            'transition-all duration-300 ease-out hover:bg-green-600',
            actionType === 'convert' && 'scale-90'
          )}
          title="转为客户"
        >
          <UserCheck className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => handleAction('lost', lead.id, e)}
          className={cn(
            'p-2 rounded-lg bg-red-500 text-white',
            'transition-all duration-300 ease-out hover:bg-red-600',
            actionType === 'lost' && 'scale-90'
          )}
          title="标记流失"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface LeadFormProps {
  onSubmit: (data: {
    companyName: string;
    contactPerson: string;
    phone: string;
    source: LeadSource;
    status: LeadStatus;
  }) => void;
  onCancel: () => void;
}

function LeadForm({ onSubmit, onCancel }: LeadFormProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    source: '线上广告' as LeadSource,
    status: '待跟进' as LeadStatus,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactPerson || !formData.phone) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">添加新线索</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">公司名称 *</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-out"
            placeholder="请输入公司名称"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">联系人 *</label>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-out"
            placeholder="请输入联系人"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">手机号 *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-out"
            placeholder="请输入手机号"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">来源渠道</label>
          <select
            value={formData.source}
            onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value as LeadSource }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-out appearance-none bg-white"
          >
            <option value="线上广告">线上广告</option>
            <option value="线下展会">线下展会</option>
            <option value="朋友推荐">朋友推荐</option>
            <option value="主动搜索">主动搜索</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all duration-300 ease-out hover:shadow-md"
          >
            添加
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all duration-300 ease-out"
          >
            取消
          </button>
        </div>
      </div>
    </form>
  );
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-all duration-300 ease-out"
      >
        <span className="text-gray-500">{label}:</span>
        <span className="font-medium">{options.find(o => o.value === value)?.label || '全部'}</span>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-300 ease-out', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-10">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-4 py-2 text-left text-sm transition-colors duration-200 ease-out',
                value === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeadsList({ onLeadClick }: { onLeadClick: (id: string) => void }) {
  const { leads, addLead, updateLeadStatus } = useCRM();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const renderStartTime = useRef<number>(0);

  const filteredLeads = useMemo(() => {
    const startTime = performance.now();
    const query = searchQuery.toLowerCase().trim();
    const result = leads.filter(lead => {
      const matchesSearch = !query ||
        lead.companyName.toLowerCase().includes(query) ||
        lead.contactPerson.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
    const duration = performance.now() - startTime;
    if (searchQuery || statusFilter !== 'all' || sourceFilter !== 'all') {
      console.log(`筛选搜索耗时: ${duration.toFixed(2)}ms`);
    }
    return result;
  }, [leads, searchQuery, statusFilter, sourceFilter]);

  const handleAddLead = useCallback((data: {
    companyName: string;
    contactPerson: string;
    phone: string;
    source: LeadSource;
    status: LeadStatus;
  }) => {
    addLead(data);
    setShowForm(false);
  }, [addLead]);

  const handleFollowUp = useCallback((id: string) => {
    onLeadClick(id);
  }, [onLeadClick]);

  const handleConvert = useCallback((id: string) => {
    updateLeadStatus(id, '已成交');
  }, [updateLeadStatus]);

  const handleMarkLost = useCallback((id: string) => {
    updateLeadStatus(id, '已流失');
  }, [updateLeadStatus]);

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: '待跟进', label: '待跟进' },
    { value: '跟进中', label: '跟进中' },
    { value: '已成交', label: '已成交' },
    { value: '已流失', label: '已流失' },
  ];

  const sourceOptions = [
    { value: 'all', label: '全部来源' },
    { value: '线上广告', label: '线上广告' },
    { value: '线下展会', label: '线下展会' },
    { value: '朋友推荐', label: '朋友推荐' },
    { value: '主动搜索', label: '主动搜索' },
  ];

  renderStartTime.current = performance.now();
  setTimeout(() => {
    const duration = performance.now() - renderStartTime.current;
    console.log(`渲染 ${filteredLeads.length} 条数据耗时: ${duration.toFixed(2)}ms`);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">线索管理</h1>
          <p className="text-gray-500">共 {leads.length} 条线索，当前显示 {filteredLeads.length} 条</p>
        </div>

        {showForm ? (
          <LeadForm onSubmit={handleAddLead} onCancel={() => setShowForm(false)} />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            添加新线索
          </button>
        )}

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索公司名或联系人..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-out"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <FilterDropdown
              label="状态"
              value={statusFilter}
              options={statusOptions}
              onChange={setStatusFilter}
            />
            <FilterDropdown
              label="来源"
              value={sourceFilter}
              options={sourceOptions}
              onChange={setSourceFilter}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLeads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onFollowUp={handleFollowUp}
              onConvert={handleConvert}
              onMarkLost={handleMarkLost}
              onClick={onLeadClick}
            />
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">暂无匹配的线索</p>
          </div>
        )}
      </div>
    </div>
  );
}
