import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Users, Calendar, AlertCircle } from 'lucide-react';
import { useDebateStore } from './store/debateStore';
import { formatDateTime } from './utils/time';
import type { Debate, CreateDebateRequest } from './types';

const statusConfig = {
  waiting: { label: '等待开始', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: '进行中', color: 'bg-green-100 text-green-800' },
  completed: { label: '已结束', color: 'bg-gray-100 text-gray-800' },
};

export default function HomePage() {
  const navigate = useNavigate();
  const { debates, fetchDebates, createDebate, loading, error } = useDebateStore();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateDebateRequest>({
    name: '',
    proSpeaker: '',
    conSpeaker: '',
    proDuration: 5,
    conDuration: 5,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDebates();
  }, [fetchDebates]);

  const validateDuration = (value: number): string | null => {
    if (value < 1 || value > 20) {
      return '时长必须在1-20分钟之间';
    }
    return null;
  };

  const handleDurationChange = (field: 'proDuration' | 'conDuration', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setFormData((prev) => ({ ...prev, [field]: numValue }));
      const error = validateDuration(numValue);
      setFormErrors((prev) => ({
        ...prev,
        [field]: error || '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = '请输入辩论赛名称';
    }
    if (!formData.proSpeaker.trim()) {
      errors.proSpeaker = '请输入正方辩手昵称';
    }
    if (!formData.conSpeaker.trim()) {
      errors.conSpeaker = '请输入反方辩手昵称';
    }
    
    const proError = validateDuration(formData.proDuration);
    if (proError) errors.proDuration = proError;
    
    const conError = validateDuration(formData.conDuration);
    if (conError) errors.conDuration = conError;
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const newDebate = await createDebate(formData);
    if (newDebate) {
      setShowForm(false);
      navigate(`/debate/${newDebate.id}`);
    }
  };

  const handleDebateClick = (debate: Debate) => {
    navigate(`/debate/${debate.id}`);
  };

  return (
    <div className="min-h-screen bg-debate-bg-primary p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-debate-primary mb-2">在线辩论赛计时系统</h1>
            <p className="text-gray-600">管理赛程、精准计时、实时论点交互</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-debate-accent text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus size={20} />
            新建辩论赛
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
              <h2 className="text-2xl font-bold text-debate-primary mb-6">新建辩论赛</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    辩论赛名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="请输入辩论赛名称"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      正方辩手昵称
                    </label>
                    <input
                      type="text"
                      value={formData.proSpeaker}
                      onChange={(e) => setFormData((prev) => ({ ...prev, proSpeaker: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${formErrors.proSpeaker ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="正方辩手"
                    />
                    {formErrors.proSpeaker && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {formErrors.proSpeaker}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      反方辩手昵称
                    </label>
                    <input
                      type="text"
                      value={formData.conSpeaker}
                      onChange={(e) => setFormData((prev) => ({ ...prev, conSpeaker: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${formErrors.conSpeaker ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="反方辩手"
                    />
                    {formErrors.conSpeaker && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {formErrors.conSpeaker}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      正方发言时长（分钟）
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.proDuration}
                      onChange={(e) => handleDurationChange('proDuration', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${formErrors.proDuration ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.proDuration && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {formErrors.proDuration}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      反方发言时长（分钟）
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.conDuration}
                      onChange={(e) => handleDurationChange('conDuration', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${formErrors.conDuration ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.conDuration && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {formErrors.conDuration}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-debate-accent text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {loading ? '创建中...' : '创建辩论赛'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading && debates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : debates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">暂无辩论赛</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-debate-accent text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              创建第一场辩论赛
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {debates.map((debate) => (
              <div
                key={debate.id}
                onClick={() => handleDebateClick(debate)}
                className="bg-debate-bg-secondary rounded-xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl border border-transparent hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDebateClick(debate);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-debate-primary flex-1 pr-2">
                    {debate.name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusConfig[debate.status].color}`}
                  >
                    {statusConfig[debate.status].label}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={16} className="text-debate-positive flex-shrink-0" />
                    <span className="text-debate-positive font-medium">{debate.proSpeaker}</span>
                    <span className="text-gray-400">VS</span>
                    <span className="text-debate-negative font-medium">{debate.conSpeaker}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} className="text-gray-400 flex-shrink-0" />
                    <span>
                      正方 {debate.proDuration}分钟 / 反方 {debate.conDuration}分钟
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                    <span>{formatDateTime(debate.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
