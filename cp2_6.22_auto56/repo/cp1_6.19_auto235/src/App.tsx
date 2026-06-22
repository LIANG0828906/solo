import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDesignStore } from './store/useDesignStore';
import { ImageUploader } from './components/ImageUploader';
import { ColorPalette } from './components/ColorPalette';
import { InspirationBoard } from './components/InspirationBoard';
import { ExportButton } from './components/ExportButton';
import './styles/global.css';

const App: React.FC = () => {
  const primaryColors = useDesignStore(state => state.primaryColors);
  const accentColors = useDesignStore(state => state.accentColors);
  const croppedImage = useDesignStore(state => state.croppedImage);
  const drawerExpanded = useDesignStore(state => state.drawerExpanded);
  const setDrawerExpanded = useDesignStore(state => state.setDrawerExpanded);

  const exportRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const hasContent = croppedImage && primaryColors.length > 0;

  const handleDrawerClick = () => {
    if (isMobile) {
      setDrawerExpanded(!drawerExpanded);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <nav className="navbar">
        <div className="navbar-title">书籍装帧灵感板 · Cover Inspiration Board</div>
        <div className="navbar-actions">
          <ExportButton
            targetRef={exportRef}
            disabled={!hasContent}
          />
        </div>
      </nav>

      <div className="main-layout">
        <main className="workspace">
          <ImageUploader />
        </main>

        <AnimatePresence mode="wait">
          <aside
            className={`side-panel ${drawerExpanded ? 'expanded' : ''}`}
            style={isMobile ? { position: 'fixed', bottom: 0, left: 0, right: 0 } : {}}
          >
            {isMobile && (
              <div
                className="drawer-handle"
                onClick={handleDrawerClick}
              />
            )}

            <div ref={exportRef} className="export-content">
              <ColorPalette
                type="primary"
                colors={primaryColors}
                title="主色调 · Primary Colors"
              />

              <ColorPalette
                type="accent"
                colors={accentColors}
                title="辅助色 · Accent Colors"
              />

              <InspirationBoard />
            </div>
          </aside>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
