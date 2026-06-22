import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Work, Appointment } from '../dataStore';
import { Edit2, Trash2, Plus, X, Check, ChevronDown, ChevronUp, Image, Calendar, User, Mail, Phone } from 'lucide-react';

const statusColors: Record<Appointment['status'], { bg: string; text: string; label: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E', label: '待处理' },
  contacted: { bg: '#DBEAFE', text: '#1E40AF', label: '已联系' },
  completed: { bg: '#D1FAE5', text: '#065F46', label: '已完成' },
};

const serviceTypeLabels: Record<Appointment['serviceType'], string> = {
  illustration: '插画定制',
  commercial: '商业设计',
  other: '其他',
};

const AdminPage: React.FC = () => {
  const {
    works,
    appointments,
    portfolios,
    setWorks,
    setAppointments,
    setPortfolios,
    removeWork,
    updateWork,
    addWork,
    updateAppointment,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'works' | 'appointments'>('works');
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [workForm, setWorkForm] = useState({
    portfolioId: '',
    title: '',
    description: '',
    imageUrl: '',
    thumbnailUrl: '',
    tags: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [worksRes, appointmentsRes, portfoliosRes] = await Promise.all([
          fetch('/api/works'),
          fetch('/api/appointments'),
          fetch('/api/portfolios'),
        ]);

        if (worksRes.ok && appointmentsRes.ok && portfoliosRes.ok) {
          const worksData = await worksRes.json();
          const appointmentsData = await appointmentsRes.json();
          const portfoliosData = await portfoliosRes.json();
          setWorks(worksData);
          setAppointments(appointmentsData);
          setPortfolios(portfoliosData);
          
          if (portfoliosData.length > 0 && !workForm.portfolioId) {
            setWorkForm((prev) => ({ ...prev, portfolioId: portfoliosData[0].id }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      }
    };

    fetchData();
  }, [setWorks, setAppointments, setPortfolios]);

  const handleOpenWorkModal = (work?: Work) => {
    if (work) {
      setEditingWork(work);
      setWorkForm({
        portfolioId: work.portfolioId,
        title: work.title,
        description: work.description,
        imageUrl: work.imageUrl,
        thumbnailUrl: work.thumbnailUrl,
        tags: work.tags.join(', '),
      });
    } else {
      setEditingWork(null);
      setWorkForm({
        portfolioId: portfolios[0]?.id || '',
        title: '',
        description: '',
        imageUrl: '',
        thumbnailUrl: '',
        tags: '',
      });
    }
    setShowWorkModal(true);
  };

  const handleCloseWorkModal = () => {
    setShowWorkModal(false);
    setEditingWork(null);
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();

    const workData = {
      portfolioId: workForm.portfolioId,
      title: workForm.title,
      description: workForm.description,
      imageUrl: workForm.imageUrl,
      thumbnailUrl: workForm.thumbnailUrl,
      tags: workForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    try {
      if (editingWork) {
        const response = await fetch(`/api/works/${editingWork.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workData),
        });
        if (response.ok) {
          const updatedWork = await response.json();
          updateWork(updatedWork);
        }
      } else {
        const response = await fetch('/api/works', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workData),
        });
        if (response.ok) {
          const newWork = await response.json();
          addWork(newWork);
        }
      }
      handleCloseWorkModal();
    } catch (error) {
      console.error('Failed to save work:', error);
    }
  };

  const handleDeleteWork = async (id: string) => {
    try {
      const response = await fetch(`/api/works/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        removeWork(id);
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Failed to delete work:', error);
    }
  };

  const handleStatusChange = async (id: string, status: Appointment['status']) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        const updatedAppointment = await response.json();
        updateAppointment(updatedAppointment);
      }
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const getPortfolioName = (portfolioId: string) => {
    return portfolios.find((p) => p.id === portfolioId)?.name || '未知画集';
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50 page-transition">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            管理面板
          </h1>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('works')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                activeTab === 'works'
                  ? 'text-white'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              style={activeTab === 'works' ? {
                background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
              } : {}}
            >
              作品管理
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                activeTab === 'appointments'
                  ? 'text-white'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              style={activeTab === 'appointments' ? {
                background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
              } : {}}
            >
              预约管理
              {appointments.filter((a) => a.status === 'pending').length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {appointments.filter((a) => a.status === 'pending').length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'works' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">共 {works.length} 件作品</p>
                <button
                  onClick={() => handleOpenWorkModal()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-white btn-ripple transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)' }}
                >
                  <Plus size={18} />
                  上传新作品
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">作品</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">画集</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">标签</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">点赞数</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {works.map((work, index) => (
                      <tr key={work.id} className="border-b border-gray-100 list-item-enter" style={{ animationDelay: `${index * 30}ms` }}>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={work.thumbnailUrl}
                              alt={work.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {work.title}
                              </p>
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {work.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 text-sm rounded-full" style={{ backgroundColor: 'var(--secondary)', color: '#9D174D' }}>
                            {getPortfolioName(work.portfolioId)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {work.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                #{tag}
                              </span>
                            ))}
                            {work.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{work.tags.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{work.likes}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenWorkModal(work)}
                              className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(work.id)}
                              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div>
              <p className="text-gray-600 mb-4">共 {appointments.length} 条预约</p>
              <div className="space-y-3">
                {appointments.map((appointment, index) => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-xl overflow-hidden list-item-enter"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedAppointment(
                        expandedAppointment === appointment.id ? null : appointment.id
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--secondary)' }}>
                          <User size={20} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {appointment.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {serviceTypeLabels[appointment.serviceType]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm text-gray-600">期望日期</p>
                          <p className="text-sm font-medium">{appointment.expectedDate}</p>
                        </div>
                        <span
                          className="px-3 py-1 text-sm font-medium rounded-full"
                          style={{
                            backgroundColor: statusColors[appointment.status].bg,
                            color: statusColors[appointment.status].text,
                          }}
                        >
                          {statusColors[appointment.status].label}
                        </span>
                        <button className="p-1 text-gray-400">
                          {expandedAppointment === appointment.id ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </button>
                      </div>
                    </div>

                    {expandedAppointment === appointment.id && (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50 fade-in">
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <Mail size={16} className="text-gray-400" />
                              <span className="text-gray-600">{appointment.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={16} className="text-gray-400" />
                              <span className="text-gray-600">{appointment.phone || '未填写'}</span>
                            </div>
                            <div className="flex items-center gap-2 md:col-span-2">
                              <Calendar size={16} className="text-gray-400" />
                              <span className="text-gray-600">
                                提交时间：{new Date(appointment.createdAt).toLocaleString('zh-CN')}
                              </span>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">需求描述：</p>
                            <p className="text-gray-600 whitespace-pre-wrap bg-white p-3 rounded-lg">
                              {appointment.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 pt-4">
                            <span className="text-sm text-gray-600">修改状态：</span>
                            {(Object.keys(statusColors) as Appointment['status'][]).map((status) => (
                              <button
                                key={status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(appointment.id, status);
                                }}
                                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                                  appointment.status === status
                                    ? 'ring-2 ring-offset-2'
                                    : 'opacity-70 hover:opacity-100'
                                }`}
                                style={{
                                  backgroundColor: statusColors[status].bg,
                                  color: statusColors[status].text,
                                  boxShadow: appointment.status === status ? `0 0 0 2px white, 0 0 0 4px ${statusColors[status].bg}` : 'none',
                                }}
                              >
                                {statusColors[status].label}
                                {appointment.status === status && (
                                  <Check size={14} className="inline ml-1" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              确认删除
            </h3>
            <p className="text-gray-600 mb-6">确定要删除这件作品吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteWork(showDeleteConfirm)}
                className="flex-1 py-2.5 rounded-lg text-white font-medium"
                style={{ backgroundColor: 'var(--danger)' }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {showWorkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={handleCloseWorkModal}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingWork ? '编辑作品' : '上传新作品'}
              </h2>
              <button
                onClick={handleCloseWorkModal}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  所属画集
                </label>
                <select
                  value={workForm.portfolioId}
                  onChange={(e) => setWorkForm({ ...workForm, portfolioId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                  required
                >
                  {portfolios.map((portfolio) => (
                    <option key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  作品标题
                </label>
                <input
                  type="text"
                  value={workForm.title}
                  onChange={(e) => setWorkForm({ ...workForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                  placeholder="请输入作品标题"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  作品描述
                </label>
                <textarea
                  value={workForm.description}
                  onChange={(e) => setWorkForm({ ...workForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 resize-none"
                  style={{ height: '100px' }}
                  placeholder="请输入作品描述"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Image size={14} className="inline mr-1" />
                    大图URL
                  </label>
                  <input
                    type="url"
                    value={workForm.imageUrl}
                    onChange={(e) => setWorkForm({ ...workForm, imageUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                    placeholder="https://..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Image size={14} className="inline mr-1" />
                    缩略图URL
                  </label>
                  <input
                    type="url"
                    value={workForm.thumbnailUrl}
                    onChange={(e) => setWorkForm({ ...workForm, thumbnailUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                    placeholder="https://..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  标签（用逗号分隔）
                </label>
                <input
                  type="text"
                  value={workForm.tags}
                  onChange={(e) => setWorkForm({ ...workForm, tags: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                  placeholder="例如: 人物, 古风, 传统"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseWorkModal}
                  className="flex-1 py-3 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-lg font-medium text-white btn-ripple transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)' }}
                >
                  {editingWork ? '保存修改' : '上传作品'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
