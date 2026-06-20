import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContractHistory } from '../types';
import { downloadPDF } from '../utils/pdfGenerator';

function HistoryPreview() {
  const { historyId } = useParams<{ historyId: string }>();
  const navigate = useNavigate();
  const [history, setHistory] = useState<ContractHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [ripple, setRipple] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/history/${historyId}`);
        if (!response.ok) {
          navigate('/');
          return;
        }
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error('Failed to fetch history:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [historyId, navigate]);

  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!history) return;

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setRipple({
        show: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setTimeout(() => setRipple({ ...ripple, show: false }), 300);
    }

    const filename = `${history.templateName}_${history.partyAName}_${new Date(history.generatedAt).getTime()}.pdf`;
    downloadPDF(history.templateId, history.variables, filename);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!history) {
    return <div className="loading">记录不存在</div>;
  }

  return (
    <div className="history-preview">
      <header className="editor-header">
        <button className="back-btn" onClick={handleBack}>
          ← 返回
        </button>
        <h1>{history.templateName}</h1>
        <p className="template-desc">
          甲方：{history.partyAName} | 生成时间：{formatDate(history.generatedAt)}
        </p>
      </header>

      <div className="preview-container">
        <div className="preview-header">
          <h2>合同预览</h2>
          <button
            ref={buttonRef}
            className="download-btn"
            onClick={handleDownload}
          >
            {ripple.show && (
              <span
                className="ripple"
                style={{ left: ripple.x, top: ripple.y }}
              ></span>
            )}
            下载PDF
          </button>
        </div>

        <div className="pdf-preview">
          <div
            className="pdf-html-preview"
            dangerouslySetInnerHTML={{ __html: history.htmlPreview }}
          />
        </div>
      </div>
    </div>
  );
}

export default HistoryPreview;
