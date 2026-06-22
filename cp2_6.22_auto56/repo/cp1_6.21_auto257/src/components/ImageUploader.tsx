import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { uploadImage } from '../api/works';
import type { WorkImage } from '../types';

interface ImageUploaderProps {
  images: WorkImage[];
  onChange: (next: WorkImage[]) => void;
  maxCount?: number;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({
  images,
  onChange,
  maxCount = 9,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const canUpload = images.length < maxCount;

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setUploading(true);
      try {
        const remain = maxCount - images.length;
        const toProcess = files.slice(0, remain);
        const next: WorkImage[] = [...images];
        let baseOrder = next.length
          ? Math.max(...next.map((i) => i.order ?? 0)) + 1
          : 0;

        for (const f of toProcess) {
          try {
            const dataUrl = await fileToDataUrl(f);
            let remoteUrl = dataUrl;
            try {
              const uploadRes = await uploadImage(f).catch(() => null);
              if (uploadRes?.url) remoteUrl = uploadRes.url;
            } catch {
              // ignore: fallback to base64
            }
            next.push({
              id: uuidv4(),
              url: remoteUrl,
              order: baseOrder++,
            });
          } catch {
            continue;
          }
        }
        onChange(next);
      } finally {
        setUploading(false);
      }
    },
    [images, maxCount, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    multiple: true,
    disabled: !canUpload || uploading,
    noClick: !canUpload,
  });

  const removeImage = (id: string) =>
    onChange(
      images
        .filter((i) => i.id !== id)
        .map((i, idx) => ({ ...i, order: idx })),
    );

  const setMain = (id: string) => {
    const target = images.find((i) => i.id === id);
    if (!target) return;
    const others = images.filter((i) => i.id !== id);
    const ordered = [target, ...others].map((i, idx) => ({ ...i, order: idx }));
    onChange(ordered);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const arr = [...images];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(idx, 0, moved);
    const reindexed = arr.map((i, n) => ({ ...i, order: n }));
    setDragIdx(idx);
    onChange(reindexed);
  };
  const handleDragEnd = () => setDragIdx(null);

  const gridCols = images.length <= 4 ? 2 : 3;

  return (
    <div className="rounded-xl border border-[#334155] bg-[#1E293B] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#334155]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#F1F5F9]">作品图片</span>
          <span className="text-xs text-[#94A3B8]">
            {images.length} / {maxCount} 张（首张为主图，可拖拽排序）
          </span>
        </div>
      </div>

      <div className="p-4">
        {canUpload && (
          <div
            {...getRootProps()}
            className={`dropzone p-6 mb-4 text-center cursor-pointer ${
              isDragActive ? 'dropzone-active' : ''
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-3xl mb-2 opacity-70">📸</div>
            <div className="text-sm text-[#CBD5E1] mb-1">
              {uploading ? '上传中...' : '点击或拖拽图片到此处上传'}
            </div>
            <div className="text-xs text-[#64748B]">
              支持 PNG / JPG / WEBP，最多 {maxCount} 张
            </div>
          </div>
        )}

        {images.length > 0 && (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
          >
            {images.map((img, idx) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`relative aspect-square rounded-lg overflow-hidden border ${
                  idx === 0
                    ? 'border-[#8B5CF6] ring-2 ring-[#8B5CF6]/30'
                    : 'border-[#334155]'
                } ${dragIdx === idx ? 'opacity-50' : ''} group cursor-move`}
              >
                <img
                  src={img.url}
                  alt={`作品图${idx + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {idx === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#8B5CF6] text-[11px] text-white font-medium">
                    主图
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {idx !== 0 && (
                    <button
                      type="button"
                      className="px-2 py-1 rounded-md bg-[#8B5CF6]/90 text-white text-[11px]"
                      onClick={() => setMain(img.id)}
                    >
                      设为主图
                    </button>
                  )}
                  <button
                    type="button"
                    className="px-2 py-1 rounded-md bg-[#EF4444]/90 text-white text-[11px]"
                    onClick={() => removeImage(img.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!canUpload && (
          <div className="mt-4 text-center text-xs text-[#94A3B8]">
            已达到上限 {maxCount} 张，删除后可继续上传
          </div>
        )}
      </div>
    </div>
  );
}
