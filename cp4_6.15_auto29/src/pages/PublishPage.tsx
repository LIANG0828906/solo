import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, GripVertical, Image as ImageIcon } from 'lucide-react';
import { useDataStore } from '@/utils/dataStore';
import { CATEGORY_LABELS, type Category } from '@/types';

export default function PublishPage() {
  const navigate = useNavigate();
  const addProduct = useDataStore((state) => state.addProduct);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [condition, setCondition] = useState(7);
  const [description, setDescription] = useState('');
  const [exchangePreference, setExchangePreference] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [newProductId, setNewProductId] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 6 - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setImages((prev) => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (!files) return;

      const remainingSlots = 6 - images.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      filesToProcess.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            setImages((prev) => [...prev, result]);
          };
          reader.readAsDataURL(file);
        }
      });
    },
    [images.length]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newImages = [...images];
    const dragItem = newImages[dragIndex];
    newImages.splice(dragIndex, 1);
    newImages.splice(index, 0, dragItem);
    setImages(newImages);
    setDragIndex(index);
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

    const newProduct = addProduct({
      title: title.trim(),
      category,
      condition,
      description: description.trim(),
      images,
      exchangePreference: exchangePreference.trim() || '不限',
    });

    setNewProductId(newProduct.id);
    setShowSuccessCard(true);

    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const conditionLabel = (value: number) => {
    if (value >= 9) return '几乎全新';
    if (value >= 7) return '成色较好';
    if (value >= 5) return '有使用痕迹';
    if (value >= 3) return '有明显磨损';
    return '品相一般';
  };

  return (
    <div className="min-h-screen bg-morandi-white pb-24">
      <div className="sticky top-0 z-30 bg-morandi-white/90 backdrop-blur-sm border-b border-morandi-gray">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-700">发布闲置</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-3">
            物品照片
            <span className="text-morandi-brown ml-1">（最多6张，拖拽可排序）</span>
          </label>
          <div
            className="grid grid-cols-3 gap-3"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {images.map((img, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOverItem(e, index)}
                className={`relative aspect-square rounded-card overflow-hidden bg-morandi-gray group ${
                  dragIndex === index ? 'opacity-50 scale-95' : ''
                } transition-all duration-200 cursor-move`}
              >
                <img
                  src={img}
                  alt={`图片 ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70"
                  aria-label="删除图片"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <GripVertical size={16} className="text-white drop-shadow" />
                </div>
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-morandi-blue/80 text-white text-xs rounded">
                  {index + 1}
                </div>
              </div>
            ))}
            {images.length < 6 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-card border-2 border-dashed border-morandi-gray-dark bg-morandi-gray/50 flex flex-col items-center justify-center text-morandi-brown hover:border-morandi-blue hover:text-morandi-blue hover:bg-morandi-blue/5 transition-all duration-300"
              >
                <Upload size={24} className="mb-1" />
                <span className="text-xs">添加图片</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              物品名称
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：Kindle Paperwhite 电子书阅读器"
              className="w-full px-4 py-3 bg-white border border-morandi-gray rounded-card text-gray-700 placeholder:text-morandi-brown/60 focus:outline-none focus:border-morandi-blue focus:ring-2 focus:ring-morandi-blue/20 transition-all duration-300"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              物品类别
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                    category === cat
                      ? 'bg-morandi-blue text-white shadow-md'
                      : 'bg-white text-morandi-brown border border-morandi-gray hover:border-morandi-blue hover:text-morandi-blue'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-600">
                新旧程度
              </label>
              <span className="text-sm text-morandi-blue font-medium">
                {condition}/10 · {conditionLabel(condition)}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={1}
                max={10}
                value={condition}
                onChange={(e) => setCondition(Number(e.target.value))}
                className="w-full h-2 bg-morandi-gray rounded-full appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, #A8B5A0 0%, #A8B5A0 ${(condition - 1) * 11.11}%, #E8E6E1 ${(condition - 1) * 11.11}%, #E8E6E1 100%)`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-morandi-brown">
              <span>较旧</span>
              <span>较新</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              详细描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述物品的使用情况、购买时间、是否有瑕疵等..."
              rows={4}
              className="w-full px-4 py-3 bg-white border border-morandi-gray rounded-card text-gray-700 placeholder:text-morandi-brown/60 focus:outline-none focus:border-morandi-blue focus:ring-2 focus:ring-morandi-blue/20 transition-all duration-300 resize-none"
              maxLength={500}
            />
            <div className="text-right text-xs text-morandi-brown mt-1">
              {description.length}/500
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              交换意向
              <span className="text-morandi-brown font-normal ml-1">（想换什么类型的物品）</span>
            </label>
            <input
              type="text"
              value={exchangePreference}
              onChange={(e) => setExchangePreference(e.target.value)}
              placeholder="例如：想换一套心理学书籍，或不限"
              className="w-full px-4 py-3 bg-white border border-morandi-gray rounded-card text-gray-700 placeholder:text-morandi-brown/60 focus:outline-none focus:border-morandi-blue focus:ring-2 focus:ring-morandi-blue/20 transition-all duration-300"
              maxLength={100}
            />
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleSubmit}
            className="w-full py-4 bg-morandi-blue text-white rounded-card font-medium text-base hover:bg-morandi-blue-dark active:scale-[0.98] transition-all duration-300 shadow-md hover:shadow-lg"
          >
            发布物品
          </button>
        </div>
      </div>

      {showSuccessCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowSuccessCard(false)}
          />
          <div className="relative w-full max-w-sm animate-slide-up">
            <div className="bg-white rounded-card p-6 shadow-card text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-morandi-green/20 rounded-full flex items-center justify-center">
                <ImageIcon size={28} className="text-morandi-green" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                发布成功！
              </h3>
              <p className="text-sm text-morandi-brown mb-4">
                你的商品卡片已生成，正在跳转到浏览页...
              </p>
              <div className="bg-morandi-white rounded-card p-3">
                <div className="aspect-square rounded-lg overflow-hidden mb-2">
                  {images[0] && (
                    <img
                      src={images[0]}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <p className="text-sm font-medium text-gray-700 truncate">
                  {title}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
