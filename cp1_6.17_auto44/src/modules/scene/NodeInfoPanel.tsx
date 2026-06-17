import React from 'react';
import { Html } from '@react-three/drei';
import { SceneNode, BrowsingRecord } from '@/store/useStore';

interface NodeInfoPanelProps {
  node: SceneNode;
  records: BrowsingRecord[];
}

const NodeInfoPanel: React.FC<NodeInfoPanelProps> = ({ node, records }) => {
  const sourceRecord = records.find((r) => r.url === node.url);
  const sourceUrl = sourceRecord?.source || '直接访问';

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <Html
      position={[node.position[0], node.position[1] + 0.8, node.position[2]]}
      center
      style={{ pointerEvents: 'none }}
    >
      <div className="node-info-panel">
        <div className="info-title" title={node.title}>
          {node.title}
        </div>
        <div className="info-divider" />
        <div className="info-row">
          <span className="info-label">URL</span>
          <span className="info-value info-url" title={node.url}>
          {node.url}
        </span>
        </div>
        <div className="info-row">
          <span className="info-label">停留时长</span>
          <span className="info-value info-duration">
            {formatDuration(node.duration)}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">进入来源</span>
          <span className="info-value info-source" title={sourceUrl}>
          {sourceUrl.length > 20 ? sourceUrl.slice(0, 20) + '...' : sourceUrl}
        </span>
        </div>
        <div className="info-row">
          <span className="info-label">访问次数</span>
          <span className="info-value info-visits">
            {node.visitCount} 次
          </span>
        </div>
      </div>
    </Html>
  );
};

export default NodeInfoPanel;
