import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Upload, Trash2, Wand2, Image as ImageIcon, Pencil } from 'lucide-react';
import { FontRenderer } from '../renderer/fontRenderer';
import { Point, InputMode } from '../types';
import { TabSwitcher } from './TabSwitcher';
import { useAppStore, selectInputMode, selectUploadedImage } from '../stores/appStore';
import { FontRecognizer } from '../engine/fontRecognizer';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export const FontCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FontRenderer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Point[]>([]);
  const allStrokesRef = useRef<Point[][]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const inputMode = useAppStore(selectInputMode);
  const uploadedImage = useAppStore(selectUploadedImage);
  const setInputMode = useAppStore((state) => state.setInputMode);
  const setUploadedImage = useAppStore((state) => state.setUploadedImage);
  const setRecognizedGlyphs = useAppStore((state) => state.setRecognizedGlyphs);

  const initRenderer = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.max(400, container.clientHeight);

    if (rendererRef.current) {
      rendererRef.current.destroy();
    }

    rendererRef.current = new FontRenderer(canvas);
    rendererRef.current.resize(width, height);
    
    if (inputMode === 'handwrite') {
      rendererRef.current.clearBackground('#FAFAFA');
    }
  }, [inputMode]);

  useEffect(() => {
    initRenderer();
    
    const handleResize = () => {
      initRenderer();
      redrawAll();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      rendererRef.current?.destroy();
    };
  }, [initRenderer]);

  useEffect(() => {
    if (!rendererRef.current) return;
    
    if (inputMode === 'handwrite') {
      rendererRef.current.clearBackground('#FAFAFA');
      allStrokesRef.current = [];
      redrawAll();
    } else {
      rendererRef.current.clear();
      if (uploadedImage) {
        rendererRef.current.drawUploadedImage(uploadedImage);
      } else {
        drawUploadPlaceholder();
      }
    }
  }, [inputMode, uploadedImage]);

  const redrawAll = useCallback(() => {
    if (!rendererRef.current || inputMode !== 'handwrite') return;
    
    rendererRef.current.clearBackground('#FAFAFA');
    
    for (const stroke of allStrokesRef.current) {
      if (stroke.length >= 2) {
        rendererRef.current.drawHandwritingSegment(stroke, '#333333', 3);
      }
    }
  }, [inputMode]);

  const drawUploadPlaceholder = useCallback(() => {
    if (!rendererRef.current) return;
    
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#1E1E2E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#3D3D5C';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#6B6B7B';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      '点击或拖拽上传图片 (PNG/JPG, 最大5MB)',
      canvas.width / 2,
      canvas.height / 2
    );
  }, []);

  const getCanvasPoint = useCallback((e: React.MouseEvent | MouseEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (inputMode !== 'handwrite' || isProcessing) return;
    
    isDrawingRef.current = true;
    const point = getCanvasPoint(e);
    currentStrokeRef.current = [point];
  }, [inputMode, isProcessing, getCanvasPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingRef.current || inputMode !== 'handwrite' || isProcessing) return;
    
    const point = getCanvasPoint(e);
    currentStrokeRef.current.push(point);
    
    if (currentStrokeRef.current.length >= 2 && rendererRef.current) {
      const lastTwo = currentStrokeRef.current.slice(-2);
      rendererRef.current.drawHandwritingSegment(lastTwo, '#333333', 3);
    }
  }, [inputMode, isProcessing, getCanvasPoint]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    
    isDrawingRef.current = false;
    if (currentStrokeRef.current.length >= 2) {
      allStrokesRef.current.push([...currentStrokeRef.current]);
    }
    currentStrokeRef.current = [];
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDrawingRef.current) {
      handleMouseUp();
    }
  }, [handleMouseUp]);

  const validateFile = useCallback((file: File): boolean => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('请上传PNG或JPG格式的图片');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('图片大小不能超过5MB');
      return false;
    }
    return true;
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!validateFile(file) || !rendererRef.current) return;
    
    setIsProcessing(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setUploadedImage(dataUrl);
        
        const result = await FontRecognizer.recognizeFromImage(dataUrl);
        setRecognizedGlyphs(result.glyphs);
        
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('处理图片失败:', error);
      setIsProcessing(false);
    }
  }, [validateFile, setUploadedImage, setRecognizedGlyphs]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && inputMode === 'upload') {
      processFile(file);
    }
  }, [inputMode, processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (inputMode === 'upload') {
      setIsDragging(true);
    }
  }, [inputMode]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (inputMode === 'upload' && !isProcessing) {
      fileInputRef.current?.click();
    }
  }, [inputMode, isProcessing]);

  const handleClear = useCallback(() => {
    if (!rendererRef.current) return;
    
    if (inputMode === 'handwrite') {
      allStrokesRef.current = [];
      currentStrokeRef.current = [];
      rendererRef.current.clearBackground('#FAFAFA');
    } else {
      setUploadedImage(null);
      setRecognizedGlyphs([]);
      rendererRef.current.clear();
      drawUploadPlaceholder();
    }
  }, [inputMode, setUploadedImage, setRecognizedGlyphs, drawUploadPlaceholder]);

  const handleRecognize = useCallback(async () => {
    if (!canvasRef.current || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const result = await FontRecognizer.recognizeFromCanvas(canvasRef.current);
      setRecognizedGlyphs(result.glyphs);
    } catch (error) {
      console.error('识别失败:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, setRecognizedGlyphs]);

  const handleTabChange = useCallback((mode: InputMode) => {
    setInputMode(mode);
  }, [setInputMode]);

  return (
    <div className="flex flex-col h-full">
      <TabSwitcher
        activeTab={inputMode}
        onTabChange={handleTabChange}
        disabled={isProcessing}
      />
      
      <div
        ref={containerRef}
        className={`
          relative flex-1 rounded-xl overflow-hidden
          transition-all duration-300
          ${isDragging ? 'ring-2 ring-[#6C63FF] ring-offset-2 ring-offset-[#1E1E2E]' : ''}
          ${inputMode === 'handwrite' ? 'cursor-crosshair' : 'cursor-pointer'}
        `}
        style={{ minHeight: '400px' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={inputMode === 'upload' ? handleCanvasClick : undefined}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => inputMode === 'handwrite' && e.stopPropagation()}
        />
        
        {isProcessing && (
          <div className="absolute inset-0 bg-[#1E1E2E]/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
              <span className="text-[#E0E0E0] text-sm">正在识别文字...</span>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={handleClear}
          disabled={isProcessing}
          className="
            flex items-center gap-2 px-4 py-2 h-10 rounded-lg
            bg-[#2D2D44] text-[#E0E0E0] text-sm
            hover:bg-[#3D3D5C] transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <Trash2 size={16} />
          清空
        </button>
        
        {inputMode === 'upload' && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="
              flex items-center gap-2 px-4 py-2 h-10 rounded-lg
              bg-[#6C63FF] text-white text-sm
              hover:bg-[#7B73FF] transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <ImageIcon size={16} />
            选择图片
          </button>
        )}
        
        {inputMode === 'handwrite' && (
          <button
            onClick={handleRecognize}
            disabled={isProcessing || allStrokesRef.current.length === 0}
            className="
              flex items-center gap-2 px-4 py-2 h-10 rounded-lg
              bg-[#6C63FF] text-white text-sm
              hover:bg-[#7B73FF] transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <Wand2 size={16} />
            识别文字
          </button>
        )}
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="
            md:hidden flex items-center gap-2 px-4 py-2 h-10 rounded-lg
            bg-[#2D2D44] text-[#E0E0E0] text-sm
            hover:bg-[#3D3D5C] transition-all duration-300
          "
        >
          <Upload size={16} />
          {inputMode === 'upload' ? '上传' : '手写'}
        </button>
      </div>
    </div>
  );
};
