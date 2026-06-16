import React, { useState, useRef, useCallback, useMemo } from 'react'
import {
  Recipe,
  CanvasBlock,
  Ingredient,
  CuisineType,
  CuisineColor,
  CuisineLabel,
  DifficultyLevel,
  PRESET_INGREDIENTS,
  UNITS
} from './types'
import { useRecipesStore } from './store'

interface EditorCanvasProps {
  recipe: Recipe
}

interface DragState {
  isDragging: boolean
  blockId: string | null
  offsetX: number
  offsetY: number
}

const BLOCK_WIDTH = 240
const BLOCK_MIN_HEIGHT = 180

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ recipe }) => {
  const customIngredients = useRecipesStore((s) => s.customIngredients)
  const updateRecipe = useRecipesStore((s) => s.updateRecipe)
  const addBlock = useRecipesStore((s) => s.addBlock)
  const updateBlock = useRecipesStore((s) => s.updateBlock)
  const deleteBlock = useRecipesStore((s) => s.deleteBlock)
  const addIngredientToBlock = useRecipesStore((s) => s.addIngredientToBlock)
  const removeIngredientFromBlock = useRecipesStore((s) => s.removeIngredientFromBlock)
  const updateBlockIngredient = useRecipesStore((s) => s.updateBlockIngredient)
  const addCustomIngredient = useRecipesStore((s) => s.addCustomIngredient)

  const canvasRef = useRef<HTMLDivElement>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [ingredientCategory, setIngredientCategory] = useState<string>('全部')
  const [showAddIngredient, setShowAddIngredient] = useState(false)
  const [newIngredient, setNewIngredient] = useState({
    name: '', quantity: 100, unit: '克', emoji: '🥗', category: '自定义'
  })
  const [previewKey, setPreviewKey] = useState(0)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false, blockId: null, offsetX: 0, offsetY: 0
  })

  const allIngredients = useMemo(
    () => [...PRESET_INGREDIENTS, ...customIngredients],
    [customIngredients]
  )

  const categories = useMemo(() => {
    const cats = [...new Set(allIngredients.map((i) => i.category))]
    return ['全部', ...cats]
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
    if (recipe.ratings.length === 0) return 0
    return recipe.ratings.reduce((a, b) => a + b, 0) / recipe.ratings.length
  }, [recipe.ratings])

  const handleIngredientDragStart = useCallback((e: React.DragEvent, ingredient: Ingredient) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'ingredient', data: ingredient }))
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  const handleBlockMouseDown = useCallback(
    (e: React.MouseEvent, block: CanvasBlock) => {
      if (e.button !== 0) return
      e.stopPropagation()
      setSelectedBlockId(block.id)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setDragState({
        isDragging: true,
        blockId: block.id,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top
      })
    }, []
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState.isDragging || !dragState.blockId) return
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (!canvasRect) return
      const newX = e.clientX - canvasRect.left - dragState.offsetX
      const newY = e.clientY - canvasRect.top - dragState.offsetY
      const clampedX = Math.max(0, Math.min(newX, canvasRect.width - BLOCK_WIDTH))
      const clampedY = Math.max(0, Math.min(newY, canvasRect.height - BLOCK_MIN_HEIGHT))
      updateBlock(recipe.id, dragState.blockId, { position: { x: clampedX, y: clampedY } })
    },
    [dragState, recipe.id, updateBlock]
  )

  const handleMouseUp = useCallback(() => {
    setDragState({ isDragging: false, blockId: null, offsetX: 0, offsetY: 0 })
  }, [])

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData('application/json')
      if (!raw) return
      try {
        const parsed = JSON.parse(raw)
        if (parsed.type === 'ingredient') {
          const ingredient = parsed.data as Ingredient
          const canvasRect = canvasRef.current?.getBoundingClientRect()
          if (!canvasRect) return
          const dropX = e.clientX - canvasRect.left
          const dropY = e.clientY - canvasRect.top

          const targetBlock = recipe.blocks.find((b) => {
            return (
              dropX >= b.position.x &&
              dropX <= b.position.x + BLOCK_WIDTH &&
              dropY >= b.position.y &&
              dropY <= b.position.y + BLOCK_MIN_HEIGHT
            )
          })

          if (!targetBlock) {
            addBlock(recipe.id, {
              title: `步骤 ${recipe.blocks.length + 1}`,
              description: '',
              ingredients: [ingredient],
              position: {
                x: Math.max(0, dropX - BLOCK_WIDTH / 2),
                y: Math.max(0, dropY - BLOCK_MIN_HEIGHT / 2)
              }
            })
          } else {
            addIngredientToBlock(recipe.id, targetBlock.id, ingredient)
          }
        }
      } catch { /* ignore */ }
    },
    [recipe.blocks, recipe.id, addBlock, addIngredientToBlock]
  )

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleAddCustomIngredient = useCallback(() => {
    if (!newIngredient.name.trim()) return
    addCustomIngredient(newIngredient)
    setNewIngredient({ name: '', quantity: 100, unit: '克', emoji: '🥗', category: '自定义' })
    setShowAddIngredient(false)
  }, [newIngredient, addCustomIngredient])

  const renderConnections = () => {
    const sorted = sortedBlocks
    if (sorted.length < 2) return null
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="connGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5E3C" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#D4A574" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8B5E3C" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {sorted.slice(0, -1).map((block, idx) => {
          const nextBlock = sorted[idx + 1]
          const sx = block.position.x + BLOCK_WIDTH
          const sy = block.position.y + BLOCK_MIN_HEIGHT / 2
          const ex = nextBlock.position.x
          const ey = nextBlock.position.y + BLOCK_MIN_HEIGHT / 2
          const mx = (sx + ex) / 2
          const my = (sy + ey) / 2
          const dx = Math.abs(ex - sx)
          const isHorizontal = Math.abs(sy - ey) < 50
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
                strokeLinecap="round"
                className="ribbon-connection"
              />
              <circle cx={mx} cy={my} r="12" fill="#F5E6D3" stroke="#8B5E3C" strokeWidth="2" />
              <text x={mx} y={my + 4} textAnchor="middle" fontSize="11" fill="#8B5E3C" fontWeight="600">→</text>
            </g>
          )
        })}
      </svg>
    )
  }

  return (
    <div className="flex h-full bg-[#FBF7F2]" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      <style>{`
        @keyframes ribbonFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -24; }
        }
        .ribbon-connection { animation: ribbonFlow 1.5s linear infinite; }
        @keyframes expandFromCenter {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .preview-expand { animation: expandFromCenter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
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
            <div
              key={ing.id}
              draggable
              onDragStart={(e) => handleIngredientDragStart(e, ing)}
              className="group p-2.5 rounded-xl bg-white border border-[#EFE4D4] hover:border-[#D4A574] hover:shadow-md hover:shadow-[#D4A574]/10 cursor-grab active:cursor-grabbing transition-all duration-200 fade-in"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl group-hover:scale-110 transition-transform">{ing.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[#5C4033] font-medium text-sm truncate">{ing.name}</div>
                  <div className="text-[#A0876D] text-xs">{ing.category}</div>
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-[#8B5E3C] font-medium">{ing.quantity} {ing.unit}</span>
                <span className="text-[#C4B099] opacity-0 group-hover:opacity-100 transition-opacity">拖拽 →</span>
              </div>
            </div>
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
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
          onClick={() => setSelectedBlockId(null)}
          className="flex-1 relative overflow-auto"
          style={{
            backgroundColor: '#FBF7F2',
            backgroundImage: `
              linear-gradient(to right, rgba(212, 165, 116, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(212, 165, 116, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            cursor: dragState.isDragging ? 'grabbing' : 'default',
            minHeight: 500
          }}
        >
          {renderConnections()}

          {recipe.blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-12 rounded-3xl bg-white/60 backdrop-blur-sm border-2 border-dashed border-[#D4A574]/50">
                <div className="text-6xl mb-4">🍳</div>
                <div className="text-[#8B5E3C] font-bold text-lg mb-2">开始创作你的食谱</div>
                <div className="text-[#A0876D] text-sm">从左侧拖拽食材到画布，或点击「添加步骤」按钮</div>
              </div>
            </div>
          )}

          {sortedBlocks.map((block) => (
            <div
              key={block.id}
              onMouseDown={(e) => handleBlockMouseDown(e, block)}
              onMouseEnter={() => setHoveredBlockId(block.id)}
              onMouseLeave={() => setHoveredBlockId(null)}
              onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id) }}
              style={{
                left: block.position.x,
                top: block.position.y,
                width: BLOCK_WIDTH,
                minHeight: BLOCK_MIN_HEIGHT,
                zIndex: selectedBlockId === block.id ? 50 : hoveredBlockId === block.id ? 20 : 10,
                transform: dragState.isDragging && dragState.blockId === block.id ? 'scale(1.03)' : 'translateY(0)',
                transition: dragState.isDragging && dragState.blockId === block.id ? 'none' : 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              className={`absolute rounded-2xl ${
                selectedBlockId === block.id
                  ? 'shadow-xl shadow-[#8B5E3C]/25 ring-2 ring-[#8B5E3C]/50'
                  : hoveredBlockId === block.id
                    ? 'shadow-xl shadow-[#8B5E3C]/15 -translate-y-1'
                    : 'shadow-lg shadow-black/8'
              }`}
            >
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white to-[#FFF9F0] border border-[#EFE4D4]" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}>
                <div
                  className="absolute top-0 left-0 w-12 h-12 rounded-tr-2xl rounded-bl-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                  style={{ backgroundColor: CuisineColor[recipe.cuisine] }}
                >
                  {block.order}
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); deleteBlock(recipe.id, block.id) }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur text-[#C85A5A] hover:bg-[#C85A5A] hover:text-white transition-all flex items-center justify-center text-sm z-10"
                  style={{ opacity: hoveredBlockId === block.id ? 1 : 0 }}
                >
                  ✕
                </button>

                <div className="p-4 pt-10">
                  <input
                    type="text"
                    value={block.title}
                    onChange={(e) => updateBlock(recipe.id, block.id, { title: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent border-none focus:outline-none font-bold text-[#5C4033] text-sm mb-2"
                    placeholder="步骤标题"
                  />
                  <textarea
                    value={block.description}
                    onChange={(e) => updateBlock(recipe.id, block.id, { description: e.target.value })}
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
                            onChange={(e) => updateBlockIngredient(recipe.id, block.id, ing.id, { quantity: Number(e.target.value) })}
                            onClick={(e) => e.stopPropagation()}
                            className="w-10 bg-transparent border-none focus:outline-none text-center font-medium"
                          />
                          <span className="text-[#A0876D]">{ing.unit}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeIngredientFromBlock(recipe.id, block.id, ing.id) }}
                            className="ml-0.5 text-[#C85A5A] opacity-0 group-hover:opacity-100 transition-opacity"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {block.ingredients.length === 0 && (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      try {
                        const raw = e.dataTransfer.getData('application/json')
                        const parsed = JSON.parse(raw)
                        if (parsed.type === 'ingredient') {
                          addIngredientToBlock(recipe.id, block.id, parsed.data)
                        }
                      } catch { /* ignore */ }
                    }}
                    className="mx-4 mb-3 py-2.5 rounded-lg border-2 border-dashed border-[#E8DCC8] text-center text-[#B8A894] text-xs hover:border-[#D4A574] hover:text-[#8B5E3C] transition-colors"
                  >
                    拖拽食材到这里
                  </div>
                )}
              </div>
            </div>
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
                  <span className="text-sm text-[#5C4033] font-medium">{recipe.views}</span>
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
  )
}
