import React, { useMemo } from 'react';
import { useStore, SceneNode } from '@/store/useStore';
import { UpOutlined, DownOutlined, BarChartOutlined } from '@ant-design/icons';
import './AppStats.css';

interface StatsPanelProps {
  expanded: boolean;
  onToggle: () => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ expanded, onToggle }) => {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const records = useStore((s) => s.records);

  const stats = useMemo(() => {
    const totalNodes = nodes.length;

    const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = records.length > 0 ? totalDuration / records.length : 0;

    const urlVisits = new Map<string, number>();
    records.forEach((r) => {
      urlVisits.set(r.url, (urlVisits.get(r.url) || 0) + 1);
    });
    let maxPath = 0;
    if (records.length > 0) {
      let currentPath = 1;
      for (let i = 1; i < records.length; i++) {
        if (records[i].url !== records[i - 1].url) {
          currentPath++;
        } else {
          maxPath = Math.max(maxPath, currentPath);
          currentPath = 1;
        }
      }
      maxPath = Math.max(maxPath, currentPath);
    }

    const sortedNodes = [...nodes].sort((a, b) => b.duration - a.duration);
    const topPages = sortedNodes.slice(0, 3);

    return {
      totalNodes,
      longestPath: maxPath,
      totalDuration,
      avgDuration,
      topPages,
    };
  }, [nodes, edges, records]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}分${secs}秒`;
  };

  const maxDuration = stats.topPages.length > 0 ? stats.topPages[0].duration : 1;

  return (
    <div className={`stats-panel ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="stats-header" onClick={onToggle}>
        <div className="stats-title">
          <BarChartOutlined style={{ color: '#E94560', marginRight: 8 }} />
          数据统计
        </div>
        <div className="stats-toggle-icon">
          {expanded ? <UpOutlined /> : <DownOutlined />}
        </div>
      </div>

      {expanded && (
        <div className="stats-content">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.totalNodes}</div>
              <div className="stat-label">总节点数</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.longestPath}</div>
              <div className="stat-label">最长路径</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatDuration(stats.totalDuration)}</div>
              <div className="stat-label">总浏览时长</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatDuration(stats.avgDuration)}</div>
              <div className="stat-label">平均停留</div>
            </div>
          </div>

          <div className="stats-hot-section">
            <div className="stats-subtitle">
              <span style={{ color: '#E94560' }}>★</span> 热点页面 Top 3
            </div>
            <div className="bar-chart">
              {stats.topPages.length === 0 && (
                <div className="empty-bars">暂无数据</div>
              )}
              {stats.topPages.map((node, index) => {
                const heightPercent = (node.duration / maxDuration) * 100;
                return (
                  <div key={node.id} className="bar-item">
                    <div className="bar-label" title={node.title}>
                      {node.title.length > 8 ? node.title.slice(0, 8) + '...' : node.title}
                    </div>
                    <div className="bar-container">
                      <div
                        className="bar-fill bounce-bar"
                        style={{
                          height: `${Math.max(heightPercent, 5)}%`,
                          background: `linear-gradient(180deg, #E94560 0%, #533483 100%)`,
                          animationDelay: `${index * 0.1}s`,
                        }}
                      >
                        <span className="bar-value">{node.duration}s</span>
                      </div>
                    </div>
                    <div className="bar-rank">
                      #{index + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
