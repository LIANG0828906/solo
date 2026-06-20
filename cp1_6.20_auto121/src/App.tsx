import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, Settings } from 'lucide-react';
import { useResponsiveBreakpoint } from '@/utils/perfMonitor';
import SceneViewer from '@/components/SceneViewer';
import FurniturePanel from '@/components/FurniturePanel';
import ControlPanel from '@/components/ControlPanel';
import StatusBar from '@/components/StatusBar';

export default function App() {
  const { isDesktop } = useResponsiveBreakpoint();
  const [furnitureOpen, setFurnitureOpen] = useState<boolean>(false);
  const [controlOpen, setControlOpen] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [welcomeFading, setWelcomeFading] = useState<boolean>(false);
  const firstLoadRef = useRef<boolean>(true);
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      setShowWelcome(true);
      welcomeTimerRef.current = setTimeout(() => {
        setWelcomeFading(true);
        fadeTimerRef.current = setTimeout(() => {
          setShowWelcome(false);
        }, 500);
      }, 3000);
    }

    return () => {
      if (welcomeTimerRef.current !== null) {
        clearTimeout(welcomeTimerRef.current);
        welcomeTimerRef.current = null;
      }
      if (fadeTimerRef.current !== null) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };
  }, []);

  const handleOpenFurniture = useCallback(() => {
    setFurnitureOpen(true);
  }, []);

  const handleCloseFurniture = useCallback(() => {
    setFurnitureOpen(false);
  }, []);

  const handleOpenControl = useCallback(() => {
    setControlOpen(true);
  }, []);

  const handleCloseControl = useCallback(() => {
    setControlOpen(false);
  }, []);

  const handleOverlayClick = useCallback((panel: 'furniture' | 'control') => {
    if (panel === 'furniture') {
      setFurnitureOpen(false);
    } else {
      setControlOpen(false);
    }
  }, []);

  const fabButtonStyle: React.CSSProperties = {
    position: 'fixed',
    top: 16,
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 15,
    color: 'rgba(45, 55, 72, 0.85)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const renderDesktopLayout = () => (
    <>
      <SceneViewer />
      <FurniturePanel
        isOpen={true}
        style={{
          position: 'absolute',
          left: 16,
          top: 16,
          bottom: 46,
          width: 220,
          zIndex: 10,
        }}
      />
      <ControlPanel
        isOpen={true}
        style={{
          position: 'absolute',
          right: 16,
          top: 16,
          bottom: 46,
          width: 240,
          zIndex: 10,
        }}
      />
      <StatusBar compact={false} />
    </>
  );

  const renderMobileLayout = () => (
    <>
      <SceneViewer />

      <button
        onClick={handleOpenFurniture}
        style={{
          ...fabButtonStyle,
          left: 16,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.18)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.92)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
        }}
        aria-label="打开家具面板"
      >
        <Menu size={24} strokeWidth={2} />
      </button>

      <button
        onClick={handleOpenControl}
        style={{
          ...fabButtonStyle,
          right: 16,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.18)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.92)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
        }}
        aria-label="打开控制面板"
      >
        <Settings size={24} strokeWidth={2} />
      </button>

      {furnitureOpen && (
        <>
          <div
            onClick={() => handleOverlayClick('furniture')}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.35)',
              zIndex: 99,
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              animation: 'fadeIn 0.25s ease-out',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: furnitureOpen ? 'translateY(0)' : 'translateY(-100%)',
                transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
                pointerEvents: 'auto',
                maxHeight: '82vh',
              }}
            >
              <FurniturePanel
                isOpen={true}
                onClose={handleCloseFurniture}
                style={{
                  position: 'relative',
                  left: 0,
                  top: 0,
                  bottom: 'auto',
                  width: 'auto',
                  margin: 12,
                  zIndex: 100,
                  maxHeight: 'calc(82vh - 24px)',
                }}
              />
            </div>
          </div>
        </>
      )}

      {controlOpen && (
        <>
          <div
            onClick={() => handleOverlayClick('control')}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.35)',
              zIndex: 99,
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              animation: 'fadeIn 0.25s ease-out',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                transform: controlOpen ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
                pointerEvents: 'auto',
                maxHeight: '82vh',
              }}
            >
              <ControlPanel
                isOpen={true}
                onClose={handleCloseControl}
                style={{
                  position: 'relative',
                  right: 0,
                  top: 0,
                  bottom: 'auto',
                  width: 'auto',
                  margin: 12,
                  zIndex: 100,
                  maxHeight: 'calc(82vh - 24px)',
                }}
              />
            </div>
          </div>
        </>
      )}

      <StatusBar compact={true} />
    </>
  );

  return (
    <>
      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {isDesktop ? renderDesktopLayout() : renderMobileLayout()}

        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Noto Serif SC', 'Noto Sans SC', serif",
            fontWeight: 300,
            fontSize: 20,
            color: 'rgba(45, 55, 72, 0.85)',
            pointerEvents: 'none',
            zIndex: 5,
            letterSpacing: 2,
          }}
        >
          3D室内场景设计器
        </div>

        {showWelcome && (
          <div
            style={{
              position: 'fixed',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255, 255, 255, 0.78)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 16,
              padding: '14px 24px',
              fontSize: 14,
              color: 'rgba(45, 55, 72, 0.9)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
              zIndex: 200,
              fontWeight: 500,
              opacity: welcomeFading ? 0 : 1,
              transition: 'opacity 0.5s ease-out',
              animation: !welcomeFading ? 'slideDownFade 0.4s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
            }}
          >
            欢迎使用！从左侧拖入家具开始设计 ☁️
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDownFade {
          from {
            opacity: 0;
            transform: translate(-50%, -16px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </>
  );
}
