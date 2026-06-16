import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  Recipe,
  CanvasBlock,
  Ingredient,
  CuisineType,
  CuisineColor,
  CuisineLabel,
  DifficultyLevel,
  PRESET_INGREDIENTS,
  UNITS,
  INGREDIENT_CATEGORIES
} from './types'
import { useRecipesStore } from './store'

interface EditorCanvasProps {
  recipe: Recipe
}

interface IngredientDragData {
  type: 'ingredient'
  ingredient: Ingredient
}

interface BlockDragData {
  type: 'block'
  blockId: string
}

type DragItemData = IngredientDragData | BlockDragData

const BLOCK_WIDTH = 240
const BLOCK_MIN_HEIGHT = 180

const DraggableIngredientCard: React.FC<{
  ingredient: Ingredient
  onDragStart?: () => void
}> = ({ ingredient }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `ing-${ingredient.id}`,
    data: { type: 'ingredient', ingredient } as IngredientDragData
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? 'scale(0.95)' : undefined,
        touchAction: 'none'
      }}
      className="group p-2.5 rounded-xl bg-white border border-[#EFE4D4] hover:border-[#D4A574] hover:shadow-md hover:shadow-[#D4A574]/10 cursor-grab active:cursor-grabbing transition-all duration-200 fade-in select-none"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-2xl group-hover:scale-110 transition-transform pointer-events-none">{ingredient.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[#5C4033] font-medium text-sm truncate">{ingredient.name}</div>
          <div className="text-[#A0876D] text-xs">{ingredient.category}</div>
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="text-[#8B5E3C] font-medium">{ingredient.quantity} {ingredient.unit}</span>
        <span className="text-[#C4B099] opacity-0 group-hover:opacity-100 transition-opacity">拖拽 →</span>
      </div>
    </div>
  )
}

