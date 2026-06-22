import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  Copy,
  Check,
  Share2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import TimeSlotForm, { TimeSlotInput } from '@/components/TimeSlotForm';
import { pollApi } from '@/utils/api';
import type { Poll } from '@/types';

function CreatePoll() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlotInput[]>([
    { id: 'slot_1', date: '', startTime: '09:00', endTime: '11:00' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPoll, setCreatedPoll] = useState<Poll | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('请输入活动标题');
      return;
    }

    const validSlots = timeSlots.filter(
      (s) => s.date && s.startTime && s.endTime
    );
    if (validSlots.length === 0) {
      alert('请至少添加一个时间段');
      return;
    }

    setIsSubmitting(true);
    try {
      const poll = await pollApi.create({
        title: title.trim(),
        description: description.trim(),
        timeSlots: validSlots.map((s) => ({
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
      setCreatedPoll(poll);
    } catch (error) {
      console.error('创建活动失败:', error);
      alert('创建活动失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareUrl = createdPoll
    ? `${window.location.origin}/poll/${createdPoll.id}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleViewPoll = () => {
    if (createdPoll) {
      navigate(`/poll/${createdPoll.id}`);
    }
  };

  if (createdPoll) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md card p-8 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold text-dark-100 mb-2">
              活动创建成功！
            </h1>
            <p className="text-dark-400">{createdPoll.title}</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-dark-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-4 h-4 text-primary-400" />
                <span className="text-sm text-dark-300">分享链接</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-200 font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ease-bounce-subtle hover:scale-105 ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-primary-600 text-white hover:bg-primary-500'
                  }`}
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-dark-900 rounded-lg p-4">
              <div className="text-sm text-dark-400 mb-2">管理令牌</div>
              <div className="text-lg font-mono text-primary-400 break-all">
                {createdPoll.adminToken}
              </div>
              <div className="text-xs text-dark-500 mt-1">
                请妥善保存，用于管理活动和导出结果
              </div>
            </div>

            <div className="bg-dark-900 rounded-lg p-4">
              <div className="text-sm text-dark-400 mb-2">
                {createdPoll.timeSlots.length} 个候选时段
              </div>
              <div className="text-sm text-dark-300">
                {createdPoll.timeSlots.length} 个时间段等待投票
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleViewPoll}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <CalendarPlus className="w-5 h-5" />
              查看投票页面
            </button>
            <button
              onClick={() => {
                setCreatedPoll(null);
                setTitle('');
                setDescription('');
                setTimeSlots([
                  { id: 'slot_1', date: '', startTime: '09:00', endTime: '11:00' },
                ]);
              }}
              className="w-full btn-secondary flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              再创建一个活动
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600/10 rounded-full text-primary-400 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            智能时间协调
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-dark-100 mb-3">
            发起活动投票
          </h1>
          <p className="text-dark-400 max-w-md mx-auto">
            填写活动信息并添加候选时间段，系统会自动帮你找到最佳会议时间
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              活动标题 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：团队周会、项目评审会"
              className="input-field"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              活动描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单描述一下活动内容和目的..."
              rows={3}
              className="input-field resize-none"
              maxLength={500}
            />
          </div>

          <TimeSlotForm slots={timeSlots} onChange={setTimeSlots} />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary flex items-center justify-center gap-2 text-base py-4"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <CalendarPlus className="w-5 h-5" />
                创建活动
              </>
            )}
          </button>
        </form>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '📊', title: '实时统计', desc: '投票数据实时更新' },
            { icon: '🎯', title: '智能推荐', desc: '自动计算最佳时间' },
            { icon: '📅', title: '日历导出', desc: '一键导出 iCal 文件' },
          ].map((item, i) => (
            <div
              key={i}
              className="card p-4 text-center animate-fade-in-up"
              style={{ animationDelay: `${0.2 + i * 0.1}s` }}
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="font-medium text-dark-200">{item.title}</div>
              <div className="text-sm text-dark-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CreatePoll;
