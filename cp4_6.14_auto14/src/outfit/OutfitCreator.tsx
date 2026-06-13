import React, { useState } from 'react';
import { useWardrobeStore } from '@/store';
import { ClothingItem } from '@/types';

interface OutfitCreatorProps {}

const OutfitCreator: React.FC<OutfitCreatorProps> = () => {
  const { items, createOutfit, outfits, removeOutfit } = useWardrobeStore();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [outfitName, setOutfitName] = useState('');

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (outfitName && selectedItems.length > 0) {
      createOutfit(outfitName, selectedItems);
      setOutfitName('');
      setSelectedItems([]);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">穿搭创建</h1>

      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">创建新穿搭</h2>
        <input
          type="text"
          placeholder="穿搭名称"
          value={outfitName}
          onChange={(e) => setOutfitName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">已选择 {selectedItems.length} 件</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={!outfitName || selectedItems.length === 0}
          className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          创建穿搭
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">选择衣物</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((item: ClothingItem) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                selectedItems.includes(item.id)
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full aspect-square object-cover"
              />
              <div className="p-2 bg-white">
                <p className="text-xs font-medium truncate">{item.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {outfits.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">已保存的穿搭</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outfits.map((outfit) => (
              <div
                key={outfit.id}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <h3 className="font-semibold mb-2">{outfit.name}</h3>
                <div className="flex gap-1 mb-2">
                  {outfit.items.map((itemId) => {
                    const item = items.find((i) => i.id === itemId);
                    return item ? (
                      <img
                        key={itemId}
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : null;
                  })}
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {outfit.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => removeOutfit(outfit.id)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutfitCreator;
