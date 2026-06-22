import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload } from 'lucide-react';
import { useGalleryStore } from '@/store/galleryStore';
import type { PosterTemplate, UploadFormData } from '@/types';

export const UploadModal: React.FC = () => {
  const isOpen = useGalleryStore((s) => s.isUploadModalOpen);
  const setOpen = useGalleryStore((s) => s.setUploadModalOpen);
  const addPoster = useGalleryStore((s) => s.addPoster);

  const [form, setForm] = useState<UploadFormData>({
    name: '',
    author: '',
    templateFile: null,
    previewFile: null,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setForm({ name: '', author: '', templateFile: null, previewFile: null });
    setPreview(null);
    setError(null);
  };

  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, previewFile: file }));
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.author.trim()) {
      setError('请填写海报名称和作者');
      return;
    }
    if (!form.previewFile || !preview) {
      setError('请上传预览图');
      return;
    }
    if (!form.templateFile) {
      setError('请上传模板JSON文件');
      return;
    }

    setSubmitting(true);
    try {
      const templateText = await form.templateFile.text();
      const template = JSON.parse(templateText) as PosterTemplate;

      if (!template.layers || !template.palette || !template.width || !template.height) {
        throw new Error('模板JSON格式不正确');
      }

      addPoster({
        name: form.name.trim(),
        author: form.author.trim(),
        previewImage: preview,
        template,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析模板失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.31)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: '#2C2C2C', fontFamily: '"Noto Sans SC", sans-serif' }}>
                上传新海报
              </h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition-all duration-150"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  海报名称 *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                  placeholder="例如：晨曦之境"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  作者 *
                </label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                  placeholder="艺术家或策展人姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  预览图 *
                </label>
                <label className="block border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
                  {preview ? (
                    <img
                      src={preview}
                      alt="预览"
                      className="max-h-40 mx-auto rounded-md object-contain"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500">点击上传预览图 (JPG/PNG)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePreviewChange}
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  模板JSON *
                </label>
                <label className="block border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                  {form.templateFile ? (
                    <p className="text-sm text-gray-700 truncate">
                      ✓ {form.templateFile.name}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      点击上传基础模板JSON文件（含layers/palette）
                    </p>
                  )}
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, templateFile: e.target.files?.[0] || null }))
                    }
                  />
                </label>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg font-medium text-white active:scale-95 transition-all duration-150 disabled:opacity-50"
                style={{ backgroundColor: '#2C2C2C' }}
              >
                {submitting ? '上传中...' : '确认上传'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
