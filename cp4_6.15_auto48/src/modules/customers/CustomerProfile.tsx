import { useState, useEffect, useMemo } from 'react';
import {
  User,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  Plus,
  ArrowLeft,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { useCRM, type Customer, type Opportunity, type Lead, type OpportunityStatus } from '@/context/CRMContext';
import { cn } from '@/lib/utils';

interface CustomerProfileProps {
  customerId: string;
  onBack: () => void;
}

export default function CustomerProfile({ customerId, onBack }: CustomerProfileProps) {
  const {
    customers,
    leads,
    opportunities,
    addOpportunity,
    closeOpportunity,
    getCustomerConversionRate,
  } = useCRM();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [relatedLead, setRelatedLead] = useState<Lead | null>(null);
  const [customerOpps, setCustomerOpps] = useState<Opportunity[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOpp, setNewOpp] = useState({
    name: '',
    expectedAmount: '',
    expectedCloseDate: '',
  });
  const [animatedProgress, setAnimatedProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const customer = customers.find((c) => c.id === customerId);
    setSelectedCustomer(customer || null);
  }, [customers, customerId]);

  useEffect(() => {
    if (selectedCustomer) {
      const lead = leads.find((l) => l.id === selectedCustomer.leadId);
      setRelatedLead(lead || null);

      const opps = opportunities.filter((o) => o.customerId === selectedCustomer.id);
      setCustomerOpps(opps);

      const initialProgress: Record<string, number> = {};
      opps.forEach((opp) => {
        initialProgress[opp.id] = 0;
      });
      setAnimatedProgress(initialProgress);

      const timer = setTimeout(() => {
        const targetProgress: Record<string, number> = {};
        opps.forEach((opp) => {
          targetProgress[opp.id] = opp.progress;
        });
        setAnimatedProgress(targetProgress);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedCustomer, leads, opportunities]);

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

  const handleCloseOpportunity = (opportunityId: string, status: '已赢单' | '已输单') => {
    closeOpportunity(opportunityId, status);
  };

  const getProgressColor = (amount: number): string => {
    const minAmount = 5000;
    const maxAmount = 500000;
    const ratio = Math.min(Math.max((amount - minAmount) / (maxAmount - minAmount), 0), 1);

    const lightR = 191;
    const lightG = 219;
    const lightB = 254;

    const darkR = 90;
    const darkG = 103;
    const darkB = 216;

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

  const conversionRate = selectedCustomer ? getCustomerConversionRate(selectedCustomer.id) : 0;

  if (!selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">客户不存在</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 ease-out"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  const totalRevenue = useMemo(() => {
    return customerOpps
      .filter((o) => o.status === '已赢单')
      .reduce((sum, o) => sum + o.expectedAmount, 0);
  }, [customerOpps]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 ease-out"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-fade-in-up">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedCustomer.contactPerson}</h1>
                <p className="text-lg text-gray-600">{selectedCustomer.companyName}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
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
                <Building2 className="w-4 h-4 mr-1" />
                公司名称
              </div>
              <div className="font-medium text-gray-900">{selectedCustomer.companyName}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center text-gray-500 text-sm mb-1">
                <User className="w-4 h-4 mr-1" />
                联系人
              </div>
              <div className="font-medium text-gray-900">{selectedCustomer.contactPerson}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center text-gray-500 text-sm mb-1">
                <DollarSign className="w-4 h-4 mr-1" />
                累计营收
              </div>
              <div className="font-medium text-green-600">{formatCurrency(totalRevenue)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center text-gray-500 text-sm mb-1">
                <Calendar className="w-4 h-4 mr-1" />
                转化日期
              </div>
              <div className="font-medium text-gray-900">{formatDate(selectedCustomer.convertedAt)}</div>
            </div>
          </div>
        </div>

        {relatedLead && relatedLead.followUpRecords.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-indigo-600" />
              跟进记录
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {relatedLead.followUpRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{record.method}</span>
                      <span className="text-sm text-gray-500">{record.date}</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{record.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
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
            <div className="mb-6 p-4 bg-gray-50 rounded-lg animate-fade-in-up">
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
              {customerOpps.map((opp, index) => (
                <div
                  key={opp.id}
                  className={cn(
                    'p-4 rounded-xl border transition-all duration-300 ease-out',
                    opp.status === '已赢单'
                      ? 'bg-green-50 border-green-200'
                      : opp.status === '已输单'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-gray-200 hover:shadow-md'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{opp.name}</h3>
                      <p className="text-sm text-gray-500">{opp.status}</p>
                    </div>
                    {opp.status === '已赢单' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        已赢单
                      </span>
                    )}
                    {opp.status === '已输单' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        已输单
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-500 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {formatCurrency(opp.expectedAmount)}
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
                          backgroundColor: getProgressColor(opp.expectedAmount),
                        }}
                      />
                    </div>
                  </div>

                  {opp.status === '进行中' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCloseOpportunity(opp.id, '已赢单')}
                        className="flex-1 py-2 px-3 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-300 flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        标记赢单
                      </button>
                      <button
                        onClick={() => handleCloseOpportunity(opp.id, '已输单')}
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
    </div>
  );
}
