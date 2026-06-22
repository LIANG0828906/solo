import { Clock, History } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { useMarketStore } from '@/stores/marketStore';

export default function ExchangeHistory() {
  const currentUser = useUserStore((s) => s.currentUser);
  const getExchangeLogsForUser = useUserStore((s) => s.getExchangeLogsForUser);
  const users = useUserStore((s) => s.users);
  const getItemById = useMarketStore((s) => s.getItemById);

  if (!currentUser) return null;

  const logs = getExchangeLogsForUser(currentUser.id);

  const getUserName = (userId: string): string => {
    if (userId === currentUser.id) return '你';
    const user = users.find((u) => u.id === userId);
    return user?.name ?? '未知用户';
  };

  return (
    <section className="section">
      <h2 className="section-title">
        <Clock size={20} />
        交换历史
      </h2>

      {logs.length === 0 ? (
        <div className="empty-state">
          <History size={48} />
          <p>暂无交换记录</p>
        </div>
      ) : (
        <div className="timeline">
          {logs.map((log, index) => {
            const isUser1 = log.user1Id === currentUser.id;
            const yourItemId = isUser1 ? log.item1Id : log.item2Id;
            const theirItemId = isUser1 ? log.item2Id : log.item1Id;
            const otherUserId = isUser1 ? log.user2Id : log.user1Id;

            const yourItem = getItemById(yourItemId);
            const theirItem = getItemById(theirItemId);
            const otherUserName = getUserName(otherUserId);

            return (
              <div
                key={log.id}
                className="timeline-item animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="timeline-date">
                  {new Date(log.completedAt).toLocaleDateString()}
                </div>
                <div className="timeline-content">
                  <p className="timeline-description">
                    你用 <strong>{yourItem?.name ?? '未知物品'}</strong> 与{' '}
                    <strong>{otherUserName}</strong> 交换了{' '}
                    <strong>{theirItem?.name ?? '未知物品'}</strong>
                  </p>
                  <span className="badge badge-points">+10 🌱 环保积分</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
