import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, GripVertical, X } from 'lucide-react';
import { useMapStore, type Material, type TileType } from '@/store/mapStore';

interface EditorPanelProps {
  zoom: number;
  onDragStart: (material: Material, e: React.DragEvent) => void;
  onDragEnd: () => void;
}

interface CategoryGroup {
  category: string;
  materials: Material[];
}

const EditorPanel: React.FC<EditorPanelProps> = ({ zoom, onDragStart, onDragEnd }) => {
  const {
    materials,
    selectedMaterial,
    setSelectedMaterial,
    showMaterialPanel,
    editMode,
    collisionPolygons,
    selectedPolygonId,
    removeCollisionPolygon,
    isDrawingPolygon,
    setIsDrawingPolygon,
    finishDrawingPolygon,
    cancelDrawingPolygon,
    setCurrentDrawingPolygon,
    setEditMode,
  } = useMapStore();

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    '地面': true,
    '障碍': true,
    '装饰': true,
  });

  const groupedMaterials = materials.reduce<CategoryGroup[]>((acc, mat) => {
    const existing = acc.find(g => g.category === mat.category);
    if (existing) {
      existing.materials.push(mat);
    } else {
      acc.push({ category: mat.category, materials: [mat] });
    }
    return acc;
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  const handleDragStart = useCallback((material: Material, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', material.id);
    setSelectedMaterial(material);
    onDragStart(material, e);
  }, [setSelectedMaterial, onDragStart]);

  const handleDragEnd = useCallback(() => {
    onDragEnd();
  }, [onDragEnd]);

  const handleMaterialClick = useCallback((material: Material) => {
    setSelectedMaterial(selectedMaterial?.id === material.id ? null : material);
  }, [selectedMaterial, setSelectedMaterial]);

  const handleStartDrawing = useCallback(() => {
    setIsDrawingPolygon(true);
    setCurrentDrawingPolygon([]);
  }, [setIsDrawingPolygon, setCurrentDrawingPolygon]);

  const handleFinishDrawing = useCallback(() => {
    finishDrawingPolygon();
  }, [finishDrawingPolygon]);

  const handleCancelDrawing = useCallback(() => {
    cancelDrawingPolygon();
  }, [cancelDrawingPolygon]);

  const handleDeletePolygon = useCallback((id: string) => {
    removeCollisionPolygon(id);
  }, [removeCollisionPolygon]);

  if (!showMaterialPanel) return null;

  return (
    <div
      className="h-full bg-[#2b2b2b] border-r border-gray-700 flex flex-col overflow-hidden"
      style={{
        width: 280,
        transition: 'width 0.3s ease-in-out, transform 0.3s ease-in-out',
      }}
    >
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-[#00ff88] text-lg font-bold mb-3">关卡编辑器</h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode('tile')}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editMode === 'tile'
                ? 'bg-[#00ff88] text-[#2b2b2b]'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:translate-y-[-2px]'
            }`}
          >
            地砖编辑
          </button>
          <button
            onClick={() => setEditMode('collision')}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editMode === 'collision'
                ? 'bg-[#00ff88] text-[#2b2b2b]'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:translate-y-[-2px]'
            }`}
          >
            碰撞编辑
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {editMode === 'tile' ? (
          <div className="p-4">
            <p className="text-gray-400 text-xs mb-4">
              拖拽素材到画布上放置，或点击选中后点击画布放置
            </p>
            
            {groupedMaterials.map(group => (
              <div key={group.category} className="mb-4">
                <button
                  onClick={() => toggleCategory(group.category)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 rounded-t hover:bg-gray-700 transition-colors"
                >
                  <span className="text-gray-200 text-sm font-medium">
                    {group.category}
                  </span>
                  {expandedCategories[group.category] ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </button>
                
                {expandedCategories[group.category] && (
                  <div className="p-3 bg-gray-800/50 rounded-b grid grid-cols-2 gap-3">
                    {group.materials.map(material => (
                      <div
                        key={material.id}
                        draggable
                        onDragStart={(e) => handleDragStart(material, e)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleMaterialClick(material)}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 ${
                          selectedMaterial?.id === material.id
                            ? 'ring-2 ring-[#00ff88]'
                            : ''
                        }`}
                        style={{
                          aspectRatio: '1',
                        }}
                      >
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ backgroundColor: material.color }}
                        >
                          <TilePreview type={material.type} />
                        </div>
                        
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                          <div className="w-full p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs text-center font-medium">
                              {material.name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical size={14} className="text-white/80" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <p className="text-gray-400 text-xs mb-4">
              点击画布添加顶点，双击或点击"完成"闭合多边形
            </p>
            
            <div className="flex gap-2 mb-4">
              {!isDrawingPolygon ? (
                <button
                  onClick={handleStartDrawing}
                  className="flex-1 px-4 py-2 bg-[#00ff88] text-[#2b2b2b] rounded text-sm font-medium hover:bg-[#ffdd00] hover:translate-y-[-2px] active:scale-95 transition-all duration-200"
                >
                  + 新建碰撞区域
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFinishDrawing}
                    className="flex-1 px-4 py-2 bg-[#00ff88] text-[#2b2b2b] rounded text-sm font-medium hover:bg-[#ffdd00] hover:translate-y-[-2px] active:scale-95 transition-all duration-200"
                  >
                    完成
                  </button>
                  <button
                    onClick={handleCancelDrawing}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded text-sm font-medium hover:bg-gray-600 hover:translate-y-[-2px] active:scale-95 transition-all duration-200"
                  >
                    取消
                  </button>
                </>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-gray-300 text-sm font-medium mb-2">
                碰撞区域 ({collisionPolygons.length})
              </h3>
              {collisionPolygons.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">
                  暂无碰撞区域
                </p>
              ) : (
                collisionPolygons.map((polygon, index) => (
                  <div
                    key={polygon.id}
                    className={`flex items-center justify-between px-3 py-2 rounded transition-colors ${
                      selectedPolygonId === polygon.id
                        ? 'bg-[#a855f7]/20 border border-[#a855f7]'
                        : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <span className="text-gray-300 text-sm">
                      碰撞区域 {index + 1} ({polygon.vertices.length}个顶点)
                    </span>
                    <button
                      onClick={() => handleDeletePolygon(polygon.id)}
                      className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700 bg-gray-800/50">
        <div className="text-xs text-gray-400 space-y-1">
          <p>缩放: {(zoom * 100).toFixed(0)}%</p>
          <p>提示: 滚轮缩放，拖拽平移</p>
        </div>
      </div>
    </div>
  );
};

const TilePreview: React.FC<{ type: TileType }> = ({ type }) => {
  const patterns: Record<TileType, JSX.Element> = {
    grass: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <rect x="2" y="2" width="36" height="36" fill="#22c55e" rx="2" />
        <rect x="2" y="2" width="36" height="12" fill="#86efac" rx="2" />
        <path d="M10 24 L8 16 L12 18" stroke="#16a34a" strokeWidth="1.5" fill="none" />
        <path d="M20 24 L18 14 L22 16" stroke="#16a34a" strokeWidth="1.5" fill="none" />
        <path d="M30 24 L28 16 L32 18" stroke="#16a34a" strokeWidth="1.5" fill="none" />
      </svg>
    ),
    stone: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <rect x="2" y="2" width="36" height="36" fill="#6b7280" rx="2" />
        <rect x="2" y="2" width="36" height="12" fill="#d1d5db" rx="2" />
        <rect x="6" y="6" width="12" height="12" fill="none" stroke="#4b5563" strokeWidth="1" />
        <rect x="22" y="6" width="12" height="12" fill="none" stroke="#4b5563" strokeWidth="1" />
        <rect x="6" y="22" width="12" height="12" fill="none" stroke="#4b5563" strokeWidth="1" />
        <rect x="22" y="22" width="12" height="12" fill="none" stroke="#4b5563" strokeWidth="1" />
      </svg>
    ),
    wall: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <rect x="2" y="2" width="36" height="36" fill="#57534e" rx="2" />
        <rect x="2" y="2" width="36" height="10" fill="#a8a29e" rx="2" />
        <line x1="4" y1="14" x2="36" y2="14" stroke="#44403c" strokeWidth="1.5" />
        <line x1="4" y1="24" x2="36" y2="24" stroke="#44403c" strokeWidth="1.5" />
        <line x1="4" y1="34" x2="36" y2="34" stroke="#44403c" strokeWidth="1.5" />
      </svg>
    ),
    water: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <rect x="2" y="2" width="36" height="36" fill="#2563eb" rx="2" />
        <rect x="2" y="2" width="36" height="10" fill="#60a5fa" rx="2" />
        <path d="M6 22 Q10 20 14 22 T22 22 T30 22 T34 22" stroke="#1d4ed8" strokeWidth="1.5" fill="none" />
        <path d="M6 30 Q10 28 14 30 T22 30 T30 30 T34 30" stroke="#1d4ed8" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  };

  return patterns[type];
};

export default EditorPanel;
