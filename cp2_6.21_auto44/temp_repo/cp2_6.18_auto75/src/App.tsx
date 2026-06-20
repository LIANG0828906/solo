import { useState, useRef, useCallback } from "react";
import { useColorStore } from "./store/colorStore";
import { extractColors } from "./modules/extractor/colorExtractor";
import ColorCard from "./modules/editor/ColorCard";
import ExportPanel from "./modules/editor/ExportPanel";
import "./App.css";

export default function App() {
  const {
    extractedColors,
    manualColors,
    getAllColors,
    reorderColors,
    setExtractedColors,
  } = useColorStore();

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const allColors = getAllColors();

  const getImageData = (img: HTMLImageElement): ImageData => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    const maxDim = 1200;
    let { naturalWidth: w, naturalHeight: h } = img;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    w = Math.round(w * scale);
    h = Math.round(h * scale);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
  };

  const processFile = useCallback((file: File) => {
    setError(null);
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError("仅支持 PNG 和 JPG 格式的图片");
      return;
    }
    setIsProcessing(true);
    setProcessingProgress(10);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);
      setProcessingProgress(30);

      const img = new Image();
      img.onload = () => {
        setProcessingProgress(50);
        try {
          window.setTimeout(() => {
            const imageData = getImageData(img);
            setProcessingProgress(70);
            window.setTimeout(() => {
              const colors = extractColors(imageData, 5, 5);
              setProcessingProgress(90);
              setExtractedColors(colors);
              setProcessingProgress(100);
              window.setTimeout(() => {
                setIsProcessing(false);
              }, 300);
            }, 50);
          }, 50);
        } catch (err) {
          console.error("颜色提取失败:", err);
          setError("图片处理失败，请尝试其他图片");
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setError("图片加载失败");
        setIsProcessing(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setError("文件读取失败");
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  }, [setExtractedColors]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (isProcessing) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    e.target.value = "";
  };

  const handleUploadClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    useColorStore.setState({
      extractedColors: [],
      manualColors: [],
      expandedCardId: null,
      selectedIndex: null,
    });
  };

  const handleCardDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleCardDragOver = (_e: React.DragEvent, index: number) => {
    setDragOverIndex(index);
  };

  const handleCardDrop = (index: number) => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== index) {
      reorderColors(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <svg
            width="36"
            height="36"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="8" y="8" width="38" height="38" rx="10" fill="#8B5CF6" />
            <rect x="54" y="8" width="38" height="38" rx="10" fill="#EC4899" />
            <rect x="8" y="54" width="38" height="38" rx="10" fill="#3B82F6" />
            <rect x="54" y="54" width="38" height="38" rx="10" fill="#10B981" />
          </svg>
          <div className="logo-text">
            <h1>ColorHunt</h1>
            <p>智能图片色彩提取 · 生成专属调色板</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="upload-section">
          <div
            className={`upload-container ${isDraggingOver ? "dragover" : ""} ${
              isProcessing ? "processing" : ""
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            {previewUrl && (
              <div className="upload-preview" onClick={(e) => e.stopPropagation()}>
                <img src={previewUrl} alt="预览图" />
                <button className="clear-btn" onClick={handleClear} title="清除图片">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            {!previewUrl && (
              <div className="upload-placeholder">
                <div className="upload-icon-wrapper">
                  <svg
                    className="upload-icon"
                    width="56"
                    height="56"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="upload-hint">拖拽图片到这里或点击上传</p>
                <p className="upload-subhint">支持 PNG 和 JPG 格式</p>
              </div>
            )}

            {isProcessing && (
              <div className="processing-overlay">
                <div className="processing-spinner" />
                <div className="processing-text">正在提取颜色...</div>
                <div className="processing-progress">
                  <div
                    className="processing-progress-bar"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {error && <div className="error-msg">{error}</div>}
        </section>

        {(allColors.length > 0 || extractedColors.length > 0 || manualColors.length > 0) && (
          <section className="palette-section">
            <div className="section-header">
              <h2>
                <span className="section-dot" />
                调色板
              </h2>
              <span className="section-sub">共 {allColors.length} 种颜色 · 拖拽卡片可排序</span>
            </div>

            <div className="palette-grid">
              {allColors.map((color, idx) => (
                <ColorCard
                  key={color.id}
                  color={color}
                  index={idx}
                  onDragStart={handleCardDragStart}
                  onDragOver={handleCardDragOver}
                  onDrop={handleCardDrop}
                  isDragging={dragIndex === idx}
                  isDragOver={dragOverIndex === idx && dragIndex !== idx}
                />
              ))}
            </div>

            {allColors.length === 0 && !isProcessing && (
              <div className="empty-palette">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                  <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
                  <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
                  <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
                  <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                </svg>
                <p>上传图片后自动生成调色板</p>
              </div>
            )}
          </section>
        )}

        <section className="actions-section">
          <ExportPanel />
        </section>
      </main>

      <footer className="app-footer">
        <p>ColorHunt · 使用 K-Means 聚类算法智能提取图片核心色彩</p>
      </footer>
    </div>
  );
}
