import React, { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useBoardStore } from '../store'
import type { Card, Priority, Tag } from '../types'

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: '高', color: '#EF4444' },
  { value: 'medium', label: '中', color: '#F97316' },
  { value: 'low', label: '低', color: '#22C55E' },
]

const presetColors = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#6B7280', '#14B8A6',
]

interface CardModalProps {
  card: Card
  onClose: () => void
}

const CardModal: React.FC<CardModalProps> = ({ card, onClose }) => {
  const updateCard = useBoardStore((s) => s.updateCard)
  const deleteCard = useBoardStore((s) => s.deleteCard)

  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [priority, setPriority] = useState<Priority>(card.priority)
  const [assignee, setAssignee] = useState(card.assignee)
  const [dueDate, setDueDate] = useState(card.dueDate)
  const [tags, setTags] = useState<Tag[]>(card.tags)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(presetColors[0])
  const [closing, setClosing] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => {
      onClose()
    }, 250)
  }

  const handleSave = () => {
    if (!title.trim()) return
    updateCard(card.id, {
      title: title.trim(),
      description: description.trim(),
      priority,
      assignee: assignee.trim(),
      dueDate,
      tags,
    })
    handleClose()
  }

  const handleAddTag = () => {
    if (!newTagName.trim()) return
    if (tags.length >= 5) return
    setTags([
      ...tags,
      { id: uuidv4(), name: newTagName.trim(), color: newTagColor },
    ])
    setNewTagName('')
  }

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter((t) => t.id !== tagId))
  }

  const handleDelete = () => {
    if (confirm('确定要删除这张卡片吗？')) {
      deleteCard(card.id)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <div
      className={`wc-modal-backdrop ${closing ? 'wc-modal-closing' : ''}`}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`wc-modal ${closing ? 'wc-modal-content-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wc-modal-header">
          <h2 className="wc-modal-title">编辑卡片</h2>
          <button className="wc-modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="wc-modal-body">
          <div className="wc-form-group">
            <label className="wc-form-label">标题 *</label>
            <input
              type="text"
              className="wc-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="卡片标题"
              autoFocus
            />
          </div>

          <div className="wc-form-group">
            <label className="wc-form-label">描述</label>
            <textarea
              className="wc-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="任务详细描述..."
              rows={4}
            />
          </div>

          <div className="wc-form-row">
            <div className="wc-form-group wc-form-group-half">
              <label className="wc-form-label">优先级</label>
              <div className="wc-priority-options">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`wc-priority-option ${priority === opt.value ? 'wc-priority-active' : ''}`}
                    onClick={() => setPriority(opt.value)}
                    style={{
                      borderColor: priority === opt.value ? opt.color : '#D9D6D3',
                      backgroundColor:
                        priority === opt.value ? opt.color + '15' : 'transparent',
                    }}
                  >
                    <span
                      className="wc-priority-dot"
                      style={{ backgroundColor: opt.color }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="wc-form-group wc-form-group-half">
              <label className="wc-form-label">截止日期</label>
              <input
                type="date"
                className="wc-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="wc-form-group">
            <label className="wc-form-label">负责人</label>
            <input
              type="text"
              className="wc-input"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="负责人姓名"
            />
          </div>

          <div className="wc-form-group">
            <label className="wc-form-label">
              标签（最多5个） {tags.length > 0 && `(${tags.length}/5)`}
            </label>

            {tags.length > 0 && (
              <div className="wc-tags-list">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="wc-tag wc-tag-removable"
                    style={{
                      backgroundColor: tag.color + '22',
                      color: tag.color,
                      border: `1px solid ${tag.color}44`,
                    }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      className="wc-tag-remove"
                      onClick={() => handleRemoveTag(tag.id)}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {tags.length < 5 && (
              <div className="wc-add-tag-row">
                <input
                  type="text"
                  className="wc-input wc-add-tag-input"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="新标签名称"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <div className="wc-color-picker">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`wc-color-swatch ${newTagColor === color ? 'wc-color-active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="wc-btn wc-btn-primary wc-add-tag-btn"
                  onClick={handleAddTag}
                  disabled={!newTagName.trim()}
                >
                  添加
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="wc-modal-footer">
          <button className="wc-btn wc-btn-danger-outline" onClick={handleDelete}>
            🗑 删除卡片
          </button>
          <div className="wc-modal-footer-right">
            <button className="wc-btn wc-btn-cancel" onClick={handleClose}>
              取消
            </button>
            <button
              className="wc-btn wc-btn-primary"
              onClick={handleSave}
              disabled={!title.trim()}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardModal
