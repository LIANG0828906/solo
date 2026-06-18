import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiX, FiLayers } from 'react-icons/fi';
import { PromptCanvas } from './components/PromptCanvas';
import { StylePalette } from './components/StylePalette';
import { ControlPanel } from './components/ControlPanel';
import { useCanvasState } from './hooks/useCanvasState';
import {
  exportCanvasToPng,
  createLoadingOverlay,
  removeLoadingOverlay,
  showToast,
} from './utils/imageExport';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    state,
    generateFromPrompt,
    resetCanvas,
    setTransformTarget,
    applyColorVariant,
    generateNewVariants,
    selectColor,
    updateSelectedColor,
    setParticleHover,
  } = useCanvasState(CANVAS_WIDTH, CANVAS_HEIGHT);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 960);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleGenerate = useCallback(() => {
    if (prompt.trim()) {
      generateFromPrompt(prompt);
    }
  }, [prompt, generateFromPrompt]);

  const handleReset = useCallback(() => {
    setPrompt('');
    resetCanvas();
  }, [resetCanvas]);

  const handleExport = useCallback(async () => {
    if (!canvasContainerRef.current || isExporting) return;

    setIsExporting(true);
    const overlay = createLoadingOverlay();

    try {
      await exportCanvasToPng(canvasContainerRef.current, {
        width: 1920,
        height: 1080,
        backgroundColor: '#1A1A2E',
        filename: `诗语微澜-${Date.now()}.png`,
      });
      showToast('图片已保存');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('导出失败，请重试');
    } finally {
      removeLoadingOverlay(overlay);
      setIsExporting(false);
    }
  }, [isExporting]);

  const handleTransformChange = useCallback(
    (transform: { x?: number; y?: number; scale?: number }) => {
      setTransformTarget(transform);
    },
    [setTransformTarget]
  );

  const handleParticleHover = useCallback(
    (index: number, isHovered: boolean) => {
      setParticleHover(index, isHovered);
    },
    [setParticleHover]
  );

  const renderDesktopLayout = () => (
    <div style={{
      display: 'flex',
      gap: '20px',
      flex: 1,
      minHeight: 0,
    }}>
      <ControlPanel
        prompt={prompt}
        onPromptChange={setPrompt}
        onGenerate={handleGenerate}
        onReset={handleReset}
        onExport={handleExport}
        isExporting={isExporting}
        isGenerated={state.isGenerated}
        particleCount={state.particles.length}
        motionIntensity={state.parsedPrompt?.motionIntensity || 0}
      />

      <PromptCanvas
        particles={state.particles}
        shapes={state.shapes}
        transform={state.transform}
        colors={state.colors}
        isGenerated={state.isGenerated}
        onTransformChange={handleTransformChange}
        onParticleHover={handleParticleHover}
        canvasRef={canvasRef}
        containerRef={canvasContainerRef}
      />

      <StylePalette
        colors={state.colors}
        selectedColorIndex={state.selectedColorIndex}
        colorVariants={state.colorVariants}
        onSelectColor={selectColor}
        onUpdateColor={updateSelectedColor}
        onApplyVariant={applyColorVariant}
        onGenerateVariants={generateNewVariants}
        isGenerated={state.isGenerated}
      />
    </div>
  );

  const renderMobileLayout = () => (
    <>
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '16px',
        zIndex: 100,
      }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowLeftPanel(true)}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#0F3460',
            border: 'none',
            color: '#E94560',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <FiMenu />
        </motion.button>
      </div>

      <div style={{
        position: 'fixed',
        top: '80px',
        right: '16px',
        zIndex: 100,
      }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowRightPanel(true)}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#16213E',
            border: 'none',
            color: '#E94560',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <FiLayers />
        </motion.button>
      </div>

      {showLeftPanel && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 200,
            }}
            onClick={() => setShowLeftPanel(false)}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 300,
              maxWidth: '85vw',
            }}
          >
            <div style={{ position: 'relative', height: '100%' }}>
              <ControlPanel
                prompt={prompt}
                onPromptChange={setPrompt}
                onGenerate={() => {
                  handleGenerate();
                  setShowLeftPanel(false);
                }}
                onReset={() => {
                  handleReset();
                  setShowLeftPanel(false);
                }}
                onExport={handleExport}
                isExporting={isExporting}
                isGenerated={state.isGenerated}
                particleCount={state.particles.length}
                motionIntensity={state.parsedPrompt?.motionIntensity || 0}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowLeftPanel(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '-40px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#0F3460',
                  border: 'none',
                  color: '#E0E0E0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiX />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}

      {showRightPanel && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 200,
            }}
            onClick={() => setShowRightPanel(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              zIndex: 300,
              maxWidth: '85vw',
            }}
          >
            <div style={{ position: 'relative', height: '100%' }}>
              <StylePalette
                colors={state.colors}
                selectedColorIndex={state.selectedColorIndex}
                colorVariants={state.colorVariants}
                onSelectColor={selectColor}
                onUpdateColor={updateSelectedColor}
                onApplyVariant={(id) => {
                  applyColorVariant(id);
                  setShowRightPanel(false);
                }}
                onGenerateVariants={generateNewVariants}
                isGenerated={state.isGenerated}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowRightPanel(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '-40px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#16213E',
                  border: 'none',
                  color: '#E0E0E0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiX />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}

      <PromptCanvas
        particles={state.particles}
        shapes={state.shapes}
        transform={state.transform}
        colors={state.colors}
        isGenerated={state.isGenerated}
        onTransformChange={handleTransformChange}
        onParticleHover={handleParticleHover}
        canvasRef={canvasRef}
        containerRef={canvasContainerRef}
      />
    </>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          textAlign: 'center',
          marginBottom: '20px',
        }}
      >
        <h1 style={{
          margin: 0,
          fontFamily: '"Playfair Display", serif',
          fontSize: isMobile ? '24px' : '28px',
          fontWeight: 700,
          color: '#E94560',
          letterSpacing: '2px',
        }}>
          诗语微澜
        </h1>
        <p style={{
          margin: '8px 0 0 0',
          fontSize: isMobile ? '12px' : '14px',
          color: '#8892b0',
          letterSpacing: '1px',
        }}>
          用文字勾勒诗意，让灵感化为涟漪
        </p>
      </motion.header>

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        {isMobile ? renderMobileLayout() : renderDesktopLayout()}
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #E94560;
          cursor: pointer;
          margin-top: -5px;
          box-shadow: 0 2px 6px rgba(233, 69, 96, 0.4);
        }
        
        input[type="range"]::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 3px;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #E94560;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(233, 69, 96, 0.4);
        }
        
        input[type="range"]::-moz-range-track {
          height: 6px;
          border-radius: 3px;
        }
        
        textarea {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
};

export default App;
