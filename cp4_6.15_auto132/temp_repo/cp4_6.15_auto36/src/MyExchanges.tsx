import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, Package } from 'lucide-react';
import { useExchangeStore } from './exchangeStore';
import { useUserStore } from './userStore';
import { useItemStore } from './itemStore';
import { cn, formatTimeAgo } from './utils';

type TabType = 'sent' | 'received' | 'history';

export const MyExchanges = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { requests, updateRequestStatus, getRequestsByFromUser, getRequestsByToUser, getCompletedRequests } = useExchangeStore();
  const { getItemById } = useItemStore();
  const { getUserById } = useUserStore();

  const [activeTab, setActiveTab] = useState<TabType>('received');

  const sentRequests = currentUser ? getRequestsByFromUser(currentUser.id) : [];
  const receivedRequests = currentUser ? getRequestsByToUser(currentUser.id) : [];
  const completedRequests = currentUser ? getCompletedRequests(currentUser.id) : [];

  const handleConfirm = (id: string) => {
    updateRequestStatus(id, 'confirmed');
  };

  const handleReject = (id: string) => {
    updateRequestStatus(id, 'rejected');
  };

  const handleComplete = (id: string) => {
    updateRequestStatus(id, 'completed');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '待确认';
      case 'confirmed':
        return '已确认';
      case 'completed':
        return '已完成';
      case 'rejected':
        return '已拒绝';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-600';
      case 'confirmed':
        return 'bg-blue-100 text-blue-600';
      case 'completed':
        return 'bg-green-100 text-green-600';
      case 'rejected':
        return 'bg-red-100 text-red-500';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const renderExchangeCard = (
    req: (typeof requests)[0],
    showActions: boolean = false,
    isReceived: boolean = false
  ) => {
    const item = getItemById(req.itemId);
    const otherUser = isReceived
      ? getUserById(req.fromUserId)
      : getUserById(req.toUserId);

    if (!item) return null;

    const isPending = req.status === 'pending';
    const isConfirmed = req.status === 'confirmed';

    return (
      <div
        key={req.id}
        className={cn(
          'bg-white rounded-2xl p-4 mb-3 transition-all duration-300',
          isPending && isReceived
            ? 'border-2 border-orange-400 animate-pulse-glow'
            : 'border border-orange-100'
        )}
        style={{
          animation: isPending && isReceived ? 'pulse-glow 2s ease-in-out infinite' : 'none',
        }}
      >
        <div className="flex gap-3">
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-semibold text-gray-800 line-clamp-1">{item.title}</h4>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2', getStatusColor(req.status))}>
                {getStatusLabel(req.status)}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <img
                src={otherUser?.avatar}
                alt=""
                className="w-6 h-6 rounded-full bg-gray-200"
              />
              <span className="text-xs text-gray-600">
                {isReceived ? otherUser?.nickname + ' 想交换' : '与 ' + otherUser?.nickname + ' 交换'}
              </span>
            </div>

            <p className="text-xs text-gray-400">{formatTimeAgo(req.createdAt)}</p>
          </div>
        </div>

        {showActions && isPending && isReceived && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-orange-50">
            <button
              onClick={() => handleReject(req.id)}
              className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium btn-bounce flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4" />
              拒绝
            </button>
            <button
              onClick={() => handleConfirm(req.id)}
              className="flex-1 py-2.5 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-xl text-sm font-medium btn-bounce flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" />
              同意交换
            </button>
          </div>
        )}

        {showActions && isConfirmed && !isReceived && (
          <div className="mt-3 pt-3 border-t border-orange-50">
            <button
              onClick={() => handleComplete(req.id)}
              className="w-full py-2.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl text-sm font-medium btn-bounce flex items-center justify-center gap-1"
            >
              <Package className="w-4 h-4" />
              确认已完成交换
            </button>
          </div>
        )}

        {showActions && isConfirmed && isReceived && (
          <div className="mt-3 pt-3 border-t border-orange-50">
            <button
              onClick={() => handleComplete(req.id)}
              className="w-full py-2.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl text-sm font-medium btn-bounce flex items-center justify-center gap-1"
            >
              <Package className="w-4 h-4" />
              确认已完成交换
            </button>
          </div>
        )}
      </div>
    );
  };

  const sentPending = sentRequests.filter((r) => r.status === 'pending');
  const sentConfirmed = sentRequests.filter((r) => r.status === 'confirmed');
  const sentCompleted = sentRequests.filter((r) => r.status === 'completed');

  const receivedPending = receivedRequests.filter((r) => r.status === 'pending');
  const receivedConfirmed = receivedRequests.filter((r) => r.status === 'confirmed');
  const receivedRejected = receivedRequests.filter((r) => r.status === 'rejected');

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'sent', label: '我发起的', count: sentPending.length + sentConfirmed.length },
    { key: 'received', label: '我收到的', count: receivedPending.length },
    { key: 'history', label: '历史记录' },
  ];

  return (
    <div className="min-h-screen bg-orange-50/30">
      <div className="bg-gradient-to-b from-orange-400 to-amber-300 pt-8 pb-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center btn-bounce"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">我的交换</h1>
          </div>

          <div className="flex gap-1 bg-white/20 backdrop-blur-sm rounded-2xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative',
                  activeTab === tab.key
                    ? 'bg-white text-orange-500 shadow-md'
                    : 'text-white/80 hover:text-white'
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24">
        <div className="max-w-2xl mx-auto">
          {activeTab === 'sent' && (
            <div className="animate-fade-in">
              {sentPending.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    待确认 ({sentPending.length})
                  </h3>
                  {sentPending.map((req) => renderExchangeCard(req, true, false))}
                </div>
              )}
              {sentConfirmed.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    已确认 ({sentConfirmed.length})
                  </h3>
                  {sentConfirmed.map((req) => renderExchangeCard(req, true, false))}
                </div>
              )}
              {sentPending.length === 0 && sentConfirmed.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500">还没有发起过交换请求</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-6 py-2.5 bg-orange-400 text-white rounded-full text-sm font-medium btn-bounce"
                  >
                    去逛逛
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'received' && (
            <div className="animate-fade-in">
              {receivedPending.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-orange-500 mb-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    待回复 ({receivedPending.length})
                  </h3>
                  {receivedPending.map((req) => renderExchangeCard(req, true, true))}
                </div>
              )}
              {receivedConfirmed.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    已同意 ({receivedConfirmed.length})
                  </h3>
                  {receivedConfirmed.map((req) => renderExchangeCard(req, true, true))}
                </div>
              )}
              {receivedRejected.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    已拒绝 ({receivedRejected.length})
                  </h3>
                  {receivedRejected.map((req) => renderExchangeCard(req, false, true))}
                </div>
              )}
              {receivedPending.length === 0 && receivedConfirmed.length === 0 && receivedRejected.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📬</div>
                  <p className="text-gray-500">还没有收到交换请求</p>
                  <p className="text-gray-400 text-sm mt-1">发布物品后会有邻居来找你交换哦~</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-fade-in">
              {completedRequests.length > 0 ? (
                completedRequests.map((req) => {
                  const isSent = currentUser?.id === req.fromUserId;
                  return renderExchangeCard(req, false, !isSent);
                })
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📖</div>
                  <p className="text-gray-500">还没有完成的交换</p>
                  <p className="text-gray-400 text-sm mt-1">完成第一次交换来这里看看吧~</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
