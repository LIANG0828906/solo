import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAppStore } from '@/store';
import styles from './DocumentList.module.css';

function DocumentList() {
  const navigate = useNavigate();
  const documents = useAppStore((state) => state.documents);
  const addDocument = useAppStore((state) => state.addDocument);
  const removeDocument = useAppStore((state) => state.removeDocument);
  const getAnnotationsForDocument = useAppStore((state) => state.getAnnotationsForDocument);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleCreateDocument = useCallback(async () => {
    if (!title.trim()) return;

    const doc = await addDocument(title.trim(), content.trim());
    setShowModal(false);
    setTitle('');
    setContent('');
    navigate(`/document/${doc.id}`);
  }, [title, content, addDocument, navigate]);

  const handleDeleteDocument = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm('确定要删除这个文档吗？')) {
        await removeDocument(id);
      }
    },
    [removeDocument],
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>CollabNote 协作批注</h1>
          <button className={styles.addButton} onClick={() => setShowModal(true)}>
            + 新建文档
          </button>
        </div>
      </header>

      <main className={styles.container}>
        {documents.length === 0 ? (
          <div className={styles.emptyState}>
            <p>还没有文档，点击右上角"新建文档"开始创建</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {documents.map((doc) => {
              const annotations = getAnnotationsForDocument(doc.id);
              return (
                <div
                  key={doc.id}
                  className={styles.card}
                  onClick={() => navigate(`/document/${doc.id}`)}
                >
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => handleDeleteDocument(e, doc.id)}
                  >
                    ×
                  </button>
                  <h3 className={styles.cardTitle}>{doc.title}</h3>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardDate}>
                      {format(new Date(doc.updatedAt), 'yyyy-MM-dd')}
                    </span>
                    <span className={styles.badge}>{annotations.length} 条批注</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>新建文档</h2>
            <div className={styles.formGroup}>
              <label>文档标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入文档标题"
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label>初始内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入文档初始内容（可选）"
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={() => setShowModal(false)}>
                取消
              </button>
              <button className={styles.submitButton} onClick={handleCreateDocument}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentList;
