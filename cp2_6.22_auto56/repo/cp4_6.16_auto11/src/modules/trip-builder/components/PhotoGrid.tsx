import { useState, useRef, useCallback } from 'react';
import { X, Upload, GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { useLazyLoad } from '@/shared/hooks/useLazyLoad';
import { compressImage } from '@/shared/utils/photoCompressor';
import { useTripStore } from '@/shared/data/TripStore';
import type { Photo } from '@/shared/types';

interface PhotoGridProps {
  photos: Photo[];
  pageId: string;
  tripId: string;
}

interface UploadingPhoto {
  id: string;
  name: string;
  progress: number;
}

export default function PhotoGrid({ photos, pageId, tripId }: PhotoGridProps) {
  const [uploadingPhotos, setUploadingPhotos] = useState<UploadingPhoto[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addPhotoToPage = useTripStore((s) => s.addPhotoToPage);
  const removePhotoFromPage = useTripStore((s) => s.removePhotoFromPage);
  const reorderPhotos = useTripStore((s) => s.reorderPhotos);

  const handleUpload = useCallback(
    async (files: FileList) => {
      const remainingSlots = 6 - photos.length;
      if (remainingSlots <= 0) return;

      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      for (const file of filesToProcess) {
        const uploadId = uuidv4();
        setUploadingPhotos((prev) => [
          ...prev,
          { id: uploadId, name: file.name, progress: 0 },
        ]);

        try {
          setUploadingPhotos((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: 20 } : u))
          );

          const { compressedFile, thumbnailUrl } = await compressImage(file, 200);

          setUploadingPhotos((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: 70 } : u))
          );

          const url = URL.createObjectURL(compressedFile);
          const newPhoto: Photo = {
            id: uuidv4(),
            url,
            thumbnailUrl,
            name: file.name,
            originalSize: file.size,
            compressedSize: compressedFile.size,
            uploadedAt: new Date().toISOString(),
          };

          addPhotoToPage(tripId, pageId, newPhoto);

          setUploadingPhotos((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: 100 } : u))
          );

          setTimeout(() => {
            setUploadingPhotos((prev) => prev.filter((u) => u.id !== uploadId));
          }, 300);
        } catch {
          setUploadingPhotos((prev) => prev.filter((u) => u.id !== uploadId));
        }
      }
    },
    [photos.length, tripId, pageId, addPhotoToPage]
  );

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      const orderedIds = [...photos.map((p) => p.id)];
      const [movedId] = orderedIds.splice(dragIndex, 1);
      orderedIds.splice(index, 0, movedId);
      reorderPhotos(tripId, pageId, orderedIds);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const maxPhotos = 6;
  const showUpload = photos.length + uploadingPhotos.length < maxPhotos;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          照片 ({photos.length}/{maxPhotos})
        </h3>
      </div>

      {uploadingPhotos.length > 0 && (
        <div className="space-y-2">
          {uploadingPhotos.map((upload) => (
            <div
              key={upload.id}
              className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20"
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="truncate text-blue-700 dark:text-blue-300">
                  {upload.name}
                </span>
                <span className="text-blue-600 dark:text-blue-400">{upload.progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.map((photo, index) => (
          <PhotoItem
            key={photo.id}
            photo={photo}
            index={index}
            isDragging={dragIndex === index}
            isDragOver={dragOverIndex === index && dragIndex !== index}
            onDragStart={handleDragStart(index)}
            onDragOver={handleDragOver(index)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop(index)}
            onDragEnd={handleDragEnd}
            onDelete={() => removePhotoFromPage(tripId, pageId, photo.id)}
          />
        ))}

        {showUpload && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'group flex aspect-square flex-col items-center justify-center',
              'rounded-lg border-2 border-dashed border-gray-300 bg-gray-50',
              'hover:border-indigo-400 hover:bg-indigo-50',
              'transition-all duration-200 dark:border-gray-600 dark:bg-gray-800/50',
              'dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20'
            )}
          >
            <Upload className="mb-1 h-6 w-6 text-gray-400 transition-colors group-hover:text-indigo-500 dark:text-gray-500" />
            <span className="text-xs text-gray-500 transition-colors group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400">
              添加照片
            </span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              handleUpload(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </div>
    </div>
  );
}

interface PhotoItemProps {
  photo: Photo;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDelete: () => void;
}

function PhotoItem({
  photo,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onDelete,
}: PhotoItemProps) {
  const { ref, hasIntersected } = useLazyLoad<HTMLDivElement>();
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      ref={ref}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-lg',
        'cursor-grab active:cursor-grabbing',
        'transition-all duration-200',
        isDragging && 'opacity-40 scale-95',
        isDragOver && 'ring-2 ring-indigo-500 ring-offset-2 scale-105',
        !isDragging && 'hover:scale-[1.05] hover:shadow-lg'
      )}
    >
      <div className="absolute left-1 top-1 z-10 rounded bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-3 w-3 text-white" />
      </div>

      <button
        onClick={onDelete}
        className="absolute right-1 top-1 z-10 rounded-full bg-black/50 p-1 opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
      >
        <X className="h-3 w-3 text-white" />
      </button>

      {photo.thumbnailUrl && !loaded && (
        <img
          src={photo.thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full blur-sm object-cover"
        />
      )}

      {hasIntersected && (
        <img
          src={photo.url}
          alt={photo.name}
          onLoad={() => setLoaded(true)}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {!loaded && !hasIntersected && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
      )}
    </div>
  );
}
