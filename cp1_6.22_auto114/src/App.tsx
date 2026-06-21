import React, { useState, useCallback, useEffect } from 'react';
import { ImageData, ColorData, sampleImages } from './data/sampleImages';
import { analyzeColors, getAverageColor, getAllImagesWithAnalysis } from './utils/colorAnalysis';
import ThumbnailBar from './components/ThumbnailBar';
import AnalysisPanel from './components/AnalysisPanel';
import ComparisonPanel from './components/ComparisonPanel';

type ViewMode = 'analysis' | 'comparison';

const MAX_IMAGES = 6;

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, active, onClick, disabled }) => {
  const [pressed, setPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={() => {
          if (disabled) return;
          setPressed(true);
          setTimeout(() => setPressed(false), 150);
          onClick();
        }}
        disabled={disabled}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
          color: active ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          transform: pressed ? 'scale(0.95)' : showTooltip && !disabled ? 'scale(1.05)' : 'scale(1)',
          opacity: disabled ? 0.5 : 1,
          backdropFilter: active ? 'blur(8px)' : 'none'
        }}
        aria-label={label}
      >
        {icon}
      </button>
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            left: 'calc(100% + 12px)',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.85)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            zIndex: 100,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          {label}
          <div
            style={{
              position: 'absolute',
              left: '-5px',
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              width: '10px',
              height: '10px',
              background: 'rgba(0,0,0,0.85)'
            }}
          />
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('analysis');
  const [analyzedColors, setAnalyzedColors] = useState<ColorData[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [comparisonImages, setComparisonImages] = useState<ImageData[]>([]);
  const [imageKey, setImageKey] = useState(0);
  const [sampleIndex, setSampleIndex] = useState(0);

  const selectedImage = images.find((img) => img.id === selectedId) || null;
  const averageColor = selectedImage ? getAverageColor(selectedImage.id) : '#808080';

  useEffect(() => {
    if (selectedImage) {
      setAnalyzedColors(null);
      setImageKey((k) => k + 1);
    }
  }, [selectedId, selectedImage]);

  const handleUpload = useCallback(() => {
    if (images.length >= MAX_IMAGES) return;

    const availableSamples = sampleImages.filter(
      (sample) => !images.some((img) => img.title === sample.title)
    );

    let newImage: ImageData;
    if (availableSamples.length > 0) {
      newImage = { ...availableSamples[0], id: `${availableSamples[0].id}-${Date.now()}` };
    } else {
      const fallback = sampleImages[sampleIndex % sampleImages.length];
      newImage = { ...fallback, id: `${fallback.id}-${Date.now()}-${sampleIndex}` };
      setSampleIndex((i) => i + 1);
    }

    setImages((prev) => {
      const next = [...prev, newImage];
      if (!selectedId) {
        setSelectedId(newImage.id);
      }
      return next;
    });
  }, [images.length, selectedId, sampleIndex]);

  const handleDelete = useCallback(
    (id: string) => {
      setImages((prev) => {
        const next = prev.filter((img) => img.id !== id);
        if (selectedId === id) {
          setSelectedId(next.length > 0 ? next[0].id : null);
        }
        return next;
      });
      setComparisonImages((prev) => prev.filter((img) => img.id !== id));
      if (selectedId === id) {
        setAnalyzedColors(null);
      }
    },
    [selectedId]
  );

  const handleAnalyze = useCallback(() => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setViewMode('analysis');

    setTimeout(() => {
      const colors = analyzeColors(selectedImage.id);
      setAnalyzedColors(colors);
      setIsAnalyzing(false);
    }, 300);
  }, [selectedImage]);

  const handleCompare = useCallback(() => {
    if (images.length === 0) return;
    setViewMode('comparison');
    const analyzed = getAllImagesWithAnalysis(images);
    setComparisonImages(analyzed);
  }, [images]);

  const renderSidebarNav = () => (
    <nav
      className="sidebar-nav"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '60px',
        background: 'linear-gradient(180deg, #4A90D9 0%, #357ABD 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        gap: '16px',
        zIndex: 1000,
        boxShadow: '2px 0 8px rgba(74, 144, 217, 0.15)'
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '8px',
          color: 'white',
          fontSize: '20px'
        }}
      >
        🎨
      </div>

      <NavButton
        label="上传图片"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        }
        onClick={handleUpload}
        disabled={images.length >= MAX_IMAGES}
      />

      <NavButton
        label="分析主色调"
        active={viewMode === 'analysis'}
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
        }
        onClick={handleAnalyze}
        disabled={!selectedImage}
      />

      <NavButton
        label="对比所有图片"
        active={viewMode === 'comparison'}
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        }
        onClick={handleCompare}
        disabled={images.length === 0}
      />

      <div style={{ flex: 1 }} />

      <div
        style={{
          padding: '8px 4px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '10px',
          lineHeight: 1.4
        }}
      >
        v1.0
      </div>
    </nav>
  );

  const renderTopNav = () => (
    <nav
      className="top-nav"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: 0,
        height: '50px',
        background: 'linear-gradient(90deg, #4A90D9 0%, #357ABD 100%)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '8px',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(74, 144, 217, 0.15)'
      }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '8px',
          color: 'white',
          fontSize: '16px'
        }}
      >
        🎨
      </div>

      <button
        onClick={handleUpload}
        disabled={images.length >= MAX_IMAGES}
        style={{
          padding: '7px 12px',
          borderRadius: '8px',
          border: 'none',
          cursor: images.length >= MAX_IMAGES ? 'not-allowed' : 'pointer',
          background: 'rgba(255,255,255,0.15)',
          color: 'white',
          fontSize: '13px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.15s ease',
          opacity: images.length >= MAX_IMAGES ? 0.5 : 1
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        上传
      </button>

      <button
        onClick={handleAnalyze}
        disabled={!selectedImage}
        style={{
          padding: '7px 12px',
          borderRadius: '8px',
          border: 'none',
          cursor: !selectedImage ? 'not-allowed' : 'pointer',
          background: viewMode === 'analysis' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
          color: 'white',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'all 0.15s ease',
          opacity: !selectedImage ? 0.5 : 1
        }}
      >
        分析
      </button>

      <button
        onClick={handleCompare}
        disabled={images.length === 0}
        style={{
          padding: '7px 12px',
          borderRadius: '8px',
          border: 'none',
          cursor: images.length === 0 ? 'not-allowed' : 'pointer',
          background: viewMode === 'comparison' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
          color: 'white',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'all 0.15s ease',
          opacity: images.length === 0 ? 0.5 : 1
        }}
      >
        对比
      </button>
    </nav>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAFAFA'
      }}
    >
      {renderSidebarNav()}
      {renderTopNav()}

      <div
        className="main-wrapper"
        style={{
          marginLeft: '60px',
          paddingTop: 0
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}
        >
          <ThumbnailBar
            images={images}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={handleDelete}
            onUpload={handleUpload}
            maxImages={MAX_IMAGES}
          />
        </div>

        <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          {selectedImage ? (
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  marginBottom: '20px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#333',
                        marginBottom: '4px'
                      }}
                    >
                      {selectedImage.title}
                    </h2>
                    <div style={{ fontSize: '13px', color: '#888' }}>
                      点击缩略图切换图片 · 当前共 {images.length} 张
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className={isAnalyzing ? 'button-press' : undefined}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: isAnalyzing ? 'wait' : 'pointer',
                        background: isAnalyzing
                          ? 'linear-gradient(135deg, #7AA7E0, #5A88C8)'
                          : 'linear-gradient(135deg, #4A90D9, #357ABD)',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(74, 144, 217, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isAnalyzing) {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(74, 144, 217, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(74, 144, 217, 0.3)';
                      }}
                    >
                      {isAnalyzing ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                          分析中...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                          </svg>
                          分析主色调
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCompare}
                      disabled={images.length < 1}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1.5px solid #DDE',
                        cursor: images.length < 1 ? 'not-allowed' : 'pointer',
                        background: viewMode === 'comparison' ? '#F0F7FF' : '#FFFFFF',
                        color: '#4A90D9',
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        opacity: images.length < 1 ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (images.length >= 1) {
                          (e.currentTarget as HTMLButtonElement).style.background = '#E8F2FC';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#4A90D9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = viewMode === 'comparison' ? '#F0F7FF' : '#FFFFFF';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#DDE';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                      对比当前所有已上传图片
                    </button>
                  </div>
                </div>

                <div
                  key={imageKey}
                  className="image-fade"
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    background: '#F8F9FA',
                    borderRadius: '10px',
                    padding: '16px',
                    marginBottom: '16px',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '500px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      display: 'block',
                      width: 'auto',
                      height: 'auto'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '12px',
                        background: averageColor,
                        border: '3px solid white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.08)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                      }}
                    />
                    <div style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>
                      图片平均色
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#333',
                        letterSpacing: '1px',
                        padding: '3px 10px',
                        background: '#F5F5F5',
                        borderRadius: '5px',
                        border: '1px solid #EEE'
                      }}
                    >
                      {averageColor.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '60px 32px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                textAlign: 'center',
                marginBottom: '24px'
              }}
            >
              <div style={{ fontSize: '72px', marginBottom: '16px', opacity: 0.5 }}>🖼️</div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
                欢迎使用照片色彩分析工具
              </h2>
              <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px', lineHeight: 1.7 }}>
                点击上方「上传图片」按钮或拖拽图片到顶部区域<br />
                最多支持上传 {MAX_IMAGES} 张图片进行批量色彩分析
              </p>
              <button
                onClick={handleUpload}
                style={{
                  padding: '12px 28px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #4A90D9, #357ABD)',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 14px rgba(74, 144, 217, 0.35)'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(74, 144, 217, 0.45)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(74, 144, 217, 0.35)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                开始上传图片
              </button>
            </div>
          )}

          {viewMode === 'analysis' ? (
            <AnalysisPanel
              colors={analyzedColors}
              averageColor={averageColor}
              imageTitle={selectedImage?.title || ''}
            />
          ) : (
            <ComparisonPanel images={comparisonImages} />
          )}

          <footer
            style={{
              marginTop: '32px',
              padding: '20px',
              textAlign: 'center',
              color: '#AAA',
              fontSize: '12px'
            }}
          >
            照片色彩分析工具 · 帮助摄影师快速对多张照片进行批量色彩分析
          </footer>
        </main>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .sidebar-nav {
            display: none !important;
          }

          .top-nav {
            display: flex !important;
          }

          .main-wrapper {
            margin-left: 0 !important;
            padding-top: 50px !important;
          }

          .main-wrapper img[style*="max-height: 500px"] {
            max-height: 300px !important;
          }

          main {
            padding: 16px !important;
          }

          [style*="grid-template-columns: 140px 1fr"] {
            grid-template-columns: 100px 1fr !important;
            gap: 10px !important;
          }
        }

        @media (min-width: 769px) {
          .top-nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
