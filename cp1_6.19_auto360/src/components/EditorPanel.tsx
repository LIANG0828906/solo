import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useContentStore } from '../store/useContentStore';

const themeOptions = [
  { id: 'light', name: '极简白', color: '#ffffff' },
  { id: 'warm', name: '暖黄复古', color: '#FFF8E7' },
  { id: 'dark', name: '暗夜森林', color: '#1a1a2e' },
];

const fontOptions = [
  { id: 'noto', name: 'Noto Sans SC' },
  { id: 'kuaile', name: 'ZCOOL KuaiLe' },
  { id: 'serif', name: 'Source Han Serif' },
];

export default function EditorPanel() {
  const { 
    rawText, 
    setRawText, 
    performSplit, 
    currentTheme, 
    setTheme,
    currentFont,
    setFont,
    cards
  } = useContentStore();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = useCallback(() => {
    if (!textareaRef.current || cards.length === 0) return;
    
    const textarea = textareaRef.current;
    const scrollTop = textarea.scrollTop;
    const scrollHeight = textarea.scrollHeight - textarea.clientHeight;
    const scrollPercent = scrollTop / scrollHeight;
    
    const cardIndex = Math.floor(scrollPercent * cards.length);
    const safeIndex = Math.max(0, Math.min(cardIndex, cards.length - 1));
    const cardId = cards[safeIndex]?.id || null;
    
    useContentStore.getState().setHighlightedCard(cardId);
    
    const previewContainer = document.querySelector('.preview-scroll-container');
    if (previewContainer && cardId) {
      const cardElement = document.getElementById(cardId);
      if (cardElement) {
        const containerRect = previewContainer.getBoundingClientRect();
        const cardRect = cardElement.getBoundingClientRect();
        const scrollLeft = cardElement.offsetLeft - containerRect.width / 2 + cardRect.width / 2;
        
        previewContainer.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      }
    }
  }, [cards]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const handler = () => {
      clearTimeout((handler as any)._timer);
      (handler as any)._timer = setTimeout(handleScroll, 100);
    };
    
    textarea.addEventListener('scroll', handler);
    return () => textarea.removeEventListener('scroll', handler);
  }, [handleScroll]);

  const handleSplit = () => {
    performSplit();
  };

  return (
    <motion.div 
      className="editor-panel"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="editor-header">
        <h2 className="editor-title">编辑内容</h2>
        <div className="header-controls">
          <div className="select-wrapper">
            <select 
              value={currentTheme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="theme-select"
            >
              {themeOptions.map(theme => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
          </div>
          <div className="select-wrapper">
            <select 
              value={currentFont}
              onChange={(e) => setFont(e.target.value as any)}
              className="font-select"
            >
              {fontOptions.map(font => (
                <option key={font.id} value={font.id}>{font.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="textarea-wrapper">
        <textarea
          ref={textareaRef}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="在此粘贴 Markdown 内容..."
          className="editor-textarea"
        />
      </div>
      
      <div className="editor-footer">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSplit}
          className="split-button"
        >
          <span className="button-icon">✨</span>
          自动拆分
        </motion.button>
        
        <div className="card-count">
          {cards.length > 0 && (
            <span>已生成 <strong>{cards.length}</strong> 张卡片</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
