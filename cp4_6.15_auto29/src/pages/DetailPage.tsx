import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, Sparkles, MessageSquare, Check, X } from 'lucide-react';
import { useDataStore } from '@/utils/dataStore';
import { CATEGORY_LABELS } from '@/types';
import ImageCarousel from '@/components/ImageCarousel';
import Modal from '@/components/Modal';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getProduct = useDataStore((state) => state.getProduct);
  const addRequest = useDataStore((state) => state.addRequest);
  const currentUserId = useDataStore((state) => state.currentUserId);

  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [offerDescription, setOfferDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const product = id ? getProduct(id) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const handleSubmitExchange = () => {
    if (!offerDescription.trim()) {
      alert('请填写你能提供的物品描述');
      return;
    }
    if (!contactInfo.trim()) {
      alert('请填写联系方式');
      return;
    }
    if (!product) return;

    addRequest({
      productId: product.id,
      offerDescription: offerDescription.trim(),
      contactInfo: contactInfo.trim(),
      requesterId: currentUserId,
    });

    setShowExchangeModal(false);
    setShowSuccessModal(true);
    setOfferDescription('');
    setContactInfo('');
  };

  const isOwner = product?.ownerId === currentUserId;

  const conditionLabel = (condition: number) => {
    if (condition >= 9) return '几乎全新';
    if (condition >= 7) return '成色较好';
    if (condition >= 5) return '有使用痕迹';
    if (condition >= 3) return '有明显磨损';
    return '品相一般';
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-morandi-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-morandi-brown mb-4">物品不存在或已下架</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-morandi-blue text-white rounded-full text-sm hover:bg-morandi-blue-dark transition-colors duration-300"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-morandi-white pb-24">
      <div className="sticky top-0 z-30 bg-morandi-white/90 backdrop-blur-sm border-b border-morandi-gray">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center text-morandi-brown hover:text-morandi-blue hover:bg-morandi-gray rounded-full transition-all duration-300"
            aria-label="返回"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-medium text-gray-700 truncate flex-1">
            物品详情
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto animate-fade-in">
        <ImageCarousel images={product.images} />

        <div className="px-4 py-5 bg-white border-b border-morandi-gray">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h2 className="text-xl font-semibold text-gray-700">{product.title}</h2>
            <span className="flex-shrink-0 px-3 py-1 bg-morandi-blue/10 text-morandi-blue text-sm rounded-full">
              {CATEGORY_LABELS[product.category]}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-morandi-green" />
              <span className="text-sm text-gray-600">
                新旧程度：
                <span className="font-medium text-morandi-green">
                  {product.condition}/10
                </span>
              </span>
            </div>
            <div className="text-sm text-morandi-brown">
              {conditionLabel(product.condition)}
            </div>
          </div>

          <div className="w-full h-2 bg-morandi-gray rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-morandi-green to-morandi-green-dark rounded-full transition-all duration-500"
              style={{ width: `${product.condition * 10}%` }}
            />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Tag size={16} className="text-morandi-sand" />
            <span className="text-sm text-gray-600">交换意向：</span>
            <span className="text-sm font-medium text-morandi-brown">
              {product.exchangePreference}
            </span>
          </div>

          <div className="text-xs text-morandi-brown">
            发布于 {formatDate(product.createdAt)}
          </div>
        </div>

        <div className="px-4 py-5">
          <h3 className="text-base font-medium text-gray-700 mb-3">物品描述</h3>
          <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
            {product.description || '暂无详细描述'}
          </p>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-20 bg-white border-t border-morandi-gray px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {isOwner ? (
            <div className="flex items-center justify-center gap-3 py-2 text-morandi-brown">
              <MessageSquare size={18} />
              <span className="text-sm">这是你发布的物品</span>
            </div>
          ) : product.status === 'sold' ? (
            <div className="flex items-center justify-center gap-2 py-2 text-morandi-brown">
              <Check size={18} className="text-morandi-green" />
              <span className="text-sm">这件物品已被交换</span>
            </div>
          ) : (
            <button
              onClick={() => setShowExchangeModal(true)}
              className="w-full py-3.5 bg-morandi-blue text-white rounded-card font-medium hover:bg-morandi-blue-dark active:scale-[0.98] transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <MessageSquare size={20} />
              申请交换
            </button>
          )}
        </div>
      </div>

      <Modal
        isOpen={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
        title="申请交换"
      >
        <div className="space-y-4">
          <p className="text-sm text-morandi-brown mb-4">
            请描述你能提供的物品，以及联系方式，物主会与你联系。
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              你能提供的物品
            </label>
            <textarea
              value={offerDescription}
              onChange={(e) => setOfferDescription(e.target.value)}
              placeholder="描述一下你想用来交换的物品..."
              rows={3}
              className="w-full px-4 py-3 bg-morandi-white border border-morandi-gray rounded-card text-gray-700 placeholder:text-morandi-brown/60 focus:outline-none focus:border-morandi-blue focus:ring-2 focus:ring-morandi-blue/20 transition-all duration-300 resize-none"
              maxLength={300}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              联系方式
            </label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="微信号 / 手机号 / 其他"
              className="w-full px-4 py-3 bg-morandi-white border border-morandi-gray rounded-card text-gray-700 placeholder:text-morandi-brown/60 focus:outline-none focus:border-morandi-blue focus:ring-2 focus:ring-morandi-blue/20 transition-all duration-300"
              maxLength={50}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowExchangeModal(false)}
              className="flex-1 py-3 border border-morandi-gray text-morandi-brown rounded-card font-medium hover:bg-morandi-gray transition-colors duration-300"
            >
              取消
            </button>
            <button
              onClick={handleSubmitExchange}
              className="flex-1 py-3 bg-morandi-blue text-white rounded-card font-medium hover:bg-morandi-blue-dark transition-colors duration-300"
            >
              提交申请
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-morandi-green/20 rounded-full flex items-center justify-center animate-scale-in">
            <Check size={32} className="text-morandi-green" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">申请已发送！</h3>
          <p className="text-sm text-morandi-brown mb-6">
            物主会收到你的交换申请，请耐心等待回复
          </p>
          <button
            onClick={() => {
              setShowSuccessModal(false);
              navigate('/');
            }}
            className="px-8 py-2.5 bg-morandi-blue text-white rounded-full text-sm hover:bg-morandi-blue-dark transition-colors duration-300"
          >
            返回首页
          </button>
        </div>
      </Modal>
    </div>
  );
}
