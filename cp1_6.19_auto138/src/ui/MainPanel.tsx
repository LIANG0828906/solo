import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FragmentCard } from './FragmentCard';
import { GraphCanvas } from './GraphCanvas';
import { DetailPanel } from './DetailPanel';
import { useStory } from '../context/StoryContext';
import { StoryFragment } from '../eventBus';
import { TYPE_LABELS, TYPE_COLORS } from '../storyData/storyFragment';

export const MainPanel: React.FC = () => {
  const { fragments, addFragment, graphNodes } = useStory();
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<StoryFragment['type']>('character');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAddFragment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContent.trim()) {
      addFragment(newType, newContent.trim());
      setNewContent('');
    }
  };

  const leftPanel = (
    <div
      style={{
        width: isMobile ? '100%' : 280,
        backgroundColor: '#F9F9F9',
        borderRight: isMobile ? 'none' : '2px solid #E0E0E0',
        borderBottom: isMobile ? '2px solid #E0E0E0' : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E0E0E0',
          backgroundColor: '#FFFFFF',
        }}
      >
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: 16,
            fontWeight: 600,
            color: '#333333',
          }}
        >
          素材库
        </h3>

        <form onSubmit={handleAddFragment} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="输入故事碎片内容..."
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #E0E0E0',
              fontSize: 13,
              outline: 'none',
              backgroundColor: '#FFFFFF',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as StoryFragment['type'])}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #E0E0E0',
                fontSize: 13,
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="character">角色</option>
              <option value="scene">场景</option>
              <option value="plot-twist">情节转折</option>
            </select>
            <motion.button
              type="submit"
              whileHover={{ filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              disabled={!newContent.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: newContent.trim() ? '#FF6F61' : '#CCCCCC',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 500,
                cursor: newContent.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              添加
            </motion.button>
          </div>
        </form>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: isMobile ? 'flex' : 'block',
          flexDirection: isMobile ? 'row' : 'column',
          gap: 10,
          overflowX: isMobile ? 'auto' : 'hidden',
        }}
      >
        {fragments.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#999999',
              fontSize: 13,
              minWidth: isMobile ? 200 : 'auto',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div>还没有碎片</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>添加你的第一个故事碎片</div>
          </div>
        ) : (
          <AnimatePresence>
            {fragments.map((fragment) => (
              <div
                key={fragment.id}
                style={{
                  marginBottom: isMobile ? 0 : 10,
                  flexShrink: 0,
                  width: isMobile ? 200 : 'auto',
                }}
              >
                <FragmentCard fragment={fragment} />
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #E0E0E0',
          backgroundColor: '#FFFFFF',
          fontSize: 12,
          color: '#888888',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>共 {fragments.length} 个碎片</span>
        <span>脉络图 {graphNodes.length} 个节点</span>
      </div>
    </div>
  );

  const rightPanel = <DetailPanel />;

  if (isMobile) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div style={{ flexShrink: 0, height: 180 }}>{leftPanel}</div>

        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <GraphCanvas />

          <motion.button
            onClick={() => setIsMobileDrawerOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: '#FF6F61',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 24,
              boxShadow: '0 4px 12px rgba(255, 111, 97, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            ✏️
          </motion.button>
        </div>

        <AnimatePresence>
          {isMobileDrawerOpen && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  pointerEvents: 'auto',
                }}
                onClick={() => setIsMobileDrawerOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  maxHeight: '70%',
                  pointerEvents: 'auto',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    backgroundColor: '#F0F0F0',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 4,
                      backgroundColor: '#CCCCCC',
                      borderRadius: 2,
                      margin: '12px auto',
                    }}
                  />
                  <div style={{ maxHeight: 'calc(70vh - 28px)', overflow: 'auto' }}>
                    {rightPanel}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {leftPanel}
      <GraphCanvas />
      {rightPanel}
    </div>
  );
};
