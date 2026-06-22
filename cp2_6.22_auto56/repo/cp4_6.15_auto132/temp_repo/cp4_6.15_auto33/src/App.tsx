import { useState, useCallback, useEffect } from 'react';
import TemplatePanel from '@/components/TemplatePanel';
import CanvasArea from '@/components/CanvasArea';
import ToolBar from '@/components/ToolBar';
import { exportMemeImage, downloadImage, generateShortLink, copyToClipboard } from '@/utils/exportImage';
import type { TextStyle, Sticker, MemeTemplate, PanelType } from '@/types';
import { generateId } from '@/types';

const initialTextStyle: TextStyle = {
  text: '',
  fontFamily: 'Impact, sans-serif',
  fontSize: 36,
  color: '#ffffff',
  strokeColor: '#000000',
  strokeWidth: 2,
  x: 0,
  y: 0,
};

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [topText, setTopText] = useState<TextStyle>({ ...initialTextStyle });
  const [bottomText, setBottomText] = useState<TextStyle>({ ...initialTextStyle });
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [selectedTextType, setSelectedTextType] = useState<'top' | 'bottom' | null>('top');
  const [activePanel, setActivePanel] = useState<PanelType>('templates');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [shortLink, setShortLink] = useState('');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [bottomSheetContent, setBottomSheetContent] = useState<PanelType>('templates');
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 360 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  const handleSelectTemplate = useCallback((template: MemeTemplate) => {
    setImage(template.imageUrl);
    setTopText(prev => ({ ...prev, text: '' }));
    setBottomText(prev => ({ ...prev, text: '' }));
    setStickers([]);
    if (isMobile) {
      setShowBottomSheet(false);
    }
  }, [isMobile]);

  const handleUploadImage = useCallback((file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        setUploadProgress(progress);
      }
    };

    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImage(result);
      setIsUploading(false);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 500);
      if (isMobile) {
        setShowBottomSheet(false);
      }
    };

    reader.onerror = () => {
      setIsUploading(false);
      setUploadProgress(0);
      showToastMessage('上传失败');
    };

    reader.readAsDataURL(file);
  }, [isMobile, showToastMessage]);

  const handleTopTextChange = useCallback((style: Partial<TextStyle>) => {
    setSelectedTextType('top');
    setTopText(prev => ({ ...prev, ...style }));
  }, []);

  const handleBottomTextChange = useCallback((style: Partial<TextStyle>) => {
    setSelectedTextType('bottom');
    setBottomText(prev => ({ ...prev, ...style }));
  }, []);

  const handleUpdateText = useCallback((type: 'top' | 'bottom', updates: Partial<TextStyle>) => {
    if (type === 'top') {
      setTopText(prev => ({ ...prev, ...updates }));
    } else {
      setBottomText(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const handleAddSticker = useCallback((type: 'emoji' | 'shape', content: string) => {
    const newSticker: Sticker = {
      id: generateId(),
      type,
      content,
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
      scale: 1,
      rotation: 0,
      zIndex: stickers.length,
    };
    setStickers(prev => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
  }, [canvasSize, stickers.length]);

  const handleUpdateSticker = useCallback((id: string, updates: Partial<Sticker>) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const handleDeleteSticker = useCallback((id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    setSelectedStickerId(null);
  }, []);

  const handleMoveStickerLayer = useCallback((id: string, direction: 'up' | 'down') => {
    setStickers(prev => {
      const index = prev.findIndex(s => s.id === id);
      if (index === -1) return prev;
      
      const newStickers = [...prev];
      const targetIndex = direction === 'up' ? index + 1 : index - 1;
      
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      
      [newStickers[index], newStickers[targetIndex]] = [newStickers[targetIndex], newStickers[index]];
      
      return newStickers.map((s, i) => ({ ...s, zIndex: i }));
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    try {
      const dataUrl = await exportMemeImage(
        image,
        topText,
        bottomText,
        stickers,
        canvasSize.width,
        canvasSize.height
      );
      
      downloadImage(dataUrl, `meme-${Date.now()}.png`);
      
      const link = generateShortLink();
      setShortLink(link);
      
      showToastMessage('表情包生成成功！');
    } catch (error) {
      showToastMessage('生成失败，请重试');
      console.error(error);
    }
  }, [image, topText, bottomText, stickers, canvasSize, showToastMessage]);

  const handleCopyLink = useCallback(async () => {
    if (!shortLink) return;
    const success = await copyToClipboard(shortLink);
    if (success) {
      showToastMessage('已复制到剪贴板');
    } else {
      showToastMessage('复制失败，请手动复制');
    }
  }, [shortLink, showToastMessage]);

  const openMobilePanel = (panel: PanelType) => {
    setBottomSheetContent(panel);
    setShowBottomSheet(true);
  };

  const selectedSticker = stickers.find(s => s.id === selectedStickerId) || null;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎨 Meme 表情包生成器</h1>
        <span className="hint">上传图片 → 添加文字 → 装饰贴纸 → 一键生成</span>
      </header>

      <div className="main-content">
        {!isMobile && (
          <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-tabs">
              <button
                className={`sidebar-tab ${activePanel === 'templates' ? 'active' : ''}`}
                onClick={() => setActivePanel('templates')}
              >
                模板
              </button>
              <button
                className={`sidebar-tab ${activePanel === 'text' ? 'active' : ''}`}
                onClick={() => setActivePanel('text')}
              >
                文字
              </button>
              <button
                className={`sidebar-tab ${activePanel === 'stickers' ? 'active' : ''}`}
                onClick={() => setActivePanel('stickers')}
              >
                贴纸
              </button>
            </div>
            <div className="sidebar-content">
              {activePanel === 'templates' && (
                <TemplatePanel
                  onSelectTemplate={handleSelectTemplate}
                  onUploadImage={handleUploadImage}
                  uploadProgress={uploadProgress}
                  isUploading={isUploading}
                />
              )}
              {(activePanel === 'text' || activePanel === 'stickers') && (
                <ToolBar
                  topText={topText}
                  bottomText={bottomText}
                  selectedTextType={selectedTextType}
                  onTopTextChange={handleTopTextChange}
                  onBottomTextChange={handleBottomTextChange}
                  onAddSticker={handleAddSticker}
                  selectedSticker={selectedSticker}
                  onUpdateSticker={handleUpdateSticker}
                  onDeleteSticker={handleDeleteSticker}
                  onMoveStickerLayer={handleMoveStickerLayer}
                  stickers={stickers}
                />
              )}

              <div style={{ marginTop: '24px' }}>
                <button className="generate-btn" onClick={handleGenerate}>
                  ✨ 生成表情包
                </button>
                
                {shortLink && (
                  <div className="share-link-container animate-slide-up">
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      分享链接
                    </div>
                    <div className="share-link">
                      <input type="text" value={shortLink} readOnly />
                      <button className="copy-btn" onClick={handleCopyLink}>
                        复制
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {!isMobile && (
          <button
            className="toggle-sidebar-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ left: sidebarCollapsed ? 0 : 'var(--sidebar-width)' }}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        )}

        <CanvasArea
          image={image}
          topText={topText}
          bottomText={bottomText}
          stickers={stickers}
          selectedStickerId={selectedStickerId}
          selectedTextType={selectedTextType}
          onSelectSticker={setSelectedStickerId}
          onSelectText={setSelectedTextType}
          onUpdateSticker={handleUpdateSticker}
          onUpdateText={handleUpdateText}
          canvasSize={canvasSize}
          onCanvasSizeChange={setCanvasSize}
        />

        {isMobile && (
          <>
            <div className="mobile-toolbar">
              <div className="mobile-toolbar-buttons">
                <button className="mobile-toolbar-btn" onClick={() => openMobilePanel('templates')}>
                  🖼️ 模板
                </button>
                <button className="mobile-toolbar-btn" onClick={() => openMobilePanel('text')}>
                  ✏️ 文字
                </button>
                <button className="mobile-toolbar-btn" onClick={() => openMobilePanel('stickers')}>
                  😀 贴纸
                </button>
                <button 
                  className="mobile-toolbar-btn" 
                  style={{ background: 'var(--color-accent)', color: '#1a1a2e', fontWeight: 600 }}
                  onClick={handleGenerate}
                >
                  ✨ 生成
                </button>
              </div>
              {shortLink && (
                <div className="share-link-container animate-slide-up" style={{ marginTop: '12px' }}>
                  <div className="share-link">
                    <input type="text" value={shortLink} readOnly />
                    <button className="copy-btn" onClick={handleCopyLink}>
                      复制
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div 
              className={`bottom-sheet-overlay ${showBottomSheet ? 'show' : ''}`}
              onClick={() => setShowBottomSheet(false)}
            />
            
            <div className={`bottom-sheet ${showBottomSheet ? 'show' : ''}`}>
              <div className="bottom-sheet-handle" />
              {bottomSheetContent === 'templates' && (
                <TemplatePanel
                  onSelectTemplate={handleSelectTemplate}
                  onUploadImage={handleUploadImage}
                  uploadProgress={uploadProgress}
                  isUploading={isUploading}
                />
              )}
              {(bottomSheetContent === 'text' || bottomSheetContent === 'stickers') && (
                <ToolBar
                  topText={topText}
                  bottomText={bottomText}
                  selectedTextType={selectedTextType}
                  onTopTextChange={handleTopTextChange}
                  onBottomTextChange={handleBottomTextChange}
                  onAddSticker={handleAddSticker}
                  selectedSticker={selectedSticker}
                  onUpdateSticker={handleUpdateSticker}
                  onDeleteSticker={handleDeleteSticker}
                  onMoveStickerLayer={handleMoveStickerLayer}
                  stickers={stickers}
                />
              )}
            </div>
          </>
        )}
      </div>

      <div className={`toast ${showToast ? 'show' : ''}`}>
        ✅ {toastMessage}
      </div>
    </div>
  );
}
