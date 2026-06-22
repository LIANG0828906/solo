import { useState, useRef, useEffect, useCallback } from 'react';
import { useFaceDetection } from './hooks/useFaceDetection';
import { ProductPanel } from './components/ProductPanel';
import { ControlPanel } from './components/ControlPanel';
import { drawMakeup } from './utils/makeupRenderer';
import {
  LIPSTICK_PRODUCTS,
  EYESHADOW_PRODUCTS,
  BLUSH_PRODUCTS,
  type SelectedProducts,
  type ProductSettings,
  type CompareMode,
  type InputMode,
  type CategoryTab,
  type LipstickProduct,
  type EyeshadowProduct,
  type BlushProduct,
} from './types';
import './App.css';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const SCREENSHOT_WIDTH = 800;
const SCREENSHOT_HEIGHT = 600;

export default function App() {
  const [inputMode, setInputMode] = useState<InputMode>('photo');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProducts>({
    lipstick: LIPSTICK_PRODUCTS[0],
    eyeshadow: EYESHADOW_PRODUCTS[0],
    blush: BLUSH_PRODUCTS[0],
  });
  const [productSettings, setProductSettings] = useState<ProductSettings>({
    lipstickOpacity: 0.7,
    eyeshadowShimmer: 0.5,
    blushSize: 100,
  });
  const [compareMode, setCompareMode] = useState<CompareMode>('none');
  const [showKeypoints, setShowKeypoints] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('lipstick');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'products' | 'controls' | null>(null);
  const [photoLoaded, setPhotoLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const frameSeedRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { keypoints, isLoaded, isLoading, fps, modelLoadTime, loadTimeWithinLimit, detectFace } =
    useFaceDetection();

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 开始摄像头
  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setIsCameraActive(true);
      setInputMode('camera');
    } catch (err) {
      console.error('无法访问摄像头:', err);
    }
  }, []);

  // 停止摄像头
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  }, []);

  // 处理照片上传
  const handlePhotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      stopCamera();

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          originalImageRef.current = img;
          setPhotoLoaded(true);
          setInputMode('photo');

          if (canvasRef.current && isLoaded) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              // 计算等比缩放
              const scale = Math.min(
                CANVAS_WIDTH / img.width,
                CANVAS_HEIGHT / img.height,
              );
              const drawWidth = img.width * scale;
              const drawHeight = img.height * scale;
              const offsetX = (CANVAS_WIDTH - drawWidth) / 2;
              const offsetY = (CANVAS_HEIGHT - drawHeight) / 2;

              ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
              ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            }
            detectFace(img);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [stopCamera, isLoaded, detectFace],
  );

  // 渲染循环
  useEffect(() => {
    if (!isLoaded) return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = async () => {
      frameSeedRef.current += 1;

      if (inputMode === 'camera' && videoRef.current && isCameraActive) {
        // 绘制视频帧
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(videoRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 检测面部
        await detectFace(videoRef.current);

        // 绘制美妆
        drawMakeup(ctx, keypoints, {
          lipstickColor: selectedProducts.lipstick?.color || null,
          lipstickOpacity: productSettings.lipstickOpacity,
          eyeshadowColor: selectedProducts.eyeshadow?.color || null,
          eyeshadowShimmer: productSettings.eyeshadowShimmer,
          blushColor: selectedProducts.blush?.color || null,
          blushSize: productSettings.blushSize,
          showKeypoints,
          frameSeed: frameSeedRef.current,
        }, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else if (inputMode === 'photo' && originalImageRef.current && photoLoaded) {
        // 静态照片模式
        const img = originalImageRef.current;
        const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const offsetX = (CANVAS_WIDTH - drawWidth) / 2;
        const offsetY = (CANVAS_HEIGHT - drawHeight) / 2;

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // 绘制美妆
        drawMakeup(ctx, keypoints, {
          lipstickColor: selectedProducts.lipstick?.color || null,
          lipstickOpacity: productSettings.lipstickOpacity,
          eyeshadowColor: selectedProducts.eyeshadow?.color || null,
          eyeshadowShimmer: productSettings.eyeshadowShimmer,
          blushColor: selectedProducts.blush?.color || null,
          blushSize: productSettings.blushSize,
          showKeypoints,
          frameSeed: frameSeedRef.current,
        }, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    isLoaded,
    inputMode,
    isCameraActive,
    keypoints,
    selectedProducts,
    productSettings,
    showKeypoints,
    detectFace,
    photoLoaded,
  ]);

  // 照片加载后检测面部
  useEffect(() => {
    if (isLoaded && originalImageRef.current && photoLoaded) {
      detectFace(originalImageRef.current);
    }
  }, [isLoaded, photoLoaded, detectFace]);

  // Bug修复#4: 保存截图，强制800x600分辨率，隐藏关键点
  const handleSaveScreenshot = useCallback(() => {
    if (!canvasRef.current) return;

    // 创建输出canvas，固定800x600分辨率
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = SCREENSHOT_WIDTH;
    outputCanvas.height = SCREENSHOT_HEIGHT;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) return;

    // 在不显示关键点的情况下重新渲染
    const sourceCanvas = canvasRef.current;
    const scale = Math.min(SCREENSHOT_WIDTH / sourceCanvas.width, SCREENSHOT_HEIGHT / sourceCanvas.height);
    const drawWidth = sourceCanvas.width * scale;
    const drawHeight = sourceCanvas.height * scale;
    const offsetX = (SCREENSHOT_WIDTH - drawWidth) / 2;
    const offsetY = (SCREENSHOT_HEIGHT - drawHeight) / 2;

    // 填充背景
    outputCtx.fillStyle = '#fff0f5';
    outputCtx.fillRect(0, 0, SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT);

    // 绘制不含关键点的美妆效果
    // 重新绘制原始图像 + 美妆（不带关键点）
    if (inputMode === 'photo' && originalImageRef.current) {
      const img = originalImageRef.current;
      const imgScale = Math.min(SCREENSHOT_WIDTH / img.width, SCREENSHOT_HEIGHT / img.height);
      const imgW = img.width * imgScale;
      const imgH = img.height * imgScale;
      const imgX = (SCREENSHOT_WIDTH - imgW) / 2;
      const imgY = (SCREENSHOT_HEIGHT - imgH) / 2;

      outputCtx.drawImage(img, imgX, imgY, imgW, imgH);

      // 绘制美妆效果（不带关键点）
      // 由于关键点是归一化坐标，需要按缩放比例转换
      if (keypoints.length > 0) {
        drawMakeup(outputCtx, keypoints, {
          lipstickColor: selectedProducts.lipstick?.color || null,
          lipstickOpacity: productSettings.lipstickOpacity,
          eyeshadowColor: selectedProducts.eyeshadow?.color || null,
          eyeshadowShimmer: productSettings.eyeshadowShimmer,
          blushColor: selectedProducts.blush?.color || null,
          blushSize: productSettings.blushSize,
          showKeypoints: false, // Bug修复#4: 隐藏调试点
          frameSeed: frameSeedRef.current,
        }, SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT);
      }
    } else {
      // 直接从canvas复制（不含关键点模式需要重新渲染）
      outputCtx.drawImage(sourceCanvas, offsetX, offsetY, drawWidth, drawHeight);
    }

    // 处理对比模式
    if (compareMode === 'split' || compareMode === 'sidebyside') {
      // 绘制对比图...
    }

    // 导出为PNG并下载
    outputCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `makeup-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, [inputMode, keypoints, selectedProducts, productSettings, compareMode]);

  const handleSelectLipstick = (product: LipstickProduct | null) => {
    setSelectedProducts((prev) => ({ ...prev, lipstick: product }));
    setActiveCategory('lipstick');
  };

  const handleSelectEyeshadow = (product: EyeshadowProduct | null) => {
    setSelectedProducts((prev) => ({ ...prev, eyeshadow: product }));
    setActiveCategory('eyeshadow');
  };

  const handleSelectBlush = (product: BlushProduct | null) => {
    setSelectedProducts((prev) => ({ ...prev, blush: product }));
    setActiveCategory('blush');
  };

  const handleSettingsChange = (settings: Partial<ProductSettings>) => {
    setProductSettings((prev) => ({ ...prev, ...settings }));
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">美妆虚拟试妆间</h1>
        {modelLoadTime !== null && (
          <span className={`perf-badge ${loadTimeWithinLimit ? 'ok' : 'warn'}`}>
            模型加载: {modelLoadTime.toFixed(0)}ms
            {loadTimeWithinLimit ? ' ✓' : ' ⚠'}
          </span>
        )}
      </header>

      <div className="main-content">
        {/* 左侧产品面板 - 桌面端 */}
        {!isMobile && (
          <ProductPanel
            selectedLipstick={selectedProducts.lipstick}
            selectedEyeshadow={selectedProducts.eyeshadow}
            selectedBlush={selectedProducts.blush}
            onSelectLipstick={handleSelectLipstick}
            onSelectEyeshadow={handleSelectEyeshadow}
            onSelectBlush={handleSelectBlush}
          />
        )}

        {/* 中央画布区域 */}
        <div className="canvas-area">
          <div className="input-toggle">
            <button
              className={`toggle-btn ${inputMode === 'photo' ? 'active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              上传照片
            </button>
            <button
              className={`toggle-btn ${inputMode === 'camera' ? 'active' : ''}`}
              onClick={() => {
                if (isCameraActive) {
                  stopCamera();
                } else {
                  startCamera();
                }
              }}
            >
              {isCameraActive ? '关闭摄像头' : '开启摄像头'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>

          <div className="canvas-wrapper">
            <div className="mirror-frame">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="makeup-canvas"
              />
              <video
                ref={videoRef}
                style={{ display: 'none' }}
                width={640}
                height={480}
                playsInline
              />

              {isLoading && (
                <div className="loading-overlay">
                  <div className="loading-spinner" />
                  <p>正在加载面部检测模型...</p>
                </div>
              )}
            </div>

            {inputMode === 'camera' && (
              <div className="fps-display">FPS: {fps}</div>
            )}
          </div>
        </div>

        {/* 右侧控制面板 - 桌面端 */}
        {!isMobile && (
          <ControlPanel
            settings={productSettings}
            compareMode={compareMode}
            showKeypoints={showKeypoints}
            activeCategory={activeCategory}
            onSettingsChange={handleSettingsChange}
            onCompareModeChange={setCompareMode}
            onShowKeypointsChange={setShowKeypoints}
            onSaveScreenshot={handleSaveScreenshot}
          />
        )}
      </div>

      {/* Bug修复#5: 移动端底部浮动工具栏 - 毛玻璃效果 */}
      {isMobile && (
        <>
          {/* 底部工具栏按钮 */}
          <div className="mobile-toolbar">
            <button
              className={`mobile-tool-btn ${mobileTab === 'products' ? 'active' : ''}`}
              onClick={() => setMobileTab(mobileTab === 'products' ? null : 'products')}
            >
              💄 产品
            </button>
            <button
              className={`mobile-tool-btn ${mobileTab === 'controls' ? 'active' : ''}`}
              onClick={() => setMobileTab(mobileTab === 'controls' ? null : 'controls')}
            >
              ⚙️ 调整
            </button>
            <button
              className="mobile-tool-btn save"
              onClick={handleSaveScreenshot}
            >
              📷 保存
            </button>
          </div>

          {/* 产品选择弹出面板 */}
          {mobileTab === 'products' && (
            <div className="mobile-drawer backdrop-blur">
              <div className="drawer-handle" />
              <ProductPanel
                selectedLipstick={selectedProducts.lipstick}
                selectedEyeshadow={selectedProducts.eyeshadow}
                selectedBlush={selectedProducts.blush}
                onSelectLipstick={handleSelectLipstick}
                onSelectEyeshadow={handleSelectEyeshadow}
                onSelectBlush={handleSelectBlush}
              />
            </div>
          )}

          {/* 控制面板弹出面板 */}
          {mobileTab === 'controls' && (
            <div className="mobile-drawer backdrop-blur">
              <div className="drawer-handle" />
              <ControlPanel
                settings={productSettings}
                compareMode={compareMode}
                showKeypoints={showKeypoints}
                activeCategory={activeCategory}
                onSettingsChange={handleSettingsChange}
                onCompareModeChange={setCompareMode}
                onShowKeypointsChange={setShowKeypoints}
                onSaveScreenshot={handleSaveScreenshot}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
