import { useState } from 'react';
import { useKeyStore } from '../store/keyStore';
import { KeyCard } from './KeyCard';
import { RevokeModal } from './RevokeModal';

export function KeyList() {
  const keys = useKeyStore((state) => state.keys);
  const revokeKey = useKeyStore((state) => state.revokeKey);
  const [modalOpen, setModalOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);

  const handleRevokeClick = (id: string, name: string) => {
    setRevokeTarget({ id, name });
    setModalOpen(true);
  };

  const handleConfirmRevoke = () => {
    if (revokeTarget) {
      revokeKey(revokeTarget.id);
    }
    setModalOpen(false);
    setRevokeTarget(null);
  };

  const handleCancelRevoke = () => {
    setModalOpen(false);
    setRevokeTarget(null);
  };

  return (
    <div>
      <h2 className="card-title" style={{ marginBottom: '16px' }}>
        密钥列表 ({keys.length})
      </h2>
      {keys.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🔑</div>
          <div className="empty-text">暂无密钥，点击左侧生成新密钥</div>
        </div>
      ) : (
        <div className="key-grid">
          {keys.map((key) => (
            <KeyCard key={key.id} keyData={key} onRevoke={handleRevokeClick} />
          ))}
        </div>
      )}
      <RevokeModal
        isOpen={modalOpen}
        keyName={revokeTarget?.name || ''}
        onConfirm={handleConfirmRevoke}
        onCancel={handleCancelRevoke}
      />
    </div>
  );
}
