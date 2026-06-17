import { useState, useRef, useCallback } from 'react';
import { GripVertical, Trash2, Copy, Type } from 'lucide-react';
import useStore, { Layer, createImageLayer } from '@/store';

function LayerPanel() {
  const layers = useStore((s) => s.layers);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const canvasWidth = useStore((s) => s.canvasWidth);
  const canvasHeight = useStore((s) => s.canvasHeight);
  const uploading = useStore((s) => s.uploading);
  const uploadProgress = useStore((s) => s.uploadProgress);
  const setSelectedLayer = useStore((s) => s.setSelectedLayer);
  const removeLayer = useStore((s) => s.removeLayer);
  const duplicateLayer = useStore((s) => s.duplicateLayer);
  const addLayer = useStore((s) => s.addLayer);
  const setUploading = useStore((s) => s.setUploading);
  const setUploadProgress = useStore((s) => s.setUploadProgress);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ index: number; position: 'above' | 'below' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'above' : 'below';
    setDropIndicator({ index, position });
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex === null) return;
    if (dragIndex !== toIndex) {
      useStore.getState().reorderLayers(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDropIndicator(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndicator(null);
  };

  const processFile = useCallback((file: File) => {
    if (file.name.endsWith('.zip')) {
      alert('暂不支持ZIP解压，请上传单张图片');
      return;
    }

    if (!file.type.startsWith('image/')) return;

    setUploading(true);
    setUploadProgress(0);

    const steps = 20;
    const interval = 1500 / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += 100 / steps;
      if (current >= 100) {
        current = 100;
        clearInterval(timer);
      }
      setUploadProgress(Math.round(current));
    }, interval);

    const img = new Image();
    img.onload = () => {
      const waitForProgress = setInterval(() => {
        if (Math.round(current) >= 100) {
          clearInterval(waitForProgress);
          const layer = createImageLayer(img, canvasWidth, canvasHeight);
          addLayer(layer);
          setUploading(false);
          setUploadProgress(0);
        }
      }, 50);
    };
    img.src = URL.createObjectURL(file);
  }, [canvasWidth, canvasHeight, addLayer, setUploading, setUploadProgress]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleUploadAreaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleUploadAreaDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const circumference = 2 * Math.PI * 9;
  const dashOffset = circumference - (uploadProgress / 100) * circumference;

  return (
    <div
      style={{ width: 300, background: '#F9F9F9' }}
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-700">图层管理</div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
          {sortedLayers.map((layer, si) => {
            const isSelected = layer.id === selectedLayerId;
            const isDragOver = dropIndicator?.index === si;
            const showAbove = isDragOver && dropIndicator.position === 'above';
            const showBelow = isDragOver && dropIndicator.position === 'below';

            return (
              <div key={layer.id}>
                {showAbove && (
                  <div style={{ height: 2, background: '#1976D2', margin: '2px 0' }} />
                )}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, layer.zIndex)}
                  onDragOver={(e) => handleDragOver(e, si)}
                  onDrop={(e) => handleDrop(e, layer.zIndex)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedLayer(layer.id)}
                  className={`card-hover flex items-center gap-2 px-2 py-2 mb-1 cursor-pointer ${
                    isSelected ? 'border-l-[3px]' : 'border-l-[3px] border-l-transparent'
                  }`}
                  style={isSelected ? { background: '#E3F2FD', borderLeftColor: '#1976D2' } : undefined}
                >
                  <div className="cursor-grab text-gray-400 hover:text-gray-600">
                    <GripVertical size={16} />
                  </div>
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 4,
                      border: '1px solid #E0E0E0',
                      overflow: 'hidden',
                      background: '#fff',
                    }}
                  >
                    {layer.type === 'image' && layer.imageUrl ? (
                      <img
                        src={layer.imageUrl}
                        alt={layer.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Type size={18} className="text-gray-400" />
                    )}
                  </div>
                  <span className="flex-1 text-sm text-gray-700 truncate">{layer.name}</span>
                  <button
                    className="p-1 text-gray-400 hover:text-blue-600"
                    onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="p-1 text-gray-400 hover:text-red-500"
                    onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {showBelow && (
                  <div style={{ height: 2, background: '#1976D2', margin: '2px 0' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="px-4 pb-4 pt-2"
        onDrop={handleUploadAreaDrop}
        onDragOver={handleUploadAreaDragOver}
      >
        <button
          className="btn-hover flex items-center justify-center"
          style={{
            width: 120,
            height: 36,
            background: '#1976D2',
            color: '#fff',
            borderRadius: 20,
            border: 'none',
            cursor: uploading ? 'default' : 'pointer',
            fontSize: 14,
          }}
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <svg width="24" height="24" className="upload-progress-ring">
              <circle
                cx="12" cy="12" r="9"
                fill="none"
                stroke="#E0E0E0"
                strokeWidth="2"
              />
              <circle
                cx="12" cy="12" r="9"
                fill="none"
                stroke="#1976D2"
                strokeWidth="2"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            </svg>
          ) : (
            '上传图片'
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.zip"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

export default LayerPanel;
