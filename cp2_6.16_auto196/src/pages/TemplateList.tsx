import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAppStore } from '@/store/appStore'
import { TEMPLATE_TYPE_LABELS, type TemplateType, type CustomClause } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import './TemplateList.css'

export default function TemplateList() {
  const navigate = useNavigate()
  const { templates, addTemplate, deleteTemplate, updateTemplate } = useAppStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateType, setNewTemplateType] = useState<TemplateType>('residential')
  const [editData, setEditData] = useState<{
    name: string
    type: TemplateType
    fixedClauses: { leaseTerm: string; rent: string; deposit: string }
    customClauses: CustomClause[]
  } | null>(null)

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) return
    addTemplate({
      name: newTemplateName.trim(),
      type: newTemplateType,
      fixedClauses: {
        leaseTerm: '租赁期限自起始日期起至结束日期止，共计若干个月。',
        rent: '租金按月支付，承租方应于每月规定日期前支付当月租金。',
        deposit: '押金为X个月租金，合同期满且无违约情况下全额退还。',
      },
      customClauses: [
        { id: uuidv4(), title: '维修责任', content: '租赁期间，租赁物及其附属设施的维修责任由双方协商确定。' },
        { id: uuidv4(), title: '违约责任', content: '任何一方违反合同约定，应承担相应的违约责任。' },
      ],
    })
    setNewTemplateName('')
    setNewTemplateType('residential')
    setShowCreateModal(false)
  }

  const handleEditTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return
    setEditingTemplate(templateId)
    setEditData({
      name: template.name,
      type: template.type,
      fixedClauses: { ...template.fixedClauses },
      customClauses: template.customClauses.map((c) => ({ ...c })),
    })
  }

  const handleSaveEdit = () => {
    if (!editingTemplate || !editData) return
    updateTemplate(editingTemplate, {
      name: editData.name,
      type: editData.type,
      fixedClauses: editData.fixedClauses,
      customClauses: editData.customClauses,
    })
    setEditingTemplate(null)
    setEditData(null)
  }

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要删除这个模板吗？')) {
      deleteTemplate(id)
    }
  }

  const addCustomClause = () => {
    if (!editData) return
    setEditData({
      ...editData,
      customClauses: [
        ...editData.customClauses,
        { id: uuidv4(), title: '新条款', content: '请输入条款内容...' },
      ],
    })
  }

  const removeCustomClause = (clauseId: string) => {
    if (!editData) return
    setEditData({
      ...editData,
      customClauses: editData.customClauses.filter((c) => c.id !== clauseId),
    })
  }

  const updateCustomClause = (clauseId: string, field: 'title' | 'content', value: string) => {
    if (!editData) return
    setEditData({
      ...editData,
      customClauses: editData.customClauses.map((c) =>
        c.id === clauseId ? { ...c, [field]: value } : c
      ),
    })
  }

  const getTypeColor = (type: TemplateType) => {
    switch (type) {
      case 'residential': return 'var(--primary)'
      case 'commercial': return 'var(--expiring)'
      case 'equipment': return 'var(--success)'
    }
  }

  const getTypeBgColor = (type: TemplateType) => {
    switch (type) {
      case 'residential': return 'var(--primary-light)'
      case 'commercial': return 'var(--expiring-light)'
      case 'equipment': return 'var(--success-light)'
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">合同模板管理</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + 新建模板
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-title">暂无模板</div>
          <div className="empty-state-desc">点击右上角按钮创建第一个合同模板</div>
        </div>
      ) : (
        <div className="template-grid">
          {templates.map((template) => (
            <div
              key={template.id}
              className="card template-card"
              onClick={() => handleEditTemplate(template.id)}
            >
              <div className="template-card-header">
                <h3 className="template-name">{template.name}</h3>
                <button
                  className="btn btn-ghost btn-sm delete-btn"
                  onClick={(e) => handleDeleteTemplate(template.id, e)}
                  title="删除模板"
                >
                  🗑️
                </button>
              </div>

              <div className="template-meta">
                <span
                  className="template-type-badge"
                  style={{
                    background: getTypeBgColor(template.type),
                    color: getTypeColor(template.type),
                  }}
                >
                  {TEMPLATE_TYPE_LABELS[template.type]}
                </span>
              </div>

              <div className="template-clauses">
                <div className="clause-count">
                  <span>📝 固定条款：3条</span>
                </div>
                <div className="clause-count">
                  <span>📋 自定义条款：{template.customClauses.length}条</span>
                </div>
              </div>

              <div className="template-footer">
                <span className="template-time">
                  最后修改：{dayjs(template.updatedAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">新建模板</h2>

            <div className="form-group">
              <label className="form-label">模板名称</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入模板名称"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">模板类型</label>
              <select
                className="form-input"
                value={newTemplateType}
                onChange={(e) => setNewTemplateType(e.target.value as TemplateType)}
              >
                <option value="residential">住宅租赁</option>
                <option value="commercial">商铺租赁</option>
                <option value="equipment">设备租赁</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateTemplate}
                disabled={!newTemplateName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTemplate && editData && (
        <div className="modal-overlay modal-large" onClick={() => setEditingTemplate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">编辑模板</h2>

            <div className="form-group">
              <label className="form-label">模板名称</label>
              <input
                type="text"
                className="form-input"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">模板类型</label>
              <select
                className="form-input"
                value={editData.type}
                onChange={(e) => setEditData({ ...editData, type: e.target.value as TemplateType })}
              >
                <option value="residential">住宅租赁</option>
                <option value="commercial">商铺租赁</option>
                <option value="equipment">设备租赁</option>
              </select>
            </div>

            <div className="edit-section">
              <h3 className="edit-section-title">固定条款</h3>

              <div className="form-group">
                <label className="form-label">租赁期限</label>
                <textarea
                  className="form-textarea"
                  value={editData.fixedClauses.leaseTerm}
                  onChange={(e) => setEditData({
                    ...editData,
                    fixedClauses: { ...editData.fixedClauses, leaseTerm: e.target.value },
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">租金条款</label>
                <textarea
                  className="form-textarea"
                  value={editData.fixedClauses.rent}
                  onChange={(e) => setEditData({
                    ...editData,
                    fixedClauses: { ...editData.fixedClauses, rent: e.target.value },
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">押金条款</label>
                <textarea
                  className="form-textarea"
                  value={editData.fixedClauses.deposit}
                  onChange={(e) => setEditData({
                    ...editData,
                    fixedClauses: { ...editData.fixedClauses, deposit: e.target.value },
                  })}
                />
              </div>
            </div>

            <div className="edit-section">
              <div className="edit-section-header">
                <h3 className="edit-section-title">自定义条款</h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={addCustomClause}
                >
                  + 添加条款
                </button>
              </div>

              <div className="custom-clauses-list">
                {editData.customClauses.map((clause, index) => (
                  <div key={clause.id} className="custom-clause-item">
                    <div className="custom-clause-header">
                      <span className="clause-index">第{index + 1}条</span>
                      <button
                        className="btn btn-ghost btn-sm remove-clause-btn"
                        onClick={() => removeCustomClause(clause.id)}
                        title="删除条款"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="text"
                      className="form-input clause-title-input"
                      placeholder="条款标题"
                      value={clause.title}
                      onChange={(e) => updateCustomClause(clause.id, 'title', e.target.value)}
                    />
                    <textarea
                      className="form-textarea clause-content-input"
                      placeholder="条款内容"
                      value={clause.content}
                      onChange={(e) => updateCustomClause(clause.id, 'content', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditingTemplate(null)
                  setEditData(null)
                }}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEdit}
                disabled={!editData.name.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
