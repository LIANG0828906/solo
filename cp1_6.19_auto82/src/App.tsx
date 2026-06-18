import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import type { Plant, GrowthStage, LogEntry } from '@types/index';
import { useLocalStorage } from '@hooks/useLocalStorage';
import PlantPad from '@components/PlantPad';
import SymbiosisGraph from '@components/SymbiosisGraph';
import PlanningAdvice from '@components/PlanningAdvice';
import { FiMenu, FiX, FiLeaf } from 'react-icons/fi';

const STORAGE_KEY = 'community_garden_plants_v1';

const App: React.FC = () => {
  const [plants, setPlants] = useLocalStorage<Plant[]>(STORAGE_KEY, []);
  const [mobilePadOpen, setMobilePadOpen] = useState(false);
  const [isViewportLarge, setIsViewportLarge] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth > 1024 : true,
  );
  const [isTablet, setIsTablet] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth <= 1024 : false,
  );

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsViewportLarge(w > 1024);
      setIsTablet(w >= 768 && w <= 1024);
      if (w >= 768) setMobilePadOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreate = useCallback((plant: Plant) => {
    setPlants((prev) => [...prev, plant]);
    toast.success(`「${plant.customName || plant.speciesId}」已种下 🌱`, {
      style: { borderRadius: 10, padding: '10px 14px' },
      iconTheme: { primary: '#5B8C5A', secondary: '#fff' },
    });
  }, [setPlants]);

  const handleUpdate = useCallback(
    (plantId: string, patch: Partial<Plant>) => {
      setPlants((prev) => prev.map((p) => (p.id === plantId ? { ...p, ...patch } : p)));
    },
    [setPlants],
  );

  const handleDelete = useCallback(
    (plantId: string) => {
      setPlants((prev) => prev.filter((p) => p.id !== plantId));
      toast('已移除植物', {
        icon: '🗑️',
        style: { borderRadius: 10, padding: '10px 14px' },
      });
    },
    [setPlants],
  );

  const renderPadPanel = () => (
    <div
      style={{
        width: isViewportLarge ? '35%' : '100%',
        height: isTablet ? '55%' : isViewportLarge ? '100%' : '100%',
        minHeight: 0,
        flexShrink: 0,
        backgroundColor: 'var(--color-bg)',
        borderRight: isViewportLarge ? '1px solid var(--color-card-border)' : 'none',
        borderBottom: isTablet ? '1px solid var(--color-card-border)' : 'none',
      }}
    >
      <PlantPad plants={plants} onCreate={handleCreate} onUpdate={handleUpdate} onDelete={handleDelete} />
    </div>
  );

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg)',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          height: 56,
          padding: '0 18px',
          backgroundColor: 'var(--color-card)',
          borderBottom: '1px solid var(--color-card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isViewportLarge && (
            <button
              onClick={() => setMobilePadOpen(true)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.05)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
              aria-label="打开植物面板"
            >
              <FiMenu size={20} />
            </button>
          )}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #66BB6A, #4CAF50)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(76, 175, 80, 0.3)',
            }}
          >
            <FiLeaf size={20} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 0.3 }}>社区花园共生规划助手</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: -2 }}>
              Community Garden Symbiosis Planner
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            className="chip"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            🌱 已种植 {plants.length} 株
          </div>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: isTablet ? 'flex' : 'flex',
          flexDirection: isTablet ? 'column' : isViewportLarge ? 'row' : 'row',
          minHeight: 0,
          position: 'relative',
        }}
      >
        {isViewportLarge && renderPadPanel()}

        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, minHeight: 0 }}>
            <SymbiosisGraph plants={plants} />
          </div>
          <PlanningAdvice plants={plants} />
        </div>
      </div>

      <AnimatePresence>
        {!isViewportLarge && mobilePadOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => setMobilePadOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.45)',
                zIndex: 40,
                top: 56,
              }}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'fixed',
                top: 56,
                left: 0,
                bottom: 0,
                width: 'min(420px, 92vw)',
                zIndex: 50,
                backgroundColor: 'var(--color-bg)',
                boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
                borderRight: '1px solid var(--color-card-border)',
                willChange: 'transform',
                height: 'calc(100vh - 56px)',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--color-card-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  backgroundColor: 'var(--color-card)',
                }}
              >
                <button
                  onClick={() => setMobilePadOpen(false)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.06)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
                >
                  <FiX size={18} />
                </button>
              </div>
              <div style={{ height: 'calc(100% - 55px)' }}>{renderPadPanel()}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            fontFamily: 'var(--font-family)',
            boxShadow: 'var(--shadow-toast)',
          },
        }}
      />
    </div>
  );
};

export default App;
