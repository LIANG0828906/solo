import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Cluster } from '../shared/types';

interface ClusterListPanelProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function ClusterListPanel({ collapsed, onToggle }: ClusterListPanelProps) {
  const clusters = useAppStore(state => state.clusters);
  const ideas = useAppStore(state => state.ideas);
  const selectedClusterId = useAppStore(state => state.selectedClusterId);
  const selectCluster = useAppStore(state => state.selectCluster);
  const updateClusterName = useAppStore(state => state.updateClusterName);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleClusterClick = (cluster: Cluster) => {
    if (selectedClusterId === cluster.id) {
      selectCluster(null);
    } else {
      selectCluster(cluster.id);
    }
  };

  const handleDoubleClick = (cluster: Cluster) => {
    setEditingId(cluster.id);
    setEditingName(cluster.name);
  };

  const handleSaveName = () => {
    if (editingId && editingName.trim()) {
      updateClusterName(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const getClusterCount = (clusterId: string) => {
    return ideas.filter(i => i.clusterId === clusterId).length;
  };

  return (
    <div
      style={{
        width: collapsed ? 48 : 250,
        height: '100%',
        background: '#1A1A2E',
        borderRadius: 16,
        borderRight: '3px solid #FFE66D',
        boxShadow: '0 0 20px rgba(255, 230, 109, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        position: 'relative'
      }}
    >
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: 16,
          left: collapsed ? 12 : 8,
          width: 24,
          height: 24,
          borderRadius: 6,
          background: '#2D2D44',
          border: 'none',
          color: '#FFE66D',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          transition: 'all 0.2s ease',
          zIndex: 10
        }}
      >
        {collapsed ? '←' : '→'}
      </button>

      {!collapsed && (
        <>
          <div
            style={{
              padding: '24px 20px 16px',
              borderBottom: '1px solid #2A2A44'
            }}
          >
            <h2
              style={{
                color: '#FFE66D',
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
                marginBottom: 4,
                letterSpacing: 1,
                textAlign: 'right'
              }}
            >
              星群列表 ✦
            </h2>
            <p
              style={{
                color: '#8888AA',
                fontSize: 12,
                margin: 0,
                textAlign: 'right'
              }}
            >
              共 {clusters.length} 个星群
            </p>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 8
            }}
          >
            {clusters.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: '#555577',
                  fontSize: 13
                }}
              >
                添加灵感后<br />自动形成星群
              </div>
            ) : (
              clusters.map(cluster => (
                <div
                  key={cluster.id}
                  onClick={() => handleClusterClick(cluster)}
                  onDoubleClick={() => handleDoubleClick(cluster)}
                  style={{
                    height: 48,
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderRadius: 8,
                    cursor: 'pointer',
                    marginBottom: 4,
                    background: selectedClusterId === cluster.id
                      ? 'rgba(255, 230, 109, 0.15)'
                      : 'transparent',
                    border: selectedClusterId === cluster.id
                      ? '1px solid rgba(255, 230, 109, 0.4)'
                      : '1px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    if (selectedClusterId !== cluster.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (selectedClusterId !== cluster.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: cluster.color,
                      boxShadow: `0 0 8px ${cluster.color}80`,
                      flexShrink: 0
                    }}
                  />
                  
                  {editingId === cluster.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={handleSaveName}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditingName('');
                        }
                      }}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                      style={{
                        width: 160,
                        height: 28,
                        padding: '0 8px',
                        borderRadius: 4,
                        background: '#2D2D44',
                        border: '1px solid #FFE66D',
                        color: '#FFFFFF',
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <>
                      <span
                        style={{
                          flex: 1,
                          color: '#FFFFFF',
                          fontSize: 13,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {cluster.name}
                      </span>
                      <span
                        style={{
                          color: '#666688',
                          fontSize: 11,
                          background: '#2D2D44',
                          padding: '2px 8px',
                          borderRadius: 10
                        }}
                      >
                        {getClusterCount(cluster.id)}
                      </span>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div
            style={{
              padding: 12,
              borderTop: '1px solid #2A2A44',
              color: '#666688',
              fontSize: 11,
              textAlign: 'center'
            }}
          >
            双击星群可重命名
          </div>
        </>
      )}

      {collapsed && (
        <div
          style={{
            padding: '50px 12px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#FFE66D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0A0A2E',
              fontSize: 14,
              fontWeight: 700
            }}
          >
            ★
          </div>
          {clusters.slice(0, 8).map(cluster => (
            <div
              key={cluster.id}
              title={cluster.name}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: cluster.color,
                boxShadow: `0 0 6px ${cluster.color}80`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