const DroppableBlock: React.FC<{
  block: CanvasBlock
  recipeId: string
  recipeCuisine: CuisineType
  isSelected: boolean
  isHovered: boolean
  isActiveDrag: boolean
  updateBlock: (rid: string, bid: string, data: Partial<CanvasBlock>) => void
  deleteBlock: (rid: string, bid: string) => void
  addIngredientToBlock: (rid: string, bid: string, ing: Ingredient) => void
  removeIngredientFromBlock: (rid: string, bid: string, iid: string) => void
  updateBlockIngredient: (rid: string, bid: string, iid: string, data: Partial<Ingredient>) => void
  onSelect: () => void
  onHover: (hovered: boolean) => void
}> = ({
  block, recipeId, recipeCuisine, isSelected, isHovered, isActiveDrag,
  updateBlock, deleteBlock, addIngredientToBlock, removeIngredientFromBlock, updateBlockIngredient,
  onSelect, onHover
}) => {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `block-drop-${block.id}`
  })

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: `block-${block.id}`,
    data: { type: 'block', blockId: block.id } as BlockDragData,
    disabled: false
  })

  const style = {
    left: block.position.x,
    top: block.position.y,
    width: BLOCK_WIDTH,
    minHeight: BLOCK_MIN_HEIGHT,
    zIndex: isDragging ? 100 : isSelected ? 50 : isHovered ? 20 : 10,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.85 : 1,
    transition: isDragging ? 'none' : 'transform 0.15s ease, box-shadow 0.15s ease'
  }

  const setBothRefs = (el: HTMLDivElement | null) => {
    setDroppableRef(el)
    setDraggableRef(el)
  }

  return (
    <div
      ref={setBothRefs}
      style={style}
      className={`absolute rounded-2xl ${
        isSelected
          ? 'shadow-xl shadow-[#8B5E3C]/25 ring-2 ring-[#8B5E3C]/50'
          : isOver
            ? 'shadow-2xl shadow-[#D4A574]/40 ring-2 ring-[#D4A574]/60'
            : isHovered
              ? 'shadow-xl shadow-[#8B5E3C]/15 -translate-y-1'
              : 'shadow-lg shadow-black/8'
      }`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
    >
      <div
        {...attributes}
        {...listeners}
        className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white to-[#FFF9F0] border border-[#EFE4D4] cursor-grab active:cursor-grabbing"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
          touchAction: 'none'
        }}
      >
        <div
          className="absolute top-0 left-0 w-12 h-12 rounded-tr-2xl rounded-bl-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
          style={{ backgroundColor: CuisineColor[recipeCuisine] }}
        >
          {block.order}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); deleteBlock(recipeId, block.id) }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur text-[#C85A5A] hover:bg-[#C85A5A] hover:text-white transition-all flex items-center justify-center text-sm z-10"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          ✕
        </button>

        <div className="p-4 pt-10">
          <input
            type="text"
            value={block.title}
            onChange={(e) => updateBlock(recipeId, block.id, { title: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full bg-transparent border-none focus:outline-none font-bold text-[#5C4033] text-sm mb-2"
            placeholder="步骤标题"
          />
          <textarea
            value={block.description}
            onChange={(e) => updateBlock(recipeId, block.id, { description: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            rows={3}
            className="w-full bg-transparent border-none focus:outline-none text-[#7A6650] text-xs resize-none leading-relaxed"
            placeholder="描述这个步骤..."
          />
        </div>

        {block.ingredients.length > 0 && (
          <div className="px-4 pb-3 border-t border-[#F0E6D6]/50 pt-2">
            <div className="flex flex-wrap gap-1.5">
              {block.ingredients.map((ing) => (
                <div key={ing.id} className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5E6D3] text-xs text-[#8B5E3C]">
                  <span className="text-sm">{ing.emoji}</span>
                  <input
                    type="number"
                    value={ing.quantity}
                    onChange={(e) => updateBlockIngredient(recipeId, block.id, ing.id, { quantity: Number(e.target.value) })}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-10 bg-transparent border-none focus:outline-none text-center font-medium"
                  />
                  <span className="text-[#A0876D]">{ing.unit}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeIngredientFromBlock(recipeId, block.id, ing.id) }}
                    className="ml-0.5 text-[#C85A5A] opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {block.ingredients.length === 0 && (
          <div
            className={`mx-4 mb-3 py-2.5 rounded-lg border-2 border-dashed text-center text-xs transition-colors ${
              isOver
                ? 'border-[#D4A574] bg-[#FFF9F0] text-[#8B5E3C]'
                : 'border-[#E8DCC8] text-[#B8A894] hover:border-[#D4A574] hover:text-[#8B5E3C]'
            }`}
          >
            拖拽食材到这里
          </div>
        )}
      </div>
    </div>
  )
}

const ConnectionsRenderer: React.FC<{
  sortedBlocks: CanvasBlock[]
}> = ({ sortedBlocks }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const animFrameRef = useRef<number>(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (sortedBlocks.length < 2) return
    let running = true
    const animate = () => {
      if (!running) return
      setTick((t) => (t + 1) % 1000)
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)
    return () => {
      running = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [sortedBlocks.length])

  if (sortedBlocks.length < 2) return null

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="connGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5E3C" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#D4A574" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8B5E3C" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {sortedBlocks.slice(0, -1).map((block, idx) => {
        const nextBlock = sortedBlocks[idx + 1]
        const sx = block.position.x + BLOCK_WIDTH
        const sy = block.position.y + BLOCK_MIN_HEIGHT / 2
        const ex = nextBlock.position.x
        const ey = nextBlock.position.y + BLOCK_MIN_HEIGHT / 2
        const mx = (sx + ex) / 2
        const my = (sy + ey) / 2
        const dx = Math.abs(ex - sx)
        const isHorizontal = Math.abs(sy - ey) < 50
        const dashOffset = -((tick * 0.24) % 24)
        return (
          <g key={`c-${block.id}-${nextBlock.id}`}>
            <path
              d={isHorizontal
                ? `M ${sx} ${sy} C ${mx} ${sy - 20}, ${mx} ${ey - 20}, ${ex} ${ey}`
                : `M ${sx} ${sy} C ${sx + dx * 0.3} ${sy}, ${ex - dx * 0.3} ${ey}, ${ex} ${ey}`}
              fill="none"
              stroke="url(#connGrad)"
              strokeWidth="3"
              strokeDasharray="8 4"
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{
                willChange: 'stroke-dashoffset',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}
            />
            <circle
              cx={mx}
              cy={my}
              r="12"
              fill="#F5E6D3"
              stroke="#8B5E3C"
              strokeWidth="2"
              style={{ willChange: 'auto', transform: 'translateZ(0)' }}
            />
            <text
              x={mx}
              y={my + 4}
              textAnchor="middle"
              fontSize="11"
              fill="#8B5E3C"
              fontWeight="600"
              style={{ transform: 'translateZ(0)' }}
            >→</text>
          </g>
        )
      })}
    </svg>
  )
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ recipe }) => {
  const customIngredients = useRecipesStore((s) => s.customIngredients) || []
  const updateRecipe = useRecipesStore((s) => s.updateRecipe)
  const addBlock = useRecipesStore((s) => s.addBlock)
  const updateBlock = useRecipesStore((s) => s.updateBlock)
  const deleteBlock = useRecipesStore((s) => s.deleteBlock)
  const addIngredientToBlock = useRecipesStore((s) => s.addIngredientToBlock)
  const removeIngredientFromBlock = useRecipesStore((s) => s.removeIngredientFromBlock)
  const updateBlockIngredient = useRecipesStore((s) => s.updateBlockIngredient)
  const addCustomIngredient = useRecipesStore((s) => s.addCustomIngredient)

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [ingredientCategory, setIngredientCategory] = useState<string>('全部')
  const [showAddIngredient, setShowAddIngredient] = useState(false)
  const [newIngredient, setNewIngredient] = useState({
    name: '', quantity: 100, unit: '克', emoji: '🥗', category: '自定义'
  })
  const [previewKey, setPreviewKey] = useState(0)

  const [activeDragId, setActiveDragId] = useState<UniqueIdentifier | null>(null)
  const [activeDragData, setActiveDragData] = useState<DragItemData | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    })
  )

  const allIngredients = useMemo(
    () => [...PRESET_INGREDIENTS, ...customIngredients],
    [customIngredients]
  )

  const categories = useMemo(() => {
    const cats = [...new Set(allIngredients.map((i) => i.category))]
    return ['全部', ...INGREDIENT_CATEGORIES.filter((c) => cats.includes(c)), ...cats.filter((c) => !INGREDIENT_CATEGORIES.includes(c))]
  }, [allIngredients])

  const filteredIngredients = useMemo(() => {
    return allIngredients.filter((i) => {
      const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCategory = ingredientCategory === '全部' || i.category === ingredientCategory
      return matchSearch && matchCategory
    })
  }, [allIngredients, searchTerm, ingredientCategory])

  const sortedBlocks = useMemo(() => {
    return [...recipe.blocks].sort((a, b) => a.order - b.order)
  }, [recipe.blocks])

  const allRecipeIngredients = useMemo(() => {
    const map = new Map<string, Ingredient & { totalQuantity: number }>()
    recipe.blocks.forEach((block) => {
      if (!Array.isArray(block.ingredients)) return
      block.ingredients.forEach((ing) => {
        const key = `${ing.name}-${ing.unit}`
        if (map.has(key)) {
          map.get(key)!.totalQuantity += ing.quantity
        } else {
          map.set(key, { ...ing, totalQuantity: ing.quantity })
        }
      })
    })
    return Array.from(map.values())
  }, [recipe.blocks])

  const averageRating = useMemo(() => {
    if (!Array.isArray(recipe.ratings) || recipe.ratings.length === 0) return 0
    return recipe.ratings.reduce((a, b) => a + b, 0) / recipe.ratings.length
  }, [recipe.ratings])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id)
    setActiveDragData(event.active.data.current as DragItemData)
  }, [])

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // 视觉反馈由 useDroppable 的 isOver 处理
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    const data = active.data.current as DragItemData

    if (data?.type === 'block' && typeof over?.id === 'string' && over.id.startsWith('canvas-main')) {
      const blockId = data.blockId
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (!canvasRect) {
        setActiveDragId(null)
        setActiveDragData(null)
        return
      }
      const delta = event.delta
      const block = recipe.blocks.find((b) => b.id === blockId)
      if (!block) {
        setActiveDragId(null)
        setActiveDragData(null)
        return
      }
      const newX = Math.max(0, Math.min(block.position.x + delta.x, canvasRect.width - BLOCK_WIDTH))
      const newY = Math.max(0, Math.min(block.position.y + delta.y, Math.max(canvasRect.height, 500) - BLOCK_MIN_HEIGHT))
      updateBlock(recipe.id, blockId, { position: { x: newX, y: newY } })
    } else if (data?.type === 'ingredient') {
      const ingredient = data.ingredient
      if (over?.id && typeof over.id === 'string') {
        if (over.id.startsWith('block-drop-')) {
          const blockId = over.id.replace('block-drop-', '')
          addIngredientToBlock(recipe.id, blockId, ingredient)
        } else if (over.id === 'canvas-main') {
          const canvasRect = canvasRef.current?.getBoundingClientRect()
          if (!canvasRect) {
            setActiveDragId(null)
            setActiveDragData(null)
            return
          }
          const delta = event.delta
          const initialX = 150
          const initialY = 150
          const dropX = Math.max(0, Math.min(initialX + delta.x, canvasRect.width - BLOCK_WIDTH))
          const dropY = Math.max(0, Math.min(initialY + delta.y, Math.max(canvasRect.height, 500) - BLOCK_MIN_HEIGHT))
          addBlock(recipe.id, {
            title: `步骤 ${recipe.blocks.length + 1}`,
            description: '',
            ingredients: [ingredient],
            position: { x: dropX, y: dropY }
          })
        }
      }
    }

    setActiveDragId(null)
    setActiveDragData(null)
  }, [recipe.id, recipe.blocks, updateBlock, addIngredientToBlock, addBlock])

  const { setNodeRef: setCanvasDropRef, isOver: isCanvasOver } = useDroppable({
    id: 'canvas-main'
  })

  const setBothCanvasRefs = (el: HTMLDivElement | null) => {
    canvasRef.current = el
    setCanvasDropRef(el)
  }

  const handleAddCustomIngredient = useCallback(() => {
    if (!newIngredient.name.trim()) return
    addCustomIngredient(newIngredient)
    setNewIngredient({ name: '', quantity: 100, unit: '克', emoji: '🥗', category: '自定义' })
    setShowAddIngredient(false)
  }, [newIngredient, addCustomIngredient])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveDragId(null)
        setActiveDragData(null)
      }}
    >
      <div className="flex h-full bg-[#FBF7F2]" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
        <style>{`
          @keyframes expandFromCenter {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .preview-expand {
            animation: expandFromCenter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            will-change: transform, opacity;
            transform: translateZ(0);
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in {
            animation: fadeIn 0.3s ease forwards;
            will-change: transform, opacity;
          }
        `}</style>

        {/* ====== LEFT: Ingredient Library Panel ====== */}
        <div className="w-72 flex-shrink-0 border-r border-[#E8DCC8] bg-white overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#E8DCC8] bg-gradient-to-br from-[#FFF9F0] to-white">
            <h3 className="text-[#8B5E3C] font-bold text-lg mb-3 flex items-center gap-2">
              <span>🥬</span> 食材库
            </h3>
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="搜索食材..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-9 rounded-lg border border-[#E8DCC8] bg-[#FBF7F2] text-sm text-[#5C4033] placeholder:text-[#B8A894] focus:outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 transition-all"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8A894] text-sm">🔍</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setIngredientCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    ingredientCategory === cat
                      ? 'bg-[#8B5E3C] text-white shadow-sm'
                      : 'bg-[#F5E6D3] text-[#8B5E3C] hover:bg-[#E8D4BE]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddIngredient(!showAddIngredient)}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-[#D4A574] to-[#C49464] text-white text-sm font-medium hover:shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>+</span> 自定义食材
            </button>
          </div>

          {showAddIngredient && (
            <div className="p-4 bg-[#FFF5E8] border-b border-[#E8DCC8] fade-in">
              <div className="space-y-2">
                <input type="text" placeholder="食材名称" value={newIngredient.name} onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })} className="w-full px-3 py-1.5 rounded border border-[#E8DCC8] text-sm focus:outline-none focus:border-[#D4A574]" />
                <div className="flex gap-2">
                  <input type="number" placeholder="用量" value={newIngredient.quantity} onChange={(e) => setNewIngredient({ ...newIngredient, quantity: Number(e.target.value) })} className="w-1/2 px-3 py-1.5 rounded border border-[#E8DCC8] text-sm focus:outline-none focus:border-[#D4A574]" />
                  <select value={newIngredient.unit} onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })} className="w-1/2 px-2 py-1.5 rounded border border-[#E8DCC8] text-sm focus:outline-none focus:border-[#D4A574]">
                    {UNITS.map((u) => (<option key={u} value={u}>{u}</option>))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="emoji" value={newIngredient.emoji} onChange={(e) => setNewIngredient({ ...newIngredient, emoji: e.target.value })} className="w-1/3 px-3 py-1.5 rounded border border-[#E8DCC8] text-sm focus:outline-none focus:border-[#D4A574]" />
                  <input type="text" placeholder="分类" value={newIngredient.category} onChange={(e) => setNewIngredient({ ...newIngredient, category: e.target.value })} className="w-2/3 px-3 py-1.5 rounded border border-[#E8DCC8] text-sm focus:outline-none focus:border-[#D4A574]" />
                </div>
                <button onClick={handleAddCustomIngredient} className="w-full py-1.5 rounded bg-[#8B5E3C] text-white text-sm font-medium hover:bg-[#7A4F2E] transition-colors">添加食材</button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredIngredients.map((ing) => (
              <DraggableIngredientCard key={ing.id} ingredient={ing} />
            ))}
          </div>
        </div>

        {/* ====== CENTER: Main Canvas Area ====== */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-[#E8DCC8] bg-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <input
                type="text"
                value={recipe.title}
                onChange={(e) => updateRecipe(recipe.id, { title: e.target.value })}
                className="text-xl font-bold text-[#5C4033] bg-transparent border-b-2 border-transparent hover:border-[#E8DCC8] focus:border-[#8B5E3C] focus:outline-none px-1 py-0.5 transition-all min-w-0"
                placeholder="食谱标题"
              />
              <select
                value={recipe.cuisine}
                onChange={(e) => updateRecipe(recipe.id, { cuisine: e.target.value as CuisineType })}
                className="px-3 py-1.5 rounded-lg border border-[#E8DCC8] text-sm text-[#5C4033] focus:outline-none focus:border-[#D4A574]"
                style={{ borderLeftWidth: 4, borderLeftColor: CuisineColor[recipe.cuisine] }}
              >
                {(Object.keys(CuisineLabel) as CuisineType[]).map((c) => (
                  <option key={c} value={c}>{CuisineLabel[c]}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button key={lvl} onClick={() => updateRecipe(recipe.id, { difficulty: lvl as DifficultyLevel })} className={`text-lg transition-transform hover:scale-110 ${lvl <= recipe.difficulty ? 'text-[#E8A838]' : 'text-[#D4C4A8]'}`}>★</button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-[#8B5E3C]">
                <span>⏱️</span>
                <input type="number" value={recipe.totalTime} onChange={(e) => updateRecipe(recipe.id, { totalTime: Number(e.target.value) })} className="w-16 px-2 py-1 rounded border border-[#E8DCC8] text-center focus:outline-none focus:border-[#D4A574]" />
                <span className="text-[#A0876D]">分钟</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => addBlock(recipe.id)} className="px-4 py-2 rounded-lg bg-[#F5E6D3] text-[#8B5E3C] text-sm font-medium hover:bg-[#E8D4BE] transition-all flex items-center gap-1.5">
                <span>📝</span> 添加步骤
              </button>
              <button onClick={() => setPreviewKey((k) => k + 1)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#8B5E3C] to-[#7A4F2E] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#8B5E3C]/20 transition-all flex items-center gap-1.5">
                <span>👁️</span> 刷新预览
              </button>
            </div>
          </div>

          <div
            ref={setBothCanvasRefs}
            onClick={() => setSelectedBlockId(null)}
            className="flex-1 relative overflow-auto"
            style={{
              backgroundColor: '#FBF7F2',
              backgroundImage: `
                linear-gradient(to right, rgba(212, 165, 116, 0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(212, 165, 116, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              cursor: activeDragId ? 'grabbing' : 'default',
              minHeight: 500,
              outline: isCanvasOver ? '3px dashed #D4A574' : undefined,
              outlineOffset: '-8px'
            }}
          >
            <ConnectionsRenderer sortedBlocks={sortedBlocks} />

            {recipe.blocks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center p-12 rounded-3xl bg-white/60 backdrop-blur-sm border-2 border-dashed border-[#D4A574]/50">
                  <div className="text-6xl mb-4">🍳</div>
                  <div className="text-[#8B5E3C] font-bold text-lg mb-2">开始创作你的食谱</div>
                  <div className="text-[#A0876D] text-sm">从左侧拖拽食材到画布，或点击「添加步骤」按钮</div>
                </div>
              </div>
            )}

            {sortedBlocks.map((block) => (
              <DroppableBlock
                key={block.id}
                block={block}
                recipeId={recipe.id}
                recipeCuisine={recipe.cuisine}
                isSelected={selectedBlockId === block.id}
                isHovered={hoveredBlockId === block.id}
                isActiveDrag={activeDragId === `block-${block.id}`}
                updateBlock={updateBlock}
                deleteBlock={deleteBlock}
                addIngredientToBlock={addIngredientToBlock}
                removeIngredientFromBlock={removeIngredientFromBlock}
                updateBlockIngredient={updateBlockIngredient}
                onSelect={() => setSelectedBlockId(block.id)}
                onHover={(h) => setHoveredBlockId(h ? block.id : (hoveredBlockId === block.id ? null : hoveredBlockId))}
              />
            ))}
          </div>
        </div>

        {/* ====== RIGHT: Preview Panel ====== */}
        <div className="w-80 flex-shrink-0 border-l border-[#E8DCC8] bg-white overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#E8DCC8] bg-gradient-to-br from-[#FFF9F0] to-white">
            <h3 className="text-[#8B5E3C] font-bold text-lg flex items-center gap-2">
              <span>📖</span> 食谱预览
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div
              key={previewKey}
              className="preview-expand rounded-2xl overflow-hidden bg-gradient-to-b from-white via-[#FFFBF5] to-[#FFF9F0] border border-[#EFE4D4] shadow-lg"
            >
              <div
                className="relative h-40 flex items-center justify-center overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${CuisineColor[recipe.cuisine]}20, ${CuisineColor[recipe.cuisine]}08)` }}
              >
                <div
                  className="absolute top-3 left-3 px-3 py-1 rounded-full text-white text-xs font-bold shadow-sm"
                  style={{ backgroundColor: CuisineColor[recipe.cuisine] }}
                >
                  {CuisineLabel[recipe.cuisine]}
                </div>
                <div className="text-7xl">🍽️</div>
              </div>

              <div className="p-4">
                <h2 className="text-xl font-bold text-[#5C4033] mb-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                  {recipe.title}
                </h2>
                {recipe.description && <p className="text-[#A0876D] text-sm mb-3 leading-relaxed">{recipe.description}</p>}

                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[#F0E6D6]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#D4A574]">⏱️</span>
                    <span className="text-sm text-[#5C4033] font-medium">{recipe.totalTime}分钟</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={i <= recipe.difficulty ? 'text-[#E8A838]' : 'text-[#E8DCC8]'}>★</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#D4A574]">⭐</span>
                    <span className="text-sm text-[#5C4033] font-medium">{averageRating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#D4A574]">👁️</span>
                    <span className="text-sm text-[#5C4033] font-medium">{recipe.views || 0}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-[#8B5E3C] font-bold text-sm mb-2.5 flex items-center gap-1.5">
                    <span>🥗</span> 食材清单
                  </h4>
                  <div className="space-y-1.5">
                    {allRecipeIngredients.length === 0
                      ? <p className="text-[#B8A894] text-xs italic">暂无食材</p>
                      : allRecipeIngredients.map((ing) => (
                        <div key={`${ing.name}-${ing.unit}`} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#FAF4EB]">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{ing.emoji}</span>
                            <span className="text-sm text-[#5C4033]">{ing.name}</span>
                          </div>
                          <span className="text-sm text-[#8B5E3C] font-medium">{ing.totalQuantity} {ing.unit}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div>
                  <h4 className="text-[#8B5E3C] font-bold text-sm mb-2.5 flex items-center gap-1.5">
                    <span>📋</span> 步骤
                  </h4>
                  <div className="space-y-3">
                    {sortedBlocks.length === 0
                      ? <p className="text-[#B8A894] text-xs italic">暂无步骤</p>
                      : sortedBlocks.map((block) => (
                        <div key={block.id} className="flex gap-3">
                          <div
                            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: CuisineColor[recipe.cuisine] }}
                          >
                            {block.order}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-bold text-[#5C4033]">{block.title}</h5>
                            {block.description && <p className="text-xs text-[#7A6650] mt-0.5 leading-relaxed">{block.description}</p>}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#F0E6D6] flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B5E3C] flex items-center justify-center text-lg">
                    {recipe.authorAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#5C4033]">{recipe.author}</div>
                    <div className="text-xs text-[#A0876D]">美食创作者</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeDragId && activeDragData?.type === 'ingredient' ? (
          <div className="p-2.5 rounded-xl bg-white border-2 border-[#D4A574] shadow-2xl shadow-[#8B5E3C]/30 opacity-90" style={{ width: BLOCK_WIDTH - 40 }}>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{(activeDragData as IngredientDragData).ingredient.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[#5C4033] font-medium text-sm truncate">{(activeDragData as IngredientDragData).ingredient.name}</div>
              </div>
            </div>
          </div>
        ) : activeDragData?.type === 'block' ? (
          <div className="p-3 rounded-2xl bg-white border-2 border-[#8B5E3C] shadow-2xl shadow-[#8B5E3C]/40 opacity-90" style={{ width: BLOCK_WIDTH, minHeight: BLOCK_MIN_HEIGHT }}>
            <div className="text-[#5C4033] font-bold text-sm">正在移动步骤...</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
