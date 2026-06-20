import React from 'react';
import { DiffSegment } from '../VersionManager';
import { Snapshot } from '../store';

interface CompareModalProps {
  current: {
    weibo: string;
    officialAccount: string;
    seo: string;
  };
  target: Snapshot;
  diff: {
    weiboDiff: DiffSegment[];
    officialAccountDiff: DiffSegment[];
    seoDiff: DiffSegment[];
  };
  onClose: () => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const DiffRenderer: React.FC<{ segments: DiffSegment[] }> = ({ segments }) => (
  <span className="diff-text">
    {segments.map((seg, i) => {
      if (seg.type === 'added') {
        return (
          <span key={i} className="diff-added">
            {seg.text}
          </span>
        );
      }
      if (seg.type === 'removed') {
        return (
          <span key={i} className="diff-removed">
            {seg.text}
          </span>
        );
      }
      return <span key={i}>{seg.text}</span>;
    })}
    {segments.length === 0 && <span style={{ color: '#999' }}>（空）</span>}
  </span>
);

export const CompareModal: React.FC<CompareModalProps> = ({
  current,
  target,
  diff,
  onClose,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">版本对比</span>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="compare-col current">
            <div className="compare-col-label">当前版本（最新编辑）</div>
            <div className="compare-card">
              <div className="compare-card-title">微博帖</div>
              <DiffRenderer segments={diff.weiboDiff} />
            </div>
            <div className="compare-card">
              <div className="compare-card-title">公众号摘要</div>
              <DiffRenderer segments={diff.officialAccountDiff} />
            </div>
            <div className="compare-card">
              <div className="compare-card-title">SEO描述</div>
              <DiffRenderer segments={diff.seoDiff} />
            </div>
          </div>
          <div className="compare-col">
            <div className="compare-col-label">
              选中版本（{formatTime(target.timestamp)}）
            </div>
            <div className="compare-card">
              <div className="compare-card-title">微博帖</div>
              <span className="diff-text">{target.weibo || '（空）'}</span>
            </div>
            <div className="compare-card">
              <div className="compare-card-title">公众号摘要</div>
              <span className="diff-text">{target.officialAccount || '（空）'}</span>
            </div>
            <div className="compare-card">
              <div className="compare-card-title">SEO描述</div>
              <span className="diff-text">{target.seo || '（空）'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
