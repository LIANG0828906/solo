import React, { useState, useEffect } from 'react';
import MindmapCanvas from './components/MindmapCanvas';
import NodeDetailPanel from './components/NodeDetailPanel';
import OutlinePanel from './components/OutlinePanel';
import Toolbar from './components/Toolbar';
import { useMindmapStore } from './store/mindmapStore';
import { mindmapApi } from './api/mindmapApi';
import { MindmapNode, Task } from './types';

const App: React.FC = () => {
  const { saveToast, selectedNodeId, loadMindmap } = useMindmapStore();
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addingTaskForNodeId, setAddingTaskForNodeId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActivePanel, setMobileActivePanel] = useState<'outline' | 'detail' | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setOutlineOpen(false);
      setDetailOpen(false);
    } else {
      setOutlineOpen(true);
      setDetailOpen(!!selectedNodeId);
    }
  }, [isMobile]);

  useEffect(() => {
    if (selectedNodeId) {
      if (isMobile) {
        setMobileActivePanel('detail');
      } else {
        setDetailOpen(true);
      }
    }
  }, [selectedNodeId, isMobile]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await mindmapApi.loadMindmap();
        if (data.nodes && data.nodes.length > 0) {
          const nodes: MindmapNode[] = data.nodes.map((n: any) => ({
            id: n.id,
            title: n.title,
            description: n.description || '',
            position_x: n.position_x,
            position_y: n.position_y,
            parent_id: n.parent_id,
          }));
          const tasks: Task[] = (data.tasks || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            due_date: t.due_date,
            assignee: t.assignee,
            priority: t.priority as 'high' | 'medium' | 'low',
            completed: Boolean(t.completed),
            node_id: t.node_id,
          }));
          loadMindmap(nodes, tasks);
        }
      } catch (err) {
        console.log('No existing mindmap data found');
      }
    };
    loadData();
  }, [loadMindmap]);

  const handleAddTask = (nodeId: string) => {
    setAddingTaskForNodeId(nodeId);
    if (isMobile) {
      setMobileActivePanel('detail');
    } else {
      setDetailOpen(true);
    }
  };

  const handleNodeClick = (_nodeId: string) => {
    if (!isMobile) {
      setDetailOpen(true);
    }
  };

  const handleCloseDetail = () => {
    if (isMobile) {
      setMobileActivePanel(null);
    } else {
      setDetailOpen(false);
    }
    setAddingTaskForNodeId(null);
  };

  const handleCloseOutline = () => {
    if (isMobile) {
      setMobileActivePanel(null);
    } else {
      setOutlineOpen(false);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e1e2e 0%, #181825 100%)',
        overflow: 'hidden',
        position: 'relative',
      }}
      className="app-container"
    >
      <Toolbar isMobile={isMobile} />

      {!isMobile && (
        <button
          onClick={() => setOutlineOpen(!outlineOpen)}
          style={{
            position: 'fixed',
            top: '50%',
            left: outlineOpen ? '320px' : '0',
            transform: 'translateY(-50%)',
            zIndex: 90,
            backgroundColor: 'rgba(30,30,46,0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderLeft: 'none',
            color: '#fff',
            width: '24px',
            height: '48px',
            borderRadius: '0 8px 8px 0',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'left 0.3s ease-out',
          }}
        >
          {outlineOpen ? '‹' : '›'}
        </button>
      )}

      {!isMobile && (
        <button
          onClick={() => setDetailOpen(!detailOpen)}
          style={{
            position: 'fixed',
            top: '50%',
            right: detailOpen ? '400px' : '0',
            transform: 'translateY(-50%)',
            zIndex: 90,
            backgroundColor: 'rgba(30,30,46,0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRight: 'none',
            color: '#fff',
            width: '24px',
            height: '48px',
            borderRadius: '8px 0 0 8px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'right 0.3s ease-out',
          }}
        >
          {detailOpen ? '›' : '‹'}
        </button>
      )}

      <OutlinePanel
        isOpen={isMobile ? mobileActivePanel === 'outline' : outlineOpen}
        onClose={handleCloseOutline}
        isMobile={isMobile}
      />

      <NodeDetailPanel
        isOpen={isMobile ? mobileActivePanel === 'detail' : detailOpen}
        onClose={handleCloseDetail}
        addingTaskForNodeId={addingTaskForNodeId}
        setAddingTaskForNodeId={setAddingTaskForNodeId}
        isMobile={isMobile}
      />

      {isMobile && (
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 80,
            display: 'flex',
            gap: '12px',
            backgroundColor: 'rgba(30,30,46,0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50px',
            padding: '8px 16px',
          }}
        >
          <button
            onClick={() => setMobileActivePanel(mobileActivePanel === 'outline' ? null : 'outline')}
            style={{
              padding: '8px 16px',
              borderRadius: '50px',
              border: 'none',
              backgroundColor: mobileActivePanel === 'outline' ? '#3b82f6' : 'transparent',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            📋 大纲
          </button>
          <button
            onClick={() => setMobileActivePanel(mobileActivePanel === 'detail' ? null : 'detail')}
            style={{
              padding: '8px 16px',
              borderRadius: '50px',
              border: 'none',
              backgroundColor: mobileActivePanel === 'detail' ? '#3b82f6' : 'transparent',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ✏️ 详情
          </button>
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        <MindmapCanvas onAddTask={handleAddTask} onNodeClick={handleNodeClick} />
      </div>

      {saveToast && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#52c41a',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            zIndex: 300,
            animation: 'fadeInDown 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          ✓ 已保存
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .react-flow__controls {
          background: rgba(30, 30, 46, 0.9) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
        }

        .react-flow__controls-button {
          background: transparent !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
          color: #fff !important;
        }

        .react-flow__controls-button svg {
          fill: #fff !important;
        }

        .react-flow__controls-button:hover {
          background: rgba(255,255,255,0.1) !important;
        }

        @media (max-width: 768px) {
          .custom-node {
            font-size: 14px !important;
          }

          .react-flow__controls {
            bottom: 80px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
