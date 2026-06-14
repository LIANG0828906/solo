import { memo } from 'react';
import { X, Sparkles, RefreshCw } from 'lucide-react';
import type { Person } from '@/types';
import { GiftCard } from './GiftCard';
import { getGiftRecommendations } from '@/utils/giftDatabase';
import { useBirthdayStore } from '@/store/useBirthdayStore';
import { useState, useEffect } from 'react';
import type { GiftIdea } from '@/types';

interface GiftFinderProps {
  person: Person;
}

export const GiftFinder = memo(function GiftFinder({ person }: GiftFinderProps) {
  const { closeGiftModal } = useBirthdayStore();
  const [recommendations, setRecommendations] = useState<GiftIdea[]>([]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setRecommendations(getGiftRecommendations(person.interests, 3));
  }, [person.interests, key]);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeGiftModal();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-[#D4AF37]" size={28} />
            <div>
              <h2 className="text-2xl font-bold font-display">
                为 {person.name} 找到的礼物灵感
              </h2>
              <p className="text-sm text-gray-300 mt-1">
                基于兴趣标签：{person.interests.join('、')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-105"
              title="换一批"
              aria-label="换一批推荐"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={closeGiftModal}
              className="p-2 rounded-lg bg-white/10 hover:bg-red-500 transition-all duration-200 hover:scale-105"
              title="关闭"
              aria-label="关闭弹窗"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((gift, index) => (
            <GiftCard key={`${gift.id}-${key}`} gift={gift} index={index} />
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 mb-4">
            💡 点击卡片翻转查看详情和购买建议
          </p>
          <button onClick={closeGiftModal} className="btn-gold">
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
});
