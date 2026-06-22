import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, useDraggable, useDroppable } from '@dnd-kit/core';
import type { PlacedFurniture } from '../moduleA/designEngine';
import type { Furniture, Style, DesignListItem } from '../moduleD/apiService';
import type { BudgetState } from '../moduleC/budgetCalculator';

export interface SnapLine {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number;
}

interface PhotoUploaderProps {
  onUpload: (imageDataUrl: string) => void;
  isLoading: boolean;
}

interface StyleSelectorProps {
  styles: Style[];
  currentStyle: string;
  onSelect: (styleId: string) => void;
}

interface FurnitureLibraryProps {
  furnitureList: Furniture[];
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
}

interface FurnitureItemProps {
  furniture: PlacedFurniture;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PlacedFurniture>) => void;
  onDelete: (id: string) => void;
}

interface PhotoCanvasProps {
  imageUrl: string | null;
  style: string;
  placedFurniture: PlacedFurniture[];
  snapLines: SnapLine[];
  onDrop: (furnitureId: string, x: number, y: number) => void;
  onFurnitureUpdate: (id: string, updates: Partial<PlacedFurniture>) => void;
}

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  isSaving: boolean;
}

interface DesignListProps {
  designs: DesignListItem[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onToggle3D: () => void;
  onSave: () => void;
  is3DMode: boolean;
}

interface LoadingOverlayProps {
  isVisible: boolean;
  message: string;
}

interface BudgetPanelProps {
  budgetState: BudgetState;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const CROP_RATIO = 16 / 9;

const categoryTabs = [
  { id: 'sofa', label: '沙发', emoji: '🛋️' },
  { id: 'table', label: '桌子', emoji: '🪑' },
  { id: 'chair', label: '椅子', emoji: '🪑' },
  { id: 'lamp', label: '灯具', emoji: '💡' },
  { id: 'carpet', label: '地毯', emoji: '🟫' },
  { id: 'painting', label: '装饰画', emoji: '🖼️' },
];

const styleFilters: Record<string, CSSProperties> = {
  modern: { filter: 'hue-rotate(0deg) saturate(1) brightness(1)' },
  nordic: { filter: 'hue-rotate(10deg) saturate(0.9) brightness(1.05)' },
  industrial: { filter: 'hue-rotate(-10deg) saturate(0.8) brightness(0.95)' },
  japanese: { filter: 'hue-rotate(20deg) saturate(0.7) brightness(1.02)' },
  vintage: { filter: 'hue-rotate(-20deg) saturate(1.1) brightness(0.9)' },
};

const cropTo16x9 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        const imgRatio = img.width / img.height;
        let cropWidth: number;
        let cropHeight: number;
        let offsetX: number;
        let offsetY: number;

        if (imgRatio > CROP_RATIO) {
          cropHeight = img.height;
          cropWidth = cropHeight * CROP_RATIO;
          offsetX = (img.width - cropWidth) / 2;
          offsetY = 0;
        } else {
          cropWidth = img.width;
          cropHeight = cropWidth / CROP_RATIO;
          offsetX = 0;
          offsetY = (img.height - cropHeight) / 2;
        }

