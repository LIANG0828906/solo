import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Upload, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { createCard, fetchCards } from '../modules/cardModule';
import { cn } from '../lib/utils';

const categories = ['tech', 'life', 'study', 'creation'];

export default function CardForm() {
  const { isFormOpen, setIsFormOpen, cards, setCards } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('tech');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [relatedCards, setRelatedCards] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setTitle('');
    setContent('');
    setImage('');
    setCategory('tech');
    setTags([]);
    setTagInput('');
    setRelatedCards([]);
  }, []);

  useEffect(() => {
    if (!isFormOpen) {
      resetForm();
    }
  }, [isFormOpen, resetForm]);

  const handleClose = () => {
    setIsFormOpen(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    }
  };

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleRelatedCardToggle = (cardId: number) => {
    setRelatedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createCard({
        title: title.trim(),
        content: content.trim(),
        image,
        category,
        tags,
        relatedCards,
      });

      const updatedCards = await fetchCards();
      setCards(updatedCards);
      handleClose();
    } catch (error) {
      console.error('Failed to create card:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isFormOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 fade-in"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-2xl w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl fade-in"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-800">创建新卡片</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入卡片标题..."
              className="w-full px-3 py-3 border-2 border-[#BCAAA4] rounded-lg focus:outline-none focus:border-[#8D6E63] transition-colors"
              style={{ padding: '12px' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              正文
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入卡片内容..."
              className="w-full px-3 py-3 border-2 border-[#BCAAA4] rounded-lg focus:outline-none focus:border-[#8D6E63] transition-colors"
              style={{ height: '200px', resize: 'vertical', padding: '12px' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片
            </label>
            {image ? (
              <div className="relative">
                <img
                  src={image}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <div
                onClick={handleImageClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragging
                    ? 'border-[#8D6E63] bg-[#8D6E63]/5'
                    : 'border-[#BCAAA4] hover:border-[#8D6E63] hover:bg-gray-50'
                )}
              >
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  拖拽图片到此处或点击上传
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  支持 JPG、PNG、GIF 格式
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分类
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-3 border-2 border-[#BCAAA4] rounded-lg focus:outline-none focus:border-[#8D6E63] transition-colors bg-white"
              style={{ padding: '12px' }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'tech' && '科技'}
                  {cat === 'life' && '生活'}
                  {cat === 'study' && '学习'}
                  {cat === 'creation' && '创作'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#BCAAA4]/20 text-[#5D4037] rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              onBlur={() => {
                if (tagInput.trim()) addTag();
              }}
              placeholder="输入标签，用逗号分隔..."
              className="w-full px-3 py-3 border-2 border-[#BCAAA4] rounded-lg focus:outline-none focus:border-[#8D6E63] transition-colors"
              style={{ padding: '12px' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              关联卡片
            </label>
            {cards.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto border-2 border-[#BCAAA4] rounded-lg p-2">
                {cards.map((card) => (
                  <label
                    key={card.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                      relatedCards.includes(card.id)
                        ? 'bg-[#8D6E63]/10'
                        : 'hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={relatedCards.includes(card.id)}
                      onChange={() => handleRelatedCardToggle(card.id)}
                      className="w-4 h-4 rounded border-[#BCAAA4] text-[#8D6E63] focus:ring-[#8D6E63]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {card.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {card.content}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {card.category}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center border-2 border-dashed border-[#BCAAA4] rounded-lg">
                暂无可用卡片
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border-2 border-[#BCAAA4] text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 px-4 py-2.5 bg-[#8D6E63] text-white rounded-lg hover:bg-[#6D4C41] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  提交中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  创建卡片
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
