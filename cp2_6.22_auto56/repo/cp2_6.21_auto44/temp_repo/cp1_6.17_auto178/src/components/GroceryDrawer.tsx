import { useEffect, useRef, useState } from 'react'
import { X, Trash2, Plus, Minus, Download, FileText } from 'lucide-react'
import { useGroceryStore } from '@/client/GroceryListGenerator'

const categoryLabels: Record<string, string> = {
  vegetable: '蔬菜',
  meat: '肉类',
  seasoning: '调料',
  other: '其他',
}
const categoryOrder = ['vegetable', 'meat', 'seasoning', 'other'] as const

function GroceryDrawer() {
  const drawerOpen = useGroceryStore((s) => s.drawerOpen)
  const items = useGroceryStore((s) => s.items)
  const closeDrawer = useGroceryStore((s) => s.closeDrawer)
  const toggleCheck = useGroceryStore((s) => s.toggleCheck)
  const removeItem = useGroceryStore((s) => s.removeItem)
  const updateQuantity = useGroceryStore((s) => s.updateQuantity)
  const exportAsText = useGroceryStore((s) => s.exportAsText)
  const exportAsPDF = useGroceryStore((s) => s.exportAsPDF)

  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editVal, setEditVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingIdx !== null && inputRef.current) inputRef.current.focus()
  }, [editingIdx])

  const grouped = categoryOrder.map((cat) => ({
    key: cat,
    label: categoryLabels[cat],
    items: items
      .map((item, idx) => ({ ...item, _idx: idx }))
      .filter((item) => item.category === cat),
  }))

  const handleEditSave = (idx: number) => {
    updateQuantity(idx, editVal)
    setEditingIdx(null)
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
        }}
        onClick={closeDrawer}
      />

      <div
        className="fixed top-0 right-0 z-50 h-full bg-white shadow-2xl flex flex-col"
        style={{
          width: 380,
          maxWidth: '100vw',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8ddd0]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#8B4513]">杂货清单</h2>
            <span className="text-xs bg-[#F4A46020] text-[#F4A460] px-2 py-0.5 rounded-full font-medium">
              {items.length} 项
            </span>
          </div>
          <button onClick={closeDrawer} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {grouped.map(({ key, label, items: catItems }) => {
            if (catItems.length === 0) return null
            return (
              <div key={key} className="mb-4">
                <h3 className="text-sm font-semibold text-[#8B4513] mb-2">{label}</h3>
                {catItems.map((item) => (
                  <div
                    key={item._idx}
                    className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleCheck(item._idx)}
                      className="w-4 h-4 accent-[#F4A460] shrink-0"
                    />
                    {editingIdx === item._idx ? (
                      <input
                        ref={inputRef}
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onBlur={() => handleEditSave(item._idx)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditSave(item._idx)}
                        className="flex-1 text-sm border border-[#F4A460] rounded px-1.5 py-0.5 outline-none"
                      />
                    ) : (
                      <span
                        className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}
                        onDoubleClick={() => {
                          setEditingIdx(item._idx)
                          setEditVal(item.amount)
                        }}
                      >
                        {item.name}
                        <span className="ml-1 text-gray-400">{item.amount}</span>
                      </span>
                    )}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => {
                          const match = item.amount.match(/^(\d+)(.*)$/)
                          if (match) {
                            const num = Math.max(0, parseInt(match[1]) - 50)
                            updateQuantity(item._idx, num + match[2])
                          }
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400"
                      >
                        <Minus size={12} />
                      </button>
                      <button
                        onClick={() => {
                          const match = item.amount.match(/^(\d+)(.*)$/)
                          if (match) {
                            const num = parseInt(match[1]) + 50
                            updateQuantity(item._idx, num + match[2])
                          }
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item._idx)}
                      className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
          {items.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-12">清单为空，从菜谱中添加食材吧</p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#e8ddd0] flex gap-3">
          <button
            onClick={exportAsText}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#F4A460' }}
          >
            <FileText size={16} />
            导出为文本
          </button>
          <button
            onClick={exportAsPDF}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-[#F4A460] text-sm font-medium transition-opacity hover:opacity-90"
            style={{ color: '#F4A460' }}
          >
            <Download size={16} />
            导出为PDF
          </button>
        </div>
      </div>
    </>
  )
}

export default GroceryDrawer
