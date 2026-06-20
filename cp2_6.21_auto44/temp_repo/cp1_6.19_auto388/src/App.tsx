import React, { useEffect, useState } from 'react';
import { useFlowerStore } from './store';
import FlowerCard from './components/FlowerCard';
import FlowerModal from './components/FlowerModal';
import Workbench from './components/Workbench';
import SchemeList from './components/SchemeList';
import { generateCanvasPreview } from './utils/canvasPreview';

const App: React.FC = () => {
  const {
    flowers,
    selectedFlowers,
    packagingStyle,
    savedSchemes,
    fetchFlowers,
    fetchSchemes,
    saveScheme,
    calculateTotal,
    calculatePackagingFee,
  } = useFlowerStore();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [schemeName, setSchemeName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'flowers' | 'schemes'>('flowers');

  useEffect(() => {
    fetchFlowers();
    fetchSchemes();
  }, [fetchFlowers, fetchSchemes]);

  const handleGeneratePreview = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const url = generateCanvasPreview(selectedFlowers, packagingStyle);
      setPreviewUrl(url);
      setIsGenerating(false);
    }, 100);
  };

  const handleSaveScheme = async () => {
    if (!schemeName.trim()) {
      alert('请输入方案名称');
      return;
    }
    await saveScheme(schemeName.trim());
    setSchemeName('');
    setShowSaveDialog(false);
  };

  const grandTotal = calculateTotal() + calculatePackagingFee();

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '20px',
        paddingBottom: '60px',
      }}
    >
      <header
        style={{
          padding: '20px 24px',
          marginBottom: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '36px' }}>💐</div>
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#333',
                margin: 0,
              }}
            >
              花束搭配工坊
            </h1>
            <p style={{ fontSize: '13px', color: '#888', margin: '2px 0 0 0' }}>
              轻松设计你的专属花束
            </p>
          </div>
        </div>
        <div
          style={{
            fontSize: '13px',
            color: '#666',
            backgroundColor: 'rgba(255,255,255,0.5)',
            padding: '8px 14px',
            borderRadius: '20px',
          }}
        >
          已保存 <strong style={{ color: '#9C27B0' }}>{savedSchemes.length}</strong> 个方案
        </div>
      </header>

      <div className="main-container">
        <aside className="flower-library">
          <div className="mobile-tabs">
            <button
              className={`tab-btn ${activeTab === 'flowers' ? 'active' : ''}`}
              onClick={() => setActiveTab('flowers')}
            >
              🌸 花材库
            </button>
            <button
              className={`tab-btn ${activeTab === 'schemes' ? 'active' : ''}`}
              onClick={() => setActiveTab('schemes')}
            >
              📋 我的方案
            </button>
          </div>

          <div className={`tab-content ${activeTab === 'flowers' ? 'active' : ''}`}>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#333',
                marginBottom: '16px',
              }}
            >
              🌸 花材库
            </h2>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '14px',
                justifyContent: 'flex-start',
              }}
              className="flower-grid"
            >
              {flowers.map((flower) => (
                <FlowerCard key={flower.id} flower={flower} />
              ))}
            </div>
          </div>
        </aside>

        <main className="workbench-section">
          <Workbench />

          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={handleGeneratePreview}
              disabled={isGenerating || selectedFlowers.length === 0}
              className="action-button preview-btn"
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '16px 24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: selectedFlowers.length === 0 ? '#E0E0E0' : '#B5D8EB',
                color: selectedFlowers.length === 0 ? '#999' : '#333',
                fontSize: '16px',
                fontWeight: 600,
                cursor: selectedFlowers.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isGenerating ? '生成中...' : '🎨 生成预览图'}
            </button>

            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={selectedFlowers.length === 0}
              className="action-button save-btn"
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '16px 24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: selectedFlowers.length === 0 ? '#E0E0E0' : '#81C784',
                color: selectedFlowers.length === 0 ? '#999' : '#fff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: selectedFlowers.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              💾 保存方案
            </button>
          </div>

          {previewUrl && (
            <div
              style={{
                marginTop: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '12px',
                }}
              >
                🖼️ 高分辨率预览图
              </h3>
              <div
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                }}
              >
                <img
                  src={previewUrl}
                  alt="花束预览"
                  style={{
                    width: '100%',
                    display: 'block',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: '12px',
                  textAlign: 'right',
                }}
              >
                <a
                  href={previewUrl}
                  download={`花束预览_${new Date().toLocaleDateString('zh-CN')}.png`}
                  style={{
                    fontSize: '13px',
                    color: '#81C784',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  ⬇️ 下载预览图
                </a>
              </div>
            </div>
          )}

          <div className="desktop-schemes">
            <SchemeList />
          </div>
        </main>
      </div>

      {showSaveDialog && (
        <div
          className="save-modal-overlay"
          onClick={() => setShowSaveDialog(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#00000080',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '28px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#333',
                marginBottom: '20px',
              }}
            >
              保存方案
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  fontSize: '14px',
                  color: '#666',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                方案名称
              </label>
              <input
                type="text"
                value={schemeName}
                onChange={(e) => setSchemeName(e.target.value)}
                placeholder="例如：生日祝福花束"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '2px solid #E0E0E0',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease-out',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#81C784';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E0E0E0';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveScheme();
                }}
              />
            </div>

            <div
              style={{
                backgroundColor: '#F5F5F5',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '13px', color: '#888' }}>花材种类</span>
                <span style={{ fontSize: '13px', color: '#333' }}>
                  {selectedFlowers.length} 种
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '13px', color: '#888' }}>花材总数</span>
                <span style={{ fontSize: '13px', color: '#333' }}>
                  {selectedFlowers.reduce((sum, f) => sum + f.quantity, 0)} 枝
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px dashed #DDD',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                  总价
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#9C27B0' }}>
                  ¥{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSaveDialog(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid #E0E0E0',
                  backgroundColor: '#fff',
                  color: '#666',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-out',
                  fontFamily: 'inherit',
                }}
                className="cancel-btn"
              >
                取消
              </button>
              <button
                onClick={handleSaveScheme}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#81C784',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-out',
                  fontFamily: 'inherit',
                }}
                className="confirm-btn"
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      <FlowerModal />

      <style>{`
        .main-container {
          display: flex;
          gap: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .flower-library {
          flex-shrink: 0;
          width: 220px;
        }
        
        .workbench-section {
          flex: 1;
          min-width: 0;
        }
        
        .mobile-tabs {
          display: none;
        }
        
        .flower-grid {
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          padding-right: 8px;
          justify-content: center;
        }
        
        .desktop-schemes {
          display: block;
        }
        
        .action-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
        }
        
        .action-button:active:not(:disabled) {
          transform: scale(0.97);
        }
        
        .preview-btn:hover:not(:disabled) {
          background-color: #81D4FA !important;
        }
        
        .save-btn:hover:not(:disabled) {
          background-color: #66BB6A !important;
        }
        
        .save-modal-overlay {
          animation: fadeIn 0.25s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .cancel-btn:hover {
          border-color: #BDBDBD !important;
          background-color: #FAFAFA !important;
        }
        
        .cancel-btn:active {
          transform: scale(0.95);
        }
        
        .confirm-btn:hover {
          background-color: #66BB6A !important;
        }
        
        .confirm-btn:active {
          transform: scale(0.95);
        }
        
        @media (max-width: 1000px) {
          .main-container {
            flex-direction: column;
          }
          
          .flower-library {
            width: 100%;
          }
          
          .flower-grid {
            max-height: none;
            overflow-y: visible;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 8px;
          }
          
          .mobile-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
          }
          
          .tab-btn {
            flex: 1;
            padding: 12px 16px;
            border: none;
            borderRadius: 10px;
            backgroundColor: rgba(255, 255, 255, 0.5);
            color: #666;
            fontSize: 14px;
            fontWeight: 600;
            cursor: pointer;
            transition: all 0.2s ease-out;
            font-family: inherit;
          }
          
          .tab-btn.active {
            background-color: #fff;
            color: #333;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          
          .tab-content {
            display: none;
          }
          
          .tab-content.active {
            display: block;
          }
          
          .desktop-schemes {
            display: none;
          }
        }
        
        @media (max-width: 768px) {
          body {
            padding: 12px;
          }
          
          header {
            padding: 16px;
            margin-bottom: 16px;
          }
          
          h1 {
            font-size: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
