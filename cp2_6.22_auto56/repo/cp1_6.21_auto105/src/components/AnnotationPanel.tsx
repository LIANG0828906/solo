import { useState } from 'react'
import { cn } from '@/lib/utils'

export type AnnotationType = 'highlight' | 'underline' | 'comment'

export interface Annotation {
  id: string
  type: AnnotationType
  text: string
  comment: string
  position: number
}

interface AnnotationPanelProps {
  annotations: Annotation[]
  onJump: (position: number) => void
  onEdit: (id: string, comment: string) => void
  onDelete: (id: string) => void
}

const typeConfig = {
  highlight: {
    label: '高亮',
    bgColor: '#FEF3C7',
  },
  underline: {
    label: '波浪线',
    bgColor: '#D1FAE5',
  },
  comment: {
    label: '评论',
    bgColor: '#DBEAFE',
  },
}

const groupOrder: AnnotationType[] = ['highlight', 'underline', 'comment']

export default function AnnotationPanel({
  annotations,
  onJump,
  onEdit,
  onDelete,
}: AnnotationPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const truncateText = (text: string, maxLength = 30) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  const groupedAnnotations = groupOrder.reduce((acc, type) => {
    acc[type] = annotations.filter((a) => a.type === type)
    return acc
  }, {} as Record<AnnotationType, Annotation[]>)

  const handleEditStart = (annotation: Annotation) => {
    setEditingId(annotation.id)
    setEditText(annotation.comment)
  }

  const handleEditSave = (id: string) => {
    onEdit(id, editText)
    setEditingId(null)
    setEditText('')
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditText('')
  }

  const PencilIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )

  const TrashIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )

  return (
    <div
      className={cn('h-full')}
      style={{
        backgroundColor: '#F3F4F6',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      {groupOrder.map((type) => {
        const items = groupedAnnotations[type]
        if (items.length === 0) return null

        return (
          <div key={type}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#6B7280',
                margin: '16px 0 8px',
              }}
            >
              {typeConfig[type].label}
            </h3>
            {items.map((annotation) => (
              <div
                key={annotation.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  editingId === annotation.id && 'cursor-default',
                )}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '8px',
                  border: '1px solid #E5E7EB',
                }}
                onMouseEnter={(e) => {
                  if (editingId !== annotation.id) {
                    e.currentTarget.style.backgroundColor = '#F9FAFB'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
                onClick={(e) => {
                  if (editingId !== annotation.id) {
                    onJump(annotation.position)
                  }
                  e.stopPropagation()
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        backgroundColor: typeConfig[type].bgColor,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        color: '#1F2937',
                        marginBottom: '8px',
                        wordBreak: 'break-all',
                      }}
                    >
                      {truncateText(annotation.text)}
                    </div>
                    {editingId === annotation.id ? (
                      <div>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '100%',
                            height: '80px',
                            borderRadius: '6px',
                            border: '1px solid #D1D5DB',
                            padding: '8px',
                            fontSize: '13px',
                            resize: 'none',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                          placeholder="输入评论内容..."
                          autoFocus
                        />
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            marginTop: '8px',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCancel()
                            }}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '4px',
                              border: '1px solid #D1D5DB',
                              backgroundColor: 'white',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            取消
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditSave(annotation.id)
                            }}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: '#3B82F6',
                              color: 'white',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#4B5563',
                          wordBreak: 'break-word',
                        }}
                      >
                        {annotation.comment || '暂无评论'}
                      </div>
                    )}
                  </div>
                  {editingId !== annotation.id && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        color: '#9CA3AF',
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditStart(annotation)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: '#9CA3AF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#3B82F6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#9CA3AF'
                        }}
                        title="编辑"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(annotation.id)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: '#9CA3AF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#EF4444'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#9CA3AF'
                        }}
                        title="删除"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      })}
      {annotations.length === 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#9CA3AF',
            fontSize: '14px',
          }}
        >
          暂无标注
        </div>
      )}
    </div>
  )
}
