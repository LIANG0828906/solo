import React, { useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Trash2, Copy, Type } from 'lucide-react';
import { useBoardStore } from '@/stores/useBoardStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { DraggableElement } from '@/components/DraggableElement';
import { getRandomColor } from '@/utils/colorGenerator';

export const InspirationBoard: React.FC = () => {
  const {
    elements,
    selectedElementId,
    currentFontPreset,
    isExporting,
    selectElement,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    removeElement,
    addElement,
    exportBoard,
  } = useBoardStore();

  const { screenWidth } = useLayoutStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      selectElement(null);
    }
  }, [selectElement]);

  const handleExport = useCallback(() => {
    exportBoard(canvasRef.current);
  }, [exportBoard]);

  const handleAddText = useCallback(() => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const x = canvasRect ? 100 + Math.random() * (canvasRect.width - 200) : 100;
    const y = canvasRect ? 100 + Math.random() * (canvasRect.height - 100) : 100;
    
    addElement({
      type: 'text',
      x,
      y,
      width: 200,
      height: 60,
      fill: '#333333',
      stroke: 'transparent',
      strokeWidth: 0,
      rotation: 0,
      opacity: 1,
      text: '品牌标题',
      fontSize: 32,
      fontFamily: currentFontPreset.titleFont,
    });
  }, [addElement, currentFontPreset]);

  const handleAddBodyText = useCallback(() => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const x = canvasRect ? 100 + Math.random() * (canvasRect.width - 250) : 100;
    const y = canvasRect ? 150 + Math.random() * (canvasRect.height - 150) : 150;
    
    addElement({
      type: 'text',
      x,
      y,
      width: 250,
      height: 80,
      fill: '#555555',
      stroke: 'transparent',
      strokeWidth: 0,
      rotation: 0,
      opacity: 1,
      text: '这是一段正文内容，用于展示字体效果和排版布局。',
      fontSize: 16,
      fontFamily: currentFontPreset.bodyFont,
    });
  }, [addElement, currentFontPreset]);

  const handleDuplicate = useCallback(() => {
    if (!selectedElementId) return;
    const element = elements.find(el => el.id === selectedElementId);
    if (!element) return;
    
    addElement({
      ...element,
      x: element.x + 20,
      y: element.y + 20,
      fill: getRandomColor(),
    });
  }, [selectedElementId, elements, addElement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && document.activeElement?.tagName !== 'INPUT') {
          removeElement(selectedElementId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, removeElement]);

  const selectedElement = elements.find(el => el.id === selectedElementId);

  return (
    <div 
      ref={boardContainerRef}
      className="flex-1 relative overflow-hidden bg-[#ECECEC]"
      style={{ height: '100vh' }}
    >
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div 
          className="px-4 py-2 rounded-full text-white text-sm font-medium"
          style={{ backgroundColor: '#2196F3' }}
        >
          {currentFontPreset.displayName}字体
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {selectedElement && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-1 bg-white rounded-xl shadow-lg px-2 py-1"
          >
            <button
              onClick={() => sendToBack(selectedElementId!)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="置底"
            >
              <ChevronsDown size={18} className="text-gray-600" />
            </button>
            <button
              onClick={() => sendBackward(selectedElementId!)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="下移一层"
            >
              <ChevronDown size={18} className="text-gray-600" />
            </button>
            <button
              onClick={() => bringForward(selectedElementId!)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="上移一层"
            >
              <ChevronUp size={18} className="text-gray-600" />
            </button>
            <button
              onClick={() => bringToFront(selectedElementId!)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="置顶"
            >
              <ChevronsUp size={18} className="text-gray-600" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button
              onClick={handleDuplicate}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="复制"
            >
              <Copy size={18} className="text-gray-600" />
            </button>
            <button
              onClick={() => removeElement(selectedElementId!)}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="删除"
            >
              <Trash2 size={18} className="text-red-500" />
            </button>
          </motion.div>
        )}
        
        <button
          onClick={handleAddText}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-xl shadow-lg transition-all"
          style={{ transition: 'background-color 0.2s' }}
          title="添加标题"
        >
          <Type size={18} className="text-[#1976D2]" />
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">标题</span>
        </button>
        
        <button
          onClick={handleAddBodyText}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-xl shadow-lg transition-all"
          style={{ transition: 'background-color 0.2s' }}
          title="添加正文"
        >
          <Type size={14} className="text-[#1976D2]" />
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">正文</span>
        </button>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-xl shadow-lg transition-all disabled:opacity-50"
          style={{ 
            backgroundColor: '#1976D2',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565C0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
        >
          <Download size={18} />
          <span className="text-sm font-medium hidden sm:inline">
            {isExporting ? '导出中...' : '导出'}
          </span>
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="relative bg-white w-full h-full max-w-[1440px] max-h-[900px] overflow-hidden"
          style={{
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)',
            backgroundImage: `
              linear-gradient(to right, #D0D0D0 1px, transparent 1px),
              linear-gradient(to bottom, #D0D0D0 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        >
          <AnimatePresence mode="popLayout">
            {elements.map((element) => (
              <DraggableElement
                key={element.id}
                element={element}
                isSelected={element.id === selectedElementId}
                canvasRef={canvasRef}
              />
            ))}
          </AnimatePresence>

          {elements.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="text-center">
                <div className="text-6xl mb-4 opacity-30">🎨</div>
                <p className="text-gray-400 text-lg">从左侧拖拽图形到此处开始创作</p>
                <p className="text-gray-300 text-sm mt-2">或点击上方按钮添加文本</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
