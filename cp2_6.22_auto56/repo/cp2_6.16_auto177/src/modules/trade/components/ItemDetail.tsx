import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Tag, Calendar, MessageSquare, Check, X, Share2 } from 'lucide-react';
import { useTradeStore } from '../store';
import { useAuthStore } from '../../auth/store';
import { getStatusColor, getStatusText, getUserById } from '../models';
import Modal from '@/components/Modal';
import RatingStars from '@/components/RatingStars';
import { useToast } from '@/components/Toast';

export default function ItemDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser } = useAuthStore();
  const {
    currentItem,
    currentItemOffers,
    loading,
    fetchItemById,
    makeOffer,
    acceptOffer,
    rejectOffer,
    clearCurrentItem,
  } = useTradeStore();

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [seller, setSeller] = useState<User | null>(null);
  const [buyersMap, setBuyersMap] = useState<Record<string, User>>({});
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    fetchItemById(id);
    return () => clearCurrentItem();
  }, [id, fetchItemById, clearCurrentItem]);

  useEffect(() => {
    if (currentItem) {
      getUserById(currentItem.sellerId).then((u) => setSeller(u || null));
    }
  }, [currentItem]);

  useEffect(() => {
    const uniqueBuyerIds = Array.from(new Set(currentItemOffers.map((o) => o.buyerId)));
    Promise.all(uniqueBuyerIds.map((bid) => getUserById(bid))).then((users) => {
      const map: Record<string, User> = {};
      users.forEach((u, i) => {
        if (u) map[uniqueBuyerIds[i]] = u;
      });
      setBuyersMap(map);
    });
  }, [currentItemOffers]);

  const isSeller = currentUser?.id === currentItem?.sellerId;
  const isBuyerMadeOffer = currentItemOffers.some((o) => o.buyerId === currentUser?.id);
  const canMakeOffer =
    currentUser &&
    !isSeller &&
    currentItem?.status === 'available' &&
    !isBuyerMadeOffer;

  const handleSubmitOffer = async () => {
    if (!offerMessage.trim()) {
      showToast('请输入留言内容', 'error');
      return;
    }
    if (offerMessage.length > 100) {
      showToast('留言最多100字', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await makeOffer({ itemId: id, message: offerMessage });
      showToast('出价成功！等待卖家处理', 'success');
      setOfferModalOpen(false);
      setOfferMessage('');
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (offerId: string) => {
    try {
      await acceptOffer(offerId);
      showToast('已接受出价，交易完成！双方信誉+1', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleReject = async (offerId: string) => {
    try {
      await rejectOffer(offerId);
      showToast('已拒绝该出价', 'info');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  if (loading && !currentItem) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 pt-20">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="aspect-square skeleton rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 skeleton rounded" />
            <div className="h-10 w-1/3 skeleton rounded" />
            <div className="h-32 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 pt-24 text-center">
        <p className="text-secondary/60">物品不存在或已被删除</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 rounded-full text-white"
          style={{ backgroundColor: '#E67E22' }}
        >
          返回首页
        </button>
      </div>
    );
  }

  const statusColor = getStatusColor(currentItem.status);
  const statusText = getStatusText(currentItem.status);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 pt-20 pb-12 fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-secondary/70 hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>返回</span>
      </button>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-3">
          <div className="aspect-square rounded-xl overflow-hidden bg-white shadow-card">
            {currentItem.images[currentImg] && (
              <img
                src={currentItem.images[currentImg]}
                alt={currentItem.title}
                className="w-full h-full object-cover img-loaded"
              />
            )}
          </div>
          {currentItem.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {currentItem.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImg(i)}
                  className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    i === currentImg ? 'border-primary scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-start gap-3 justify-between">
              <h1 className="text-xl sm:text-2xl font-bold text-secondary">
                {currentItem.title}
              </h1>
              <span
                className="shrink-0 text-xs font-medium px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: statusColor }}
              >
                {statusText}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-3xl font-bold" style={{ color: '#E67E22' }}>
                ¥{currentItem.price}
              </span>
              <span className="text-sm text-secondary/50 line-through">
                ¥{Math.round(currentItem.price * 1.3)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 text-xs bg-bg px-2.5 py-1 rounded-full">
              <Tag size={12} className="text-primary" />
              {currentItem.category}
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-bg px-2.5 py-1 rounded-full">
              <Share2 size={12} className="text-primary" />
              {currentItem.condition}
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-bg px-2.5 py-1 rounded-full">
              <Calendar size={12} className="text-primary" />
              {new Date(currentItem.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>

          {seller && (
            <div className="bg-bg rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm">
                {seller.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-secondary truncate">{seller.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <RatingStars rating={seller.rating} size="sm" />
                  <span className="text-xs text-secondary/50">发布 {seller.itemCount} 件</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-card p-4">
            <h3 className="font-semibold text-secondary mb-2">物品描述</h3>
            <p className="text-sm text-secondary/80 leading-relaxed whitespace-pre-wrap">
              {currentItem.description}
            </p>
          </div>

          {canMakeOffer && (
            <button
              onClick={() => setOfferModalOpen(true)}
              className="w-full py-3.5 rounded-xl text-white font-semibold shadow-card hover:brightness-110 transition-all"
              style={{ backgroundColor: '#E67E22' }}
            >
              <span className="flex items-center justify-center gap-2">
                <MessageSquare size={20} />
                我要出价交换
              </span>
            </button>
          )}

          {isBuyerMadeOffer && !isSeller && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center text-sm text-orange-700">
              您已对此物品出价，请等待卖家回复
            </div>
          )}

          {isSeller && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center text-sm text-blue-700">
              这是您发布的物品，可在下方处理出价
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
          <MessageSquare size={20} className="text-primary" />
          出价列表 ({currentItemOffers.length})
        </h2>

        {currentItemOffers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card p-10 text-center">
            <User size={40} className="mx-auto text-secondary/20 mb-3" />
            <p className="text-secondary/50 text-sm">暂时还没有人出价</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentItemOffers.map((offer) => {
              const buyer = buyersMap[offer.buyerId];
              const isPending = offer.status === 'pending';
              return (
                <div
                  key={offer.id}
                  className="bg-white rounded-xl shadow-card p-4 flex flex-col sm:flex-row sm:items-start gap-4 fade-in"
                >
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                      {buyer?.avatar || '👤'}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{buyer?.name || '匿名用户'}</div>
                      {buyer && <RatingStars rating={buyer.rating} size="sm" />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary/80 bg-bg rounded-lg p-3">
                      {offer.message}
                    </p>
                    <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                      <span className="text-xs text-secondary/40">
                        {new Date(offer.createdAt).toLocaleString('zh-CN')}
                      </span>
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            offer.status === 'accepted'
                              ? '#2ECC7120'
                              : offer.status === 'rejected'
                              ? '#95A5A620'
                              : '#F39C1220',
                          color:
                            offer.status === 'accepted'
                              ? '#2ECC71'
                              : offer.status === 'rejected'
                              ? '#95A5A6'
                              : '#F39C12',
                        }}
                      >
                        {offer.status === 'accepted'
                          ? '已接受'
                          : offer.status === 'rejected'
                          ? '已拒绝'
                          : '待处理'}
                      </span>
                    </div>
                  </div>

                  {isSeller && isPending && (
                    <div className="flex gap-2 shrink-0 sm:flex-col sm:items-end">
                      <button
                        onClick={() => handleAccept(offer.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-medium hover:brightness-110"
                        style={{ backgroundColor: '#2ECC71' }}
                      >
                        <Check size={14} />
                        接受
                      </button>
                      <button
                        onClick={() => handleReject(offer.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-medium hover:brightness-110"
                        style={{ backgroundColor: '#95A5A6' }}
                      >
                        <X size={14} />
                        拒绝
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        title="出价交换"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-secondary mb-2 block">
              留言给卖家 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value.slice(0, 100))}
              rows={4}
              maxLength={100}
              placeholder="请描述您的交换意向，如时间、地点、交换方式等..."
              className="w-full rounded-xl border border-secondary/10 bg-bg p-3 text-sm focus:border-primary/50 focus:bg-white transition-all resize-none"
            />
            <p className="text-xs text-secondary/40 mt-1 text-right">
              {offerMessage.length}/100
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setOfferModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-secondary/10 text-sm font-medium text-secondary/70 hover:bg-bg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmitOffer}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:brightness-110 disabled:opacity-60"
              style={{ backgroundColor: '#E67E22' }}
            >
              {submitting ? '提交中...' : '确认出价'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
