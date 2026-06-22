import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
import type { Lead, LeadSource, LeadStatus } from '@/types';
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

interface LeadCardProps {
  lead: Lead;
  onFollowUp: (id: string) => void;
  onConvert: (id: string) => void;
  onMarkLost: (id: string) => void;
  onClick: (id: string) => void;
  index: number;
  isNew: boolean;
}

function LeadCard({ lead, onFollowUp, onConvert, onMarkLost, onClick, index, isNew }: LeadCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showHighlight, setShowHighlight] = useState(isNew);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (isNew) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

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
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        showHighlight && 'animate-highlight'
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
        'transform transition-all duration-500 ease-out',
        isHovered ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        'pointer-events-none',
        isHovered && 'pointer-events-auto'
      )}>
        <div className="flex flex-col gap-2 animate-slide-in-fade">
          <button
            onClick={(e) => handleAction('followUp', lead.id, e)}
            className={cn(
              'p-2 rounded-lg bg-blue-500 text-white shadow-md',
              'transition-all duration-300 ease-out hover:bg-blue-600 hover:scale-110 active:scale-95',
              actionType === 'followUp' && 'animate-bounce-in'
            )}
            title="跟进"
            style={{ transitionDelay: '0ms' }}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleAction('convert', lead.id, e)}
            className={cn(
              'p-2 rounded-lg bg-green-500 text-white shadow-md',
              'transition-all duration-300 ease-out hover:bg-green-600 hover:scale-110 active:scale-95',
              actionType === 'convert' && 'animate-bounce-in'
            )}
            title="转为客户"
            style={{ transitionDelay: '50ms' }}
          >
            <UserCheck className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleAction('lost', lead.id, e)}
            className={cn(
              'p-2 rounded-lg bg-red-500 text-white shadow-md',
              'transition-all duration-300 ease-out hover:bg-red-600 hover:scale-110 active:scale-95',
              actionType === 'lost' && 'animate-bounce-in'
            )}
            title="标记流失"
            style={{ transitionDelay: '100ms' }}
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
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
  const [formData, setFormData] = useState<{
    companyName: string;
    contactPerson: string;
    phone: string;
    source: LeadSource;
    status: LeadStatus;
  }>({
    companyName: '',
    contactPerson: '',
    phone: '',
    source: '线上广告',
    status: '新建',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactPerson || !formData.phone) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 animate-fade-in-up">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">添加新线索</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">公司名称 *</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 ease-out"
            placeholder="请输入公司名称"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">联系人 *</label>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 ease-out"
            placeholder="请输入联系人"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">手机号 *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 ease-out"
            placeholder="请输入手机号"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">来源渠道</label>
          <select
            value={formData.source}
            onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value as LeadSource }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 ease-out appearance-none bg-white"
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
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all duration-300 ease-out hover:shadow-md"
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
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-10 animate-fade-in-up">
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
                value === option.value ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
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

const VIRTUAL_SCROLL_THRESHOLD = 200;
const CARD_HEIGHT = 220;
const GRID_GAP = 16;