        canvas.width = 1280;
        canvas.height = 720;
        ctx.drawImage(
          img,
          offsetX, offsetY, cropWidth, cropHeight,
          0, 0, 1280, 720
        );
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onUpload, isLoading }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setProgress(0);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('只支持 JPG/PNG 格式');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('文件大小不能超过 5MB');
      return;
    }

    try {
      setProgress(30);
      const croppedImage = await cropTo16x9(file);
      setProgress(80);
      setPreview(croppedImage);
      setProgress(100);
      onUpload(croppedImage);
    } catch (err) {
      setError('图片处理失败，请重试');
    }
  };

  const handleClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    }}>
      <h3 style={{ marginBottom: '12px', color: '#2d3436', fontSize: '16px' }}>
        上传房间照片
      </h3>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {isLoading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          gap: '12px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #dfe6e9',
            borderTopColor: '#4ECDC4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{ color: '#636e72', fontSize: '14px' }}>处理中...</div>
        </div>
      )}

      {!isLoading && !preview && (
        <div
          onClick={handleClick}
          style={{
            border: '2px dashed #b2bec3',
            borderRadius: '8px',
            height: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4ECDC4';
            e.currentTarget.style.backgroundColor = '#f8f9fa';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#b2bec3';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span style={{ fontSize: '48px' }}>📷</span>
          <span style={{ color: '#636e72', fontSize: '14px' }}>
            点击上传 JPG/PNG 图片（最大 5MB）
          </span>
        </div>
      )}

      {!isLoading && preview && (
        <div style={{ position: 'relative' }}>
          <img
            src={preview}
            alt="预览"
            style={{
              width: '100%',
              borderRadius: '8px',
              display: 'block',
            }}
          />
          <button
            onClick={handleClick}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '6px 12px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            重新上传
          </button>
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <div style={{
          marginTop: '12px',
          height: '6px',
          backgroundColor: '#dfe6e9',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#4ECDC4',
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const StyleSelector: React.FC<StyleSelectorProps> = ({ styles, currentStyle, onSelect }) => {
  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    }}>
      <h3 style={{ marginBottom: '12px', color: '#2d3436', fontSize: '16px' }}>
        选择风格
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px',
      }}>
        {styles.map((style) => (
          <div
            key={style.id}
            onClick={() => onSelect(style.id)}
            style={{
              padding: '12px',
              border: `2px solid ${currentStyle === style.id ? '#4ECDC4' : 'transparent'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: currentStyle === style.id ? '#f0fffe' : '#f8f9fa',
              transform: currentStyle === style.id ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <div style={{
              fontSize: '32px',
              textAlign: 'center',
              marginBottom: '8px',
            }}>
              {style.thumbnail}
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: '#2d3436',
              marginBottom: '8px',
            }}>
              {style.name}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '4px',
            }}>
              {style.colorScheme.slice(0, 2).map((color, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: '1px solid #dfe6e9',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DraggableFurnitureItem: React.FC<{ furniture: Furniture }> = ({ furniture }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: furniture.id,
    data: { furniture },
  });

  const style: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsSmallScreen(window.innerWidth < 480);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const iconSize = isSmallScreen ? '24px' : '32px';

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: '8px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #dfe6e9',
        textAlign: 'center',
        transition: 'all 0.2s ease',
      }}
      {...listeners}
      {...attributes}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = `${style.transform || ''} scale(1.02)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = style.transform || 'none';
      }}
    >
      <div style={{ fontSize: iconSize, marginBottom: '4px' }}>
        {furniture.icon}
      </div>
      <div style={{
        fontSize: isSmallScreen ? '10px' : '12px',
        color: '#2d3436',
        marginBottom: '2px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {furniture.name}
      </div>
      <div style={{
        fontSize: isSmallScreen ? '10px' : '11px',
        color: '#FF6B6B',
        fontWeight: 600,
      }}>
        ¥{furniture.price.toLocaleString()}
      </div>
    </div>
  );
};

export const FurnitureLibrary: React.FC<FurnitureLibraryProps> = ({ furnitureList, onDragStart, onDragEnd }) => {
  const [activeTab, setActiveTab] = useState('sofa');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    onDragStart?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    onDragEnd?.(event);
  };

  const filteredFurniture = furnitureList.filter((f) => {
    const categoryMap: Record<string, string> = {
      'sofa': '沙发',
      'table': '桌子',
      'chair': '椅子',
      'lamp': '灯具',
      'carpet': '地毯',
      'painting': '装饰画',
    };
    return f.category === categoryMap[activeTab];
  }).slice(0, 5);

  const activeFurniture = activeId
    ? furnitureList.find((f) => f.id === activeId)
    : null;

  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    }}>
      <h3 style={{ marginBottom: '12px', color: '#2d3436', fontSize: '16px' }}>
        家具库
      </h3>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}>
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                backgroundColor: activeTab === tab.id ? '#4ECDC4' : '#f1f2f6',
                color: activeTab === tab.id ? 'white' : '#636e72',
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
          minHeight: '120px',
        }}>
          {filteredFurniture.map((furniture) => (
            <DraggableFurnitureItem key={furniture.id} furniture={furniture} />
          ))}
        </div>

        <DragOverlay>
          {activeFurniture ? (
            <div style={{
              padding: '8px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
              opacity: 0.9,
            }}>
              <div style={{ fontSize: '32px', textAlign: 'center' }}>
                {activeFurniture.icon}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export const FurnitureItem: React.FC<FurnitureItemProps> = ({
  furniture,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, handleType?: string) => {
    e.stopPropagation();
    onSelect(furniture.id);

    if (handleType) {
      setActiveHandle(handleType);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - furniture.x, y: e.clientY - furniture.y });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdate(furniture.id, {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      } else if (activeHandle) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        if (activeHandle === 'rotate') {
          const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
          const degrees = (angle * 180) / Math.PI;
          const snappedRotation = Math.round(degrees / 15) * 15;
          onUpdate(furniture.id, { rotation: snappedRotation });
        } else if (['tl', 'tr', 'bl', 'br'].includes(activeHandle)) {
          const dx = e.clientX - centerX;
          const dy = e.clientY - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const newScale = Math.max(0.3, Math.min(3, distance / 100));
          onUpdate(furniture.id, { scale: newScale });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setActiveHandle(null);
    };

    if (isDragging || activeHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, activeHandle, dragStart, furniture.id, onUpdate]);

  const iconMap: Record<string, string> = {
    'sofa': '🛋️',
    'table': '🪑',
    'chair': '🪑',
    'lamp': '💡',
    'carpet': '🟫',
    'painting': '🖼️',
  };

  const size = 60 * furniture.scale;

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(furniture.id);
      }}
      style={{
        position: 'absolute',
        left: furniture.x - size / 2,
        top: furniture.y - size / 2,
        width: size,
        height: size,
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: `rotate(${furniture.rotation}deg)`,
        transition: isDragging || activeHandle ? 'none' : 'transform 0.2s ease',
        zIndex: isSelected ? 100 : 10,
      }}
      onMouseDown={(e) => handleMouseDown(e)}
    >
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.6,
        border: isSelected ? `2px solid #4ECDC4` : '2px solid transparent',
        borderRadius: '8px',
        backgroundColor: isSelected ? 'rgba(78, 205, 196, 0.1)' : 'transparent',
        transition: 'all 0.2s ease',
      }}>
        {iconMap[furniture.category] || '📦'}
      </div>

      {isSelected && (
        <>
          {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => {
            const positions: Record<string, CSSProperties> = {
              tl: { top: -6, left: -6, cursor: 'nwse-resize' },
              tr: { top: -6, right: -6, cursor: 'nesw-resize' },
              bl: { bottom: -6, left: -6, cursor: 'nesw-resize' },
              br: { bottom: -6, right: -6, cursor: 'nwse-resize' },
            };
            return (
              <div
                key={corner}
                onMouseDown={(e) => handleMouseDown(e, corner)}
                style={{
                  position: 'absolute',
                  width: 12,
                  height: 12,
                  backgroundColor: 'white',
                  border: '2px solid #4ECDC4',
                  borderRadius: '50%',
                  ...positions[corner],
                  zIndex: 101,
                }}
              />
            );
          })}

          <div
            onMouseDown={(e) => handleMouseDown(e, 'rotate')}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 16,
              height: 16,
              backgroundColor: 'white',
              border: '2px solid #4ECDC4',
              borderRadius: '50%',
              cursor: 'crosshair',
              zIndex: 101,
            }}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(furniture.id);
            }}
            style={{
              position: 'absolute',
              top: -12,
              right: -12,
              width: 24,
              height: 24,
              backgroundColor: '#FF6B6B',
              color: 'white',
              borderRadius: '50%',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 102,
            }}
          >
            ×
          </button>
        </>
      )}
    </div>
  );
};

