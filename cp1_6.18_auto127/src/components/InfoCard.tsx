import type { BoneNode } from '@/data/speciesData';
import './InfoCard.css';

interface InfoCardProps {
  node: BoneNode | null;
  onClose: () => void;
}

export function InfoCard({ node, onClose }: InfoCardProps) {
  if (!node) return null;

  return (
    <div className="info-card-overlay">
      <div className="info-card">
        <button className="close-button" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h3 className="info-card-title">{node.name}</h3>
        <div className="info-card-section">
          <h4 className="section-heading">功能描述</h4>
          <p className="section-text">{node.description}</p>
        </div>
        <div className="info-card-section">
          <h4 className="section-heading">形态对比</h4>
          <p className="section-text">{node.comparison}</p>
        </div>
      </div>
    </div>
  );
}
