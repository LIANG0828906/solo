import React, { useState, useMemo, useCallback } from 'react';
import { useTimelineStore } from '../hooks/useTimelineStore';
import { EVENT_COLORS, EVENT_LABELS } from '../types';
import { updateNode } from '../tools/store';
import { X, Edit3, Save, Calendar, Tag } from 'lucide-react';
import { marked } from 'marked';

export const DetailPanel: React.FC = () => {
  const {
    selectedNodeId,
    eventNodes,
    setSelectedNode,
    detailPanelOpen,
    setDetailPanelOpen,
    updateEventNode,
  } = useTimelineStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editRawText, setEditRawText] = useState('');
  const [editSummary, setEditSummary] = useState('');

  const selectedNode = useMemo(
    () => eventNodes.find((n) => n.id === selectedNodeId),
    [eventNodes, selectedNodeId]
  );

  const eventColor = selectedNode
    ? EVENT_COLORS[selectedNode.eventType]
    : '#999';

  const handleEdit = useCallback(() => {
    if (!selectedNode) return;
    setEditTitle(selectedNode.title);
    setEditRawText(selectedNode.rawText);
    setEditSummary(selectedNode.summary);
    setIsEditing(true);
  }, [selectedNode]);

  const handleSave = useCallback(async () => {
    if (!selectedNode) return;
    const updated = {
      ...selectedNode,
      title: editTitle,
      rawText: editRawText,
      summary: editSummary,
    };
    await updateNode(updated);
    updateEventNode(updated);
    setIsEditing(false);
  }, [selectedNode, editTitle, editRawText, editSummary, updateEventNode]);

  const handleClose = useCallback(() => {
    setSelectedNode(null);
    setDetailPanelOpen(false);
    setIsEditing(false);
  }, [setSelectedNode, setDetailPanelOpen]);

  if (!detailPanelOpen || !selectedNode) return null;

  const renderedMarkdown = marked.parse(selectedNode.rawText || '', {
    async: false,
  }) as string;

  return (
    <div className="detail-panel open">
      <div className="detail-panel-header">
        <div className="detail-panel-title-row">
          <div
            className="detail-type-indicator"
            style={{ backgroundColor: eventColor }}
          />
          <span className="detail-panel-title">
            {isEditing ? '编辑节点' : selectedNode.title}
          </span>
        </div>
        <div className="detail-panel-actions">
          {isEditing ? (
            <button className="detail-action-btn save" onClick={handleSave}>
              <Save size={14} />
              <span>保存</span>
            </button>
          ) : (
            <button className="detail-action-btn edit" onClick={handleEdit}>
              <Edit3 size={14} />
              <span>编辑</span>
            </button>
          )}
          <button className="detail-action-btn close" onClick={handleClose}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="detail-panel-meta">
        <div className="detail-meta-item">
          <Calendar size={13} />
          <span>{selectedNode.date}</span>
        </div>
        <div className="detail-meta-item">
          <Tag size={13} />
          <span
            className="detail-type-tag"
            style={{ color: eventColor, borderColor: eventColor }}
          >
            {EVENT_LABELS[selectedNode.eventType]}
          </span>
        </div>
      </div>

      <div className="detail-panel-body">
        {isEditing ? (
          <div className="detail-edit-form">
            <div className="detail-edit-field">
              <label>标题</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="detail-edit-field">
              <label>摘要</label>
              <input
                type="text"
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
              />
            </div>
            <div className="detail-edit-field">
              <label>原文片段</label>
              <textarea
                value={editRawText}
                onChange={(e) => setEditRawText(e.target.value)}
                rows={12}
              />
            </div>
          </div>
        ) : (
          <div className="detail-content">
            <div className="detail-summary">{selectedNode.summary}</div>
            <div className="detail-divider" />
            <div className="detail-raw-content">
              <h4 className="detail-section-title">原文片段</h4>
              <div
                className="detail-markdown"
                dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
