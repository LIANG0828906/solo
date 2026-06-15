import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Users, Plus, LogIn, X } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import * as api from '@/api';
import type { Activity } from '@/shared/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, login } = useUserStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [createForm, setCreateForm] = useState({
    title: '',
    bookTitle: '',
    bookAuthor: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  useEffect(() => {
    if (!user) {
      login();
    }
  }, [user, login]);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.getActivities({ userId: user?.id });
      if (res.data.success) {
        setActivities(res.data.data);
      }
    } catch (error) {
      console.error('获取活动列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (activity: Activity) => {
    if (!user) return 0;
    const memberCheckIns = activity.checkIns.filter((c) => c.memberId === user.id);
    const start = new Date(activity.startDate);
    const end = new Date(activity.endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (totalDays === 0) return 0;
    return Math.round((memberCheckIns.length / totalDays) * 100);
  };

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.getMonth() + 1}月${s.getDate()}日 - ${e.getMonth() + 1}月${e.getDate()}日`;
  };

  const handleCreateActivity = async () => {
    try {
      const res = await api.createActivity({
        ...createForm,
        organizerId: user!.id,
      });
      if (res.data.success) {
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          bookTitle: '',
          bookAuthor: '',
          startDate: '',
          endDate: '',
          description: '',
        });
        fetchActivities();
      }
    } catch (error) {
      console.error('创建活动失败:', error);
    }
  };

  const handleJoinActivity = async () => {
    try {
      const res = await api.joinActivity(inviteCode, {
        inviteCode,
        memberName: user!.nickname,
        memberAvatar: user!.avatar,
      });
      if (res.data.success) {
        setShowJoinModal(false);
        setInviteCode('');
        fetchActivities();
      }
    } catch (error) {
      console.error('加入活动失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#78350F] mb-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              我的共读活动
            </h1>
            <p className="text-[#92400E] opacity-70">与书友一起，坚持每日阅读</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#92400E] rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-orange-100"
            >
              <LogIn size={18} />
              <span>加入活动</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus size={18} />
              <span>创建活动</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-[#F97316] rounded-full animate-spin"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <BookOpen size={48} className="mx-auto text-orange-300 mb-4" />
            <p className="text-[#92400E] text-lg mb-2">还没有参与任何活动</p>
            <p className="text-[#92400E] opacity-60">创建一个新活动或使用邀请码加入</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => {
              const progress = calculateProgress(activity);
              return (
                <div
                  key={activity.id}
                  onClick={() => navigate(`/activity/${activity.id}`)}
                  className="bg-[#FFFBF0] rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(120,53,15,0.08)] hover:shadow-[0_8px_24px_rgba(120,53,15,0.15)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex p-4 gap-4">
                    <div className="flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                      {activity.coverImage ? (
                        <img
                          src={activity.coverImage}
                          alt={activity.bookTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen size={32} className="text-orange-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#78350F] text-base mb-1 truncate" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                        {activity.title}
                      </h3>
                      <p className="text-sm text-[#92400E] opacity-70 mb-3 truncate">
                        《{activity.bookTitle}》· {activity.bookAuthor}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-[#92400E] opacity-70">
                          <Calendar size={14} />
                          <span>{formatDateRange(activity.startDate, activity.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#92400E] opacity-70">
                          <Users size={14} />
                          <span>{activity.members.length} 位成员</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex justify-between text-xs text-[#92400E] mb-1.5">
                      <span>阅读进度</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FED7AA] to-[#F97316] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFBF0] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-[#78350F]" style={{ fontFamily: "'Noto Serif SC', serif" }}>创建共读活动</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-[#92400E] opacity-60 hover:opacity-100">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#78350F] mb-1.5">活动标题</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="例如：《百年孤独》共读"
                  className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white text-[#78350F] focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[#78350F] mb-1.5">书名</label>
                  <input
                    type="text"
                    value={createForm.bookTitle}
                    onChange={(e) => setCreateForm({ ...createForm, bookTitle: e.target.value })}
                    placeholder="书名"
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white text-[#78350F] focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#78350F] mb-1.5">作者</label>
                  <input
                    type="text"
                    value={createForm.bookAuthor}
                    onChange={(e) => setCreateForm({ ...createForm, bookAuthor: e.target.value })}
                    placeholder="作者"
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white text-[#78350F] focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[#78350F] mb-1.5">开始日期</label>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white text-[#78350F] focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#78350F] mb-1.5">结束日期</label>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white text-[#78350F] focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#78350F] mb-1.5">活动描述</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="简单介绍一下这次共读活动..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white text-[#78350F] focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-orange-200 text-[#92400E] hover:bg-orange-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateActivity}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white shadow-md hover:shadow-lg transition-all"
              >
                创建活动
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFBF0] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-[#78350F]" style={{ fontFamily: "'Noto Serif SC', serif" }}>加入活动</h2>
              <button onClick={() => setShowJoinModal(false)} className="text-[#92400E] opacity-60 hover:opacity-100">
                <X size={20} />
              </button>
            </div>
            <div>
              <label className="block text-sm text-[#78350F] mb-1.5">邀请码</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="请输入6位邀请码"
                className="w-full px-4 py-3 rounded-xl border border-orange-200 bg-white text-[#78350F] text-center text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-orange-300"
                maxLength={6}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-orange-200 text-[#92400E] hover:bg-orange-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleJoinActivity}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white shadow-md hover:shadow-lg transition-all"
              >
                加入活动
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
