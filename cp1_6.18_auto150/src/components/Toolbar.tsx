import React, { useState, useCallback } from 'react';

interface Props {
  onSnapshot: (nickname: string) => void;
}

export const Toolbar: React.FC<Props> = ({ onSnapshot }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [nickname, setNickname] = useState('');

  const handleClick = useCallback(() => {
    setShowDialog(true);
    setNickname('');
  }, []);

  const handleConfirm = useCallback(() => {
    const name = nickname.trim() || '手作爱好者';
    onSnapshot(name);
    setShowDialog(false);
    setNickname('');
  }, [nickname, onSnapshot]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    setNickname('');
  }, []);

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #D4A373 0%, #BF8C6F 100%)',
          borderRadius: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFBF5', letterSpacing: 2 }}>
          🧩 零件拼搭工坊
        </div>
        <button
          onClick={handleClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: '#FFFBF5',
            color: '#5C4033',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 200ms ease-out',
            boxShadow: '0 2px 6px rgba(92,64,51,0.15)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(92,64,51,0.25)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 6px rgba(92,64,51,0.15)';
          }}
        >
          <span style={{ fontSize: 16 }}>📷</span>
          <span>导出作品快照</span>
        </button>
      </div>
      {showDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(92,64,51,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(2px)',
          }}
          onClick={handleCancel}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFBF5',
              borderRadius: 12,
              padding: 24,
              minWidth: 320,
              boxShadow: '0 12px 40px rgba(92,64,51,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#5C4033' }}>
              保存作品快照
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#8B5E3C' }}>请输入昵称</label>
              <input
                autoFocus
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                  if (e.key === 'Escape') handleCancel();
                }}
                placeholder="手作爱好者"
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #BF8C6F',
                  fontSize: 13,
                  background: '#FFFDF8',
                  color: '#5C4033',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid rgba(191,140,111,0.5)',
                  background: 'transparent',
                  color: '#8B5E3C',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #BF8C6F',
                  background: '#D4A373',
                  color: '#FFFBF5',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                保存并导出
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
