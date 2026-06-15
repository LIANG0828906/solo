import { useState, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { X, Save, Trash2, Palette } from 'lucide-react';
import { useWardrobeStore } from '@/store';
import ClosetItem from '@/closet/ClosetItem';
import { FilterBar } from '@/closet/ClosetGrid';
import {
  ClothingItem,
  OutfitTag,
} from '@/types';
import { cn } from '@/lib/utils';

const MAX_OUTFIT_ITEMS = 5;

function OutfitCreator() {
  const {
    items,
    outfits,
    createOutfit,
    removeOutfit,
    getFilteredItems,
    assignDailyOutfit,
  } = useWardrobeStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [outfitName, setOutfitName] = useState('');
  const [lastTags, setLastTags] = useState<OutfitTag[]>([]);

  const filteredItems = useMemo(() => getFilteredItems(), [getFilteredItems, items]);

  const availableItems = useMemo(
    () => filteredItems.filter((item) => !selectedIds.includes(item.id)),
    [filteredItems, selectedIds]
  );

  const selectedItems = useMemo(
    () => selectedIds.map((id) => items.find((i) => i.id === id)!).filter(Boolean),
    [selectedIds, items]
  );

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    if (
      source.droppableId === 'closet-list' &&
      destination.droppableId === 'outfit-canvas'
    ) {
      if (selectedIds.length >= MAX_OUTFIT_ITEMS) return;
      const draggedItem = availableItems[source.index];
      if (draggedItem && !selectedIds.includes(draggedItem.id)) {
        setSelectedIds((prev) => [...prev, draggedItem.id]);
      }
    }

    if (
      source.droppableId === 'outfit-canvas' &&
      destination.droppableId === 'closet-list'
    ) {
      const removedId = selectedIds[source.index];
      if (removedId) {
        setSelectedIds((prev) => prev.filter((id) => id !== removedId));
      }
    }

    if (
      source.droppableId === 'outfit-canvas' &&
      destination.droppableId === 'outfit-canvas'
    ) {
      setSelectedIds((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(source.index, 1);
        updated.splice(destination.index, 0, moved);
        return updated;
      });
    }
  }, [availableItems, selectedIds]);

  const handleRemoveFromOutfit = (id: string) => {
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  };

  const handleSaveOutfit = () => {
    if (!outfitName.trim() || selectedIds.length === 0) return;
    const outfit = createOutfit(outfitName.trim(), selectedIds);
    setLastTags(outfit.tags);
    setOutfitName('');
    setSelectedIds([]);
  };

  const handleAssignToday = (outfitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    assignDailyOutfit(today, outfitId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-full flex-col p-6">
        <h2 className="mb-4 text-xl font-bold text-gray-800">穿搭创建</h2>

        <div className="flex flex-1 gap-6 overflow-hidden" style={{ minHeight: 0 }}>
          <div
            className="flex flex-col overflow-hidden"
            style={{ width: '40%', minWidth: 0 }}
          >
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-600">衣橱单品</h3>
              <p className="text-xs text-gray-400">拖拽单品到右侧搭配区域</p>
            </div>

            <FilterBar compact />

            <Droppable droppableId="closet-list" isDropDisabled={false}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'flex-1 overflow-y-auto rounded-xl p-3 transition-colors duration-200',
                    snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-white'
                  )}
                  style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    borderRadius: 12,
                    minHeight: 200,
                  }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {availableItems.map((item, index) => (
                      <ClosetItem
                        key={item.id}
                        item={item}
                        index={index}
                        draggable
                        droppableId="closet"
                        compact
                      />
                    ))}
                  </div>
                  {provided.placeholder}
                  {availableItems.length === 0 && (
                    <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                      {filteredItems.length === 0 ? '没有匹配的单品' : '所有单品已选择'}
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>

          <div
            className="flex flex-col overflow-hidden"
            style={{ width: '60%', minWidth: 0 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600">搭配区域</h3>
                <p className="text-xs text-gray-400">
                  最多 {MAX_OUTFIT_ITEMS} 件 · 已选 {selectedIds.length} 件
                </p>
              </div>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  清空
                </button>
              )}
            </div>

            <Droppable droppableId="outfit-canvas" direction="vertical">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'flex-1 overflow-y-auto rounded-xl p-4 transition-colors duration-200',
                    snapshot.isDraggingOver ? 'bg-orange-50' : 'bg-[#fff8f0]'
                  )}
                  style={{
                    borderRadius: 12,
                    border: '2px dashed',
                    borderColor: snapshot.isDraggingOver ? '#f0932b' : '#e5ddd5',
                    minHeight: 300,
                  }}
                >
                  {selectedItems.length === 0 ? (
                    <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-gray-400">
                      <Palette className="mb-3 h-12 w-12 text-gray-300" />
                      <p className="text-sm">拖拽衣橱单品到这里</p>
                      <p className="mt-1 text-xs">或点击衣橱中的单品添加</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedItems.map((item, index) => (
                        <Draggable
                          key={item.id}
                          draggableId={`outfit-${item.id}`}
                          index={index}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={cn(
                                'flex items-center gap-4 rounded-xl bg-white p-3 transition-shadow duration-200',
                                dragSnapshot.isDragging && 'z-50 scale-105 shadow-xl'
                              )}
                              style={{
                                ...dragProvided.draggableProps.style,
                                boxShadow: dragSnapshot.isDragging
                                  ? '0 8px 32px rgba(0,0,0,0.25)'
                                  : '0 2px 8px rgba(0,0,0,0.06)',
                                borderRadius: 12,
                              }}
                            >
                              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                                <div
                                  className="absolute bottom-1 right-1 h-4 w-4 rounded-full border border-white"
                                  style={{ backgroundColor: item.color }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-gray-800">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.category} · {item.season}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromOutfit(item.id)}
                                className="flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </div>
              )}
            </Droppable>

            {selectedIds.length > 0 && (
              <div className="mt-4 rounded-xl bg-white p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: 12 }}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: item.color }}
                        title={item.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {lastTags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium',
                        tag === '色彩和谐' && 'bg-green-50 text-green-700',
                        tag === '撞色对比' && 'bg-red-50 text-red-700',
                        tag === '单色系' && 'bg-gray-100 text-gray-700',
                        tag === '暖色调' && 'bg-orange-50 text-orange-700',
                        tag === '冷色调' && 'bg-blue-50 text-blue-700',
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="输入穿搭名称"
                    value={outfitName}
                    onChange={(e) => setOutfitName(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={handleSaveOutfit}
                    disabled={!outfitName.trim() || selectedIds.length === 0}
                    className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    保存
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {outfits.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-600">已保存的穿搭</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {outfits.map((outfit) => {
                const outfitItems = outfit.items
                  .map((itemId) => items.find((i) => i.id === itemId))
                  .filter(Boolean) as ClothingItem[];

                return (
                  <div
                    key={outfit.id}
                    className="overflow-hidden rounded-xl bg-white p-4"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: 12 }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="truncate text-sm font-semibold text-gray-800">
                        {outfit.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeOutfit(outfit.id)}
                        className="text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mb-2 flex gap-1.5">
                      {outfitItems.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="h-10 w-10 overflow-hidden rounded-lg"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mb-2 flex gap-1">
                      {outfitItems.map((item) => (
                        <div
                          key={item.id}
                          className="h-4 w-4 rounded-full border border-gray-100"
                          style={{ backgroundColor: item.color }}
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {outfit.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAssignToday(outfit.id)}
                      className="mt-2 w-full rounded-lg bg-gray-50 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      安排到今日
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
}

export default OutfitCreator;
