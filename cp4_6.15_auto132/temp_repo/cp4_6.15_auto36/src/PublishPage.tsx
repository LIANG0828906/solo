import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, GripVertical, Image as ImageIcon } from 'lucide-react';
import { useItemStore } from './itemStore';
import { useUserStore } from './userStore';
import { CATEGORIES } from './types';
import { cn, getConditionLabel } from './utils';

const SAMPLE_IMAGES = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20handmade%20craft%20item%20warm%20cozy%20style&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20kitchen%20utensils%20retro%20warm%20light&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20stationery%20desk%20setup%20cute%20style&image_size=square',
];

export const PublishPage = () => {
  const navigate = useNavigate();
  const { addItem } = useItemStore();
  const { currentUser } = useUserStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState(7);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = () => {
    if (images.length >= 6) return;
    const randomImage = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
    setImages([...images, randomImage + '_' + Date.now()]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index) {
      setDragOverIndex(null);
      return;
    }
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    setImages(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleCategoryToggle = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('请填写物品名称');
      return;
    }
    if (images.length === 0) {
      alert('请至少上传一张图片');
      return;
    }
    if (selectedCategories.length === 0) {
      alert('请至少选择一个类别');
      return;
    }
    if (!currentUser) return;

    const newItem = addItem({
      userId: currentUser.id,
      title: title.trim(),
      description: description.trim() || '卖家很懒，没有留下描述~',
      images,
      condition,
      categories: selectedCategories,
    });

    alert('发布成功！🎉');
    navigate(`/item/${newItem.id}`);
  };

  return (
    <div className="min-h-screen bg-orange-50/30">
      <div className="bg-gradient-to-b from-orange-400 to-amber-300 pt-8 pb-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center btn-bounce"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">发布闲置</h1>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10 pb-32">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-orange-400" />
              物品照片
              <span className="text-xs text-gray-400 font-normal">
                ({images.length}/6)
              </span>
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, index) => (
                <div
                  key={img + '_' + index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'relative aspect-square rounded-2xl overflow-hidden cursor-move transition-all duration-200',
                    draggedIndex === index && 'scale-95 opacity-50 rotate-2',
                    dragOverIndex === index && 'ring-4 ring-orange-400 ring-offset-2 scale-105'
                  )}
                  style={{
                    transform: draggedIndex === index
                      ? 'scale(0.95) rotate(2deg)'
                      : dragOverIndex === index
                      ? 'scale(1.05)'
                      : 'scale(1)',
                  }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-1.5 left-1.5 w-6 h-6 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <GripVertical className="w-4 h-4 text-white" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(index);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center btn-bounce"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="absolute bottom-1.5 right-1.5 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                    {index + 1}
                  </div>
                </div>
              ))}
              {images.length < 6 && (
                <button
                  onClick={handleAddImage}
                  className="aspect-square rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 flex flex-col items-center justify-center text-orange-400 btn-bounce"
                >
                  <Plus className="w-8 h-8 mb-1" />
                  <span className="text-xs">添加图片</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              💡 提示：拖拽图片可以调整顺序
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">物品名称</h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给你的物品起个名字吧"
              className="w-full px-4 py-3 bg-orange-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
              maxLength={30}
            />
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">
              新旧程度
              <span className="text-orange-500 ml-2">{condition}/10</span>
              <span className="text-xs text-gray-400 ml-2 font-normal">
                ({getConditionLabel(condition)})
              </span>
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">旧</span>
              <input
                type="range"
                min="1"
                max="10"
                value={condition}
                onChange={(e) => setCondition(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #FF9A3C ${
                    ((condition - 1) / 9) * 100
                  }%, #FFE8A3 ${((condition - 1) / 9) * 100}%)`,
                }}
              />
              <span className="text-xs text-gray-400">新</span>
            </div>
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">期望交换类别</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 btn-bounce',
                    selectedCategories.includes(cat)
                      ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-md'
                      : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">物品描述</h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="说说物品的故事吧~ 使用时长、特别之处、交换的小期待..."
              rows={4}
              className="w-full px-4 py-3 bg-orange-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all resize-none"
              maxLength={200}
            />
            <p className="text-right text-xs text-gray-400 mt-1">
              {description.length}/200
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-orange-100">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || images.length === 0 || selectedCategories.length === 0}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200',
              title.trim() && images.length > 0 && selectedCategories.length > 0
                ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white btn-bounce shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            🎉 发布物品
          </button>
        </div>
      </div>
    </div>
  );
};
