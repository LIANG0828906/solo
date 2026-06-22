import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Upload, Play, Volume2, X, Image as ImageIcon, FileVideo, FileAudio } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
}

interface UploadItem {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
}

interface MaterialGridProps {
  projectId: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileType = (mimeType: string): 'image' | 'video' | 'audio' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'image';
};

const MaterialGrid: React.FC<MaterialGridProps> = ({ projectId }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight] = useState(500);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowHeight = 200;
  const columns = 4;

  useEffect(() => {
    const mockMaterials: Material[] = [];
    for (let i = 0; i < 150; i++) {
      const types: ('image' | 'video' | 'audio')[] = ['image', 'video', 'audio'];
      const type = types[i % 3];
      mockMaterials.push({
        id: `mat-${i}`,
        name: `素材_${i + 1}.${type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'mp3'}`,
        type,
        url: type === 'image'
          ? `https://picsum.photos/seed/${i}/400/225`
          : type === 'video'
          ? 'https://www.w3schools.com/html/mov_bbb.mp4'
          : 'https://www.w3schools.com/html/horse.mp3',
        thumbnail: type === 'image' ? `https://picsum.photos/seed/${i}/400/225` : undefined,
        size: Math.floor(Math.random() * 10 * 1024 * 1024),
        mimeType: type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'audio/mpeg',
      });
    }
    setMaterials(mockMaterials);
  }, []);

  const totalRows = Math.ceil(materials.length / columns);
  const useVirtualScroll = materials.length > 100;

  const visibleStartRow = useMemo(() => {
    if (!useVirtualScroll) return 0;
    return Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  }, [scrollTop, useVirtualScroll, rowHeight]);

  const visibleEndRow = useMemo(() => {
    if (!useVirtualScroll) return totalRows;
    const visibleRowCount = Math.ceil(containerHeight / rowHeight) + 4;
    return Math.min(totalRows, visibleStartRow + visibleRowCount);
  }, [totalRows, visibleStartRow, useVirtualScroll, containerHeight, rowHeight]);

  const visibleMaterials = useMemo(() => {
    if (!useVirtualScroll) return materials;
    const start = visibleStartRow * columns;
    const end = visibleEndRow * columns;
    return materials.slice(start, end).map((mat, idx) => ({
      ...mat,
      _virtualIndex: start + idx,
    }));
  }, [materials, visibleStartRow, visibleEndRow, useVirtualScroll, columns]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
  }, [projectId]);

  const handleClickUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [projectId]);

  const uploadFiles = async (files: File[]) => {
    const newUploadItems: UploadItem[] = files.map((file) => ({
      id: `upload-${Date.now()}-${Math.random()}`,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    }));
    setUploadItems((prev) => [...prev, ...newUploadItems]);

    const uploadPromises = files.map(async (file, index) => {
      const uploadId = newUploadItems[index].id;
      const formData = new FormData();
      formData.append('file', file);

      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/projects/${projectId}/materials`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadItems((prev) =>
              prev.map((item) =>
                item.id === uploadId ? { ...item, progress } : item
              )
            );
          }
        };

        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => resolve();
          xhr.onerror = () => reject(new Error('上传失败'));
          xhr.onabort = () => reject(new Error('上传取消'));
          xhr.send(formData);
        });

        const newMaterial: Material = {
          id: `mat-${Date.now()}-${index}`,
          name: file.name,
          type: getFileType(file.type),
          url: URL.createObjectURL(file),
          thumbnail: getFileType(file.type) === 'image' ? URL.createObjectURL(file) : undefined,
          size: file.size,
          mimeType: file.type,
        };
        setMaterials((prev) => [newMaterial, ...prev]);
        setUploadItems((prev) =>
          prev.map((item) =>
            item.id === uploadId ? { ...item, status: 'done' as const, progress: 100 } : item
          )
        );
      } catch {
        setUploadItems((prev) =>
          prev.map((item) =>
            item.id === uploadId ? { ...item, status: 'error' as const } : item
          )
        );
      }
    });

    await Promise.all(uploadPromises);

    setTimeout(() => {
      setUploadItems((prev) => prev.filter((item) => item.status !== 'done'));
    }, 2000);
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const getTypeIcon = (type: 'image' | 'video' | 'audio') => {
    switch (type) {
      case 'image':
        return <ImageIcon size={14} />;
      case 'video':
        return <FileVideo size={14} />;
      case 'audio':
        return <FileAudio size={14} />;
    }
  };

  const renderMaterialCard = (material: Material, actualIndex: number) => (
    <div
      key={material.id}
      style={{
        position: 'absolute',
        top: Math.floor(actualIndex / columns) * rowHeight,
        left: (actualIndex % columns) * 25 + '%',
        width: '25%',
        padding: '8px',
      }}
    >
      <div
        onClick={() => setPreviewMaterial(material)}
        style={{
          borderRadius: '8px',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          backgroundColor: '#1E293B',
          height: '100%',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 25px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        }}
      >
        <div
          style={{
            aspectRatio: '16/9',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {material.type === 'image' && (
            <img
              src={material.thumbnail || material.url}
              alt={material.name}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
          {material.type === 'video' && (
            <>
              <img
                src={`https://picsum.photos/seed/vid-${material.id}/400/225`}
                alt={material.name}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1E293B',
                  }}
                >
                  <Play size={24} fill="#1E293B" />
                </div>
              </div>
            </>
          )}
          {material.type === 'audio' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #334155 0%, #1E293B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '3px',
                  height: '40px',
                }}
              >
                {[0.3, 0.7, 0.5, 0.9, 0.6, 0.4, 0.8, 0.5, 0.7, 0.4, 0.8, 0.6].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: '3px',
                      height: `${h * 100}%`,
                      backgroundColor: '#10B981',
                      borderRadius: '2px',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#94A3B8',
                fontSize: '11px',
              }}
            >
              {getTypeIcon(material.type)}
              <span style={{ textTransform: 'uppercase' }}>{material.type}</span>
            </div>
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#E2E8F0',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={material.name}
          >
            {material.name}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#64748B',
              marginTop: '2px',
            }}
          >
            {formatFileSize(material.size)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickUpload}
        style={{
          backgroundColor: isDragging ? '#1E3A5F' : '#0F172A',
          border: isDragging ? '2px solid #3B82F6' : '2px dashed #475569',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Upload
            size={32}
            style={{
              color: isDragging ? '#3B82F6' : '#64748B',
              transition: 'color 0.3s ease',
            }}
          />
          <div
            style={{
              color: isDragging ? '#3B82F6' : '#94A3B8',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'color 0.3s ease',
            }}
          >
            拖拽文件到此处或点击上传
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="image/*,video/*,audio/*"
        />
      </div>

      {uploadItems.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {uploadItems.map((item) => (
            <div
              key={item.id}
              style={{
                marginBottom: '8px',
                padding: '12px',
                backgroundColor: '#1E293B',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '12px',
                  color: '#94A3B8',
                }}
              >
                <span style={{ color: '#E2E8F0' }}>{item.fileName}</span>
                <span>
                  {item.status === 'error' ? (
                    <span style={{ color: '#EF4444' }}>上传失败</span>
                  ) : item.status === 'done' ? (
                    <span style={{ color: '#10B981' }}>上传完成</span>
                  ) : (
                    `${item.progress}%`
                  )}
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  backgroundColor: '#334155',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${item.progress}%`,
                    backgroundColor: '#10B981',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          position: 'relative',
          height: useVirtualScroll ? `${containerHeight}px` : undefined,
          overflowY: useVirtualScroll ? 'auto' : undefined,
          overflowX: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            height: useVirtualScroll ? `${totalRows * rowHeight}px` : undefined,
          }}
        >
          <div
            style={{
              display: useVirtualScroll ? 'block' : 'grid',
              gridTemplateColumns: useVirtualScroll ? undefined : 'repeat(4, 1fr)',
              gap: useVirtualScroll ? undefined : '16px',
            }}
          >
            {useVirtualScroll
              ? visibleMaterials.map((material) => {
                  const idx = (material as Material & { _virtualIndex?: number })._virtualIndex ?? 0;
                  return renderMaterialCard(material, idx);
                })
              : materials.map((material, idx) => (
                  <div key={material.id} style={{ margin: '8px' }}>
                    {renderMaterialCard({ ...material }, idx)}
                  </div>
                ))}
          </div>
        </div>
      </div>

      {previewMaterial && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPreviewMaterial(null);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease',
            padding: '40px',
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
          <button
            onClick={() => setPreviewMaterial(null)}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>

          <div
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {previewMaterial.type === 'image' && (
              <img
                src={previewMaterial.url}
                alt={previewMaterial.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
            )}
            {previewMaterial.type === 'video' && (
              <video
                src={previewMaterial.url}
                controls
                autoPlay
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  borderRadius: '8px',
                }}
              />
            )}
            {previewMaterial.type === 'audio' && (
              <div
                style={{
                  width: '600px',
                  maxWidth: '90vw',
                  padding: '40px',
                  backgroundColor: '#1E293B',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '24px',
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Volume2 size={40} style={{ color: '#10B981' }} />
                </div>
                <audio
                  src={previewMaterial.url}
                  controls
                  autoPlay
                  style={{ width: '100%' }}
                />
              </div>
            )}
            <div style={{ color: '#E2E8F0', fontSize: '14px', textAlign: 'center' }}>
              {previewMaterial.name} · {formatFileSize(previewMaterial.size)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialGrid;
