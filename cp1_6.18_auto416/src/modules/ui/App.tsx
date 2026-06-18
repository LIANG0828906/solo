import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FileUpload from './fileUpload';
import DashboardUI from '../dashboard/dashboardUI';
import { GraphRenderer } from '../graph/graphRenderer';
import { useGraphStore } from '../store/graphStore';
import { runForceLayout, createInitialGraphData } from '../graph/graphEngine';
import type { GraphNode, GraphEdge } from '../../types';

const App: React.FC = () => {
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GraphRenderer | null>(null);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const rawData = useGraphStore((s) => s.rawData);
  const highlightNode = useGraphStore((s) => s.highlightNode);
  const resetHighlight = useGraphStore((s) => s.resetHighlight);
  const setNodes = useGraphStore((s) => s.setNodes);
  const setEdges = useGraphStore((s) => s.setEdges);

  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [graphSize, setGraphSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!graphContainerRef.current) return;

    const updateSize = () => {
      if (graphContainerRef.current) {
        const rect = graphContainerRef.current.getBoundingClientRect();
        setGraphSize({
          width: Math.max(rect.width - 32, 400),
          height: Math.max(rect.height - 32, 300),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isMobile, drawerOpen]);

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      highlightNode(nodeId);
      const highlightedIds = new Set<string>();
      highlightedIds.add(nodeId);
      edges.forEach((e) => {
        if (e.source === nodeId) highlightedIds.add(e.target);
        if (e.target === nodeId) highlightedIds.add(e.source);
      });
      rendererRef.current?.applyHighlight(highlightedIds);
    },
    [highlightNode, edges]
  );

  const handleCanvasClick = useCallback(() => {
    resetHighlight();
    rendererRef.current?.resetHighlight();
  }, [resetHighlight]);

  useEffect(() => {
    if (
      !graphContainerRef.current ||
      graphSize.width === 0 ||
      graphSize.height === 0
    )
      return;

    if (!rendererRef.current) {
      rendererRef.current = new GraphRenderer({
        container: graphContainerRef.current,
        width: graphSize.width,
        height: graphSize.height,
        onNodeDoubleClick: handleNodeDoubleClick,
        onCanvasClick: handleCanvasClick,
      });
    } else {
      rendererRef.current.updateSize(graphSize.width, graphSize.height);
    }

    if (nodes.length > 0) {
      rendererRef.current.render(nodes, edges);
    }

    return () => {
      // 保留 renderer，size 变化时复用
    };
  }, [graphSize.width, graphSize.height]);

  useEffect(() => {
    if (rendererRef.current && nodes.length > 0) {
      rendererRef.current.render(nodes, edges);
    }
  }, [nodes, edges]);

  useEffect(() => {
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  const handleResetLayout = async () => {
    if (!rawData) return;
    const { nodes: initNodes, edges: initEdges } = createInitialGraphData(rawData);
    const result = await runForceLayout(
      initNodes,
      initEdges,
      graphSize.width || 800,
      graphSize.height || 600
    );
    setNodes(result.nodes);
    setEdges(result.edges);
  };

  const graphContent = (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
        }}
      >
        <FileUpload />
      </div>

      {rawData && (
        <button
          onClick={handleResetLayout}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 10,
            background: '#00D4AA',
            color: '#1A1A2E',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s, transform 0.1s',
            boxShadow: '0 2px 8px rgba(0, 212, 170, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00E6BB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#00D4AA';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.97)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          重置布局
        </button>
      )}

      <div
        ref={graphContainerRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />

      {!rawData && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            color: '#6A6A7E',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            style={{ marginBottom: '16px', opacity: 0.5 }}
          >
            <circle cx="12" cy="5" r="2" />
            <circle cx="5" cy="19" r="2" />
            <circle cx="19" cy="19" r="2" />
            <circle cx="12" cy="12" r="2" />
            <line x1="12" y1="7" x2="12" y2="10" />
            <line x1="10.5" y1="13.5" x2="6.5" y2="17.5" />
            <line x1="13.5" y1="13.5" x2="17.5" y2="17.5" />
          </svg>
          <div style={{ fontSize: '14px', marginBottom: '6px' }}>暂无数据</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            请点击左上角按钮上传 JSON 文件
          </div>
        </div>
      )}
    </div>
  );

  const dashboardContent = (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <DashboardUI />
    </div>
  );

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0A0A1A',
        display: 'flex',
        padding: '16px',
        gap: '16px',
        boxSizing: 'border-box',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        color: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          width: isMobile ? '100%' : '70%',
          height: '100%',
          background: '#0F0F23',
          borderRadius: '12px',
          border: '1px solid #2A2A3A',
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {graphContent}

        {isMobile && (
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 10,
              background: 'rgba(42, 42, 58, 0.9)',
              color: '#FFFFFF',
              border: '1px solid #3A3A4A',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            📊 数据面板
          </button>
        )}
      </motion.div>

      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          style={{
            width: '30%',
            height: '100%',
            background: '#1A1A2E',
            borderRadius: '12px',
            border: '1px solid #2A2A3A',
            boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {dashboardContent}
        </motion.div>
      )}

      <AnimatePresence>
        {isMobile && drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 100,
              }}
              onClick={() => setDrawerOpen(false)}
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
                width: '85%',
                maxWidth: '360px',
                background: '#1A1A2E',
                borderRadius: '12px 0 0 12px',
                border: '1px solid #2A2A3A',
                borderRight: 'none',
                boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.4)',
                zIndex: 101,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: '1px solid #2A2A3A',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 600 }}>数据面板</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#8A8AA0',
                    cursor: 'pointer',
                    fontSize: '20px',
                    padding: '0 4px',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>{dashboardContent}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
