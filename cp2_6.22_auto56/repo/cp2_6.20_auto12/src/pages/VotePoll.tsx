import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Users,
  Send,
  Download,
  Lock,
  RefreshCw,
  Bell,
  Clock,
} from 'lucide-react';
import CalendarView from '@/components/CalendarView';
import PieChart from '@/components/PieChart';
import BestTimeBar from '@/components/BestTimeBar';
import ParticipantList from '@/components/ParticipantList';
import { pollApi, getSocket, disconnectSocket } from '@/utils/api';
import { computeBestTime, computeSlotVoteCounts } from '@/utils/computeBestTime';
import type { Poll, Vote, BestTimeRecommendation } from '@/types';

function VotePoll() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userName, setUserName] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newVoteId, setNewVoteId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationUser, setNotificationUser] = useState('');

  const bestTime = useMemo<BestTimeRecommendation | null>(() => {
    if (!poll) return null;
    return computeBestTime(poll.timeSlots, poll.votes);
  }, [poll]);

  const slotCounts = useMemo(() => {
    if (!poll) return [];
    return computeSlotVoteCounts(poll.timeSlots, poll.votes);
  }, [poll]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!id) return;

    const loadPoll = async () => {
      try {
        setLoading(true);
        const data = await pollApi.get(id);
        setPoll(data);
      } catch (err) {
        console.error('加载活动失败:', err);
        setError('加载活动失败，请检查链接是否正确');
      } finally {
        setLoading(false);
      }
    };

    loadPoll();

    const socket = getSocket();
    socket.emit('join_poll', { pollId: id });

    const handleNewVote = (data: { pollId: string; vote: Vote }) => {
      if (data.pollId === id) {
        setPoll((prev) => {
          if (!prev) return prev;

          const existingIndex = prev.votes.findIndex(
            (v) => v.userName === data.vote.userName
          );

          let newVotes;
          if (existingIndex >= 0) {
            newVotes = [...prev.votes];
            newVotes[existingIndex] = data.vote;
          } else {
            newVotes = [...prev.votes, data.vote];
          }

          return { ...prev, votes: newVotes };
        });

        setNewVoteId(data.vote.id);
        setNotificationUser(data.vote.userName);
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
          setNewVoteId(null);
        }, 3000);
      }
    };

    const handlePollUpdated = (data: { pollId: string; poll: Poll }) => {
      if (data.pollId === id) {
        setPoll(data.poll);
      }
    };

    socket.on('new_vote', handleNewVote);
    socket.on('poll_updated', handlePollUpdated);

    return () => {
      socket.off('new_vote', handleNewVote);
      socket.off('poll_updated', handlePollUpdated);
      disconnectSocket();
    };
  }, [id]);

  const handleSubmitVote = async () => {
    if (!poll || !id) return;

    if (!userName.trim()) {
      alert('请输入您的名字');
      return;
    }

    if (selectedSlots.length === 0) {
      alert('请至少选择一个可用时间段');
      return;
    }

    setIsSubmitting(true);
    try {
      await pollApi.submitVote(id, {
        userName: userName.trim(),
        availableSlotIds: selectedSlots,
      });
    } catch (err) {
      console.error('提交投票失败:', err);
      alert('提交投票失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    if (!id) return;
    try {
      await pollApi.exportICal(id);
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请重试');
    }
  };

  const handleRefresh = async () => {
    if (!id) return;
    try {
      const data = await pollApi.get(id);
      setPoll(data);
    } catch (err) {
      console.error('刷新失败:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-dark-100 mb-2">活动不存在</h2>
          <p className="text-dark-400 mb-6">{error || '无法找到该活动'}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-32">
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
          <div className="card px-4 py-3 flex items-center gap-3 border-primary-500/50">
            <Bell className="w-5 h-5 text-primary-400" />
            <div>
              <div className="text-sm font-medium text-dark-200">
                {notificationUser} 提交了投票
              </div>
              <div className="text-xs text-dark-500">实时更新</div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-dark-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-dark-100 truncate">
              {poll.title}
            </h1>
            {poll.description && (
              <p className="text-sm text-dark-400 truncate">
                {poll.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 rounded-full text-sm text-dark-300">
              <Users className="w-4 h-4" />
              {poll.votes.length} 人
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-dark-200 transition-colors"
              title="刷新"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-dark-200 transition-colors"
              title="导出日历"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <BestTimeBar recommendation={bestTime} />
        </div>

        {poll.isClosed && (
          <div className="mb-6 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-400" />
            <span className="text-amber-300 text-sm">
              投票已结束，无法提交新的投票
            </span>
          </div>
        )}

        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
          <div className={isMobile ? '' : 'lg:col-span-3'}>
            <div className="card p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-400" />
                  <h2 className="font-semibold text-dark-100">选择可用时间</h2>
                </div>
                <div className="text-sm text-dark-400">
                  点击或拖拽选择时间段
                </div>
              </div>
              <CalendarView
                timeSlots={poll.timeSlots}
                votes={poll.votes}
                selectedSlotIds={selectedSlots}
                onSlotSelect={setSelectedSlots}
                isSelectable={!poll.isClosed}
                isMobile={isMobile}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-4">
              <h3 className="font-semibold text-dark-100 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-400" />
                投票统计
              </h3>
              <PieChart slotCounts={slotCounts} timeSlots={poll.timeSlots} size={160} />
            </div>

            <div className="card p-4">
              <h3 className="font-semibold text-dark-100 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-400" />
                参与者 ({poll.votes.length})
              </h3>
              <ParticipantList votes={poll.votes} newVoteId={newVoteId} />
            </div>
          </div>
        </div>
      </div>

      {!poll.isClosed && (
        <div className="fixed bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-sm border-t border-dark-700 p-4 z-40">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="输入您的名字..."
                className="input-field py-3"
                maxLength={50}
              />
            </div>
            <div className="text-sm text-dark-400 flex-shrink-0 hidden sm:block">
              已选 {selectedSlots.length} 个时段
            </div>
            <button
              onClick={handleSubmitVote}
              disabled={isSubmitting || selectedSlots.length === 0 || !userName.trim()}
              className="btn-primary flex items-center gap-2 flex-shrink-0"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">提交投票</span>
              <span className="sm:hidden">提交</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VotePoll;
