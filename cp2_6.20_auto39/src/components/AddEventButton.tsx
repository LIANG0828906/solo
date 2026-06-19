import React, { useState, useCallback, useRef } from 'react';
import { Plus, X, Upload, Calendar, Image as ImageIcon } from 'lucide-react';
import { useTimelineStore } from '@/store/useTimelineStore';
import dayjs from 'dayjs';

interface FormData {
  date: string;
  title: string;
  description: string;
  summary: string;
  images: string[];
}

const AddEventButton: React.FC = function AddEventButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    date: dayjs().format('YYYY-MM-DD'),
    title: '',
    description: '',
    summary: '',
    images: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addEvent } = useTimelineStore();

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setFormData({
      date: dayjs().format('YYYY-MM-DD'),
      title: '',
      description: '',
      summary: '',
      images: [],
    });
    setIsDragOver(false);
    setIsSubmitting(false);
    setSubmitSuccess(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        const newImages = imageFiles.slice(0, 3 - formData.images.length);
        newImages.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, result].slice(0, 3),
            }));
          };
          reader.readAsDataURL(file);
        });
      }
    },
    [formData.images.length]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        const newImages = imageFiles.slice(0, 3 - formData.images.length);
        newImages.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, result].slice(0, 3),
            }));
          };
          reader.readAsDataURL(file);
        });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [formData.images.length]
  );

  const removeImage = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }, []);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.title.trim() || !formData.description.trim()) {
        return;
      }

      setIsSubmitting(true);
      setSubmitSuccess(true);

      setTimeout(() => {
        const summary =
          formData.summary.trim() ||
          (formData.description.length > 100
            ? `${formData.description.slice(0, 100)}...`
            : formData.description);

        const start = performance.now();

        addEvent({
          date: formData.date,
          title: formData.title,
          description: formData.description,
          summary,
          images: formData.images,
        });

        requestAnimationFrame(() => {
          const duration = performance.now() - start;
          console.log(`添加事件渲染耗时: ${duration.toFixed(2)}ms`);

          if (duration > 100) {
            console.warn(`⚠️ 性能警告: 渲染超过100ms`);
          }
        });

        setTimeout(() => {
          setIsSubmitting(false);
          setSubmitSuccess(false);
          closeModal();
        }, 300);
      }, 400);
    },
    [formData, addEvent, closeModal]
  );

  const isFormValid = formData.title.trim() && formData.description.trim();

  return (
    <>
      <button
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-900 hover:bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center transition-transform duration-300 hover:rotate-90 z-40"
        onClick={openModal}
        aria-label="添加新事件"
      >
        <Plus size={28} />
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">添加新事件</h2>
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={closeModal}
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline-block mr-2" size={16} />
                事件日期
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                事件标题
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="例如：第一次旅行"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                事件概要（可选，最多100字）
              </label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                placeholder="简短描述..."
                maxLength={100}
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {formData.summary.length}/100
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                完整描述
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="详细描述这个重要时刻..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              <ImageIcon className="inline-block mr-2" size={16} />
                上传图片（最多3张）
              </label>

              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                  isDragOver
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Upload
                  className={`mx-auto mb-2 transition-colors ${
                    isDragOver ? 'text-teal-500' : 'text-gray-400'
                  }`}
                  size={32}
                />
                <p
                  className={`text-sm ${
                    isDragOver ? 'text-teal-600' : 'text-gray-500'
                  }`}
                >
                  {isDragOver
                    ? '释放以上传图片'
                    : '拖拽图片到这里，或点击选择'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  支持 JPG、PNG 格式
                </p>
              </div>

              {formData.images.length > 0 && (
                <div className="flex gap-3 mt-3 flex-wrap">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.images.length >= 3 && (
                <p className="text-xs text-amber-500 mt-2">
                  已达到最大图片数量限制
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-all duration-300 ${
                submitSuccess
                  ? 'bg-green-500 scale-100'
                  : isFormValid
                  ? 'bg-blue-900 hover:bg-blue-800'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
              style={{
                transform: isSubmitting ? 'scale(0.95)' : 'scale(1)',
                transitionProperty: 'transform, background-color',
                transitionDuration: '200ms',
              }}
            >
              {submitSuccess ? '✓ 提交成功' : '提交'}
            </button>
          </form>
        </div>
        </div>
      )}
    </>
  );
};

export default AddEventButton;
