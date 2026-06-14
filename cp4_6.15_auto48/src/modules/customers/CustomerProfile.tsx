import { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  Clock,
} from 'lucide-react';
import { useCRM } from '@/context/CRMContext';
import { cn } from '@/lib/utils';
import type { Customer, Opportunity, Lead, FollowUpRecord } from '@/types';

interface CustomerProfileProps {
  customerId?: string;
}

export default function CustomerProfile({ customerId }: CustomerProfileProps) {
  const {
    customers,
    leads,
    opportunities,
    followUpRecords,
    addOpportunity,
    closeOpportunity,
    getCustomerConversionRate,
  } = useCRM();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [relatedLead, setRelatedLead] = useState<Lead | null>(null);
  const [customerOpps, setCustomerOpps] = useState<Opportunity[]>([]);
  const [customerRecords, setCustomerRecords] = useState<FollowUpRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOpp, setNewOpp] = useState({
    name: '',
    expectedAmount: '',
    expectedCloseDate: '',
  });
  const [animatedProgress, setAnimatedProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (customers.length > 0) {
      const customer = customerId
        ? customers.find((c) => c.id === customerId)
        : customers[0];
      setSelectedCustomer(customer || null);
    }
  }, [customers, customerId]);

  useEffect(() => {
    if (selectedCustomer) {
      const lead = leads.find((l) => l.id === selectedCustomer.leadId);
      setRelatedLead(lead || null);

      const opps = opportunities.filter((o) => o.customerId === selectedCustomer.id);
      setCustomerOpps(opps);

      const records = followUpRecords.filter((r) => r.leadId === selectedCustomer.leadId);
      setCustomerRecords(records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      const initialProgress: Record<string, number> = {};
      opps.forEach((opp) => {
        initialProgress[opp.id] = 0;
      });
      setAnimatedProgress(initialProgress);

      const timer = setTimeout(() => {
        const targetProgress: Record<string, number> = {};
        opps.forEach((opp) => {
          targetProgress[opp.id] = opp.probability;
        });
        setAnimatedProgress(targetProgress);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedCustomer, leads, opportunities, followUpRecords]);

  const handleAddOpportunity = () => {
    if (!selectedCustomer || !newOpp.name || !newOpp.expectedAmount || !newOpp.expectedCloseDate) {
      return;
    }

    addOpportunity(selectedCustomer.id, {
      name: newOpp.name,
      expectedAmount: parseFloat(newOpp.expectedAmount),
      expectedCloseDate: newOpp.expectedCloseDate,
    });

    setNewOpp({ name: '', expectedAmount: '', expectedCloseDate: '' });
    setShowAddForm(false);
  };

  const handleCloseOpportunity = (opportunityId: string, status: 'won' | 'lost') => {
    closeOpportunity(opportunityId, status);
  };

  const getProgressColor = (amount: number): string => {
    const minAmount = 5000;
    const maxAmount = 500000;
    const ratio = Math.min(Math.max((amount - minAmount) / (maxAmount - minAmount), 0), 1);

    const lightR = 191;
    const lightG = 219;
    const lightB = 254;

    const darkR = 37;
    const darkG = 99;
    const darkB = 235;

    const r = Math.round(lightR + (darkR - lightR) * ratio);
    const g = Math.round(lightG + (darkG - lightG) * ratio);
    const b = Math.round(lightB + (darkB - lightB) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getFollowUpTypeIcon = (type: string) => {
    const icons: Record<string, typeof Phone> = {
      call: Phone,
      email: Mail,
      meeting: User,
      presentation: FileText,
      demo: Target,
      quote: DollarSign,
      contract: FileText,
      note: FileText,
    };
    return icons[type] || FileText;
  };

  const getFollowUpTypeName = (type: string): string => {
    const names: Record<string, string> = {
      call: '电话',
      email: '邮件',
      meeting: '会议',
      presentation: '演示',
      demo: '产品展示',
      quote: '报价',
      contract: '合同',
      note: '备注',
    };
    return names[type] || type;
  };

  if (!selectedCustomer) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        暂无客户数据
      </div>
    );
  }

  const conversionRate = getCustomerConversionRate(selectedCustomer.id);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h1>
              <p className="text-lg text-gray-600">{selectedCustomer.company}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  {selectedCustomer.email}
                </span>
                <span className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  {selectedCustomer.phone}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">客户转化率</div>
            <div className="text-3xl font-bold text-indigo-600">{conversionRate}%</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <Building className="w-4 h-4 mr-1" />
              行业
            </div>
            <div className="font-medium text-gray-900">{selectedCustomer.industry}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <User className="w-4 h-4 mr-1" />
              企业规模
            </div>
            <div className="font-medium text-gray-900">{selectedCustomer.companySize}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <MapPin className="w-4 h-4 mr-1" />
              地址
            </div>
            <div className="font-medium text-gray-900 text-sm">{selectedCustomer.address}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <Calendar className="w-4 h-4 mr-1" />
              转化日期
            </div>
            <div className="font-medium text-gray-900">{formatDate(selectedCustomer.convertedDate)}</div>
          </div>
        </div>
      </div>

      {relatedLead && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-indigo-600" />
            关联线索信息
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">线索来源</div>
              <div className="font-medium text-gray-900">
                {relatedLead.source === 'website' && '官网'}
                {relatedLead.source === 'referral' && '推荐'}
                {relatedLead.source === 'social_media' && '社交媒体'}
                {relatedLead.source === 'email_campaign' && '邮件营销'}
                {relatedLead.source === 'cold_call' && '电话拓展'}
                {relatedLead.source === 'trade_show' && '展会'}
                {relatedLead.source === 'advertisement' && '广告'}
                {relatedLead.source === 'direct_mail' && '直邮'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">线索评分</div>
              <div className="font-medium text-gray-900">{relatedLead.score} 分</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">负责人</div>
              <div className="font-medium text-gray-900">{relatedLead.assignee}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">累计营收</div>
              <div className="font-medium text-green-600">{formatCurrency(selectedCustomer.totalRevenue)}</div>
            </div>
          </div>
        </div>
      )}

      {customerRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-indigo-600" />
            跟进记录
          </h2>
          <div className="space-y-4">
            {customerRecords.slice(0, 5).map((record) => {
              const Icon = getFollowUpTypeIcon(record.type);
              return (
                <div key={record.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{getFollowUpTypeName(record.type)}</span>
                      <span className="text-sm text-gray-500">{formatDate(record.date)}</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{record.content}</p>
                    <div className="text-xs text-gray-400 mt-1">
                      {record.userName} · {record.duration} 分钟
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
            商机列表
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={cn(
              'flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-out',
              showAddForm
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            )}
          >
            <Plus className="w-4 h-4 mr-1" />
            {showAddForm ? '取消' : '添加商机'}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商机名称</label>
                <input
                  type="text"
                  value={newOpp.name}
                  onChange={(e) => setNewOpp({ ...newOpp, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  placeholder="输入商机名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预计金额 (元)</label>
                <input
                  type="number"
                  value={newOpp.expectedAmount}
                  onChange={(e) => setNewOpp({ ...newOpp, expectedAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  placeholder="输入预计金额"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预期关闭日期</label>
                <input
                  type="date"
                  value={newOpp.expectedCloseDate}
                  onChange={(e) => setNewOpp({ ...newOpp, expectedCloseDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddOpportunity}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300"
              >
                创建商机
              </button>
            </div>
          </div>
        )}

        {customerOpps.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无商机，点击上方按钮添加</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerOpps.map((opp) => (
              <div
                key={opp.id}
                className={cn(
                  'p-4 rounded-xl border transition-all duration-300 ease-out',
                  opp.status === 'won'
                    ? 'bg-green-50 border-green-200'
                    : opp.status === 'lost'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200 hover:shadow-md'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                    <p className="text-sm text-gray-500">{opp.stage}</p>
                  </div>
                  {opp.status === 'won' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      已赢单
                    </span>
                  )}
                  {opp.status === 'lost' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      已输单
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-500 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {formatCurrency(opp.value)}
                  </span>
                  <span className="text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {opp.expectedCloseDate}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">成功概率</span>
                    <span className="font-medium text-gray-900">
                      {animatedProgress[opp.id] || 0}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${animatedProgress[opp.id] || 0}%`,
                        backgroundColor: getProgressColor(opp.value),
                      }}
                    />
                  </div>
                </div>

                {opp.status !== 'won' && opp.status !== 'lost' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCloseOpportunity(opp.id, 'won')}
                      className="flex-1 py-2 px-3 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-300 flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      标记赢单
                    </button>
                    <button
                      onClick={() => handleCloseOpportunity(opp.id, 'lost')}
                      className="flex-1 py-2 px-3 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-300 flex items-center justify-center"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      标记输单
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
