import { useState } from 'react';
import { useEditorStore, type Version } from '@/store/editorStore';
import DiffViewer from './DiffViewer';

interface VersionPanelProps {
  width: number;
  onResize: (width: number) => void;
}

const formatVersionTime = (ts: number) => {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const VersionPanel = ({ width, onResize }: VersionPanelProps) => {
  const { versions, currentDraftId, code } = useEditorStore();
  const [compareVersion, setCompareVersion] = useState<Version | null>(null);
  let isDragging = false;

  const draftVersions = versions.filter((v) => v.draftId === currentDraftId);
  const latestVersionId =
    draftVersions.length > 0 ? draftVersions[draftVersions.length - 1].id : null;

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging = true;
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging) return;
      const delta = ev.clientX - startX;
      const newWidth = Math.max(180, Math.min(400, startWidth - delta));
      onResize(newWidth);
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <>
      <div
        style={{
          width,
          flexShrink: 0,
          background: '#1E1E2E',
          borderRadius: 6,
          margin: 12,
          marginLeft: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.1s linear',
          position: 'relative',
        }}
      >
        <div
          style={{
            padding: '16px 20px 12px',
            borderBottom: '1px solid #3A3A3C',
          }}
        >
          <h3
            style={{
              color: '#D4D4D4',
              fontSize: 15,
              fontWeight: 600,
              margin: 0,
              marginBottom: 4,
            }}
          >
            版本历史
          </h3>
          <p style={{ color: '#6A6A6A', fontSize: 12, margin: 0 }}>
            {currentDraftId
              ? `${draftVersions.length} 个版本`
              : '请先保存草稿'}
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {!currentDraftId ? (
            <div
              style={{
                padding: 16,
                textAlign: 'center',
                color: '#6A6A6A',
                fontSize: 13,
              }}
            >
              保存草稿后可创建版本
            </div>
          ) : draftVersions.length === 0 ? (
            <div
              style={{
                padding: 16,
                textAlign: 'center',
                color: '#6A6A6A',
                fontSize: 13,
              }}
            >
              暂无版本记录
              <div style={{ marginTop: 8, fontSize: 12 }}>
                点击顶部"+版本"按钮创建快照
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 3,
                  top: 10,
                  bottom: 10,
                  width: 1,
                  background: '#3A3A3C',
                }}
              />

              {draftVersions.map((version, index) => {
                const isLatest = version.id === latestVersionId;
                return (
                  <div
                    key={version.id}
                    onClick={() => setCompareVersion(version)}
                    style={{
                      position: 'relative',
                      paddingLeft: 24,
                      paddingBottom: index === draftVersions.length - 1 ? 0 : 20,
                      cursor: 'pointer',
                      opacity: 0,
                      animation: `slideIn 0.2s ease-in-out ${index * 0.05}s forwards`,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 5,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: isLatest ? '#007ACC' : '#6A6A6A',
                        border: isLatest ? '2px solid #007ACC' : '2px solid #1E1E2E',
                        transition: 'all 0.15s ease',
                        boxShadow: isLatest ? '0 0 8px rgba(0,122,204,0.5)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isLatest) {
                          (e.currentTarget as HTMLDivElement).style.background = '#007ACC';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLatest) {
                          (e.currentTarget as HTMLDivElement).style.background = '#6A6A6A';
                        }
                      }}
                    />
                    <div
                      style={{
                        fontSize: 11,
                        color: isLatest ? '#007ACC' : '#6A6A6A',
                        marginBottom: 2,
                        fontWeight: isLatest ? 600 : 400,
                      }}
                    >
                      {isLatest ? '当前版本' : `V${index + 1}`}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#D4D4D4',
                        fontFamily: '"Fira Code", monospace',
                      }}
                    >
                      {formatVersionTime(version.timestamp)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          onMouseDown={startResize}
          style={{
            position: 'absolute',
            top: 0,
            left: -2,
            width: 6,
            height: '100%',
            cursor: 'col-resize',
            zIndex: 100,
          }}
        />
      </div>

      {compareVersion && (
        <DiffViewer
          oldCode={compareVersion.code}
          newCode={code}
          onClose={() => setCompareVersion(null)}
        />
      )}
    </>
  );
};

export default VersionPanel;
