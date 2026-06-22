import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LuggageItem } from '../utils/templateEngine'
import { categoryIcons } from '../utils/templateEngine'
import { useTripStore } from '../stores/tripStore'

interface LuggageListProps {
  tripId: string
}

interface SortableItemProps {
  item: LuggageItem
  onQuantityChange: (itemId: string, quantity: number) => void
  onNoteChange: (itemId: string, note: string) => void
  onDelete: (itemId: string) => void
  onTogglePacked: (itemId: string) => void
}

interface CategorySectionProps {
  category: string
  items: LuggageItem[]
  isExpanded: boolean
  onToggleExpand: () => void
  onQuantityChange: (itemId: string, quantity: number) => void
  onNoteChange: (itemId: string, note: string) => void
  onDelete: (itemId: string) => void
  onTogglePacked: (itemId: string) => void
  isDragOver: boolean
}

const SortableItem = React.memo(function SortableItem({
  item,
  onQuantityChange,
  onNoteChange,
  onDelete,
  onTogglePacked,
}: SortableItemProps) {
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [editingNote, setEditingNote] = useState(item.note || '')
  const noteInputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'item',
      category: item.category,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    contain: 'layout',
  }

  useEffect(() => {
    if (isEditingNote && noteInputRef.current) {
      noteInputRef.current.focus()
      noteInputRef.current.select()
    }
  }, [isEditingNote])

  const handleNoteBlur = () => {
    setIsEditingNote(false)
    if (editingNote !== item.note) {
      onNoteChange(item.id, editingNote)
    }
  }

  const handleNoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNoteBlur()
    } else if (e.key === 'Escape') {
      setEditingNote(item.note || '')
      setIsEditingNote(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`luggage-item ${item.packed ? 'packed' : ''}`}
      {...attributes}
      {...listeners}
    >
      <label className="checkbox-wrapper item-checkbox">
        <input
          type="checkbox"
          checked={item.packed}
          onChange={() => onTogglePacked(item.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="checkbox-custom"></span>
      </label>

      <div className="item-content">
        <span className="item-name">{item.name}</span>

        {isEditingNote ? (
          <input
            ref={noteInputRef}
            type="text"
            value={editingNote}
            onChange={(e) => setEditingNote(e.target.value)}
            onBlur={handleNoteBlur}
            onKeyDown={handleNoteKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="note-input"
            placeholder="添加备注..."
          />
        ) : (
          item.note && (
            <span
              className="item-note"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditingNote(true)
              }}
            >
              {item.note}
            </span>
          )
        )}
      </div>

      <div className="item-actions">
        <div className="quantity-control" onClick={(e) => e.stopPropagation()}>
          <button
            className="quantity-btn"
            onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}
          >
            −
          </button>
          <span className="quantity-value">{item.quantity}{item.unit}</span>
          <button
            className="quantity-btn"
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
          >
            +
          </button>
        </div>

        {!item.note && !isEditingNote && (
          <button
            className="add-note-btn"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditingNote(true)
            }}
            title="添加备注"
          >
            ✏️
          </button>
        )}

        <button
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(item.id)
          }}
          title="删除"
        >
          🗑️
        </button>
      </div>
    </div>
  )
})

const CategorySection = React.memo(function CategorySection({
  category,
  items,
  isExpanded,
  onToggleExpand,
  onQuantityChange,
  onNoteChange,
  onDelete,
  onTogglePacked,
  isDragOver,
}: CategorySectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: category,
    data: {
      type: 'category',
      category,
    },
  })

  const packedCount = items.filter((item) => item.packed).length
  const totalCount = items.length
  const icon = categoryIcons[category] || '📦'

  return (
    <div
      ref={setNodeRef}
      className={`category-card ${isOver || isDragOver ? 'drag-over' : ''}`}
    >
      <div className="category-header" onClick={onToggleExpand}>
        <span className="category-icon">{icon}</span>
        <span className="category-title">{category}</span>
        <span className="category-count">
          {packedCount}/{totalCount}
        </span>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>

      <div
        className={`category-content ${isExpanded ? 'expanded' : ''}`}
        style={{
          maxHeight: isExpanded ? `${items.length * 64 + 16}px` : '0px',
        }}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              onQuantityChange={onQuantityChange}
              onNoteChange={onNoteChange}
              onDelete={onDelete}
              onTogglePacked={onTogglePacked}
            />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="empty-category">
            拖拽物品到此处
          </div>
        )}
      </div>
    </div>
  )
})

