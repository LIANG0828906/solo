import React, { useState } from 'react';
import { useStore } from '../store';
import type { CodeSnippet } from '../api';

const FolderModal: React.FC<{
  codeId: string;
  currentFolderId: string;
  onClose: () => void;
}> = ({ codeId, currentFolderId, onClose }) => {
  const folders = useStore((s) => s.folders);
  const addFolder = useStore((s) => s.addFolder);
  const editCode = useStore((s) => s.editCode);
  const showToast = useStore((s) => s.showToast);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  const handleSelect = async (folderId: string) => {
    await editCode(codeId, { folderId });
    showToast('已收藏到文件夹');
    onClose();
  };

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    const folder = await addFolder({ name: newFolderName.trim() });
    await editCode(codeId, { folderId: folder.id });
    showToast('已创建文件夹并收藏');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16, fontSize: 18, color: 'var(--primary)' }}>收藏到文件夹</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => handleSelect(f.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                border: f.id === currentFolderId ? '2px solid var(--accent)' : '1px solid #e0e0e0',
                borderRadius: 8,
                background: f.id === currentFolderId ? '#fff8e1' : '#fff',
                cursor: 'pointer',
                fontSize: 14,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (f.id !== currentFolderId) e.currentTarget.style.background = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                if (f.id !== currentFolderId) e.currentTarget.style.background = '#fff';
              }}
            >
              <span className="material-icons" style={{ fontSize: 18, marginRight: 8, color: 'var(--accent)' }}>
                folder
              </span>
              {f.name}
              {f.id === currentFolderId && (
                <span className="material-icons" style={{ fontSize: 16, color: 'var(--accent)' }}>
                  check
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
          {showNewFolder ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="文件夹名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleCreate}
                style={{
                  padding: '8px 16px',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                创建
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: '1px dashed #ccc',
                borderRadius: 6,
                padding: '8px 14px',
                cursor: 'pointer',
                width: '100%',
                color: '#888',
                fontSize: 14,
              }}
            >
              <span className="material-icons" style={{ fontSize: 18 }}>add</span>
              新建文件夹
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 12,
            width: '100%',
            padding: 8,
            background: '#f5f5f5',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            color: '#666',
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
};

export const CodeDetailPage: React.FC = () => {
  const detailCodeId = useStore((s) => s.detailCodeId);
  const codes = useStore((s) => s.codes);
  const editCode = useStore((s) => s.editCode);
  const showToast = useStore((s) => s.showToast);
  const setDetailCodeId = useStore((s) => s.setDetailCodeId);
  const [showFolderModal, setShowFolderModal] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState('');
  const [editDesc, setEditDesc] = React.useState('');

  const code = codes.find((c) => c.id === detailCodeId);

  if (!code) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        <span className="material-icons" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>
          error_outline
        </span>
        代码片段未找到
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.code);
      showToast('已复制到剪贴板');
    } catch {
      showToast('复制失败，请手动复制');
    }
  };

  const handleStartEdit = () => {
    setEditTitle(code.title);
    setEditDesc(code.description);
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    await editCode(code.id, { title: editTitle, description: editDesc });
    setEditing(false);
    showToast('已保存修改');
  };

  const lines = code.code.split('\n');

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <button
        onClick={() => setDetailCodeId(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          color: 'var(--primary)',
          cursor: 'pointer',
          fontSize: 14,
          marginBottom: 20,
          padding: '6px 12px',
          borderRadius: 20,
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(96,125,139,0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        <span className="material-icons" style={{ fontSize: 18 }}>arrow_back</span>
        返回列表
      </button>

      <div style={{ marginBottom: 20 }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{
                fontSize: 22,
                fontWeight: 700,
                border: '1px solid #e0e0e0',
                borderRadius: 6,
                padding: '8px 12px',
                outline: 'none',
              }}
            />
            <input
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="添加描述..."
              style={{
                fontSize: 14,
                border: '1px solid #e0e0e0',
                borderRadius: 6,
                padding: '8px 12px',
                outline: 'none',
                color: '#666',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '6px 16px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                保存
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: '6px 16px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#666',
                }}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#333' }}>{code.title}</h2>
              <button
                onClick={handleStartEdit}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999',
                  padding: 4,
                  display: 'flex',
                }}
              >
                <span className="material-icons" style={{ fontSize: 18 }}>edit</span>
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <span
                style={{
                  background: '#e3f2fd',
                  color: '#1565c0',
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                }}
              >
                {code.language}
              </span>
              {code.description && (
                <span style={{ color: '#777', fontSize: 14 }}>{code.description}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div className="code-block" style={{ margin: 0, borderRadius: 0 }}>
          {lines.map((line, i) => (
            <div key={i}>
              <span className="line-number">{i + 1}</span>
              {line}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            background: 'var(--copy-btn)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'transform 0.15s, box-shadow 0.15s',
            boxShadow: '0 2px 4px rgba(33,150,243,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(33,150,243,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(33,150,243,0.3)';
          }}
        >
          <span className="material-icons" style={{ fontSize: 18 }}>content_copy</span>
          复制代码
        </button>

        <button
          onClick={() => setShowFolderModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            background: 'var(--folder-btn)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'transform 0.15s, box-shadow 0.15s',
            boxShadow: '0 2px 4px rgba(76,175,80,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(76,175,80,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(76,175,80,0.3)';
          }}
        >
          <span className="material-icons" style={{ fontSize: 18 }}>folder_special</span>
          收藏到文件夹
        </button>
      </div>

      {showFolderModal && (
        <FolderModal
          codeId={code.id}
          currentFolderId={code.folderId}
          onClose={() => setShowFolderModal(false)}
        />
      )}
    </div>
  );
};
