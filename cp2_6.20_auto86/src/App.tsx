import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import FlowCanvas from './components/FlowCanvas';
import NodeEditor from './components/NodeEditor';
import Toolbar from './components/Toolbar';
import useFlowStore from './store/useFlowStore';
import socketClient from './socket/socketClient';
import type { MindMapNode, MindMapEdge } from './types';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [mindmapId, setMindmapId] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      const userId = `user-${Date.now()}`;
      const targetMindmapId = mindmapId.trim() || `mindmap-${Date.now()}`;
      navigate(`/mindmap/${targetMindmapId}?userId=${userId}&name=${encodeURIComponent(username)}`);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            style={{ marginBottom: '16px' }}
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '8px',
            }}
          >
            协同思维导图
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            实时协作，创意无限
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 200ms ease, box-shadow 200ms ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              思维导图ID（可选）
            </label>
            <input
              type="text"
              value={mindmapId}
              onChange={(e) => setMindmapId(e.target.value)}
              placeholder="留空则创建新的思维导图"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 200ms ease, box-shadow 200ms ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!username.trim()}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: username.trim() ? '#6366f1' : '#c7d2fe',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: username.trim() ? 'pointer' : 'not-allowed',
              transition: 'background-color 200ms ease',
            }}
            onMouseEnter={(e) => {
              if (username.trim()) {
                e.currentTarget.style.backgroundColor = '#4f46e5';
              }
            }}
            onMouseLeave={(e) => {
              if (username.trim()) {
                e.currentTarget.style.backgroundColor = '#6366f1';
              }
            }}
          >
            进入协作
          </button>
        </form>
      </div>
    </div>
  );
};

const MindMapPage: React.FC = () => {
  const { id: mindmapId } = useParams<{ id: string }>();
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const userId = searchParams.get('userId') || '';
  const userName = searchParams.get('name') || '';
  const { setMindmapId, setUserId, initializeFromData, setZoomLevel, zoomLevel } = useFlowStore();
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || !mindmapId) {
      navigate('/');
      return;
    }

    setMindmapId(mindmapId);
    setUserId(userId);

    const mockNodes: MindMapNode[] = [
      {
        id: 'node-1',
        title: '中心主题',
        note: '这是思维导图的中心节点',
        color: '#ffffff',
        fontSize: 18,
        x: 400,
        y: 300,
      },
      {
        id: 'node-2',
        title: '分支一',
        note: '第一个分支的备注信息',
        color: '#eff6ff',
        fontSize: 16,
        x: 650,
        y: 200,
      },
      {
        id: 'node-3',
        title: '分支二',
        note: '',
        color: '#f0fdf4',
        fontSize: 16,
        x: 650,
        y: 400,
      },
      {
        id: 'node-4',
        title: '子分支',
        note: '子节点详情',
        color: '#fefce8',
        fontSize: 14,
        x: 880,
        y: 180,
      },
    ];

    const mockEdges: MindMapEdge[] = [
      { id: 'e-1-2', source: 'node-1', target: 'node-2' },
      { id: 'e-1-3', source: 'node-1', target: 'node-3' },
      { id: 'e-2-4', source: 'node-2', target: 'node-4' },
    ];

    initializeFromData(mockNodes, mockEdges);

    try {
      socketClient.connect(userId, mindmapId);
      setIsConnected(true);
    } catch (error) {
      console.warn('WebSocket connection failed, working in offline mode');
    }

    return () => {
      socketClient.disconnect();
    };
  }, [mindmapId, userId, setMindmapId, setUserId, initializeFromData, navigate]);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(3.0, zoomLevel + 0.1);
    setZoomLevel(newZoom);
  }, [zoomLevel, setZoomLevel]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(0.2, zoomLevel - 0.1);
    setZoomLevel(newZoom);
  }, [zoomLevel, setZoomLevel]);

  const handleZoomChange = useCallback(
    (zoom: number) => {
      setZoomLevel(zoom);
    },
    [setZoomLevel]
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Toolbar
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      <div
        style={{
          position: 'absolute',
          top: '56px',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f9fafb',
        }}
      >
        <FlowCanvas onZoomChange={handleZoomChange} />
      </div>

      <NodeEditor />

      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#22c55e' : '#ef4444',
          }}
        />
        <span style={{ fontSize: '12px', color: '#374151' }}>
          {userName || '匿名用户'}
        </span>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>|</span>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          {mindmapId?.slice(0, 12)}...
        </span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/mindmap/:id" element={<MindMapPage />} />
    </Routes>
  );
};

export default App;
