import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { NodeData, RelationData, TAGS, TAG_COLORS, RELATION_TYPES, RELATION_STYLES } from '../types';

interface NoteEditorProps {
  node: NodeData | null;
  relations: RelationData[];
  allNodes: NodeData[];
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: (data: Partial<NodeData>) => void;
  onDelete: () => void;
  onNodeSelect: (nodeId: string) => void;
  onAddRelation: (targetId: string, type: string) => void;
  onDeleteRelation: (relationId: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  node,
  relations,
  allNodes,
  isEditing,
  onEditToggle,
  onSave,
  onDelete,
  onNodeSelect,
  onAddRelation,
  onDeleteRelation
}) => {
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [relationSearch, setRelationSearch] = useState('');
  const [selectedRelationType, setSelectedRelationType] = useState<string>(RELATION_TYPES[0]);
  const [showRelationPicker, setShowRelationPicker] = useState(false);

  useEffect(() => {
    if (node) {
      setEditTitle(node.title);
      setEditContent(node.content);
      setEditTags(node.tags);
    }
  }, [node]);

  const handleSave = useCallback(() => {
    onSave({
      title: editTitle,
      content: editContent,
      tags: editTags
    });
  }, [editTitle, editContent, editTags, onSave]);

  const handleAddTag = useCallback(() => {
    if (newTag && !editTags.includes(newTag) && editTags.length < 8) {
      setEditTags([...editTags, newTag]);
      setNewTag('');
    }
  }, [newTag, editTags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setEditTags(editTags.filter(t => t !== tag));
  }, [editTags]);

  const relatedRelations = node
    ? relations.filter(r => r.source === node.id || r.target === node.id)
    : [];

  const getRelatedNode = useCallback((relation: RelationData): NodeData | undefined => {
    if (!node) return undefined;
    const targetId = relation.source === node.id ? relation.target : relation.source;
    return allNodes.find(n => n.id === targetId);
  }, [node, allNodes]);

  const getRelationDirection = useCallback((relation: RelationData): string => {
    if (!node) return '';
    return relation.source === node.id ? '→' : '←';
  }, [node]);

  const filteredNodes = allNodes.filter(n => {
    if (!node) return false;
    if (n.id === node.id) return false;
    if (!relationSearch) return true;
    return n.title.toLowerCase().includes(relationSearch.toLowerCase());
  }).slice(0, 10);

  const handleAddRelation = useCallback((targetId: string) => {
    onAddRelation(targetId, selectedRelationType);
    setShowRelationPicker(false);
    setRelationSearch('');
  }, [selectedRelationType, onAddRelation]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!node) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📝</div>
          <h3 style={styles.emptyTitle}>选择一个笔记</h3>
          <p style={styles.emptyText}>点击图中的节点查看详情</p>
          <p style={styles.emptyHint}>双击空白处创建新笔记</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={styles.titleInput}
            placeholder="笔记标题"
          />
        ) : (
          <h2 style={styles.title}>{node.title}</h2>
        )}
        <div style={styles.headerActions}>
          {isEditing ? (
            <>
              <button onClick={handleSave} style={{ ...styles.btn, ...styles.btnPrimary }}>
                保存
              </button>
              <button onClick={onEditToggle} style={styles.btn}>
                取消
              </button>
            </>
          ) : (
            <>
              <button onClick={onEditToggle} style={styles.btn}>
                编辑
              </button>
              <button onClick={onDelete} style={{ ...styles.btn, ...styles.btnDanger }}>
                删除
              </button>
            </>
          )}
        </div>
      </div>

      <div style={styles.meta}>
        <span style={styles.metaLabel}>创建时间：</span>
        <span style={styles.metaValue}>{formatDate(node.createdAt)}</span>
      </div>

      <div style={styles.tagsSection}>
        <div style={styles.tagsLabel}>标签</div>
        <div style={styles.tagsList}>
          {node.tags.map(tag => (
            <span
              key={tag}
              style={{
                ...styles.tag,
                backgroundColor: TAG_COLORS[tag] || '#6b7280'
              }}
            >
              {tag}
            </span>
          ))}
          {node.tags.length === 0 && (
            <span style={styles.noTags}>暂无标签</span>
          )}
        </div>
        {isEditing && (
          <div style={styles.tagInput}>
            <select
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              style={styles.tagSelect}
            >
              <option value="">选择标签...</option>
              {TAGS.filter(t => !editTags.includes(t)).map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <button
              onClick={handleAddTag}
              disabled={!newTag || editTags.length >= 8}
              style={styles.addTagBtn}
            >
              添加
            </button>
            {editTags.length > 0 && (
              <div style={styles.editableTags}>
                {editTags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      ...styles.tag,
                      backgroundColor: TAG_COLORS[tag] || '#6b7280'
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      style={styles.removeTagBtn}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={styles.contentSection}>
        <div style={styles.contentLabel}>内容</div>
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={styles.textarea}
            placeholder="使用 Markdown 语法编写笔记内容..."
          />
        ) : (
          <div style={styles.markdown}>
            <ReactMarkdown>{node.content || '*暂无内容*'}</ReactMarkdown>
          </div>
        )}
      </div>

      <div style={styles.relationsSection}>
        <div style={styles.relationsHeader}>
          <span style={styles.relationsLabel}>关联节点 ({relatedRelations.length})</span>
          {!isEditing && (
            <button
              onClick={() => setShowRelationPicker(!showRelationPicker)}
              style={styles.addRelationBtn}
            >
              + 添加关系
            </button>
          )}
        </div>

        {showRelationPicker && (
          <div style={styles.relationPicker}>
            <div style={styles.relationPickerHeader}>
              <input
                type="text"
                placeholder="搜索节点..."
                value={relationSearch}
                onChange={(e) => setRelationSearch(e.target.value)}
                style={styles.relationSearchInput}
              />
              <select
                value={selectedRelationType}
                onChange={(e) => setSelectedRelationType(e.target.value)}
                style={styles.relationTypeSelect}
              >
                {RELATION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div style={styles.nodeList}>
              {filteredNodes.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleAddRelation(n.id)}
                  style={styles.nodeItem}
                >
                  <div
                    style={{
                      ...styles.nodeDot,
                      backgroundColor: n.tags[0] ? TAG_COLORS[n.tags[0]] : '#6b7280'
                    }}
                  />
                  <span style={styles.nodeName}>{n.title}</span>
                </div>
              ))}
              {filteredNodes.length === 0 && (
                <div style={styles.noResults}>没有找到节点</div>
              )}
            </div>
          </div>
        )}

        <div style={styles.relationsList}>
          {relatedRelations.map(relation => {
            const relatedNode = getRelatedNode(relation);
            if (!relatedNode) return null;
            const direction = getRelationDirection(relation);
            const style = RELATION_STYLES[relation.type];
            return (
              <div
                key={relation.id}
                style={styles.relationItem}
                onClick={() => onNodeSelect(relatedNode.id)}
              >
                <div
                  style={{
                    ...styles.nodeDot,
                    backgroundColor: relatedNode.tags[0] ? TAG_COLORS[relatedNode.tags[0]] : '#6b7280'
                  }}
                />
                <span style={styles.relationNodeName}>{relatedNode.title}</span>
                <span
                  style={{
                    ...styles.relationTypeBadge,
                    borderColor: style?.color,
                    color: style?.color
                  }}
                >
                  {direction} {relation.type}
                </span>
                {!isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRelation(relation.id);
                    }}
                    style={styles.deleteRelationBtn}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
          {relatedRelations.length === 0 && (
            <div style={styles.noRelations}>暂无关联</div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: 20,
    backgroundColor: 'rgba(42, 42, 62, 0.8)',
    backdropFilter: 'blur(10px)',
    borderLeft: '1px solid #3a3a4e',
    overflowY: 'auto',
    overflowX: 'hidden'
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888'
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#d4d4dc',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4
  },
  emptyHint: {
    fontSize: 12,
    color: '#7c3aed'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#d4d4dc',
    wordBreak: 'break-word'
  },
  titleInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: 700,
    color: '#d4d4dc',
    backgroundColor: '#1e1e2e',
    border: '1px solid #7c3aed',
    borderRadius: 6,
    padding: '8px 12px',
    outline: 'none'
  },
  headerActions: {
    display: 'flex',
    gap: 8,
    flexShrink: 0
  },
  btn: {
    padding: '8px 16px',
    backgroundColor: '#3a3a4e',
    color: '#d4d4dc',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 300ms ease-out'
  },
  btnPrimary: {
    backgroundColor: '#7c3aed',
    color: 'white'
  },
  btnDanger: {
    backgroundColor: '#ef4444',
    color: 'white'
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
    fontSize: 13,
    color: '#888'
  },
  metaLabel: {
    color: '#666'
  },
  metaValue: {
    color: '#888'
  },
  tagsSection: {
    marginBottom: 20
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#d4d4dc',
    marginBottom: 8
  },
  tagsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8
  },
  tag: {
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    color: 'white',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4
  },
  noTags: {
    color: '#666',
    fontSize: 13
  },
  tagInput: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  tagSelect: {
    flex: 1,
    padding: '6px 10px',
    backgroundColor: '#1e1e2e',
    border: '1px solid #3a3a4e',
    borderRadius: 6,
    color: '#d4d4dc',
    outline: 'none'
  },
  addTagBtn: {
    padding: '6px 12px',
    backgroundColor: '#7c3aed',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12
  },
  editableTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6
  },
  removeTagBtn: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: 14,
    padding: 0,
    marginLeft: 4
  },
  contentSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 200,
    marginBottom: 20
  },
  contentLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#d4d4dc',
    marginBottom: 8
  },
  textarea: {
    flex: 1,
    minHeight: 200,
    padding: 12,
    backgroundColor: '#1e1e2e',
    border: '1px solid #3a3a4e',
    borderRadius: 6,
    color: '#d4d4dc',
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 1.6,
    resize: 'vertical',
    outline: 'none'
  },
  markdown: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1e1e2e',
    borderRadius: 6,
    fontSize: 14,
    lineHeight: 1.8,
    color: '#d4d4dc',
    overflowY: 'auto'
  },
  relationsSection: {
    marginTop: 'auto'
  },
  relationsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  relationsLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#d4d4dc'
  },
  addRelationBtn: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    color: '#7c3aed',
    border: '1px solid #7c3aed',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 300ms ease-out'
  },
  relationPicker: {
    backgroundColor: '#1e1e2e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    border: '1px solid #3a3a4e'
  },
  relationPickerHeader: {
    display: 'flex',
    gap: 8,
    marginBottom: 10
  },
  relationSearchInput: {
    flex: 1,
    padding: '8px 10px',
    backgroundColor: '#2a2a3e',
    border: '1px solid #3a3a4e',
    borderRadius: 6,
    color: '#d4d4dc',
    outline: 'none',
    fontSize: 13
  },
  relationTypeSelect: {
    padding: '8px 10px',
    backgroundColor: '#2a2a3e',
    border: '1px solid #3a3a4e',
    borderRadius: 6,
    color: '#d4d4dc',
    outline: 'none',
    fontSize: 13
  },
  nodeList: {
    maxHeight: 200,
    overflowY: 'auto'
  },
  nodeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background-color 300ms ease-out'
  },
  nodeDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0
  },
  nodeName: {
    fontSize: 14,
    color: '#d4d4dc'
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
    padding: 20
  },
  relationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  relationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    backgroundColor: '#1e1e2e',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 300ms ease-out',
    position: 'relative'
  },
  relationNodeName: {
    flex: 1,
    fontSize: 13,
    color: '#d4d4dc'
  },
  relationTypeBadge: {
    fontSize: 11,
    padding: '2px 8px',
    border: '1px solid',
    borderRadius: 10,
    flexShrink: 0
  },
  deleteRelationBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: 16,
    padding: '0 4px',
    flexShrink: 0
  },
  noRelations: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
    padding: 16
  }
};

export default NoteEditor;
