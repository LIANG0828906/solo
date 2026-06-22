import React, { useState } from 'react';
import { FileItem } from './fileData';
import { GenealogyEdge, computeDiff, DiffLine } from './FileGenealogy';

interface DetailPanelProps {
  selectedFile: FileItem | null;
  originalSource: FileItem | null;
  descendants: { file: FileItem; similarity: number }[];
  onNavigateToFile: (fileId: string) => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  selectedFile,
  originalSource,
  descendants,
  onNavigateToFile,
}) => {
  const [showDiff, setShowDiff] = useState(false);
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getContentPreview = (content: string) => {
    if (content.length <= 100) return content;
    return content.slice(0, 100) + '...';
  };

  const handleCompare = () => {
    if (selectedFile && originalSource) {
      const diff = computeDiff(originalSource.content, selectedFile.content);
      setDiffLines(diff);
      setShowDiff(true);
    }
  };

  const closeModal = () => {
    setShowDiff(false);
    setDiffLines([]);
  };

  if (!selectedFile) {
    return (
      <div className="right-panel">
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <div>选择一个文件查看详情</div>
        </div>
      </div>
    );
  }

  return (
    <div className="right-panel">
      <div className="detail-title">{selectedFile.name}</div>

      <div className="detail-section">
        <div className="detail-label">上传时间</div>
        <div className="detail-value">{formatTime(selectedFile.timestamp)}</div>
      </div>

      <div className="detail-section">
        <div className="detail-label">文件类型</div>
        <div className="detail-value">
          {selectedFile.type === 'txt' ? '文本文件 (.txt)' : 'Markdown (.md)'}
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-label">内容预览</div>
        <div className="detail-content-preview">
          {getContentPreview(selectedFile.content)}
        </div>
      </div>

      {originalSource && (
        <div className="detail-section">
          <div className="detail-label">原始来源</div>
          <span
            className="link"
            onClick={() => onNavigateToFile(originalSource.id)}
          >
            {originalSource.name}
          </span>
          <button className="compare-btn" onClick={handleCompare}>
            与原始对比
          </button>
        </div>
      )}

      {descendants.length > 0 && (
        <div className="detail-section">
          <div className="detail-label">衍生文件 ({descendants.length})</div>
          <div>
            {descendants.map(d => (
              <div key={d.file.id} className="descendant-item">
                <span
                  className="link"
                  onClick={() => onNavigateToFile(d.file.id)}
                  style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {d.file.name}
                </span>
                <span className="similarity-badge">
                  {Math.round(d.similarity * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDiff && originalSource && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">版本对比</div>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="diff-container">
              <div className="diff-panel left">
                <div className="diff-panel-title">原始: {originalSource.name}</div>
                {diffLines.map((line, index) => (
                  line.type !== 'added' && (
                    <div
                      key={`old-${index}`}
                      className={`diff-line ${line.type === 'removed' ? 'removed' : 'unchanged'}`}
                    >
                      {line.content || ' '}
                    </div>
                  )
                ))}
              </div>
              <div className="diff-panel">
                <div className="diff-panel-title">当前: {selectedFile.name}</div>
                {diffLines.map((line, index) => (
                  line.type !== 'removed' && (
                    <div
                      key={`new-${index}`}
                      className={`diff-line ${line.type === 'added' ? 'added' : 'unchanged'}`}
                    >
                      {line.content || ' '}
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailPanel;
