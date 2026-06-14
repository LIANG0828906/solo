import { useState, useEffect } from 'react';
import { Gift, Star, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { rewardApi } from '@/utils/api';
import RewardCard from '@/components/RewardCard';
import SuccessModal from '@/components/SuccessModal';
import type { Member } from '@/types';

export default function ShopPage() {
  const { rewards, setRewards, members, updateMember, currentMemberId, isLoading, setIsLoading } = useStore();
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  const currentMember = members.find((m) => m.id === currentMemberId) || null;

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      setIsLoading(true);
      const data = await rewardApi.getRewards();
      setRewards(data);
    } catch (error) {
      console.error('Failed to load rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    if (!currentMemberId) return;

    try {
      const response = await rewardApi.redeemReward(rewardId, currentMemberId);
      const result = response as unknown as { member: Member; reward: { name: string; points: number } };

      updateMember(result.member);
      loadRewards();

      setSuccessModal({
        isOpen: true,
        title: '兑换成功！',
        message: `恭喜你成功兑换「${result.reward.name}」，消耗 ${result.reward.points} 积分！`,
      });
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      alert('兑换失败，请稍后重试');
    }
  };

  const totalPoints = rewards.reduce((sum, r) => sum + r.points * r.stock, 0);
  const availableRewards = rewards.filter((r) => r.stock > 0).length;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-cream to-primary-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-500 shadow-lg shadow-primary-300 mb-4">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">积分商城</h1>
          <p className="text-gray-600">用汗水换来的积分，兑换你心仪的奖励吧！</p>
        </div>

        {currentMember && (
          <div className="mb-8 bg-white rounded-3xl p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200">
                  <Star className="h-8 w-8 fill-primary-500 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">我的积分</p>
                  <p className="text-4xl font-bold text-primary-600">
                    {currentMember.points}
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{rewards.length}</p>
                  <p className="text-sm text-gray-500">奖励种类</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{availableRewards}</p>
                  <p className="text-sm text-gray-500">可兑换</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">{totalPoints}</p>
                  <p className="text-sm text-gray-500">总价值</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              currentMember={currentMember}
              onRedeem={handleRedeem}
            />
          ))}
        </div>

        {rewards.length === 0 && (
          <div className="text-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mx-auto mb-4">
              <Sparkles className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">暂无奖励，请等待管理员上架</p>
          </div>
        )}
      </div>

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        message={successModal.message}
        type="celebration"
      />
    </div>
  );
}
