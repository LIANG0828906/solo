import { useState, useEffect, useCallback } from 'react';
import { SwapItem } from './SwapItem';
import { database } from '../db/database';
import { SwapRequest, Book } from '../types';
import { Inbox } from 'lucide-react';

interface SwapManagementProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function SwapManagement({ showToast }: SwapManagementProps) {
  const currentUser = database.getCurrentUser();
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRequests = () => {
      setIsLoading(true);
      setTimeout(() => {
        setRequests(
          database.getSwapRequests({
            recipientId: currentUser.id,
          } as Partial<SwapRequest>)
        );
        setIsLoading(false);
      }, 200);
    };
    loadRequests();
    return database.subscribe(loadRequests);
  }, [currentUser.id]);

  const handleAccept = useCallback(
    (id: string) => {
      const success = database.executeSwap(id);
      if (success) {
        showToast('交换已完成！书籍所有权已互换', 'success');
      } else {
        showToast('交换失败，书籍可能已被交换', 'error');
      }
    },
    [showToast]
  );

  const handleReject = useCallback(
    (id: string) => {
      database.updateSwapRequestStatus(id, 'rejected');
      showToast('已拒绝交换请求', 'info');
    },
    [showToast]
  );

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const otherRequests = requests.filter((r) => r.status !== 'pending');

  const getBook = (id: string) => database.getBookById(id);
  const getUser = (id: string) => database.getUserById(id);

  return (
    <div className="page-container page-transition">
      <div className="page-header">
        <div>
          <h1 className="page-title">交换管理</h1>
          <p className="page-subtitle">
            {pendingRequests.length > 0
              ? `你有 ${pendingRequests.length} 个待处理的交换请求`
              : '暂无待处理的交换请求'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="swap-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-swap-item">
              <div className="skeleton-line w-1/3" />
              <div className="skeleton-books">
                <div className="skeleton-book" />
                <div className="skeleton-book" />
              </div>
              <div className="skeleton-line w-1/4" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📨</div>
          <p className="empty-text">还没有收到交换请求</p>
          <p className="empty-subtext">去社区动态看看有没有想交换的书籍吧</p>
        </div>
      ) : (
        <div className="swap-list">
          {pendingRequests.length > 0 && (
            <div className="swap-section">
              <h3 className="swap-section-title">
                <Inbox size={18} />
                待处理 ({pendingRequests.length})
              </h3>
              {pendingRequests.map((request) => (
                <SwapItem
                  key={request.id}
                  request={request}
                  requester={getUser(request.requesterId)}
                  requestedBook={getBook(request.requestedBookId)}
                  offeredBook={getBook(request.offeredBookId)}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}

          {otherRequests.length > 0 && (
            <div className="swap-section">
              <h3 className="swap-section-title">已处理</h3>
              {otherRequests.map((request) => (
                <SwapItem
                  key={request.id}
                  request={request}
                  requester={getUser(request.requesterId)}
                  requestedBook={getBook(request.requestedBookId)}
                  offeredBook={getBook(request.offeredBookId)}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
