import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { usePoemStore } from '@/stores/poemStore';
import { exportAsTxt } from '@/utils/export';
import { Toast } from './Toast';
import './PoemDetail.css';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function PoemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchPoemById, currentPoem, deletePoem } = usePoemStore();

  const [showExportToast, setShowExportToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      fetchPoemById(id).finally(() => setIsLoading(false));
    }
  }, [id, fetchPoemById]);

  const handleBack = () => {
    navigate('/');
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/editor/${id}`);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (confirm('确定要删除这首诗吗？')) {
      await deletePoem(id);
      navigate('/');
    }
  };

  const handleExport = () => {
    if (currentPoem) {
      exportAsTxt(currentPoem.title, currentPoem.content);
      setShowExportToast(true);
    }
  };

  const getPreviewHtml = () => {
    if (!currentPoem) return '';
    try {
      return marked.parse(currentPoem.content) as string;
    } catch {
      return currentPoem.content;
    }
  };

  if (isLoading) {
    return (
      <div className="poem-detail-page">
        <div className="loading-state">加载中...</div>
      </div>
    );
  }

  if (!currentPoem) {
    return (
      <div className="poem-detail-page">
        <div className="not-found-state">
          <p>诗歌不存在</p>
          <button className="back-btn" onClick={handleBack}>
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="poem-detail-page">
      <Toast
        message="导出成功"
        visible={showExportToast}
        duration={3000}
        onClose={() => setShowExportToast(false)}
      />

      <div className="detail-header">
        <button className="back-btn" onClick={handleBack}>
          ← 返回列表
        </button>
        <div className="detail-actions">
          <button className="action-btn edit-btn" onClick={handleEdit}>
            编辑
          </button>
          <button className="action-btn delete-btn" onClick={handleDelete}>
            删除
          </button>
          <button className="action-btn export-btn" onClick={handleExport}>
            导出TXT
          </button>
        </div>
      </div>

      <article className="poem-detail-content">
        <h1 className="poem-detail-title">{currentPoem.title || '无题'}</h1>
        <div className="poem-detail-meta">
          <span>创建于 {formatDate(currentPoem.createdAt)}</span>
          <span>最后编辑 {formatDate(currentPoem.updatedAt)}</span>
        </div>
        <div
          className="poem-detail-body"
          dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
        />
      </article>
    </div>
  );
}
