import { useState } from 'react';
import { useTemplateStore } from './templateStore';

export default function TemplateManager() {
  const templates = useTemplateStore((state) => state.templates);
  const currentTemplateId = useTemplateStore((state) => state.currentTemplateId);
  const switchTemplate = useTemplateStore((state) => state.switchTemplate);
  const createTemplate = useTemplateStore((state) => state.createTemplate);
  const deleteTemplate = useTemplateStore((state) => state.deleteTemplate);
  const renameTemplate = useTemplateStore((state) => state.renameTemplate);

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      renameTemplate(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div
      className="template-manager"
      style={{
        backgroundColor: '#2D2D3F',
        padding: 8,
        color: '#E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 14,
          padding: '4px 4px 8px',
          borderBottom: '1px solid #444444',
          flexShrink: 0,
        }}
      >
        模板库
      </div>

      <input
        type="text"
        placeholder="搜索模板..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: '6px 10px',
          backgroundColor: '#1E1E2E',
          border: '1px solid #444444',
          borderRadius: 6,
          color: '#E0E0E0',
          fontSize: 13,
          outline: 'none',
          flexShrink: 0,
        }}
      />

      <button
        onClick={() => createTemplate()}
        style={{
          padding: '8px 12px',
          backgroundColor: '#3B82F6',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        + 新建模板
      </button>

      <div
        className="template-list"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingRight: 2,
        }}
      >
        {filtered.map((template) => {
          const isActive = template.id === currentTemplateId;
          const isEditing = editingId === template.id;
          return (
            <div
              key={template.id}
              onClick={() => !isEditing && switchTemplate(template.id)}
              style={{
                backgroundColor: isActive ? '#3B3B52' : '#23233A',
                border: isActive ? '1px solid #3B82F6' : '1px solid #444444',
                borderRadius: 8,
                padding: 8,
                cursor: isEditing ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'background-color 0.15s',
              }}
            >
              {template.thumbnail ? (
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  style={{
                    width: '100%',
                    height: 90,
                    objectFit: 'cover',
                    borderRadius: 4,
                    backgroundColor: '#1E1E2E',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 90,
                    backgroundColor: '#1E1E2E',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666666',
                    fontSize: 12,
                  }}
                >
                  暂无缩略图
                </div>
              )}

              {isEditing ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value.slice(0, 30))}
                  onBlur={() => handleRename(template.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(template.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  maxLength={30}
                  style={{
                    padding: '4px 6px',
                    backgroundColor: '#1E1E2E',
                    border: '1px solid #3B82F6',
                    borderRadius: 4,
                    color: '#E0E0E0',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {template.name}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartRename(template.id, template.name);
                  }}
                  style={{
                    padding: '3px 10px',
                    backgroundColor: 'transparent',
                    color: '#AAAAAA',
                    border: '1px solid #444444',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`确定删除模板"${template.name}"？`)) {
                      deleteTemplate(template.id);
                    }
                  }}
                  style={{
                    padding: '3px 10px',
                    backgroundColor: 'transparent',
                    color: '#EF4444',
                    border: '1px solid #444444',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ color: '#888888', fontSize: 12, padding: 12, textAlign: 'center' }}>
            未找到匹配的模板
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) and (max-width: 1024px) {
          .template-manager {
            width: 230px !important;
          }
          .template-list > div {
            padding: 6px !important;
            gap: 4px !important;
          }
          .template-list img,
          .template-list > div > div:first-of-type {
            height: 70px !important;
          }
        }
        @media (max-width: 767px) {
          .template-manager {
            width: 100% !important;
            height: 60px !important;
            flex-direction: row !important;
            align-items: center !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
          }
          .template-manager > *:not(:nth-last-child(-n+2)) {
            flex-shrink: 0 !important;
          }
          .template-list {
            flex-direction: row !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            width: auto !important;
            flex: none !important;
            height: 100% !important;
            white-space: nowrap !important;
            align-items: center !important;
          }
          .template-list > * {
            flex-shrink: 0 !important;
            width: 140px !important;
            display: inline-flex !important;
            white-space: nowrap !important;
          }
          .template-list > div > div:first-of-type,
          .template-list img {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