export default function LuggageList({ tripId }: LuggageListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('证件')
  const [newItemQuantity, setNewItemQuantity] = useState(1)

  const getTrip = useTripStore((state) => state.getTrip)
  const moveLuggageItem = useTripStore((state) => state.moveLuggageItem)
  const updateLuggageItem = useTripStore((state) => state.updateLuggageItem)
  const deleteLuggageItem = useTripStore((state) => state.deleteLuggageItem)
  const toggleItemPacked = useTripStore((state) => state.toggleItemPacked)
  const addLuggageItem = useTripStore((state) => state.addLuggageItem)
  const calculateTripWeight = useTripStore((state) => state.calculateTripWeight)

  const trip = getTrip(tripId)
  const luggageItems = trip?.luggageItems || []

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 300,
      },
    })
  )

  const groupedItems = useMemo(() => {
    const filtered = luggageItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const groups: Record<string, LuggageItem[]> = {}
    filtered.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = []
      }
      groups[item.category].push(item)
    })
    return groups
  }, [luggageItems, searchQuery])

  const categories = useMemo(() => {
    return Object.keys(categoryIcons).filter((cat) =>
      luggageItems.some((item) => item.category === cat)
    )
  }, [luggageItems])

  const packingProgress = useMemo(() => {
    if (luggageItems.length === 0) return 0
    const packed = luggageItems.filter((item) => item.packed).length
    return Math.round((packed / luggageItems.length) * 100)
  }, [luggageItems])

  const totalWeight = useMemo(() => {
    return calculateTripWeight(tripId)
  }, [tripId, calculateTripWeight, luggageItems])

  const activeItem = useMemo(() => {
    if (!activeId) return null
    return luggageItems.find((item) => item.id === activeId) || null
  }, [activeId, luggageItems])

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event
    if (over) {
      const overData = over.data.current
      if (overData?.type === 'category') {
        setDragOverCategory(overData.category)
      } else if (overData?.type === 'item') {
        setDragOverCategory(overData.category)
      }
    } else {
      setDragOverCategory(null)
    }
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)
      setDragOverCategory(null)

      if (!over) return

      const activeData = active.data.current
      const overData = over.data.current

      if (!activeData || !overData) return

      const activeItemData = luggageItems.find((i) => i.id === active.id)
      if (!activeItemData) return

      let targetCategory: string | null = null

      if (overData.type === 'category') {
        targetCategory = overData.category
      } else if (overData.type === 'item') {
        targetCategory = overData.category
      }

      if (targetCategory && targetCategory !== activeItemData.category) {
        await moveLuggageItem(tripId, active.id as string, targetCategory)
      }
    },
    [tripId, luggageItems, moveLuggageItem]
  )

  const handleQuantityChange = useCallback(
    async (itemId: string, quantity: number) => {
      await updateLuggageItem(tripId, itemId, { quantity })
    },
    [tripId, updateLuggageItem]
  )

  const handleNoteChange = useCallback(
    async (itemId: string, note: string) => {
      await updateLuggageItem(tripId, itemId, { note: note || undefined })
    },
    [tripId, updateLuggageItem]
  )

  const handleDelete = useCallback(
    async (itemId: string) => {
      await deleteLuggageItem(tripId, itemId)
    },
    [tripId, deleteLuggageItem]
  )

  const handleTogglePacked = useCallback(
    async (itemId: string) => {
      await toggleItemPacked(tripId, itemId)
    },
    [tripId, toggleItemPacked]
  )

  const handleAddItem = useCallback(async () => {
    if (!newItemName.trim()) return

    await addLuggageItem(tripId, {
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: newItemQuantity,
      unit: '个',
      packed: false,
      weight: 0,
    })

    setNewItemName('')
    setNewItemQuantity(1)
    setShowAddModal(false)
    setExpandedCategories((prev) => new Set([...prev, newItemCategory]))
  }, [tripId, newItemName, newItemCategory, newItemQuantity, addLuggageItem])

  const handleSelectAll = useCallback(async () => {
    const allPacked = luggageItems.every((item) => item.packed)
    for (const item of luggageItems) {
      if (allPacked && item.packed) {
        await toggleItemPacked(tripId, item.id)
      } else if (!allPacked && !item.packed) {
        await toggleItemPacked(tripId, item.id)
      }
    }
  }, [tripId, luggageItems, toggleItemPacked])

  useEffect(() => {
    if (categories.length > 0) {
      setExpandedCategories(new Set(categories.slice(0, 3)))
    }
  }, [categories])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="luggage-list-container fade-in-slide-up">
        <div className="luggage-header">
          <div className="progress-section">
            <div className="progress-header">
              <span className="progress-label">打包进度</span>
              <span className="progress-percent">{packingProgress}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${packingProgress}%` }}
              />
            </div>
          </div>

          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="搜索物品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="luggage-content">
          <div className="luggage-left">
            {categories.map((category) => (
              <CategorySection
                key={category}
                category={category}
                items={groupedItems[category] || []}
                isExpanded={expandedCategories.has(category)}
                onToggleExpand={() => toggleCategory(category)}
                onQuantityChange={handleQuantityChange}
                onNoteChange={handleNoteChange}
                onDelete={handleDelete}
                onTogglePacked={handleTogglePacked}
                isDragOver={dragOverCategory === category}
              />
            ))}

            {categories.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🧳</div>
                <div className="empty-text">暂无行李物品</div>
                <div className="empty-hint">点击右下角按钮添加物品</div>
              </div>
            )}
          </div>

          <div className="luggage-right">
            <div className="stats-card card">
              <h3 className="card-title">📊 打包统计</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{luggageItems.length}</span>
                  <span className="stat-label">物品总数</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{luggageItems.filter((i) => i.packed).length}</span>
                  <span className="stat-label">已打包</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{totalWeight.toFixed(1)}</span>
                  <span className="stat-label">总重量 (kg)</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{categories.length}</span>
                  <span className="stat-label">分类数</span>
                </div>
              </div>
            </div>

            <div className="actions-card card">
              <h3 className="card-title">⚡ 快捷操作</h3>
              <div className="actions-list">
                <button className="btn btn-secondary action-btn" onClick={handleSelectAll}>
                  {luggageItems.every((i) => i.packed) ? '📋 全部取消' : '✅ 全部打包'}
                </button>
                <button
                  className="btn btn-secondary action-btn"
                  onClick={() => setExpandedCategories(new Set(categories))}
                >
                  📂 展开全部
                </button>
                <button
                  className="btn btn-secondary action-btn"
                  onClick={() => setExpandedCategories(new Set())}
                >
                  📁 收起全部
                </button>
              </div>
            </div>

            <div className="tips-card card">
              <h3 className="card-title">💡 使用提示</h3>
              <ul className="tips-list">
                <li>长按物品 300ms 可拖拽到其他分类</li>
                <li>点击复选框标记为已打包</li>
                <li>点击备注可编辑说明</li>
                <li>使用加减按钮调整数量</li>
              </ul>
            </div>
          </div>
        </div>

        <button className="fab-btn" onClick={() => setShowAddModal(true)}>
          <span className="fab-icon">+</span>
        </button>

        <DragOverlay>
          {activeItem ? (
            <div className="drag-overlay-item">
              <span className="drag-icon">{categoryIcons[activeItem.category] || '📦'}</span>
              <span className="drag-name">{activeItem.name}</span>
            </div>
          ) : null}
        </DragOverlay>

        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">添加物品</h3>
              <div className="modal-form">
                <div className="form-group">
                  <label>物品名称</label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="输入物品名称"
                    className="form-input"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                  />
                </div>
                <div className="form-group">
                  <label>分类</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="form-select"
                  >
                    {Object.entries(categoryIcons).map(([name, icon]) => (
                      <option key={name} value={name}>
                        {icon} {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>数量</label>
                  <div className="quantity-control large">
                    <button
                      className="quantity-btn"
                      onClick={() => setNewItemQuantity(Math.max(1, newItemQuantity - 1))}
                    >
                      −
                    </button>
                    <span className="quantity-value">{newItemQuantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => setNewItemQuantity(newItemQuantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  取消
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddItem}
                  disabled={!newItemName.trim()}
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .luggage-list-container {
          position: relative;
          min-height: 100%;
        }

        .luggage-header {
          display: flex;
          gap: 24px;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .progress-section {
          flex: 1;
          min-width: 300px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .progress-label {
          font-weight: 600;
          color: var(--text-primary);
        }

        .progress-percent {
          font-weight: 700;
          color: var(--accent-blue);
          font-size: 18px;
        }

        .progress-bar {
          height: 12px;
          background: var(--card-border);
          border-radius: 6px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-blue), var(--accent-light));
          border-radius: 6px;
          transition: width var(--transition-normal);
        }

        .search-wrapper {
          position: relative;
          min-width: 280px;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.5;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border: 2px solid var(--card-border);
          border-radius: 10px;
          font-size: 14px;
          background: white;
          transition: all var(--transition-fast);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent-light);
          box-shadow: 0 0 0 3px rgba(66, 165, 245, 0.15);
        }

        .luggage-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .luggage-content {
            grid-template-columns: 1fr;
          }
        }

        .luggage-left {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .category-card {
          background: white;
          border: 2px solid var(--card-border);
          border-radius: 12px;
          overflow: hidden;
          transition: all var(--transition-normal);
        }

        .category-card.drag-over {
          border-color: var(--accent-light);
          background: rgba(66, 165, 245, 0.05);
          box-shadow: 0 0 0 3px rgba(66, 165, 245, 0.15);
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          cursor: pointer;
          background: white;
          transition: background var(--transition-fast);
          user-select: none;
        }

        .category-header:hover {
          background: var(--bg-primary);
        }

        .category-icon {
          font-size: 20px;
        }

        .category-title {
          flex: 1;
          font-weight: 600;
          color: var(--text-primary);
        }

        .category-count {
          font-size: 13px;
          color: var(--text-secondary);
          background: var(--bg-primary);
          padding: 4px 10px;
          border-radius: 20px;
        }

        .expand-icon {
          font-size: 12px;
          color: var(--text-secondary);
          transition: transform var(--transition-fast);
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .category-content {
          overflow: hidden;
          transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0 16px;
        }

        .category-content.expanded {
          padding: 8px 16px 16px;
        }

        .empty-category {
          padding: 24px;
          text-align: center;
          color: var(--text-secondary);
          font-size: 14px;
          border: 2px dashed var(--card-border);
          border-radius: 8px;
          margin-top: 8px;
        }

        .luggage-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 12px;
          background: white;
          border: 2px solid transparent;
          border-radius: 10px;
          margin-top: 8px;
          transition: all var(--transition-fast);
          cursor: grab;
          touch-action: none;
        }

        .luggage-item:hover {
          border-color: var(--card-border);
          background: var(--bg-primary);
        }

        .luggage-item.packed {
          opacity: 0.6;
        }

        .luggage-item.packed .item-name {
          text-decoration: line-through;
        }

        .item-checkbox {
          flex-shrink: 0;
        }

        .item-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .item-name {
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .item-note {
          font-size: 12px;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          transition: background var(--transition-fast);
          display: inline-block;
          max-width: fit-content;
        }

        .item-note:hover {
          background: var(--card-border);
        }

        .note-input {
          font-size: 12px;
          padding: 4px 8px;
          border: 2px solid var(--accent-light);
          border-radius: 6px;
          outline: none;
          width: 100%;
          max-width: 300px;
          background: white;
        }

        .item-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .luggage-item:hover .item-actions {
          opacity: 1;
        }

        .quantity-control {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--bg-primary);
          border-radius: 8px;
          padding: 2px;
        }

        .quantity-control.large {
          padding: 4px;
          gap: 8px;
        }

        .quantity-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quantity-control.large .quantity-btn {
          width: 32px;
          height: 32px;
          font-size: 18px;
        }

        .quantity-btn:hover {
          background: var(--accent-light);
          color: white;
        }

        .quantity-value {
          min-width: 32px;
          text-align: center;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .quantity-control.large .quantity-value {
          min-width: 40px;
          font-size: 16px;
        }

        .add-note-btn,
        .delete-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          opacity: 0.7;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .add-note-btn:hover,
        .delete-btn:hover {
          background: var(--bg-primary);
          opacity: 1;
        }

        .delete-btn:hover {
          background: #FFEBEE;
        }

        .luggage-right {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 0;
        }

        .stats-card,
        .actions-card,
        .tips-card {
          animation: fadeInSlideUp 0.4s ease-out;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 16px;
          background: var(--bg-primary);
          border-radius: 10px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--accent-dark);
        }

        .stat-label {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .actions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-btn {
          justify-content: flex-start;
          width: 100%;
        }

        .tips-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tips-list li {
          font-size: 13px;
          color: var(--text-secondary);
          padding-left: 20px;
          position: relative;
        }

        .tips-list li::before {
          content: '•';
          position: absolute;
          left: 8px;
          color: var(--accent-light);
        }

        .fab-btn {
          position: fixed;
          right: 40px;
          bottom: 40px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-blue), var(--accent-light));
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(33, 150, 243, 0.4);
          transition: all var(--transition-normal);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fab-btn:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 6px 28px rgba(33, 150, 243, 0.5);
        }

        .fab-btn:active {
          transform: scale(0.95);
        }

        .fab-icon {
          font-size: 28px;
          font-weight: 300;
          line-height: 1;
        }

        .drag-overlay-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(26, 35, 126, 0.2);
          border: 2px solid var(--accent-light);
        }

        .drag-icon {
          font-size: 20px;
        }

        .drag-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(26, 35, 126, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: fadeInSlideUp 0.2s ease-out;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 28px;
          width: 90%;
          max-width: 420px;
          box-shadow: 0 20px 60px rgba(26, 35, 126, 0.3);
          animation: fadeInSlideUp 0.3s ease-out;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 24px;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .form-input,
        .form-select {
          padding: 12px 16px;
          border: 2px solid var(--card-border);
          border-radius: 10px;
          font-size: 14px;
          background: white;
          transition: all var(--transition-fast);
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--accent-light);
          box-shadow: 0 0 0 3px rgba(66, 165, 245, 0.15);
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-text {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .empty-hint {
          font-size: 14px;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .luggage-header {
            flex-direction: column;
            align-items: stretch;
          }

          .progress-section {
            min-width: auto;
          }

          .search-wrapper {
            min-width: auto;
          }

          .luggage-right {
            position: static;
          }

          .fab-btn {
            right: 20px;
            bottom: 20px;
            width: 48px;
            height: 48px;
          }

          .fab-icon {
            font-size: 24px;
          }

          .item-actions {
            opacity: 1;
          }
        }
      `}</style>
    </DndContext>
  )
}