export const PhotoCanvas: React.FC<PhotoCanvasProps> = ({
  imageUrl,
  style,
  placedFurniture,
  snapLines,
  onDrop,
  onFurnitureUpdate,
}) => {
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const { setNodeRef, isOver } = useDroppable({ id: 'photo-canvas' });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = () => {
    setSelectedFurnitureId(null);
  };

  const handleFurnitureSelect = (id: string) => {
    setSelectedFurnitureId(id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const furnitureId = e.dataTransfer.getData('furnitureId');
    if (furnitureId) {
      onDrop(furnitureId, x, y);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const filterStyle = styleFilters[style] || styleFilters.modern;

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      onClick={handleCanvasClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '500px',
        backgroundColor: '#f1f2f6',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        outline: isOver ? '3px dashed #4ECDC4' : 'none',
        outlineOffset: '-3px',
      }}
    >
      {imageUrl ? (
        <div style={{
          width: '100%',
          height: '100%',
          ...filterStyle,
          transition: 'filter 0.3s ease',
        }}>
          <img
            src={imageUrl}
            alt="房间"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            pointerEvents: 'none',
          }} />
        </div>
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#b2bec3',
          fontSize: '16px',
        }}>
          请先上传房间照片
        </div>
      )}

      {snapLines.map((line) => (
        <div
          key={line.id}
          style={{
            position: 'absolute',
            backgroundColor: '#4ECDC4',
            opacity: 0.7,
            pointerEvents: 'none',
            ...(line.type === 'vertical'
              ? {
                  left: line.position,
                  top: 0,
                  width: 1,
                  height: '100%',
                }
              : {
                  top: line.position,
                  left: 0,
                  width: '100%',
                  height: 1,
                }),
          }}
        />
      ))}

      {placedFurniture.map((furniture) => (
        <FurnitureItem
          key={furniture.id}
          furniture={furniture}
          isSelected={selectedFurnitureId === furniture.id}
          onSelect={handleFurnitureSelect}
          onUpdate={onFurnitureUpdate}
          onDelete={(id) => {
            onFurnitureUpdate(id, {} as Partial<PlacedFurniture>);
          }}
        />
      ))}
    </div>
  );
};

