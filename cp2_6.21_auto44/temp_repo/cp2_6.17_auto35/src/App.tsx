import React, { useEffect, useState } from 'react';
import { Image, Type, Save, Eye, X, Play, ArrowRight } from 'lucide-react';
import { useExhibitionStore, Artifact as ArtifactType } from './store/useExhibitionStore';
import { CanvasRenderer } from './components/CanvasRenderer';
import { sampleArtifacts } from './data/sampleArtifacts';

const App: React.FC = () => {
  const {
    showArtifactModal,
    setShowArtifactModal,
    addArtifact,
    addCard,
    saveToStorage,
    loadFromStorage,
    setPreviewMode,
    isPreviewMode,
    contextMenu,
    setContextMenu,
    setNarrativeStart,
    setConnectingMode,
    isConnectingMode,
    connectingFromId,
    connectingFromType,
    artifacts,
    cards,
    selectedArtifactId,
    setSelectedArtifact,
    isBindingMode,
  } = useExhibitionStore();

  const [previewArtifact, setPreviewArtifact] = useState<ArtifactType | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false });
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu.visible, setContextMenu]);

  const handleAddArtifact = () => {
    setShowArtifactModal(true);
  };

  const handleSelectArtifact = (artifactData: typeof sampleArtifacts[0]) => {
    addArtifact({
      name: artifactData.name,
      description: artifactData.description,
      imageUrl: artifactData.imageUrl,
    });
    setShowArtifactModal(false);
  };

  const handleAddCard = () => {
    addCard();
  };

  const handleSave = async () => {
    try {
      await saveToStorage();
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2000);
    } catch (e) {
      console.error('保存失败:', e);
    }
  };

  const handlePreview = () => {
    setPreviewMode(true);
    setSelectedArtifact(null);
    setContextMenu({ visible: false });
    setConnectingMode(false);
  };

  const handleExitPreview = () => {
    setPreviewMode(false);
    setSelectedArtifact(null);
    setPreviewArtifact(null);
  };

  const handleSetNarrativeStart = () => {
    if (contextMenu.entityId) {
      setNarrativeStart(contextMenu.entityId);
    }
    setContextMenu({ visible: false });
  };

  const handleStartConnection = () => {
    if (contextMenu.entityId && contextMenu.entityType) {
      setConnectingMode(true, contextMenu.entityId, contextMenu.entityType);
    }
    setContextMenu({ visible: false });
  };

  const handleContextMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const getContextMenuEntityName = () => {
    if (contextMenu.entityType === 'artifact') {
      const artifact = artifacts.find(a => a.id === contextMenu.entityId);
      return artifact?.name || '';
    } else {
      const card = cards.find(c => c.id === contextMenu.entityId);
      return card?.title || '';
    }
  };

  const selectedArtifactForPreview = artifacts.find(a => a.id === selectedArtifactId);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* 工具栏 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: '#2C3E50',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', marginRight: '40px' }}>
          ExhibitCraft
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleAddArtifact}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Image size={18} />
            <span>添加文物</span>
          </button>

          <button
            onClick={handleAddCard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Type size={18} />
            <span>添加文字卡片</span>
          </button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
          >
            <Save size={16} />
            <span>保存</span>
          </button>

          <button
            onClick={handlePreview}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              backgroundColor: '#C4A882',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#A88B6A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#C4A882'; }}
          >
            <Eye size={16} />
            <span>预览</span>
          </button>
        </div>
      </div>

      {/* 画布 */}
      <CanvasRenderer />

      {/* 文物选择模态框 */}
      {showArtifactModal && (
        <div
          className="fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowArtifactModal(false);
            }
          }}
        >
          <div
            style={{
              width: 480,
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#2C3E50', margin: 0 }}>
                选择文物
              </h2>
              <button
                onClick={() => setShowArtifactModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F0EBE2',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E5DFD3'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F0EBE2'; }}
              >
                <X size={18} color="#5D6D7E" />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
              }}
            >
              {sampleArtifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  onClick={() => handleSelectArtifact(artifact)}
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: '8px',
                      border: '1px solid #E0D8CC',
                      overflow: 'hidden',
                      marginBottom: '8px',
                    }}
                  >
                    <img
                      src={artifact.imageUrl}
                      alt={artifact.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      draggable={false}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#2C3E50',
                      fontWeight: 500,
                      textAlign: 'center',
                    }}
                  >
                    {artifact.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu.visible && !isPreviewMode && (
        <div
          onClick={handleContextMenuClick}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            width: 160,
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            padding: '4px',
            zIndex: 3000,
          }}
        >
          <button
            onClick={handleSetNarrativeStart}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#2C3E50',
              textAlign: 'left',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9F6F0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Play size={14} />
            <span>设为叙事起点</span>
          </button>

          <button
            onClick={handleStartConnection}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#2C3E50',
              textAlign: 'left',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9F6F0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <ArrowRight size={14} />
            <span>连接到</span>
          </button>
        </div>
      )}

      {/* 预览模式 */}
      {isPreviewMode && (
        <div
          className="fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#F9F6F0',
            zIndex: 9999,
            overflow: 'auto',
          }}
        >
          <div
            style={{
              position: 'fixed',
              top: 20,
              right: 20,
              zIndex: 10000,
            }}
          >
            <button
              onClick={handleExitPreview}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2C3E50',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#34495E'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2C3E50'; }}
            >
              <X size={16} />
              退出预览
            </button>
          </div>

          <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
            <CanvasRenderer />
          </div>

          {/* 文物放大预览 */}
          {selectedArtifactForPreview && (
            <div
              className="fade-in"
              onClick={() => setSelectedArtifact(null)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(44, 62, 80, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  transition: 'all 0.4s ease',
                  marginBottom: '24px',
                }}
              >
                <img
                  src={selectedArtifactForPreview.imageUrl}
                  alt={selectedArtifactForPreview.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  draggable={false}
                />
              </div>
              <h2
                style={{
                  color: '#FFFFFF',
                  fontSize: '24px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  transition: 'all 0.4s ease',
                }}
              >
                {selectedArtifactForPreview.name}
              </h2>
              <p
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '14px',
                  lineHeight: 1.8,
                  maxWidth: '400px',
                  textAlign: 'center',
                  transition: 'all 0.4s ease',
                }}
              >
                {selectedArtifactForPreview.description}
              </p>
              <p
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '12px',
                  marginTop: '24px',
                }}
              >
                点击任意处关闭
              </p>
            </div>
          )}
        </div>
      )}

      {/* 保存提示 */}
      {showSaveToast && (
        <div
          className="fade-in"
          style={{
            position: 'fixed',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            backgroundColor: '#27AE60',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
          }}
        >
          保存成功
        </div>
      )}

      {/* 模式提示 */}
      {(isConnectingMode || isBindingMode) && !isPreviewMode && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            backgroundColor: '#2C3E50',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontSize: '13px',
            zIndex: 999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {isConnectingMode ? '点击目标元素建立连接，或点击空白处取消' : '点击文物建立绑定关系，或点击空白处取消'}
        </div>
      )}
    </div>
  );
};

export default App;
