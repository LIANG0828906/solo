import { useState, useMemo } from 'react';
import { X, ArrowRight, AlertCircle } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { useMarketStore } from '@/stores/marketStore';
import { useExchangeStore } from '@/stores/exchangeStore';
import { useUIStore } from '@/stores/uiStore';

interface RequestPanelProps {
  requestedItemId: string;
  onClose: () => void;
}

export default function RequestPanel({ requestedItemId, onClose }: RequestPanelProps) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentUser = useUserStore((s) => s.currentUser);
  const getItemById = useMarketStore((s) => s.getItemById);
  const getItemsByOwner = useMarketStore((s) => s.getItemsByOwner);
  const createRequest = useExchangeStore((s) => s.createRequest);
  const showToast = useUIStore((s) => s.showToast);

  const requestedItem = getItemById(requestedItemId);

  const myAvailableItems = useMemo(() => {
    if (!currentUser) return [];
    return getItemsByOwner(currentUser.id).filter(
      (item) => item.status === 'available'
    );
  }, [currentUser, getItemsByOwner]);

  const handleSubmit = async () => {
    if (!currentUser) {
      showToast('error', '请先登录');
      return;
    }

    if (!selectedItemId) {
      showToast('error', '请选择你要交换的材料');
      return;
    }

    if (!requestedItem) {
      showToast('error', '请求的材料不存在');
      return;
    }

    if (requestedItem.ownerId === currentUser.id) {
      showToast('error', '不能交换自己的材料');
      return;
    }

    setSubmitting(true);
    try {
      await createRequest({
        requesterId: currentUser.id,
        responderId: requestedItem.ownerId,
        offeredItemId: selectedItemId,
        requestedItemId,
      });
      showToast('success', '交换请求已发送！');
      onClose();
    } catch {
      showToast('error', '发送请求失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!requestedItem) {
    return (
      <div className="glass slide-panel animate-slide-in-right" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <AlertCircle size={48} color="var(--color-text-muted)" />
          <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
            材料不存在或已被删除
          </p>
        </div>
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onClose}>
          关闭
        </button>
      </div>
    );
  }

  return (
    <div className="glass slide-panel animate-slide-in-right">
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>交换请求</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            background: 'var(--color-card)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.5rem' }}>
            {requestedItem.name}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span className="badge badge-info">{requestedItem.category}</span>
            <span className="badge badge-warning">
              磨损 {Math.round(requestedItem.wearLevel * 100)}%
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {requestedItem.description}
          </p>
          {requestedItem.desiredExchange && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
              期望交换: {requestedItem.desiredExchange}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">选择你的材料</label>
          {myAvailableItems.length > 0 ? (
            <select
              className="form-input"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              <option value="">-- 请选择 --</option>
              {myAvailableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category})
                </option>
              ))}
            </select>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: '0.75rem 0' }}>
              你还没有可交换的材料，请先发布
            </p>
          )}
        </div>

        {selectedItemId && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem',
              padding: '0.75rem',
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {myAvailableItems.find((i) => i.id === selectedItemId)?.name}
            </span>
            <ArrowRight size={16} color="var(--color-primary)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {requestedItem.name}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleSubmit}
            disabled={!selectedItemId || submitting || myAvailableItems.length === 0}
          >
            {submitting ? '发送中...' : '发起交换请求'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
