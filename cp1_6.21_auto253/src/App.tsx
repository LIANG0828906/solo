import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import Scene from './Scene';
import Toolbar from './Toolbar';
import ExportModal from './ExportModal';

const DEFAULT_CAMERA_ANGLE = { x: 0.4, y: 0.6 };

export default function App() {
  const [cameraAngle, setCameraAngle] = useState(DEFAULT_CAMERA_ANGLE);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleRotateLeft = () => {
    setCameraAngle((prev) => ({
      ...prev,
      y: prev.y - Math.PI / 12,
    }));
  };

  const handleRotateRight = () => {
    setCameraAngle((prev) => ({
      ...prev,
      y: prev.y + Math.PI / 12,
    }));
  };

  const handleRotateUp = () => {
    setCameraAngle((prev) => ({
      ...prev,
      x: Math.min(prev.x + Math.PI / 18, Math.PI / 2.5),
    }));
  };

  const handleRotateDown = () => {
    setCameraAngle((prev) => ({
      ...prev,
      x: Math.max(prev.x - Math.PI / 18, -Math.PI / 6),
    }));
  };

  const handleReset = () => {
    setCameraAngle(DEFAULT_CAMERA_ANGLE);
  };

  const cameraControls = (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        zIndex: 10,
      }}
    >
      <button
        onClick={handleRotateUp}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#1E293B',
          color: '#E2E8F0',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s ease, transform 0.1s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#334155';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#1E293B';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <ChevronUp size={20} />
      </button>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleRotateLeft}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1E293B',
            color: '#E2E8F0',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease, transform 0.1s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#334155';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1E293B';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={handleReset}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#3B82F6',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease, transform 0.1s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563EB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3B82F6';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={handleRotateRight}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1E293B',
            color: '#E2E8F0',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease, transform 0.1s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#334155';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1E293B';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <button
        onClick={handleRotateDown}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#1E293B',
          color: '#E2E8F0',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s ease, transform 0.1s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#334155';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#1E293B';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <ChevronDown size={20} />
      </button>
    </div>
  );

  const exportButton = (
    <button
      onClick={() => setShowExportModal(true)}
      style={{
        position: 'absolute',
        bottom: isMobile && drawerOpen ? '270px' : '20px',
        right: '20px',
        width: '120px',
        height: '44px',
        borderRadius: '8px',
        backgroundColor: '#10B981',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'background-color 0.2s ease, transform 0.1s ease, bottom 0.35s ease',
        zIndex: 10,
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#059669';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#10B981';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.98)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      导出作品
    </button>
  );

  const titleBar = (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
      }}
    >
      <h1
        style={{
          color: '#F8FAFC',
          fontSize: '20px',
          fontWeight: 'bold',
          margin: 0,
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        立体像素雕塑家
      </h1>
      <p
        style={{
          color: '#94A3B8',
          fontSize: '12px',
          margin: '4px 0 0 0',
        }}
      >
        左键放置 · 右键移除
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#0F172A',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {titleBar}
        {cameraControls}
        {exportButton}

        <div
          style={{
            width: '100%',
            height: '100%',
            paddingBottom: drawerOpen ? '250px' : '60px',
            transition: 'padding-bottom 0.35s ease',
            boxSizing: 'border-box',
          }}
        >
          <Scene cameraAngle={cameraAngle} />
        </div>

        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
          }}
        >
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            style={{
              width: '100%',
              height: '40px',
              backgroundColor: '#1E293B',
              borderRadius: '12px 12px 0 0',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
            }}
          >
            <ChevronUp
              size={24}
              style={{
                transform: drawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.35s ease',
              }}
            />
          </button>

          <div
            style={{
              height: drawerOpen ? '250px' : '0',
              overflow: 'hidden',
              transition: 'height 0.35s ease',
              backgroundColor: '#1E293B',
            }}
          >
            <Toolbar isMobile={true} />
          </div>
        </div>

        <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0F172A',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: '0 0 85%',
          position: 'relative',
        }}
      >
        {titleBar}
        {cameraControls}
        {exportButton}
        <Scene cameraAngle={cameraAngle} />
      </div>

      <div
        style={{
          flex: '0 0 15%',
          minWidth: '280px',
          padding: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          overflowY: 'auto',
        }}
      >
        <Toolbar />
      </div>

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </div>
  );
}
