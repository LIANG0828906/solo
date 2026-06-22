import React, { useState } from 'react';
import { X, RefreshCw, ShoppingCart, Send, Check } from 'lucide-react';

interface ExchangeFormProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  hasPrice: boolean;
  hasExchange: boolean;
  onSubmit: (data: {
    type: 'exchange' | 'buy';
    offerBookTitle?: string;
    offerBookAuthor?: string;
    offerPrice?: number;
    message: string;
    contactInfo: string;
  }) => Promise<void>;
}

const ExchangeForm: React.FC<ExchangeFormProps> = ({
  isOpen,
  onClose,
  bookTitle,
  hasPrice,
  hasExchange,
  onSubmit,
}) => {
  const [type, setType] = useState<'exchange' | 'buy'>(
    hasExchange ? 'exchange' : 'buy'
  );
  const [offerBookTitle, setOfferBookTitle] = useState('');
  const [offerBookAuthor, setOfferBookAuthor] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [message, setMessage] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await onSubmit({
      type,
      offerBookTitle: type === 'exchange' ? offerBookTitle : undefined,
      offerBookAuthor: type === 'exchange' ? offerBookAuthor : undefined,
      offerPrice: type === 'buy' ? parseFloat(offerPrice) : undefined,
      message,
      contactInfo,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsSubmitting(false);
      setOfferBookTitle('');
      setOfferBookAuthor('');
      setOfferPrice('');
      setMessage('');
      setContactInfo('');
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="slide-in-overlay" onClick={onClose}>
      <div className="slide-in-backdrop" />
      <div
        className="slide-in-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-cream/95 backdrop-blur border-b border-wood/10">
          <h2 className="font-serif font-bold text-xl text-[#3D2B1F]">发起{type === 'exchange' ? '交换' : '购买'}</h2>
          <button
            onClick={onClose}
            className="btn-press p-2 rounded-xl hover:bg-creamDark transition-colors text-[#3D2B1F]/70"
          >
            <X size={22} />
          </button>
        </div>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <div className="rise-flash flex flex-col items-center">
              <div className="w-20 h-20 bg-sage rounded-full flex items-center justify-center green-pulse mb-6">
                <Check className="text-white" size={40} />
              </div>
              <h3 className="font-serif font-bold text-2xl text-sage mb-2">提交成功！</h3>
              <p className="text-[#3D2B1F]/60">卖家会尽快收到消息并回复您</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-creamDark/60 rounded-xl p-4">
              <p className="text-sm text-woodDark mb-1">你正在对</p>
              <p className="font-serif font-semibold text-lg text-[#3D2B1F]">《{bookTitle}》</p>
            </div>

            {(hasPrice && hasExchange) && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setType('exchange')}
                  className={`
                    btn-press flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all
                    ${type === 'exchange'
                      ? 'bg-sage text-white shadow-soft'
                      : 'bg-white border-2 border-wood/20 text-woodDark hover:border-sage/40'
                    }
                  `}
                >
                  <RefreshCw size={18} />
                  课本交换
                </button>
                <button
                  type="button"
                  onClick={() => setType('buy')}
                  className={`
                    btn-press flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all
                    ${type === 'buy'
                      ? 'bg-warmOrange text-white shadow-soft'
                      : 'bg-white border-2 border-wood/20 text-woodDark hover:border-warmOrange/40'
                    }
                  `}
                >
                  <ShoppingCart size={18} />
                  直接购买
                </button>
              </div>
            )}

            {type === 'exchange' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#3D2B1F]/80 mb-2">
                    我想交换的课本名称
                  </label>
                  <input
                    type="text"
                    value={offerBookTitle}
                    onChange={(e) => setOfferBookTitle(e.target.value)}
                    placeholder="例如：高等数学上册"
                    className="w-full px-4 py-3 rounded-xl border-2 border-wood/15 bg-white focus:border-warmOrange/50 focus:ring-4 focus:ring-warmOrange/10 outline-none transition-all text-[#3D2B1F]"
                    required={type === 'exchange'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3D2B1F]/80 mb-2">
                    课本作者
                  </label>
                  <input
                    type="text"
                    value={offerBookAuthor}
                    onChange={(e) => setOfferBookAuthor(e.target.value)}
                    placeholder="例如：同济大学数学系"
                    className="w-full px-4 py-3 rounded-xl border-2 border-wood/15 bg-white focus:border-warmOrange/50 focus:ring-4 focus:ring-warmOrange/10 outline-none transition-all text-[#3D2B1F]"
                  />
                </div>
              </div>
            )}

            {type === 'buy' && (
              <div>
                <label className="block text-sm font-medium text-[#3D2B1F]/80 mb-2">
                  我的报价（元）
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="输入你愿意出的价格"
                  className="w-full px-4 py-3 rounded-xl border-2 border-wood/15 bg-white focus:border-warmOrange/50 focus:ring-4 focus:ring-warmOrange/10 outline-none transition-all text-[#3D2B1F] text-lg font-semibold"
                  required={type === 'buy'}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#3D2B1F]/80 mb-2">
                给卖家留言
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="介绍一下你的课本情况或交易意向..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-wood/15 bg-white focus:border-warmOrange/50 focus:ring-4 focus:ring-warmOrange/10 outline-none transition-all text-[#3D2B1F] resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3D2B1F]/80 mb-2">
                我的联系方式
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="微信号 / QQ号 / 手机号"
                className="w-full px-4 py-3 rounded-xl border-2 border-wood/15 bg-white focus:border-warmOrange/50 focus:ring-4 focus:ring-warmOrange/10 outline-none transition-all text-[#3D2B1F]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-press w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-warmOrange to-warmOrangeDark text-white rounded-xl font-semibold text-lg shadow-soft hover:shadow-softHover transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send size={20} />
              {isSubmitting ? '提交中...' : '确认提交'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ExchangeForm;
