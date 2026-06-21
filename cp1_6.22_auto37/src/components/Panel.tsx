import { useState, useRef } from 'react';
import type { Stage } from '../types';
import { formatTimeFull } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';

interface PanelProps {
  stages: Stage[];
  setStages: React.Dispatch<React.SetStateAction<Stage[]>>;
  onStart: () => void;
  totalWordCount: number;
  setTotalWordCount: React.Dispatch<React.SetStateAction<number>>;
  templates: { id: string; name: string; stages: Stage[] }[];
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function Panel({
  stages,
  setStages,
  onStart,
  totalWordCount,
  setTotalWordCount,
  templates,
  mobileMenuOpen,
  setMobileMenuOpen,
}: PanelProps) {
  const [newStageName, setNewStageName] = useState('');
  const [newStageMinutes, setNewStageMinutes] = useState('');
  const [newStageSeconds, setNewStageSeconds] = useState('');
  const [newStageNotes, setNewStageNotes] = useState('');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    type: 'delete' | 'start';
    stageId?: string;
  } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const totalPlannedSeconds = stages.reduce((sum, s) => sum + s.plannedDuration, 0);

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    const minutes = parseInt(newStageMinutes) || 0;
    const seconds = parseInt(newStageSeconds) || 0;
    const total = minutes * 60 + seconds;
    if (total <= 0) return;

    const newStage: Stage = {
      id: uuidv4(),
      name: newStageName.trim(),
      plannedDuration: total,
      notes: newStageNotes.trim(),
    };

