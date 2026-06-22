import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Link2, MapPin, MessageCircle, Check } from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import StatusBadge from '@/components/StatusBadge';
import Empty from '@/components/Empty';
import { useStore } from '@/store';
import type { MatchResult as MatchResultType } from '@/types';
import { COLOR_PALETTE } from '@/types';

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function MatchCard({ match }: { match: MatchResultType }) {
  const navigate = useNavigate();
  const startConversation = useStore((state) => state.startConversation);
  const currentUserId = useStore((state) => state.currentUserId);

  const handleContact = () => {
    const conversation = startConversation(
      match.id,
      match.lostItem.anonymousId,
      match.foundItem.anonymousId
    );
    navigate(`/messages/${conversation.id}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#4CAF50';
    if (score >= 75) return '#FF9800';
    return '#4FC3F7';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl overflow-hidden"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Link2 size={16} color="#4FC3F7" />
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            匹配成功
          </span>
        </div>
        <div
          className="px-3 py-1 rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: getScoreColor(match.score) }}
        >
          {match.score}%
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#E3F2FD' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-1 rounded-full bg-white text-blue-600 font-medium">
                失物
              </span>
              <StatusBadge status={match.lostItem.status} />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <CategoryIcon category={match.lostItem.category} size={20} />
              <span className="font-semibold" style={{ color: 'var(--text)' }}>
                {match.lostItem.name}
              </span>
            </div>
            <div className="flex items-center gap-1 mb-2">
              <MapPin size={14} className="text-gray-500" />
              <span className="text-sm text-gray-600">{match.lostItem.location}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {match.lostItem.colors.map((color) => (
                <span
                  key={color}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: COLOR_PALETTE[color],
                    color:
                      COLOR_PALETTE[color] === '#FFFFFF' || COLOR_PALETTE[color] === '#FFD54F'
                        ? '#333'
                        : '#fff',
                    border: COLOR_PALETTE[color] === '#FFFFFF' ? '1px solid #E0E0E0' : 'none',
                  }}
                >
                  {color}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3E0' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-1 rounded-full bg-white text-orange-600 font-medium">
                拾物
              </span>
              <StatusBadge status={match.foundItem.status} />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <CategoryIcon category={match.foundItem.category} size={20} />
              <span className="font-semibold" style={{ color: 'var(--text)' }}>
                {match.foundItem.name}
              </span>
            </div>
            <div className="flex items-center gap-1 mb-2">
              <MapPin size={14} className="text-gray-500" />
              <span className="text-sm text-gray-600">{match.foundItem.location}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {match.foundItem.colors.map((color) => (
                <span
                  key={color}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: COLOR_PALETTE[color],
                    color:
                      COLOR_PALETTE[color] === '#FFFFFF' || COLOR_PALETTE[color] === '#FFD54F'
                        ? '#333'
                        : '#fff',
                    border: COLOR_PALETTE[color] === '#FFFFFF' ? '1px solid #E0E0E0' : 'none',
                  }}
                >
                  {color}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-4 pt-4 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span className="text-xs text-gray-500">匹配时间：{formatDate(match.createdAt)}</span>
          <div className="flex items-center gap-2">
            {(match.lostItem.anonymousId === currentUserId ||
              match.foundItem.anonymousId === currentUserId) && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleContact}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <MessageCircle size={14} />
                联系对方
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function MatchResult() {
  const matchResults = useStore((state) => state.matchResults);

  const sortedResults = [...matchResults].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            匹配结果
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            系统自动匹配失物与拾物，相似度超过 65% 会展示在这里
          </p>
        </div>
      </div>

      {sortedResults.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-4">
          {sortedResults.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
