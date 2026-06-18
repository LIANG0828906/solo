import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [ripple, setRipple] = useState(false);
  const { createAnnouncement, loading } = useAppStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTitle('');
      setContent('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setRipple(true);
    setTimeout(() => setRipple(false), 300);

    const result = await createAnnouncement(title.trim(), content.trim());
    if (result) {
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">发布公告</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              公告标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              placeholder="请输入公告标题..."
              maxLength={60}
              className="
                w-full px-4 py-3 border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                transition-all text-gray-700 placeholder-gray-400
              "
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {title.length}/60
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              公告内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder="请输入公告内容..."
              maxLength={500}
              rows={5}
              className="
                w-full px-4 py-3 border border-gray-200 rounded-xl resize-none
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                transition-all text-gray-700 placeholder-gray-400
              "
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {content.length}/500
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim() || !content.trim()}
            className={`
              relative overflow-hidden w-full py-3 rounded-xl font-medium text-white
              transition-all duration-300 transform
              ${ripple ? 'scale-105' : 'scale-100'}
              ${loading || !title.trim() || !content.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-[#6366f1] hover:bg-indigo-700'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                发布中...
              </span>
            ) : (
              '发布公告'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAnnouncementModal;
