import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Home } from 'lucide-react';
import { useGalleryStore } from '@/store/galleryStore';
import { UploadModal } from './UploadModal';

export const GalleryGrid: React.FC = () => {
  const posters = useGalleryStore((s) => s.posters);
  const setSelected = useGalleryStore((s) => s.setSelectedPoster);
  const setUploadOpen = useGalleryStore((s) => s.setUploadModalOpen);

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F2F0EB' }}>
      <nav
        className="h-14 flex items-center px-6 flex-shrink-0"
        style={{ backgroundColor: '#2C2C2C' }}
      >
        <div className="max-w-[1280px] w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-white/70" />
            <span className="text-white/70 text-sm">返回</span>
          </div>
          <h1
            className="text-white font-medium text-lg tracking-wide"
            style={{ fontFamily: '"Noto Sans SC", sans-serif' }}
          >
            动态海报数字画廊
          </h1>
          <div className="w-16" />
        </div>
      </nav>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: '#2C2C2C', fontFamily: '"Noto Sans SC", sans-serif' }}
            >
              展厅作品
            </h2>
            <p className="text-sm" style={{ color: '#6B6B6B' }}>
              共 {posters.length} 件作品 · 点击观看动态衍生版本
            </p>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white active:scale-95 transition-all duration-150 hover:opacity-90"
            style={{ backgroundColor: '#2C2C2C' }}
          >
            <Plus className="w-4 h-4" />
            <span>上传新海报</span>
          </button>
        </div>

        <div
          className="grid gap-5"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {posters.map((poster, index) => (
            <motion.div
              key={poster.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
              whileHover={{ y: -4 }}
              onClick={() => setSelected(poster.id)}
              className="group cursor-pointer overflow-hidden flex flex-col"
              style={{
                borderRadius: '12px',
                border: '2px solid #E0E0E0',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  '0 4px 12px rgba(0,0,0,0.08)';
              }}
            >
              <div className="relative aspect-[7/10] overflow-hidden bg-gray-100">
                <img
                  src={poster.previewImage}
                  alt={poster.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
                  }}
                >
                  <span className="text-white text-xs font-medium">
                    点击查看动态效果
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3
                  className="font-semibold text-base mb-1 line-clamp-1"
                  style={{ color: '#2C2C2C', fontFamily: '"Noto Sans SC", sans-serif' }}
                >
                  {poster.name}
                </h3>
                <p className="text-sm mb-2" style={{ color: '#6B6B6B' }}>
                  {poster.author}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#999' }}>
                    {formatDate(poster.createdAt)}
                  </span>
                  {poster.derivedVersions.length > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#F2F0EB', color: '#555' }}
                    >
                      {poster.derivedVersions.length} 个衍生版本
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {posters.length === 0 && (
          <div className="text-center py-24">
            <p className="text-lg mb-2" style={{ color: '#888' }}>
              展厅暂无作品
            </p>
            <p className="text-sm" style={{ color: '#AAA' }}>
              点击右上角上传你的第一张动态海报
            </p>
          </div>
        )}
      </main>

      <UploadModal />
    </div>
  );
};
