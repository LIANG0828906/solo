import React, { useState } from 'react';
import { X, Calendar, Mail, User, Phone, FileText, Loader2, CheckCircle } from 'lucide-react';
import { useAppStore } from '../store';
import { Appointment } from '../dataStore';

const serviceTypeOptions = [
  { value: 'illustration', label: '插画定制' },
  { value: 'commercial', label: '商业设计' },
  { value: 'other', label: '其他' },
];

const AppointmentModal: React.FC = () => {
  const { appointmentModalOpen, closeAppointmentModal, selectedWorkId, works, addAppointment } = useAppStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: 'illustration' as Appointment['serviceType'],
    expectedDate: '',
    description: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedWork = works.find((w) => w.id === selectedWorkId);

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '请输入您的姓名';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    if (!formData.expectedDate) {
      newErrors.expectedDate = '请选择期望完成日期';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '请描述您的需求';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          description: selectedWork
            ? `${formData.description}\n\n参考作品：${selectedWork.title} (ID: ${selectedWorkId})`
            : formData.description,
        }),
      });
      
      if (response.ok) {
        const newAppointment = await response.json();
        addAppointment(newAppointment);
        setSuccess(true);
        
        setTimeout(() => {
          setSuccess(false);
          closeAppointmentModal();
          setFormData({
            name: '',
            email: '',
            phone: '',
            serviceType: 'illustration',
            expectedDate: '',
            description: '',
          });
          setErrors({});
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      closeAppointmentModal();
      setFormData({
        name: '',
        email: '',
        phone: '',
        serviceType: 'illustration',
        expectedDate: '',
        description: '',
      });
      setErrors({});
      setSuccess(false);
    }
  };

  if (!appointmentModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      onClick={handleClose}
    >
      <div
        className="relative w-full bg-white rounded-2xl shadow-2xl slide-up"
        style={{
          maxWidth: '480px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">提交成功！</h3>
            <p className="text-gray-600">我们会尽快与您联系</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              预约咨询
            </h2>
            {selectedWork && (
              <p className="text-sm text-gray-500 mb-4">
                参考作品：<span style={{ color: 'var(--primary)' }}>{selectedWork.title}</span>
              </p>
            )}
            {!selectedWork && <p className="text-sm text-gray-500 mb-6">请填写以下信息，我们会尽快与您联系</p>}

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  <User size={16} />
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-pink-200 ${
                    errors.name ? 'border-red-400' : ''
                  }`}
                  style={{
                    borderColor: errors.name ? '#F87171' : 'var(--border-color)',
                  }}
                  placeholder="请输入您的姓名"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Mail size={16} />
                  邮箱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-pink-200 ${
                    errors.email ? 'border-red-400' : ''
                  }`}
                  style={{
                    borderColor: errors.email ? '#F87171' : 'var(--border-color)',
                  }}
                  placeholder="请输入您的邮箱"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Phone size={16} />
                  电话
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-pink-200"
                  style={{ borderColor: 'var(--border-color)' }}
                  placeholder="请输入您的联系电话"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  <FileText size={16} />
                  服务类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as Appointment['serviceType'] })}
                  className="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-pink-200 appearance-none bg-white"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%234A0E3B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                  }}
                >
                  {serviceTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Calendar size={16} />
                  期望完成日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expectedDate}
                  min={getMinDate()}
                  onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-pink-200 ${
                    errors.expectedDate ? 'border-red-400' : ''
                  }`}
                  style={{
                    borderColor: errors.expectedDate ? '#F87171' : 'var(--border-color)',
                  }}
                />
                {errors.expectedDate && <p className="text-red-500 text-xs mt-1">{errors.expectedDate}</p>}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  <FileText size={16} />
                  详细需求 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none ${
                    errors.description ? 'border-red-400' : ''
                  }`}
                  style={{
                    height: '120px',
                    borderColor: errors.description ? '#F87171' : 'var(--border-color)',
                  }}
                  placeholder="请详细描述您的需求..."
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-lg font-medium text-white btn-ripple transition-all duration-300 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
                  borderRadius: '8px',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    提交中...
                  </>
                ) : (
                  '提交预约'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AppointmentModal;
