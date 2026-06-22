import { useState, useEffect } from 'react';
import CollabEditor from './CollabEditor';
import HistoryPanel from './HistoryPanel';
import { wsService } from './WebSocketService';
import type { User, DocVersion, ConnectionStatus } from './types';

function App() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [users, setUsers] = useState<User[]>([]);
  const [versions, setVersions] = useState<DocVersion[]>([]);
  const [content, setContent] = useState<string>('');
  const [myUser, setMyUser] = useState<{ id: string; name: string; color: string } | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState<boolean>(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setStatus(wsService.getStatus());
    const unsubStatus = wsService.onStatusChange(setStatus);

    const unsubMessage = wsService.onMessage((message) => {
      switch (message.type) {
        case 'init':
          if (message.clientId && message.name && message.color) {
            setMyUser({ id: message.clientId, name: message.name, color: message.color });
          }
          if (typeof message.content !== 'undefined') {
            setContent(message.content);
          }
          if (message.versions) {
            setVersions(message.versions);
            if (message.versions.length > 0) {
              setLastSaveTime(message.versions[0].timestamp);
            }
          }
          break;
        case 'presence':
          if (message.users) {
            setUsers(message.users);
          }
          break;
        case 'operation':
          if (message.operation?.content !== undefined) {
            setContent(message.operation.content);
          }
          break;
        case 'version-created':
          if (message.version) {
            setVersions(prev => {
              const exists = prev.some(v => v.id === message.version!.id);
              if (exists) return prev;
              return [message.version!, ...prev];
            });
            setLastSaveTime(message.version.timestamp);
          }
          break;
      }
    });

    wsService.connect();

    return () => {
      unsubStatus();
      unsubMessage();
      wsService.disconnect();
    };
  }, []);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    wsService.sendOperation({ type: 'replace', content: newContent });
  };

  const handleCursorChange = (cursor: { start: number; end: number } | null) => {
    wsService.sendCursor(cursor);
  };

  const handleSelectVersion = (versionId: string | null) => {
    setSelectedVersionId(versionId);
  };

  const handleRestoreVersion = (versionId: string) => {
    setShowRestoreConfirm(versionId);
  };

  const confirmRestore = () => {
    if (showRestoreConfirm) {
      wsService.sendRestoreVersion(showRestoreConfirm);
      setSelectedVersionId(null);
      setShowRestoreConfirm(null);
      if (isMobile) {
        setMobileHistoryOpen(false);
      }
    }
  };

  const cancelRestore = () => {
    setShowRestoreConfirm(null);
  };

  const handleRename = (newName: string) => {
    wsService.sendRename(newName);
  };

  const selectedVersion = selectedVersionId ? versions.find(v => v.id === selectedVersionId) || null : null;
  const onlineCount = users.length;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F8F9FA' }}>
      <div style={{
        padding: isMobile ? '12px 16px' : '16px 24px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E9ECEF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '24px' }}>📝</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#212529' }}>协作文档编辑器</div>
            <div style={{ fontSize: '12px', color: '#6C757D' }}>共享文档 - 实时协作</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: status === 'connected' ? '#28A745' : status === 'disconnected' ? '#DC3545' : '#FFC107',
              boxShadow: status === 'connected' ? '0 0 0 3px rgba(40,167,69,0.2)' : 'none'
            }} />
            <span style={{ fontSize: '13px', color: '#495057' }}>
              {status === 'connected' ? '已连接' : status === 'reconnecting' ? '重新连接中...' : status === 'connecting' ? '连接中...' : '已断开'}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: '#F1F3F5',
            borderRadius: '20px'
          }}>
            <span style={{ fontSize: '14px' }}>👥</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#495057' }}>{onlineCount} 人在线</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {users.slice(0, 8).map((user, idx) => (
              <div
                key={user.id}
                title={`${user.name}${user.id === myUser?.id ? ' (我)' : ''}`}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: user.color,
                  border: '2px solid #FFFFFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  zIndex: users.length - idx,
                  marginLeft: idx > 0 ? '-6px' : '0'
                }}
              >
                {user.name.slice(0, 1)}
              </div>
            ))}
            {users.length > 8 && (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#6C757D',
                border: '2px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: '#FFFFFF',
                fontWeight: 600,
                marginLeft: '-6px'
              }}>
                +{users.length - 8}
              </div>
            )}
          </div>
        </div>

        {isMobile && (
          <button
            onClick={() => setMobileHistoryOpen(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0D6EFD',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📜 历史
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: isMobile ? '100%' : '70%',
          height: '100%',
          padding: isMobile ? '12px' : '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <CollabEditor
            content={content}
            users={users.filter(u => u.id !== myUser?.id)}
            myUserId={myUser?.id || null}
            myColor={myUser?.color || ''}
            selectedVersion={selectedVersion}
            onContentChange={handleContentChange}
            onCursorChange={handleCursorChange}
            onRename={handleRename}
            myName={myUser?.name || ''}
          />
        </div>

        {!isMobile && (
          <div style={{
            width: '30%',
            height: '100%',
            borderLeft: '1px solid #E9ECEF',
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <HistoryPanel
              versions={versions}
              currentContent={content}
              selectedVersionId={selectedVersionId}
              onSelectVersion={handleSelectVersion}
              onRestoreVersion={handleRestoreVersion}
            />
          </div>
        )}

        {isMobile && mobileHistoryOpen && (
          <div
            onClick={() => setMobileHistoryOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 100
            }}
          />
        )}
        {isMobile && mobileHistoryOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              height: '70vh',
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              zIndex: 101,
              display: 'flex',
              flexDirection: 'column',
              transform: 'translateY(0)',
              transition: 'transform 0.3s ease'
            }}
          >
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #E9ECEF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>📜 版本历史</span>
              <button
                onClick={() => setMobileHistoryOpen(false)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #DEE2E6',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  fontSize: '13px'
                }}
              >
                关闭
              </button>
            </div>
            <HistoryPanel
              versions={versions}
              currentContent={content}
              selectedVersionId={selectedVersionId}
              onSelectVersion={handleSelectVersion}
              onRestoreVersion={handleRestoreVersion}
            />
          </div>
        )}
      </div>

      <div style={{
        padding: isMobile ? '8px 16px' : '10px 24px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E9ECEF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#6C757D'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: status === 'connected' ? '#28A745' : '#DC3545'
          }} />
          <span>
            {status === 'connected' ? '实时同步中' : '连接已断开，修改将不会同步'}
          </span>
        </div>
        <div>
          {lastSaveTime ? `最后保存: ${new Date(lastSaveTime).toLocaleString('zh-CN')}` : '暂无保存记录'}
        </div>
      </div>

      {showRestoreConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>⚠️ 确认恢复版本</div>
            <p style={{ fontSize: '14px', color: '#495057', lineHeight: 1.6, marginBottom: '20px' }}>
              此操作将用所选版本替换当前文档内容，所有在线用户都会同步到该版本。是否继续？
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelRestore}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #DEE2E6',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                取消
              </button>
              <button
                onClick={confirmRestore}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#FFC107',
                  color: '#212529',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