    setStages((prev) => [...prev, newStage]);
    setNewStageName('');
    setNewStageMinutes('');
    setNewStageSeconds('');
    setNewStageNotes('');
  };

  const handleDeleteStage = (id: string) => {
    setStages((prev) => prev.filter((s) => s.id !== id));
    setShowConfirmModal(null);
    if (expandedCardId === id) setExpandedCardId(null);
  };

  const handleEditStage = (stage: Stage) => {
    setEditingStage({
      ...stage,
    });
    setNewStageName(stage.name);
    setNewStageMinutes(String(Math.floor(stage.plannedDuration / 60)));
    setNewStageSeconds(String(stage.plannedDuration % 60));
    setNewStageNotes(stage.notes);
  };

  const handleSaveEdit = () => {
    if (!editingStage) return;
    const minutes = parseInt(newStageMinutes) || 0;
    const seconds = parseInt(newStageSeconds) || 0;
    const total = minutes * 60 + seconds;
    if (!newStageName.trim() || total <= 0) return;

    setStages((prev) =>
      prev.map((s) =>
        s.id === editingStage.id
          ? {
              ...s,
              name: newStageName.trim(),
              plannedDuration: total,
              notes: newStageNotes.trim(),
            }
          : s
      )
    );
    setEditingStage(null);
    setNewStageName('');
    setNewStageMinutes('');
    setNewStageSeconds('');
    setNewStageNotes('');
  };

  const handleCancelEdit = () => {
    setEditingStage(null);
    setNewStageName('');
    setNewStageMinutes('');
    setNewStageSeconds('');
    setNewStageNotes('');
  };

  const toggleCard = (id: string) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    dragIndex.current = index;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging');
    if (dragIndex.current !== null && dragOverIndex.current !== null && dragIndex.current !== dragOverIndex.current) {
      const newStages = [...stages];
      const [removed] = newStages.splice(dragIndex.current, 1);
      newStages.splice(dragOverIndex.current, 0, removed);
      setStages(newStages);
    }
    dragIndex.current = null;
    dragOverIndex.current = null;
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverIndex.current = index;
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setStages(template.stages.map((s) => ({ ...s, id: uuidv4() })));
    }
  };

  const confirmStart = () => {
    setShowConfirmModal(null);
    onStart();
  };

  return (
    <div className="panel-container">
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="菜单"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
          <h1 className="panel-title">
            <span className="panel-title-icon">🎤</span>
            演讲时间管理大师
          </h1>
        </div>

        <div className="header-actions">
          <input
            type="number"
            className="word-count-input"
            placeholder="总字数（选填）"
            value={totalWordCount || ''}
            onChange={(e) => setTotalWordCount(parseInt(e.target.value) || 0)}
            min={0}
          />
          <select
            className="template-select"
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
          >
            <option value="">选择模板</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            className="btn-primary"
            onClick={() => setShowConfirmModal({ type: 'start' })}
          >
            开始演讲 ▶
          </button>
        </div>
      </div>

      <div className="panel-content">
        <aside className={`panel-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <h2 className="section-title">
            {editingStage ? '✏️ 编辑阶段' : '➕ 新增阶段'}
          </h2>

          <div className="stage-form">
            <div className="form-group">
              <label className="form-label">阶段名称</label>
              <input
                type="text"
                className="form-input"
                placeholder="例如：开场介绍"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">计划时长</label>
              <div className="duration-inputs">
                <div className="duration-input-wrapper">
                  <input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={newStageMinutes}
                    onChange={(e) => setNewStageMinutes(e.target.value)}
                  />
                  <span className="duration-unit">分</span>
                </div>
                <div className="duration-input-wrapper">
                  <input
                    type="number"
                    placeholder="0"
                    min={0}
                    max={59}
                    value={newStageSeconds}
                    onChange={(e) => setNewStageSeconds(e.target.value)}
                  />
                  <span className="duration-unit">秒</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">备注（选填）</label>
              <textarea
                className="form-textarea"
                placeholder="演讲要点、提醒事项..."
                value={newStageNotes}
                onChange={(e) => setNewStageNotes(e.target.value)}
              />
            </div>

            {editingStage ? (
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="add-stage-btn"
                  style={{ flex: 1 }}
                  onClick={handleSaveEdit}
                >
                  保存修改
                </button>
                <button
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleCancelEdit}
                >
                  取消
                </button>
              </div>
            ) : (
              <button className="add-stage-btn" onClick={handleAddStage}>
                添加阶段
              </button>
            )}
          </div>

          {mobileMenuOpen && (
            <button
              style={{
                marginTop: 24,
                width: '100%',
                padding: 12,
                borderRadius: 8,
                background: 'rgba(30,58,95,0.08)',
                color: 'var(--primary)',
                fontWeight: 600,
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              关闭面板
            </button>
          )}
        </aside>

        <main className="panel-main">
          <h2 className="section-title">
            📋 演讲阶段列表
            <span style={{ float: 'right', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              共 {stages.length} 个阶段
            </span>
          </h2>

          {stages.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>📝</div>
              <p style={{ fontSize: '1.1rem', marginBottom: 8 }}>还没有演讲阶段</p>
              <p style={{ fontSize: '0.9rem' }}>
                在左侧面板添加您的第一个演讲阶段，或选择预设模板快速开始
              </p>
            </div>
          ) : (
            <div className="stages-list">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className={`stage-card ${expandedCardId === stage.id ? 'expanded' : ''}`}
                  draggable
                  onDragStart={handleDragStart(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver(index)}
                >
                  <div className="stage-card-header">
                    <span className="drag-handle" title="拖拽排序">⋮⋮</span>
                    <span className="stage-number">{index + 1}</span>
                    <div className="stage-info" onClick={() => toggleCard(stage.id)}>
                      <div className="stage-name">{stage.name}</div>
                      <div className="stage-duration">
                        计划时长：{formatTimeFull(stage.plannedDuration)}
                      </div>
                    </div>
                    <div className="stage-actions">
                      <button
                        className="icon-btn"
                        onClick={() => toggleCard(stage.id)}
                        title="展开详情"
                      >
                        {expandedCardId === stage.id ? '▲' : '▼'}
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => handleEditStage(stage)}
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        className="icon-btn delete"
                        onClick={() => setShowConfirmModal({ type: 'delete', stageId: stage.id })}
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="stage-card-body">
                    <div className="stage-notes">
                      {stage.notes ? stage.notes : <span className="stage-notes-empty">（暂无备注）</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="total-summary">
            <div className="total-duration">
              🕒 总计划时长
              <span>{formatTimeFull(totalPlannedSeconds)}</span>
            </div>
            {totalWordCount > 0 && totalPlannedSeconds > 0 && (
              <div className="total-duration" style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                预计语速
                <span style={{ fontSize: '1.1rem' }}>
                  {Math.round((totalWordCount / totalPlannedSeconds) * 60)} 字/分
                </span>
              </div>
            )}
          </div>
        </main>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              {showConfirmModal.type === 'delete' ? '确认删除' : '确认开始'}
            </h3>
            <p className="modal-message">
              {showConfirmModal.type === 'delete'
                ? '确定要删除这个演讲阶段吗？此操作不可撤销。'
                : `演讲即将开始，共 ${stages.length} 个阶段，总时长 ${formatTimeFull(
                    totalPlannedSeconds
                  )}。准备好了吗？`}
            </p>
            <div className="modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setShowConfirmModal(null)}
              >
                取消
              </button>
              {showConfirmModal.type === 'delete' ? (
                <button
                  className="btn-modal-confirm"
                  onClick={() => handleDeleteStage(showConfirmModal.stageId!)}
                >
                  删除
                </button>
              ) : (
                <button
                  className="btn-primary"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'none',
                  }}
                  onClick={confirmStart}
                >
                  开始演讲
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Panel;
