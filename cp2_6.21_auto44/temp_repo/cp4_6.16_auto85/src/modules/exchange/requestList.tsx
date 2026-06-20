import { ArrowRight, Clock, Inbox } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { useExchangeStore } from '@/stores/exchangeStore';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import type { RequestStatus } from '@/types';

const statusLabels: Record<RequestStatus, string> = {
  pending: '待确认',
  confirmed: '已完成',
  rejected: '已拒绝',
  cancelled: '已取消',
};

const statusBadgeClass: Record<RequestStatus, string> = {
  pending: 'badge badge-warning',
  confirmed: 'badge badge-success',
  rejected: 'badge badge-error',
  cancelled: 'badge badge-info',
};

export default function RequestList() {
  const currentUser = useUserStore((s) => s.currentUser);
  const addPoints = useUserStore((s) => s.addPoints);
  const addExchangeLog = useUserStore((s) => s.addExchangeLog);
  const getPendingRequestsForUser = useExchangeStore((s) => s.getPendingRequestsForUser);
  const confirmRequest = useExchangeStore((s) => s.confirmRequest);
  const rejectRequest = useExchangeStore((s) => s.rejectRequest);
  const getItemById = useMarketStore((s) => s.getItemById);
  const updateItemStatus = useMarketStore((s) => s.updateItemStatus);
  const showToast = useUIStore((s) => s.showToast);

  if (!currentUser) return null;

  const requests = getPendingRequestsForUser(currentUser.id);

  const handleConfirm = async (requestId: string, offeredItemId: string, requestedItemId: string, requesterId: string) => {
    await confirmRequest(requestId);
    await updateItemStatus(offeredItemId, 'exchanged');
    await updateItemStatus(requestedItemId, 'exchanged');
    await addPoints(requesterId, 10);
    await addPoints(currentUser.id, 10);
    await addExchangeLog({
      requestId,
      user1Id: requesterId,
      user2Id: currentUser.id,
      item1Id: offeredItemId,
      item2Id: requestedItemId,
      pointsEarned: 10,
      completedAt: Date.now(),
    });
    showToast('success', '交换成功！双方各获得10环保积分 🎉');
  };

  const handleReject = async (requestId: string) => {
    await rejectRequest(requestId);
    showToast('info', '已拒绝交换请求');
  };

  return (
    <section className="section">
      <h2 className="section-title">
        <Clock size={20} />
        待处理的请求
      </h2>

      {requests.length === 0 ? (
        <div className="empty-state">
          <Inbox size={48} />
          <p>暂无待处理的请求</p>
        </div>
      ) : (
        <div className="request-list">
          {requests.map((request, index) => {
            const offeredItem = getItemById(request.offeredItemId);
            const requestedItem = getItemById(request.requestedItemId);

            return (
              <div
                key={request.id}
                className="request-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="request-items">
                  <div className="request-item">
                    <span className="item-name">{offeredItem?.name ?? '未知物品'}</span>
                    {offeredItem && (
                      <span className="badge badge-category">{offeredItem.category}</span>
                    )}
                  </div>

                  <ArrowRight size={20} className="request-arrow" />

                  <div className="request-item">
                    <span className="item-name">{requestedItem?.name ?? '未知物品'}</span>
                    {requestedItem && (
                      <span className="badge badge-category">{requestedItem.category}</span>
                    )}
                  </div>
                </div>

                <div className="request-actions">
                  <span className={statusBadgeClass[request.status]}>
                    {statusLabels[request.status]}
                  </span>

                  {request.status === 'pending' && (
                    <div className="request-buttons">
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          handleConfirm(
                            request.id,
                            request.offeredItemId,
                            request.requestedItemId,
                            request.requesterId,
                          )
                        }
                      >
                        确认
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleReject(request.id)}
                      >
                        拒绝
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
