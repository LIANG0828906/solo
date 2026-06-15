import { useState, useEffect, FormEvent } from 'react';
import { X, BookOpen, User, Hash, Image, MapPin, Navigation } from 'lucide-react';
import type { Book, BookFormData } from '@/types';
import { useBookStore } from '@/stores/bookStore';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';

interface BookFormProps {
  isOpen: boolean;
  onClose: () => void;
  book?: Book | null;
}

const initialFormData: BookFormData = {
  title: '',
  author: '',
  isbn: '',
  coverUrl: '',
  initialLocation: '',
  initialLat: 0,
  initialLng: 0,
};

interface FormErrors {
  title?: string;
  author?: string;
  initialLocation?: string;
  initialLat?: string;
  initialLng?: string;
}

export default function BookForm({ isOpen, onClose, book }: BookFormProps) {
  const { addBook, updateBook } = useBookStore();
  const { user } = useUserStore();
  const [formData, setFormData] = useState<BookFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        coverUrl: book.coverUrl,
        initialLocation: book.currentLocation,
        initialLat: book.currentLat,
        initialLng: book.currentLng,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [book, isOpen]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入书名';
    }

    if (!formData.author.trim()) {
      newErrors.author = '请输入作者';
    }

    if (!formData.initialLocation.trim()) {
      newErrors.initialLocation = '请输入初始位置';
    }

    if (formData.initialLat < -90 || formData.initialLat > 90) {
      newErrors.initialLat = '纬度范围应在 -90 到 90 之间';
    }

    if (formData.initialLng < -180 || formData.initialLng > 180) {
      newErrors.initialLng = '经度范围应在 -180 到 180 之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (book) {
        await updateBook(book.id, {
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
          coverUrl: formData.coverUrl,
          currentLocation: formData.initialLocation,
          currentLat: formData.initialLat,
          currentLng: formData.initialLng,
        });
      } else {
        if (user) {
          await addBook(formData, user.name);
        }
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'initialLat' || name === 'initialLng'
        ? parseFloat(value) || 0
        : value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (!isOpen) return null;

  const isEdit = !!book;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative w-full max-w-md bg-cornsilk rounded-xl shadow-2xl overflow-hidden',
          'transform transition-all duration-300',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-oak-200 bg-gradient-to-r from-oak-500 to-oak-600">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? '编辑书籍' : '添加书籍'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="flex items-center text-sm font-medium text-oak-700 mb-1.5">
              <BookOpen size={16} className="mr-1.5" />
              书名 <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="请输入书名"
              className={cn(
                'w-full px-3.5 py-2.5 rounded-lg border bg-white/80 text-oak-800 placeholder-oak-300',
                'focus:outline-none focus:ring-2 focus:ring-oak-400/50 focus:border-oak-400 transition-all',
                errors.title ? 'border-red-400' : 'border-oak-200'
              )}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-oak-700 mb-1.5">
              <User className="w-4 h-4 mr-1.5" />
              作者 <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              placeholder="请输入作者"
              className={cn(
                'w-full px-3.5 py-2.5 rounded-lg border bg-white/80 text-oak-800 placeholder-oak-300',
                'focus:outline-none focus:ring-2 focus:ring-oak-400/50 focus:border-oak-400 transition-all',
                errors.author ? 'border-red-400' : 'border-oak-200'
              )}
            />
            {errors.author && (
              <p className="mt-1 text-xs text-red-500">{errors.author}</p>
            )}
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-oak-700 mb-1.5">
              <Hash size={16} className="mr-1.5" />
              ISBN
            </label>
            <input
              type="text"
              name="isbn"
              value={formData.isbn}
              onChange={handleInputChange}
              placeholder="请输入 ISBN（选填）"
              className={cn(
                'w-full px-3.5 py-2.5 rounded-lg border bg-white/80 text-oak-800 placeholder-oak-300',
                'focus:outline-none focus:ring-2 focus:ring-oak-400/50 focus:border-oak-400 transition-all',
                'border-oak-200'
              )}
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-oak-700 mb-1.5">
              <Image size={16} className="mr-1.5" />
              封面 URL
            </label>
            <input
              type="text"
              name="coverUrl"
              value={formData.coverUrl}
              onChange={handleInputChange}
              placeholder="请输入封面图片 URL（选填）"
              className={cn(
                'w-full px-3.5 py-2.5 rounded-lg border bg-white/80 text-oak-800 placeholder-oak-300',
                'focus:outline-none focus:ring-2 focus:ring-oak-400/50 focus:border-oak-400 transition-all',
                'border-oak-200'
              )}
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-oak-700 mb-1.5">
              <MapPin size={16} className="mr-1.5" />
              初始位置 <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="initialLocation"
              value={formData.initialLocation}
              onChange={handleInputChange}
              placeholder="例如：北京市朝阳区图书馆"
              className={cn(
                'w-full px-3.5 py-2.5 rounded-lg border bg-white/80 text-oak-800 placeholder-oak-300',
                'focus:outline-none focus:ring-2 focus:ring-oak-400/50 focus:border-oak-400 transition-all',
                errors.initialLocation ? 'border-red-400' : 'border-oak-200'
              )}
            />
            {errors.initialLocation && (
              <p className="mt-1 text-xs text-red-500">{errors.initialLocation}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-oak-700 mb-1.5">
                <Navigation size={16} className="mr-1.5" />
                纬度
              </label>
              <input
                type="number"
                name="initialLat"
                value={formData.initialLat}
                onChange={handleInputChange}
                step="0.000001"
                placeholder="-90 ~ 90"
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-lg border bg-white/80 text-oak-800 placeholder-oak-300',
                  'focus:outline-none focus:ring-2 focus:ring-oak-400/50 focus:border-oak-400 transition-all',
                  errors.initialLat ? 'border-red-400' : 'border-oak-200'
                )}
              />
              {errors.initialLat && (
                <p className="mt-1 text-xs text-red-500">{errors.initialLat}</p>
              )}
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-oak-700 mb-1.5">
                <Navigation size={16} className="mr-1.5 rotate-90" />
                经度
              </label>
              <input
                type="number"
                name="initialLng"
                value={formData.initialLng}
                onChange={handleInputChange}
                step="0.000001"
                placeholder="-180 ~ 180"
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-lg border bg-white/80 text-oak-800 placeholder-oak-300',
                  'focus:outline-none focus:ring-2 focus:ring-oak-400/50 focus:border-oak-400 transition-all',
                  errors.initialLng ? 'border-red-400' : 'border-oak-200'
                )}
              />
              {errors.initialLng && (
                <p className="mt-1 text-xs text-red-500">{errors.initialLng}</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-oak-300 text-oak-600 font-medium hover:bg-oak-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-all',
                'bg-gradient-to-r from-oak-500 to-oak-600 hover:from-oak-600 hover:to-oak-700',
                'focus:outline-none focus:ring-2 focus:ring-oak-400/50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'shadow-md hover:shadow-lg'
              )}
            >
              {submitting ? '提交中...' : isEdit ? '保存修改' : '添加书籍'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
