import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Calendar, Users, Upload, Copy, Check, ChevronLeft, FileText, Send, X } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import * as api from '@/api';
import CalendarCanvas from '@/components/CalendarCanvas';
import type { Activity, CheckIn, Member, ReadingStatus } from '@/shared/types';

interface CheckInWithMember extends CheckIn {
  memberName?: string;
  memberAvatar?: string;
}

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, login } = useUserStore();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkIns, setCheckIns] = useState<CheckInWithMember[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus>('reading');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shakeCardId, setShakeCardId] = useState<string | null>(null);
  const [newCheckInId, setNewCheckInId] = useState<string | null>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isJoined = activity && user && activity.members.some((m) => m.id === user.id);
  const currentMember = activity && user ? activity.members.find((m) => m.id === user.id) : null;

  useEffect(() => {
    if (!user) {
      login();
    }
  }, [user, login]);

  useEffect(() => {
    if (id && user) {
      fetchActivity();
      fetchCheckIns(1, true);
    }
  }, [id, user]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const res = await api.getActivity(id!);
      if (res.data.success) {
        setActivity(res.data.data);
      }
    } catch (error) {
      console.error('获取活动详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckIns = async (pageNum: number, reset = false) => {
    try {
      if (pageNum > 1) setLoadingMore(true);
      const res = await api.getCheckIns(id!, { page: pageNum, limit: 10 });
      if (res.data.success) {
        const newCheckIns = res.data.data.map((c: CheckIn) => {
          const member = activity?.members.find((m) => m.id === c.memberId);
          return {
            ...c,
            memberName: member?.name || '匿名用户',
            memberAvatar: member?.avatar || '',
          };
        });
        if (reset) {
          setCheckIns(newCheckIns);
        } else {
          setCheckIns((prev) => [...prev, ...newCheckIns]);
        }
        setPage(pageNum);
        setHasMore(pageNum < res.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('获取打卡列表失败:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setSelectedStatus('reading');
    setNote('');
    setShowStatusModal(true);
  };

  const handleSubmitCheckIn = async () => {
    if (!user || !currentMember) return;
    const pages = selectedStatus === 'finished50' ? 50 : selectedStatus === 'finished20' ? 20 : selectedStatus === 'reading' ? 10 : 0;
    try {
      setSubmitting(true);
      const res = await api.checkIn(id!, {
        memberId: currentMember.id,
        date: selectedDate,
        status: selectedStatus,
        pages,
        note: note || undefined,
      });
      if (res.data.success) {
        const newCheckIn: CheckInWithMember = {
          ...res.data.data,
          memberName: user.nickname,
          memberAvatar: user.avatar,
        };
        setCheckIns((prev) => [newCheckIn, ...prev]);
        setNewCheckInId(newCheckIn.id);
        setShakeCardId(newCheckIn.id);
        setTimeout(() => setShakeCardId(null), 200);
        setTimeout(() => setNewCheckInId(null), 600);
        setShowStatusModal(false);
        fetchActivity();
      }
    } catch (error) {
      console.error('打卡失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCoverClick = () => {
    fileInputRef.current?.click();
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadCover(id!, file);
      if (res.data.success) {
        setActivity((prev) => prev ? { ...prev, coverImage: res.data.data.coverImage } : null);
      }
    } catch (error) {
      console.error('上传封面失败:', error);
    }
  };

  const handleCopyInviteCode = () => {
    if (!activity) return;
    navigator.clipboard.writeText(activity.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!user) return;
    try {
      setJoining(true);
      const res = await api.joinActivity(id!, {
        inviteCode: inviteCodeInput,
        memberName: user.nickname,
        memberAvatar: user.avatar,
      });
      if (res.data.success) {
        fetchActivity();
        setInviteCodeInput('');
      }
    } catch (error) {
      console.error('加入活动失败:', error);
    } finally {
      setJoining(false);
    }
  };

  const getStatusLabel = (status: string, pages: number) => {
    if (pages >= 50) return { label: '读完50页', color: 'bg-[#F97316] text-white' };
    if (pages >= 20) return { label: '读完20页', color: 'bg-[#FDBA74] text-[#78350F]' };
    if (status === 'reading') return { label: '在读', color: 'bg-[#FED7AA] text-[#78350F]' };
    return { label: '未读', color: 'bg-gray-100 text-gray-600' };
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-[#F97316] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex justify-center items-center">
        <p className="text-[#92400E]">活动不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#92400E] mb-6 hover:text-[#78350F] transition-colors"
        >
          <ChevronLeft size={20} />
          <span>返回列表</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#FFFBF0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(120,53,15,0.08)]">
              <div
                onClick={handleCoverClick}
                className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 cursor-pointer group mb-4"
              >
                {activity.coverImage ? (
                  <img
                    src={activity.coverImage}
                    alt={activity.bookTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={64} className="text-orange-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white">
                    <Upload size={20} />
                    <span>更换封面</span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </div>
              <h1 className="text-2xl font-bold text-[#78350F] mb-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                {activity.title}
              </h1>
              <p className="text-[#92400E] mb-4">《{activity.bookTitle}》· {activity.bookAuthor}</p>
              <p className="text-sm text-[#92400E] opacity-80 mb-4">{activity.description}</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-[#78350F]">
                  <Calendar size={16} className="text-orange-400" />
                  <span>{formatDate(activity.startDate)} - {formatDate(activity.endDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#78350F]">
                  <Users size={16} className="text-orange-400" />
                  <span>已加入 {activity.members.length} 位成员</span>
                </div>
              </div>

              {isJoined ? (
                <div className="mt-5 pt-5 border-t border-orange-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#92400E] opacity-60 mb-1">邀请码</p>
                      <p className="text-lg font-mono font-bold text-[#F97316] tracking-wider">{activity.inviteCode}</p>
                    </div>
                    <button
                      onClick={handleCopyInviteCode}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-[#92400E] rounded-lg hover:bg-orange-100 transition-colors text-sm"
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      <span>{copied ? '已复制' : '复制'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 pt-5 border-t border-orange-100">
                  <p className="text-sm text-[#92400E] mb-2">使用邀请码加入活动</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                      placeholder="邀请码"
                      maxLength={6}
                      className="flex-1 px-3 py-2 rounded-lg border border-orange-200 bg-white text-[#78350F] text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <button
                      onClick={handleJoin}
                      disabled={joining || inviteCodeInput.length < 6}
                      className="px-4 py-2 bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {joining ? '加入中...' : '加入'}
                    </button>
                  </div>
                </div>
              )}

              {activity.ended && (
                <button
                  onClick={() => navigate(`/report/${activity.id}`)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <FileText size={18} />
                  <span>查看报告</span>
                </button>
              )}
            </div>

            {activity.members.length > 0 && (
              <div className="bg-[#FFFBF0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(120,53,15,0.08)]">
                <h3 className="font-bold text-[#78350F] mb-4">成员列表</h3>
                <div className="space-y-3">
                  {activity.members.map((member: Member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center text-[#78350F] font-bold text-sm overflow-hidden">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      <span className="text-sm text-[#78350F]">{member.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            {isJoined && (
              <div className="bg-[#FFFBF0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(120,53,15,0.08)]">
                <h2 className="text-lg font-bold text-[#78350F] mb-4" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                  我的打卡日历
                </h2>
                <CalendarCanvas
                  startDate={activity.startDate}
                  endDate={activity.endDate}
                  checkIns={activity.checkIns}
                  memberId={currentMember?.id || ''}
                  onDateClick={handleDateClick}
                />
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[#92400E]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#F5F5F4]"></div>
                    <span>未读</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#FED7AA]"></div>
                    <span>在读</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#FDBA74]"></div>
                    <span>20页+</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#F97316]"></div>
                    <span>50页+</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#FFFBF0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(120,53,15,0.08)]">
              <h2 className="text-lg font-bold text-[#78350F] mb-4" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                动态打卡墙
              </h2>
              {checkIns.length === 0 ? (
                <div className="text-center py-12 text-[#92400E] opacity-60">
                  <BookOpen size={40} className="mx-auto mb-3 text-orange-300" />
                  <p>还没有打卡记录</p>
                  {isJoined && <p className="text-sm mt-1">点击日历上的日期开始打卡吧</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  {checkIns.map((checkIn) => {
                    const statusInfo = getStatusLabel(checkIn.status, checkIn.pages || checkIn.pagesRead || 0);
                    const isNew = newCheckInId === checkIn.id;
                    const isShaking = shakeCardId === checkIn.id;
                    return (
                      <div
                        key={checkIn.id}
                        className={`bg-white rounded-xl p-4 shadow-sm ${isNew ? 'animate-fadeIn' : ''} ${isShaking ? 'animate-shake' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center text-[#78350F] font-bold overflow-hidden flex-shrink-0">
                            {checkIn.memberAvatar ? (
                              <img src={checkIn.memberAvatar} alt={checkIn.memberName} className="w-full h-full object-cover" />
                            ) : (
                              (checkIn.memberName || '?').charAt(0)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[#78350F] text-sm">{checkIn.memberName}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <span className="text-xs text-[#92400E] opacity-60">{formatDate(checkIn.date)}</span>
                            </div>
                            {checkIn.note && (
                              <p className="text-sm text-[#78350F] opacity-80 leading-relaxed">{checkIn.note}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {hasMore && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => fetchCheckIns(page + 1)}
                    disabled={loadingMore}
                    className="px-6 py-2 bg-orange-50 text-[#92400E] rounded-xl hover:bg-orange-100 transition-colors text-sm disabled:opacity-50"
                  >
                    {loadingMore ? '加载中...' : '加载更多'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFBF0] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-[#78350F]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                {formatDate(selectedDate)} 打卡
              </h2>
              <button onClick={() => setShowStatusModal(false)} className="text-[#92400E] opacity-60 hover:opacity-100">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              {[
                { value: 'unread' as ReadingStatus, label: '未读', desc: '今天还没开始阅读', pages: 0 },
                { value: 'reading' as ReadingStatus, label: '在读', desc: '正在阅读中', pages: 10 },
                { value: 'finished20' as ReadingStatus, label: '读完20页', desc: '今天读了20页以上', pages: 20 },
                { value: 'finished50' as ReadingStatus, label: '读完50页', desc: '今天读了50页以上', pages: 50 },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setSelectedStatus(item.value)}
                  className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                    selectedStatus === item.value
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-transparent bg-white hover:bg-orange-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#78350F]">{item.label}</p>
                      <p className="text-xs text-[#92400E] opacity-60 mt-0.5">{item.desc}</p>
                    </div>
                    {selectedStatus === item.value && (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm text-[#78350F] mb-1.5">阅读心得（100-500字）</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="记录一下今天的阅读感受..."
                rows={4}
