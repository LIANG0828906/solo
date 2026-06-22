import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, User, Mail, Phone, Send } from 'lucide-react';
import { Event, RegisterRequest, RegisterResponse } from '../types';

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<RegisterRequest>({
    name: '',
    email: '',
    phone: '',
    customAnswers: []
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) {
          throw new Error('活动不存在');
        }
        const data = await response.json();
        setEvent(data);
        setFormData(prev => ({
          ...prev,
          customAnswers: new Array(data.customQuestions?.length || 0).fill('')
        }));
      } catch (error) {
        console.error('Failed to fetch event:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newShake: Record<string, boolean> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入姓名';
      newShake.name = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱';
      newShake.email = true;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
      newShake.email = true;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '请输入手机号';
      newShake.phone = true;
    } else if (!/^\d{11}$/.test(formData.phone)) {
      newErrors.phone = '手机号应为11位数字';
      newShake.phone = true;
    }

    event?.customQuestions?.forEach((q, index) => {
      if (!formData.customAnswers[index]?.trim()) {
        newErrors[`custom_${index}`] = `请回答：${q}`;
        newShake[`custom_${index}`] = true;
      }
    });

    setErrors(newErrors);
    setShakeFields(newShake);

    if (Object.keys(newShake).length > 0) {
      setTimeout(() => setShakeFields({}), 500);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/events/${id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data: RegisterResponse & { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '报名失败');
      }

      navigate(`/ticket/${data.eventId}/${data.registrationId}`, {
        state: {
          ticketData: data,
          eventDate: event?.date,
          eventLocation: event?.location
        }
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : '报名失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof RegisterRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCustomAnswerChange = (index: number, value: string) => {
    setFormData(prev => {
      const newAnswers = [...prev.customAnswers];
      newAnswers[index] = value;
      return { ...prev, customAnswers: newAnswers };
    });
    const errorKey = `custom_${index}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-xl text-gray-500 mb-4">活动不存在</p>
        <Link
          to="/"
          className="text-primary hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    );
  }

  const remainingPercentage = (event.remainingCount / event.capacity) * 100;
  const isFull = event.remainingCount <= 0;
  const isUrgent = remainingPercentage < 10 && !isFull;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="bg-primary text-white py-6 px-4">
        <div className="container mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回活动列表
          </Link>
          <h1 className="text-3xl font-bold">{event.name}</h1>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                <span className="text-white text-3xl font-bold text-center px-8">
                  {event.name}
                </span>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">活动时间</p>
                      <p className="font-medium text-primary">{formatDate(event.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">活动地点</p>
                      <p className="font-medium text-primary">{event.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">报名情况</p>
                      <p className={`font-medium ${isUrgent ? 'text-warning' : isFull ? 'text-danger' : 'text-primary'}`}>
                        {event.registeredCount}/{event.capacity} 人已报名
                        {isUrgent && <span className="ml-2 text-sm">（剩余名额紧张！）</span>}
                        {isFull && <span className="ml-2 text-sm">（名额已满）</span>}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-primary mb-3">活动介绍</h3>
                  <p className="text-gray-600 leading-relaxed">{event.description}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-primary mb-6">在线报名</h2>

              {isFull ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">活动名额已满</p>
                  <p className="text-gray-400 text-sm mt-2">请关注其他活动</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      姓名 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="请输入您的姓名"
                      className={`
                        w-full px-4 py-3 rounded-lg border-2 transition-all
                        focus:outline-none focus:ring-2 focus:ring-primary/30
                        ${errors.name
                          ? 'border-danger animate-shake focus:border-danger focus:ring-danger/30'
                          : 'border-gray-200 focus:border-primary'
                        }
                      `}
                    />
                    {errors.name && (
                      <p className="text-danger text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      邮箱 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="请输入您的邮箱"
                      className={`
                        w-full px-4 py-3 rounded-lg border-2 transition-all
                        focus:outline-none focus:ring-2 focus:ring-primary/30
                        ${errors.email
                          ? 'border-danger animate-shake focus:border-danger focus:ring-danger/30'
                          : 'border-gray-200 focus:border-primary'
                        }
                      `}
                    />
                    {errors.email && (
                      <p className="text-danger text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      手机号 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="请输入11位手机号"
                      maxLength={11}
                      className={`
                        w-full px-4 py-3 rounded-lg border-2 transition-all
                        focus:outline-none focus:ring-2 focus:ring-primary/30
                        ${errors.phone
                          ? 'border-danger animate-shake focus:border-danger focus:ring-danger/30'
                          : 'border-gray-200 focus:border-primary'
                        }
                      `}
                    />
                    {errors.phone && (
                      <p className="text-danger text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  {event.customQuestions?.map((question, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {question} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.customAnswers[index] || ''}
                        onChange={(e) => handleCustomAnswerChange(index, e.target.value)}
                        placeholder={`请输入${question}`}
                        className={`
                          w-full px-4 py-3 rounded-lg border-2 transition-all
                          focus:outline-none focus:ring-2 focus:ring-primary/30
                          ${errors[`custom_${index}`]
                            ? 'border-danger animate-shake focus:border-danger focus:ring-danger/30'
                            : 'border-gray-200 focus:border-primary'
                          }
                        `}
                      />
                      {errors[`custom_${index}`] && (
                        <p className="text-danger text-sm mt-1">{errors[`custom_${index}`]}</p>
                      )}
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`
                      w-full py-3.5 px-6 rounded-lg font-semibold text-white
                      transition-all duration-200 flex items-center justify-center gap-2
                      hover:scale-[1.02] active:scale-[0.98]
                      ${submitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-light'
                      }
                    `}
                  >
                    <Send className="w-5 h-5" />
                    {submitting ? '提交中...' : '提交报名'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
