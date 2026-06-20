import { useMemo, useState } from 'react';
import { useSceneStore } from '../store/sceneStore';
import {
  exportConfig,
  configToJson,
  downloadJson,
  copyToClipboard,
  highlightJson
} from '../utils/exportConfig';

interface ExportModalProps {
  onClose: () => void;
}

function ExportModal({ onClose }: ExportModalProps) {
  const { geometries, lighting } = useSceneStore();
  const [copied, setCopied] = useState(false);

  const jsonStr = useMemo(() => {
    const config = exportConfig(geometries, lighting);
    return configToJson(config);
  }, [geometries, lighting]);

  const highlightedHtml = useMemo(() => highlightJson(jsonStr), [jsonStr]);

  const handleCopy = async () => {
    const success = await copyToClipboard(jsonStr);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadJson(jsonStr);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">导出场景配置</div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <pre className="json-display" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        <div className="modal-actions">
          <button className="modal-btn modal-btn-secondary" onClick={handleCopy}>
            {copied ? '已复制!' : '复制到剪贴板'}
          </button>
          <button className="modal-btn modal-btn-primary" onClick={handleDownload}>
            下载 JSON
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportModal;