export default function LeadsList({ onLeadClick }: { onLeadClick: (id: string) => void }) {
  const { leads, addLead, updateLeadStatus, convertToCustomer } = useCRM();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set());
  const renderStartTime = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(800);

  useEffect(() => {
    const updateHeight = () => {
      if (scrollContainerRef.current) {
        setContainerHeight(scrollContainerRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const searchIndex = useMemo(() => {
    const index = new Map<string, Lead>();
    leads.forEach(lead => {
      index.set(lead.id, lead);
    });
    return index;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const startTime = performance.now();
    const query = searchQuery.toLowerCase().trim();

    let result = leads;

    if (query) {
      result = result.filter(lead =>
        lead.companyName.toLowerCase().includes(query) ||
        lead.contactPerson.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(lead => lead.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      result = result.filter(lead => lead.source === sourceFilter);
    }

    const duration = performance.now() - startTime;
    if (searchQuery || statusFilter !== 'all' || sourceFilter !== 'all') {
      console.log(`筛选搜索耗时: ${duration.toFixed(2)}ms`);
    }

    return result;
  }, [leads, searchQuery, statusFilter, sourceFilter, searchIndex]);

  const handleAddLead = useCallback((data: {
    companyName: string;
    contactPerson: string;
    phone: string;
    source: LeadSource;
    status: LeadStatus;
  }) => {
    addLead(data);
    setShowForm(false);
    setTimeout(() => {
      const newLead = leads[0];
      if (newLead) {
        setNewLeadIds(prev => new Set([...prev, newLead.id]));
        setTimeout(() => {
          setNewLeadIds(prev => {
            const next = new Set(prev);
            next.delete(newLead.id);
            return next;
          });
        }, 5000);
      }
    }, 0);
  }, [addLead, leads]);

  const handleFollowUp = useCallback((id: string) => {
    updateLeadStatus(id, '跟进中' as LeadStatus);
    onLeadClick(id);
  }, [updateLeadStatus, onLeadClick]);

  const handleConvert = useCallback((id: string) => {
    const customer = convertToCustomer(id);
    if (customer) {
      console.log('已转化为客户:', customer.id);
    }
  }, [convertToCustomer]);

  const handleMarkLost = useCallback((id: string) => {
    updateLeadStatus(id, '已流失' as LeadStatus);
  }, [updateLeadStatus]);

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: '新建' as LeadStatus, label: '新建' },
    { value: '跟进中' as LeadStatus, label: '跟进中' },
    { value: '已转化' as LeadStatus, label: '已转化' },
    { value: '已流失' as LeadStatus, label: '已流失' },
  ];

  const sourceOptions = [
    { value: 'all', label: '全部来源' },
    { value: '线上广告' as LeadSource, label: '线上广告' },
    { value: '线下展会' as LeadSource, label: '线下展会' },
    { value: '朋友推荐' as LeadSource, label: '朋友推荐' },
    { value: '主动搜索' as LeadSource, label: '主动搜索' },
  ];

  const useVirtualScroll = filteredLeads.length > VIRTUAL_SCROLL_THRESHOLD;

  const { visibleLeads, startIndex, totalHeight } = useMemo(() => {
    if (!useVirtualScroll) {
      return { visibleLeads: filteredLeads, startIndex: 0, totalHeight: 0 };
    }

    const cardsPerRow = 4;
    const rowHeight = CARD_HEIGHT + GRID_GAP;
    const visibleRows = Math.ceil(containerHeight / rowHeight) + 2;
    const totalRows = Math.ceil(filteredLeads.length / cardsPerRow);
    const totalHeight = totalRows * rowHeight;

    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 1);
    const endRow = Math.min(totalRows, startRow + visibleRows);
    const startIndex = startRow * cardsPerRow;
    const endIndex = Math.min(filteredLeads.length, endRow * cardsPerRow);

    return {
      visibleLeads: filteredLeads.slice(startIndex, endIndex),
      startIndex,
      totalHeight,
    };
  }, [filteredLeads, useVirtualScroll, scrollTop, containerHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  renderStartTime.current = performance.now();
  setTimeout(() => {
    const duration = performance.now() - renderStartTime.current;
    console.log(`渲染 ${filteredLeads.length} 条数据耗时: ${duration.toFixed(2)}ms`);
  }, 0);

  return (
    <div
      ref={scrollContainerRef}
      className="min-h-screen bg-gray-50 p-6 overflow-y-auto"
      onScroll={useVirtualScroll ? handleScroll : undefined}
      style={{ height: '100vh' }}
    >
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
            className="mb-6 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5"
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
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 ease-out"
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

        {useVirtualScroll ? (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${Math.floor(startIndex / 4) * (CARD_HEIGHT + GRID_GAP)}px)`,
              }}
            >
              {visibleLeads.map((lead, index) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onFollowUp={handleFollowUp}
                  onConvert={handleConvert}
                  onMarkLost={handleMarkLost}
                  onClick={onLeadClick}
                  index={startIndex + index}
                  isNew={newLeadIds.has(lead.id) || lead.createdAt === today}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredLeads.map((lead, index) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onFollowUp={handleFollowUp}
                onConvert={handleConvert}
                onMarkLost={handleMarkLost}
                onClick={onLeadClick}
                index={index}
                isNew={newLeadIds.has(lead.id) || lead.createdAt === today}
              />
            ))}
          </div>
        )}

        {filteredLeads.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">暂无匹配的线索</p>
          </div>
        )}
      </div>
    </div>
  );
}
