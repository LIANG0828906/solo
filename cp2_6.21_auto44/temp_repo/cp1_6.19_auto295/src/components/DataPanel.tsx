import { motion, AnimatePresence } from 'framer-motion';
import { useGalleryStore } from '../store/galleryStore';
import { useEffect, useState } from 'react';

export function DataPanel() {
  const { artworks, lights, lastOperationTime } = useGalleryStore();
  const [displayKey, setDisplayKey] = useState(0);

  const artworkCount = artworks.length;
  const lightCount = lights.length;
  const paintingCount = artworks.filter((a) => a.type === 'painting').length;
  const sculptureCount = artworks.filter((a) => a.type === 'sculpture').length;

  useEffect(() => {
    setDisplayKey((k) => k + 1);
  }, [artworkCount, lightCount, lastOperationTime]);

  return (
    <motion.div
      style={{
        position: 'fixed',
        right: 16,
        top: 24,
        width: 220,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 12,
          padding: 18,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#2C3E50',
            marginBottom: 14,
            letterSpacing: 0.3,
            paddingBottom: 10,
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          📊 展厅数据
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={displayKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StatRow label="艺术品总数" value={artworkCount} highlight="#5D4037" />
            <div style={{ display: 'flex', gap: 10, marginTop: 2, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#7F8C8D', marginBottom: 2 }}>画作</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#2C3E50' }}>{paintingCount}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#7F8C8D', marginBottom: 2 }}>雕塑</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#2C3E50' }}>{sculptureCount}</div>
              </div>
            </div>
            <StatRow label="光源数量" value={lightCount} highlight="#F39C12" />
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 11, color: '#7F8C8D', marginBottom: 3 }}>最后操作</div>
              <div style={{ fontSize: 13, color: '#2C3E50', fontWeight: 500, fontFamily: 'monospace' }}>
                {lastOperationTime}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: number; highlight: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: '#7F8C8D' }}>{label}</span>
      <span
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: highlight,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {value}
      </span>
    </div>
  );
}
