import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, User, DollarSign } from 'lucide-react';
import { useStore } from '../store';
import '../index.css';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { bids, updateBidStatus, addNotification } = useStore();

  const pendingBids = bids.filter((b) => b.status === 'pending');
  const acceptedBids = bids.filter((b) => b.status === 'accepted');
  const rejectedBids = bids.filter((b) => b.status === 'rejected');

  const handleAccept = (id: string) => {
    updateBidStatus(id, 'accepted');
    addNotification({ type: 'success', message: '已接受出价！交易成功' });
  };

  const handleReject = (id: string) => {
    updateBidStatus(id, 'rejected');
    addNotification({ type: 'info', message: '已拒绝出价' });
  };

  const renderBidCard = (bid: typeof bids[number]) => {
    const isPending = bid.status === 'pending';

    return (
      <div
        key={bid.id}
        className={`rounded-xl p-5 border-2 transition-all ${
          bid.status === 'accepted'
            ? 'bg-green-50 border-green-200'
            : bid.status === 'rejected'
            ? 'bg-gray-50 border-gray-200 opacity-70'
            : 'bg-white border-gray-200 hover:border-orange-300 hover:shadow-md'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                isPending ? 'bg-orange-100' : bid.status === 'accepted' ? 'bg-green-100' : 'bg-gray-200'
              }`}
            >
              <User
                className={`w-6 h-6 ${
                  isPending ? 'text-orange-500' : bid.status === 'accepted' ? 'text-green-600' : 'text-gray-500'
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-gray-800">{bid.buyerName}</h4>
                {!isPending && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      bid.status === 'accepted'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-400 text-white'
                    }`}
                  >
                    {bid.status === 'accepted' ? '已接受' : '已拒绝'}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                对应商品：<span className="text-gray-700 font-medium">{bid.instrumentName}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">出价时间：{bid.createdAt}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-right">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" style={{ color: '#FF9800' }} />
                <span className="text-2xl font-bold" style={{ color: '#FF9800' }}>
                  ¥{bid.amount.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">出价金额</p>
            </div>

            {isPending && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(bid.id)}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-white font-medium transition-all hover:scale-105 shadow-sm hover:shadow bg-green-500 hover:bg-green-600"
                >
                  <Check className="w-4 h-4" />
                  接受
                </button>
                <button
                  onClick={() => handleReject(bid.id)}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-white font-medium transition-all hover:scale-105 shadow-sm hover:shadow bg-red-500 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                  拒绝
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div>
          <h1 className="text-2xl font-bold">卖家中心</h1>
          <p className="text-sm text-gray-500 mt-0.5">管理您的商品出价</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="待处理" count={pendingBids.length} color="#FF9800" />
        <StatCard label="已接受" count={acceptedBids.length} color="#22c55e" />
        <StatCard label="已拒绝" count={rejectedBids.length} color="#9CA3AF" />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full" style={{ backgroundColor: '#FF9800' }} />
          出价列表 ({pendingBids.length})
        </h2>

        {bids.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <DollarSign className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">暂无出价</h3>
            <p className="text-gray-500">还没有买家对您的商品出价</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bids.map(renderBidCard)}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div
      className="rounded-xl p-5 bg-white shadow-sm border-2"
      style={{ borderColor: `${color}20` }}
    >
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold" style={{ color }}>
        {count}
      </p>
    </div>
  );
}
