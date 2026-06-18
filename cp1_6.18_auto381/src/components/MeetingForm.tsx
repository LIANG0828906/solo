import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, FileText, Loader2 } from 'lucide-react';
import { useMeetingStore, type CreateMeetingRequest } from '@/hooks/useMeetingStore';
import { cn } from '@/lib/utils';

interface FormErrors {
  title?: string;
  agenda?: string;
  attendees?: string;
  dateTime?: string;
}

export function MeetingForm() {
  const navigate = useNavigate();
  const createMeeting = useMeetingStore(state => state.createMeeting);
  const loading = useMeetingStore(state => state.loading);

  const [formData, setFormData] = useState<CreateMeetingRequest>({
    title: '',
    agenda: '',
    attendees: [],
    dateTime: '',
  });

  const [attendeesInput, setAttendeesInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入会议主题';
    } else if (formData.title.length > 100) {
      newErrors.title = '会议主题不能超过100个字符';
    }

    if (!formData.agenda.trim()) {
      newErrors.agenda = '请输入会议议程';
    }

    const emails = attendeesInput.split(',').filter(e => e.trim());
    if (emails.length === 0) {
      newErrors.attendees = '请至少输入一位参与人邮箱';
    } else {
      const invalidEmails = emails.filter(e => !validateEmail(e));
      if (invalidEmails.length > 0) {
        newErrors.attendees = `以下邮箱格式不正确: ${invalidEmails.join(', ')}`;
      }
    }

    if (!formData.dateTime) {
      newErrors.dateTime = '请选择会议时间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const attendees = attendeesInput
      .split(',')
      .map(e => e.trim())
      .filter(e => e);

    const meeting = await createMeeting({
      ...formData,
      attendees,
    });

    if (meeting) {
      navigate(`/meeting/${meeting.id}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-text">
          <FileText className="w-4 h-4 text-primary" />
          会议主题
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="输入会议主题..."
          className={cn(
            'w-full px-4 py-3 rounded-xl border-2 bg-white transition-all duration-200',
            'text-text placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            errors.title
              ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
              : 'border-primary/10 focus:border-primary'
          )}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-text">
          <FileText className="w-4 h-4 text-primary" />
          会议议程
        </label>
        <textarea
          name="agenda"
          value={formData.agenda}
          onChange={handleChange}
          rows={4}
          placeholder="详细描述会议议程和讨论内容..."
          className={cn(
            'w-full px-4 py-3 rounded-xl border-2 bg-white transition-all duration-200 resize-none',
            'text-text placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            errors.agenda
              ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
              : 'border-primary/10 focus:border-primary'
          )}
        />
        {errors.agenda && (
          <p className="text-sm text-red-500">{errors.agenda}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-text">
          <Users className="w-4 h-4 text-primary" />
          参与人邮箱
        </label>
        <input
          type="text"
          value={attendeesInput}
          onChange={(e) => {
            setAttendeesInput(e.target.value);
            if (errors.attendees) {
              setErrors(prev => ({ ...prev, attendees: undefined }));
            }
          }}
          placeholder="example1@mail.com, example2@mail.com"
          className={cn(
            'w-full px-4 py-3 rounded-xl border-2 bg-white transition-all duration-200',
            'text-text placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            errors.attendees
              ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
              : 'border-primary/10 focus:border-primary'
          )}
        />
        {errors.attendees && (
          <p className="text-sm text-red-500">{errors.attendees}</p>
        )}
        <p className="text-xs text-text-muted">多个邮箱用逗号分隔</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-text">
            <Calendar className="w-4 h-4 text-primary" />
            会议日期
          </label>
          <input
            type="datetime-local"
            name="dateTime"
            value={formData.dateTime}
            onChange={handleChange}
            className={cn(
              'w-full px-4 py-3 rounded-xl border-2 bg-white transition-all duration-200',
              'text-text',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              errors.dateTime
                ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                : 'border-primary/10 focus:border-primary'
            )}
          />
          {errors.dateTime && (
            <p className="text-sm text-red-500">{errors.dateTime}</p>
          )}
        </div>
        <div className="flex items-end">
          <div className="flex items-center gap-2 text-sm text-text-light bg-primary/5 px-4 py-3 rounded-xl w-full">
            <Clock className="w-4 h-4 text-primary" />
            <span>建议会议时长: 30-60分钟</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full py-4 rounded-xl font-semibold text-white text-base',
          'bg-gradient-to-r from-primary to-primary-dark',
          'hover:shadow-lg hover:shadow-primary/25',
          'active:scale-[0.98] transition-all duration-200',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
          'flex items-center justify-center gap-2'
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            创建中...
          </>
        ) : (
          '创建会议'
        )}
      </button>
    </form>
  );
}
