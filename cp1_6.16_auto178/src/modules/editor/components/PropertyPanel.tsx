import React from 'react'
import { Plus, Trash2, Palette } from 'lucide-react'
import { useMindmapStore } from '../store/useMindmapStore'
import { PRESET_COLORS } from '../types'

interface PropertyPanelProps {
  isOpen: boolean
  onClose: () => void
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ isOpen, onClose }) => {
  const {
    nodes,
    selectedNodeId,
    updateNode,
    removeNode,
    addNode,
    selectNode,
  } = useMindmapStore()

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedNodeId) return
    updateNode(selectedNodeId, { label: e.target.value })
  }

  const handleColorChange = (color: string) => {
    if (!selectedNodeId) return
    updateNode(selectedNodeId, { color })
  }

  const handleAddChild = () => {
    if (!selectedNode) return
    const childX = selectedNode.x + (selectedNode.width || 160) + 80
    const childY = selectedNode.y
    addNode('新节点', childX, childY)
  }

  const handleDelete = () => {
    if (!selectedNodeId) return
    removeNode(selectedNodeId)
    onClose()
  }

  if (!selectedNode) {
    return (
      <div
        className={`h-full bg-white border-l border-gray-200 flex flex-col items-center justify-center text-gray-400 transition-all duration-200 ease-out ${
          isOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full overflow-hidden'
        }`}
      >
        <p className="text-sm">请选择一个节点以编辑属性</p>
      </div>
    )
  }

  return (
    <div
      className={`h-full bg-white border-l border-gray-200 flex flex-col transition-all duration-200 ease-out ${
        isOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full overflow-hidden'
      }`}
    >
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">节点属性</h3>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            节点标签
          </label>
          <input
            type="text"
            value={selectedNode.label}
            onChange={handleLabelChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="输入节点文本"
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
            <Palette size={14} />
            背景颜色
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-full aspect-square rounded-md border-2 transition-all duration-200 hover:scale-110 ${
                  selectedNode.color === color
                    ? 'border-blue-500 scale-110'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            位置
          </label>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="bg-gray-50 px-3 py-2 rounded-md">
              X: {Math.round(selectedNode.x)}
            </div>
            <div className="bg-gray-50 px-3 py-2 rounded-md">
              Y: {Math.round(selectedNode.y)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleAddChild}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 active:bg-blue-700 transition-all duration-200"
          >
            <Plus size={16} />
            添加子节点
          </button>

          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm font-medium hover:bg-red-100 active:bg-red-200 transition-all duration-200"
          >
            <Trash2 size={16} />
            删除节点
          </button>
        </div>
      </div>
    </div>
  )
}

export default PropertyPanel
