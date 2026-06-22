import React from 'react';
import { X, Edit3, Circle } from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';

const CollaborationSidebar: React.FC = () => {
  const { users, blocks, collaborationOpen, toggleCollaboration, currentUserId } = useEditorStore();

  return (
    <>
      <div
        onClick={toggleCollaboration}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: collaborationOpen ? 'rgba(0,0,0,0.3)' : 'transparent',
          pointerEvents: collaborationOpen ? 'auto' : 'none',
          transition: 'background-color 0.3s ease',
          zIndex: 199,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 280,
          backgroundColor: '#2D2D44',
          borderRadius: '16px 0 0 16px',
          transform: collaborationOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#F9FAFB', margin: 0 }}>协作成员</h3>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>
              {users.filter((u) => u.online).length} 人在线
            </p>
          </div>
          <button
            onClick={toggleCollaboration}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
          >
            <X size={18} color="#F9FAFB" />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 12,
          }}
        >
          {users.map((user) => {
            const editingBlock = user.editingBlockId
              ? blocks.find((b) => b.id === user.editingBlockId)
              : null;

            return (
              <div
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 4,
                  backgroundColor: user.id === currentUserId ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <div style={{ position: 'relative', marginRight: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: user.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: 16,
                    }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <Circle
                    size={12}
                    fill={user.online ? '#10B981' : '#6B7280'}
                    color={user.online ? '#10B981' : '#6B7280'}
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      backgroundColor: '#2D2D44',
                      borderRadius: '50%',
                      padding: 1,
                    }}
                    strokeWidth={0}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#F9FAFB',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {user.name}
                    {user.id === currentUserId && (
                      <span style={{ fontSize: 11, color: '#3B82F6' }}>(我)</span>
                    )}
                  </div>
                  {editingBlock ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 4,
                        fontSize: 12,
                        color: '#FBBF24',
                      }}
                    >
                      <Edit3 size={12} />
                      <span>正在编辑 {blockTypeLabel(editingBlock.type)}</span>
                    </div>
                  ) : (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#6B7280' }}>
                      {user.online ? '空闲中' : '离线'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            padding: 16,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 10,
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              borderRadius: 8,
              fontSize: 12,
              color: '#FBBF24',
              lineHeight: 1.5,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                backgroundColor: 'rgba(251, 191, 36, 0.5)',
                flexShrink: 0,
              }}
            />
            <span>黄色遮罩表示该区块正在被其他成员编辑</span>
          </div>
        </div>
      </div>
    </>
  );
};

function blockTypeLabel(type: string): string {
  switch (type) {
    case 'title':
      return '标题块';
    case 'text':
      return '文本块';
    case 'image':
      return '图片块';
    default:
      return '内容块';
  }
}

export default CollaborationSidebar;