export const SaveModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onSave, isSaving }) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isSaving) {
      onSave(name.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxWidth: '90vw',
        animation: 'slideUp 0.3s ease',
      }}>
        <h2 style={{
          marginBottom: '20px',
          color: '#2d3436',
          fontSize: '20px',
          fontWeight: 600,
        }}>
          保存设计方案
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="请输入方案名称"
            maxLength={20}
            disabled={isSaving}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '14px',
              border: '1px solid #dfe6e9',
              borderRadius: '8px',
              marginBottom: '20px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4ECDC4';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#dfe6e9';
            }}
          />

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: '#f1f2f6',
                color: '#636e72',
                borderRadius: '8px',
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: name.trim() && !isSaving ? '#4ECDC4' : '#b2bec3',
                color: 'white',
                borderRadius: '8px',
                cursor: name.trim() && !isSaving ? 'pointer' : 'not-allowed',
              }}
            >
              {isSaving ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  保存中...
                </span>
              ) : '确定'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const DesignList: React.FC<DesignListProps> = ({ designs, onLoad, onDelete }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxHeight: '400px',
      overflowY: 'auto',
    }}>
      <h3 style={{ marginBottom: '12px', color: '#2d3436', fontSize: '16px' }}>
        已保存方案
      </h3>

      {designs.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#b2bec3',
          fontSize: '14px',
        }}>
          暂无保存的方案
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {designs.map((design, index) => (
            <div
              key={design.id}
              onClick={() => onLoad(design.id)}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #dfe6e9',
                cursor: 'pointer',
                transition: 'all 0.8s ease',
                animation: `fadeIn 0.8s ease ${index * 0.1}s both`,
                opacity: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#4ECDC4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#dfe6e9';
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                backgroundColor: '#f1f2f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                flexShrink: 0,
              }}>
                {design.thumbnail}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600,
                  color: '#2d3436',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {design.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#636e72',
                  marginBottom: '4px',
                }}>
                  {formatDate(design.createdAt)}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#FF6B6B',
                  fontWeight: 600,
                }}>
                  ¥{design.totalPrice.toLocaleString()}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingId(design.id);
                  setTimeout(() => {
                    onDelete(design.id);
                    setDeletingId(null);
                  }, 300);
                }}
                disabled={deletingId === design.id}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  backgroundColor: deletingId === design.id ? '#FF6B6B' : 'transparent',
                  color: deletingId === design.id ? 'white' : '#b2bec3',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (deletingId !== design.id) {
                    e.currentTarget.style.backgroundColor = '#ffebee';
                    e.currentTarget.style.color = '#FF6B6B';
                  }
                }}
                onMouseLeave={(e) => {
                  if (deletingId !== design.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#b2bec3';
                  }
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export const Toolbar: React.FC<ToolbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onToggle3D,
  onSave,
  is3DMode,
}) => {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '12px 16px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      alignItems: 'center',
    }}>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="撤销"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: canUndo ? '#f1f2f6' : '#fafafa',
          color: canUndo ? '#2d3436' : '#dfe6e9',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canUndo ? 'pointer' : 'not-allowed',
        }}
      >
        ↩️
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="重做"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: canRedo ? '#f1f2f6' : '#fafafa',
          color: canRedo ? '#2d3436' : '#dfe6e9',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canRedo ? 'pointer' : 'not-allowed',
        }}
      >
        ↪️
      </button>

      <div style={{
        width: '1px',
        height: '24px',
        backgroundColor: '#dfe6e9',
        margin: '0 8px',
      }} />

      <button
        onClick={onToggle3D}
        title={is3DMode ? '切换到2D视图' : '切换到3D预览'}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: is3DMode ? '#4ECDC4' : '#f1f2f6',
          color: is3DMode ? 'white' : '#2d3436',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        🎲
      </button>

      <div style={{ flex: 1 }} />

      <button
        onClick={onSave}
        title="保存方案"
        style={{
          padding: '0 20px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: '#4ECDC4',
          color: 'white',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '16px' }}>💾</span>
        保存
      </button>
    </div>
  );
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message }) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      zIndex: 2000,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderTopColor: 'white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <div style={{
        color: 'white',
        fontSize: '16px',
        fontWeight: 500,
      }}>
        {message}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const BudgetPanel: React.FC<BudgetPanelProps> = ({ budgetState }) => {
  const { groups, total, isLoading } = budgetState;

  return (
    <div className="budget-panel" style={{
      height: '180px',
      overflowY: 'auto',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '16px',
    }}>
      <h3 style={{ marginBottom: '12px', color: '#2d3436', fontSize: '16px' }}>
        预算清单
      </h3>
      {isLoading && (
        <div style={{ color: '#636e72', textAlign: 'center', padding: '20px' }}>
          计算中...
        </div>
      )}
      {!isLoading && groups.length === 0 && (
        <div style={{ color: '#b2bec3', textAlign: 'center', padding: '20px' }}>
          暂无家具，请从左侧拖拽添加
        </div>
      )}
      {groups.map((group) => (
        <div key={group.category} style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '8px',
            borderBottom: '1px solid #dfe6e9',
            marginBottom: '8px',
          }}>
            <span style={{ fontWeight: 600, color: '#2d3436' }}>
              {group.label}
            </span>
            <span
              className="animated-number"
              data-target={group.subtotal}
              style={{ fontWeight: 600, color: '#2d3436' }}
            >
              ¥{group.subtotal.toLocaleString()}
            </span>
          </div>
          {group.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0',
                fontSize: '14px',
                color: '#636e72',
              }}
            >
              <span>{item.name}</span>
              <span>¥{item.price.toLocaleString()}</span>
            </div>
          ))}
        </div>
      ))}
      {!isLoading && groups.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '2px solid #dfe6e9',
          marginTop: '12px',
        }}>
          <span style={{ fontWeight: 700, fontSize: '18px', color: '#2d3436' }}>
            总计
          </span>
          <span
            className="animated-number"
            data-target={total}
            style={{
              fontWeight: 700,
              fontSize: '20px',
              color: '#FF6B6B',
            }}
          >
            ¥{total.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

type BudgetStateSubscriber = (state: BudgetState) => void;

const budgetSubscribers: Set<BudgetStateSubscriber> = new Set();

export const subscribeBudget = (
  callback: BudgetStateSubscriber,
): (() => void) => {
  budgetSubscribers.add(callback);
  return () => budgetSubscribers.delete(callback);
};

export const unsubscribeBudget = (callback: BudgetStateSubscriber): void => {
  budgetSubscribers.delete(callback);
};

export const notifyBudgetUpdate = (state: BudgetState): void => {
  budgetSubscribers.forEach((cb) => cb(state));
};
