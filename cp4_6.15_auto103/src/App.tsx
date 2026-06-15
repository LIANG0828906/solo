import React, { useState, useRef, useCallback, useEffect } from 'react';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  type: 'vector' | 'image' | 'text';
  color?: string;
}

interface UploadedImage {
  id: string;
  name: string;
  url: string;
  size: number;
}

const App: React.FC = () => {
  const [leftWidth, setLeftWidth] = useState<number>(280);
  const [rightWidth, setRightWidth] = useState<number>(260);
  const [isResizingLeft, setIsResizingLeft] = useState<boolean>(false);
  const [isResizingRight, setIsResizingRight] = useState<boolean>(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [layers, setLayers] = useState<Layer[]>([
    { id: '1', name: '背景层', visible: true, locked: false, opacity: 100, type: 'vector', color: '#7BC67E' },
    { id: '2', name: '主图形', visible: true, locked: false, opacity: 100, type: 'vector', color: '#5DA860' },
    { id: '3', name: '细节装饰', visible: true, locked: true, opacity: 80, type: 'vector', color: '#A8D8AA' },
    { id: '4', name: '文字标注', visible: false, locked: false, opacity: 100, type: 'text', color: '#2D3436' },
  ]);

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>('2');

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    if (isResizingLeft) {
      const newWidth = e.clientX - containerRect.left;
      const minWidth = 200;
      const maxWidth = containerRect.width * 0.4;
      setLeftWidth(Math.max(minWidth, Math.min(newWidth, maxWidth)));
    }
    
    if (isResizingRight) {
      const newWidth = containerRect.right - e.clientX;
      const minWidth = 200;
      const maxWidth = containerRect.width * 0.35;
      setRightWidth(Math.max(minWidth, Math.min(newWidth, maxWidth)));
    }
  }, [isResizingLeft, isResizingRight]);

  const handleMouseUp = useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
  }, []);

  useEffect(() => {
    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizingLeft, isResizingRight, handleMouseMove, handleMouseUp]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = Array.from(files).map((file, index) => ({
      id: `img-${Date.now()}-${index}`,
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
    if (newImages.length > 0) {
      setSelectedImage(newImages[0].id);
    }
  };

  const handleProcess = () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      const demoSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
          <rect x="50" y="50" width="300" height="200" fill="none" stroke="#7BC67E" stroke-width="3" stroke-dasharray="5,5" rx="10"/>
          <circle cx="150" cy="130" r="40" fill="none" stroke="#5DA860" stroke-width="2.5"/>
          <path d="M220 90 Q280 90 280 150 Q280 210 220 210" fill="none" stroke="#7BC67E" stroke-width="2.5"/>
          <line x1="80" y1="200" x2="320" y2="200" stroke="#A8D8AA" stroke-width="2" stroke-linecap="round"/>
          <text x="200" y="260" text-anchor="middle" fill="#636E72" font-size="14" font-family="cursive">矢量化预览</text>
        </svg>
      `;
      setSvgContent(demoSvg);
      setIsProcessing(false);
    }, 2000);
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const toggleLayerLock = (id: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, locked: !layer.locked } : layer
    ));
  };

  const addLayer = () => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `图层 ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 100,
      type: 'vector',
      color: '#7BC67E',
    };
    setLayers(prev => [newLayer, ...prev]);
    setSelectedLayerId(newLayer.id);
  };

  const deleteLayer = (id: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <style>{`
        .nav-item {
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        .nav-item:hover {
          background: rgba(123, 198, 126, 0.15);
        }
        .layer-item {
          transition: all 0.2s ease;
        }
        .layer-item:hover {
          background: rgba(123, 198, 126, 0.08);
        }
        .layer-item.selected {
          background: rgba(123, 198, 126, 0.2);
          border-left: 3px solid var(--color-primary);
        }
        .upload-zone {
          border: 2px dashed var(--color-primary-light);
          transition: all 0.3s ease;
        }
        .upload-zone:hover {
          border-color: var(--color-primary);
          background: rgba(123, 198, 126, 0.05);
        }
        .upload-zone.dragover {
          border-color: var(--color-primary);
          background: rgba(123, 198, 126, 0.1);
        }
        .image-thumb {
          transition: all 0.2s ease;
        }
        .image-thumb:hover {
          transform: scale(1.02);
        }
        .image-thumb.selected {
          box-shadow: 0 0 0 3px var(--color-primary);
        }
      `}</style>

      {/* 顶部导航栏 */}
      <nav
        className="glass"
        style={{
          height: 'var(--navbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid rgba(123, 198, 126, 0.2)',
          animation: 'fadeIn 0.5s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px',
              fontFamily: 'var(--font-handwriting)',
            }}
          >
            S
          </div>
          <span
            className="handwriting"
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--color-text)',
            }}
          >
            草图矢量化
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="nav-item">文件</div>
          <div className="nav-item">编辑</div>
          <div className="nav-item">视图</div>
          <div className="nav-item">工具</div>
          <div className="nav-item">帮助</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn-ripple"
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--color-primary)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(123, 198, 126, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-primary-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-primary)';
            }}
          >
            导出 SVG
          </button>
        </div>
      </nav>

      {/* 主内容区 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* 左侧上传预览区 */}
        <aside
          className="animate-slide-left"
          style={{
            width: `${leftWidth}px`,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-white)',
            borderRight: '1px solid var(--color-warm-gray-dark)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--color-warm-gray-dark)',
            }}
          >
            <h3
              className="handwriting"
              style={{
                fontSize: '16px',
                color: 'var(--color-text)',
                marginBottom: '12px',
              }}
            >
              上传图片
            </h3>
            
            <div
              className="upload-zone"
              style={{
                padding: '24px 16px',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--color-warm-gray)',
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('dragover');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('dragover');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  const newImages: UploadedImage[] = Array.from(files).map((file, index) => ({
                    id: `img-${Date.now()}-${index}`,
                    name: file.name,
                    url: URL.createObjectURL(file),
                    size: file.size,
                  }));
                  setUploadedImages(prev => [...prev, ...newImages]);
                }
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                  marginBottom: '8px',
                }}
              >
                📤
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                点击或拖拽上传
              </p>
              <p style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
                支持 PNG、JPG、JPEG
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
            }}
          >
            {uploadedImages.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 16px',
                  color: 'var(--color-text-light)',
                  fontSize: '13px',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>
                  🖼️
                </div>
                暂无上传图片
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {uploadedImages.map((image, index) => (
                  <div
                    key={image.id}
                    className={`image-thumb ${selectedImage === image.id ? 'selected' : ''}`}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'var(--color-warm-gray)',
                      cursor: 'pointer',
                      border: selectedImage === image.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                      animation: `flyIn 0.3s ease ${index * 0.05}s both`,
                    }}
                    onClick={() => setSelectedImage(image.id)}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '80px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        marginBottom: '6px',
                        background: 'white',
                      }}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {image.name}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-light)',
                      }}
                    >
                      {formatFileSize(image.size)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--color-warm-gray-dark)',
            }}
          >
            <button
              className="btn-ripple"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: selectedImage ? 'var(--color-primary)' : 'var(--color-warm-gray-dark)',
                color: selectedImage ? 'white' : 'var(--color-text-light)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: selectedImage ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
              }}
              onClick={handleProcess}
              disabled={!selectedImage || isProcessing}
            >
              {isProcessing ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="animate-spin" style={{ fontSize: '16px' }}>⚙️</span>
                  矢量化中...
                </span>
              ) : (
                '开始矢量化'
              )}
            </button>
          </div>

          {/* 左侧拖拽调整手柄 */}
          <div
            className="resize-handle resize-handle-horizontal"
            style={{
              right: '-2px',
              top: 0,
            }}
            onMouseDown={() => setIsResizingLeft(true)}
          />
        </aside>

        {/* 中间SVG画布 */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* 工具栏 */}
          <div
            className="glass-dark"
            style={{
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid rgba(123, 198, 126, 0.1)',
            }}
          >
            <div style={{ display: 'flex', gap: '4px' }}>
              {['🖱️', '✏️', '🔍', '🖌️', '🧹'].map((icon, i) => (
                <button
                  key={i}
                  className="btn-ripple"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: 'none',
                    background: i === 0 ? 'var(--color-primary)' : 'transparent',
                    color: i === 0 ? 'white' : 'var(--color-text)',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
            
            <div style={{ width: '1px', height: '24px', background: 'var(--color-warm-gray-dark)' }} />
            
            <div style={{ display: 'flex', gap: '4px' }}>
              {['撤销', '重做'].map((label, i) => (
                <button
                  key={label}
                  className="btn-ripple"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-text-light)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn-ripple"
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-warm-gray-dark)',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ➖
              </button>
              <span style={{ fontSize: '13px', color: 'var(--color-text)', minWidth: '50px', textAlign: 'center' }}>
                100%
              </span>
              <button
                className="btn-ripple"
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-warm-gray-dark)',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ➕
              </button>
            </div>
          </div>

          {/* SVG画布区域 */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              position: 'relative',
            }}
          >
            {isProcessing ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  className="animate-spin"
                  style={{
                    width: '48px',
                    height: '48px',
                    border: '3px solid var(--color-primary-light)',
                    borderTopColor: 'var(--color-primary)',
                    borderRadius: '50%',
                  }}
                />
                <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
                  正在智能矢量化...
                </p>
              </div>
            ) : svgContent ? (
              <div
                className="animate-elastic"
                style={{
                  width: '600px',
                  height: '450px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : selectedImage ? (
              <div
                className="animate-fly-in"
                style={{
                  maxWidth: '80%',
                  maxHeight: '80%',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={uploadedImages.find(img => img.id === selectedImage)?.url}
                  alt="预览"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--color-text-light)',
                }}
              >
                <div
                  style={{
                    fontSize: '64px',
                    marginBottom: '16px',
                    opacity: 0.3,
                  }}
                >
                  🎨
                </div>
                <p className="handwriting" style={{ fontSize: '18px', marginBottom: '8px' }}>
                  开始创作吧
                </p>
                <p style={{ fontSize: '13px' }}>
                  上传一张手绘图，将其转换为矢量图形
                </p>
              </div>
            )}
          </div>
        </main>

        {/* 右侧图层面板 */}
        <aside
          className="animate-slide-right"
          style={{
            width: `${rightWidth}px`,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-white)',
            borderLeft: '1px solid var(--color-warm-gray-dark)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--color-warm-gray-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3
              className="handwriting"
              style={{
                fontSize: '16px',
                color: 'var(--color-text)',
              }}
            >
              图层
            </h3>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className="btn-ripple"
                onClick={addLayer}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: 'white',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* 图层列表 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {layers.map((layer, index) => (
              <div
                key={layer.id}
                className={`layer-item ${selectedLayerId === layer.id ? 'selected' : ''}`}
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  animation: `slideInRight 0.3s ease ${index * 0.05}s both`,
                }}
                onClick={() => setSelectedLayerId(layer.id)}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    background: layer.color || 'var(--color-primary)',
                    flexShrink: 0,
                  }}
                />
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    opacity: layer.visible ? 1 : 0.4,
                    flexShrink: 0,
                  }}
                >
                  {layer.visible ? '👁️' : '👁️‍🗨️'}
                </button>

                <span
                  style={{
                    flex: 1,
                    fontSize: '13px',
                    color: layer.visible ? 'var(--color-text)' : 'var(--color-text-light)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {layer.name}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerLock(layer.id);
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    flexShrink: 0,
                  }}
                >
                  {layer.locked ? '🔒' : '🔓'}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(layer.id);
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    opacity: 0.6,
                    flexShrink: 0,
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          {/* 图层属性 */}
          {selectedLayerId && (
            <div
              style={{
                padding: '16px',
                borderTop: '1px solid var(--color-warm-gray-dark)',
                background: 'var(--color-warm-gray)',
              }}
            >
              <h4
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text)',
                  marginBottom: '12px',
                  fontWeight: 500,
                }}
              >
                图层属性
              </h4>
              
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-light)',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  不透明度
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layers.find(l => l.id === selectedLayerId)?.opacity || 100}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setLayers(prev => prev.map(layer =>
                      layer.id === selectedLayerId ? { ...layer, opacity: value } : layer
                    ));
                  }}
                  style={{
                    width: '100%',
                    accentColor: 'var(--color-primary)',
                  }}
                />
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: '11px',
                    color: 'var(--color-text-light)',
                    marginTop: '2px',
                  }}
                >
                  {layers.find(l => l.id === selectedLayerId)?.opacity}%
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-light)',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  混合模式
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-warm-gray-dark)',
                    background: 'white',
                    fontSize: '12px',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                  }}
                >
                  <option value="normal">正常</option>
                  <option value="multiply">正片叠底</option>
                  <option value="screen">滤色</option>
                  <option value="overlay">叠加</option>
                </select>
              </div>
            </div>
          )}

          {/* 右侧拖拽调整手柄 */}
          <div
            className="resize-handle resize-handle-horizontal"
            style={{
              left: '-2px',
              top: 0,
            }}
            onMouseDown={() => setIsResizingRight(true)}
          />
        </aside>
      </div>
    </div>
  );
};

export default App;
