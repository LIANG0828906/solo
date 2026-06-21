import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from './store';
import { BudgetPanel } from './moduleB/uiComponents';
import {
  getBudgetState,
  subscribe as subscribeBudget,
  unsubscribe as unsubscribeBudget,
  type BudgetState,
} from './moduleC/budgetCalculator';
import {
  subscribe as subscribeDesign,
  unsubscribe as unsubscribeDesign,
  addFurniture,
  removeFurniture,
  setRoomImage,
  setStyle,
  updateFurniture,
  getDesignState,
  type DesignState,
  type PlacedFurniture,
} from './moduleA/designEngine';
import {
  getFurnitureList,
  saveDesign,
  getDesigns,
  getDesign,
  type Furniture,
  type DesignListItem,
} from './moduleD/apiService';

const styles = {
  modern: { name: '现代', filter: 'none', colors: ['#FFFFFF', '#808080', '#000000'] },
  nordic: { name: '北欧', filter: 'sepia(0.1) saturate(1.1)', colors: ['#F5F5DC', '#8B7355', '#6B8E23'] },
  industrial: { name: '工业', filter: 'grayscale(0.2) contrast(1.1)', colors: ['#2C3E50', '#7F8C8D', '#E74C3C'] },
  japanese: { name: '日式', filter: 'sepia(0.2) brightness(1.05)', colors: ['#F5F5F5', '#A9A9A9', '#BC8F8F'] },
  vintage: { name: '复古', filter: 'sepia(0.3) saturate(0.9)', colors: ['#D4A574', '#8B4513', '#654321'] },
};

const styleList = Object.entries(styles).map(([id, style]) => ({ id, ...style }));

const categoryConfig: Record<string, { label: string; icon: string }> = {
  sofa: { label: '沙发', icon: '🛋️' },
  table: { label: '桌子', icon: '🪑' },
  chair: { label: '椅子', icon: '🪑' },
  lamp: { label: '灯具', icon: '💡' },
  carpet: { label: '地毯', icon: '🟫' },
  painting: { label: '装饰画', icon: '🖼️' },
};

interface PhotoUploaderProps {
  onImageUpload: (imageData: string) => void;
  isLoading: boolean;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onImageUpload, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('仅支持 JPG 和 PNG 格式');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const targetRatio = 16 / 9;
        const imgRatio = img.width / img.height;

        let cropWidth = img.width;
        let cropHeight = img.height;
        let cropX = 0;
        let cropY = 0;

        if (imgRatio > targetRatio) {
          cropWidth = img.height * targetRatio;
          cropX = (img.width - cropWidth) / 2;
        } else {
          cropHeight = img.width / targetRatio;
          cropY = (img.height - cropHeight) / 2;
        }

        canvas.width = 1280;
        canvas.height = 720;

        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const croppedData = canvas.toDataURL('image/jpeg', 0.9);
        setPreview(croppedData);
        onImageUpload(croppedData);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed #b2bec3',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: 'white',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#4ECDC4';
          e.currentTarget.style.backgroundColor = '#f0fcfb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#b2bec3';
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        {isLoading ? (
          <div style={{ color: '#4ECDC4' }}>处理中...</div>
        ) : preview ? (
          <img
            src={preview}
            alt="预览"
            style={{ width: '100%', borderRadius: '4px' }}
          />
        ) : (
          <div>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
            <div style={{ color: '#636e72', fontSize: '14px' }}>
              点击上传房间照片
            </div>
            <div style={{ color: '#b2bec3', fontSize: '12px', marginTop: '4px' }}>
              JPG/PNG，最大5MB，自动裁剪16:9
            </div>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

interface StyleSelectorProps {
  currentStyle: string;
  onStyleChange: (style: string) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({
  currentStyle,
  onStyleChange,
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h4
        style={{
          marginBottom: '8px',
          color: '#2d3436',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        风格选择
      </h4>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {styleList.map((style) => (
          <button
            key={style.id}
            onClick={() => onStyleChange(style.id)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border:
                currentStyle === style.id
                  ? '2px solid #4ECDC4'
                  : '1px solid #dfe6e9',
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '13px',
              color: '#2d3436',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${style.colors[0]} 0%, ${style.colors[1]} 50%, ${style.colors[2]} 100%)`,
                }}
              />
              {style.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

interface FurnitureLibraryProps {
  furnitureList: Furniture[];
  onDragStart: (furniture: Furniture, e: React.DragEvent) => void;
}

const FurnitureLibrary: React.FC<FurnitureLibraryProps> = ({
  furnitureList,
  onDragStart,
}) => {
  const categories = ['sofa', 'table', 'chair', 'lamp', 'carpet', 'painting'] as const;

  const getCategoryItems = (category: string) => {
    return furnitureList
      .filter((f) => {
        const catMap: Record<string, string[]> = {
          sofa: ['sofa-1', 'sofa-2', 'sofa-3', 'sofa-4', 'sofa-5'],
          table: ['table-1', 'table-2', 'table-3', 'table-4', 'table-5'],
          chair: ['chair-1', 'chair-2', 'chair-3', 'chair-4', 'chair-5'],
          lamp: ['lamp-1', 'lamp-2', 'lamp-3', 'lamp-4', 'lamp-5'],
          carpet: ['carpet-1', 'carpet-2', 'carpet-3', 'carpet-4', 'carpet-5'],
          painting: ['art-1', 'art-2', 'art-3', 'art-4', 'art-5'],
        };
        return catMap[category]?.includes(f.id);
      })
      .slice(0, 5);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <h4
        style={{
          marginBottom: '8px',
          color: '#2d3436',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        家具库
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {categories.map((cat) => {
          const config = categoryConfig[cat];
          const items = getCategoryItems(cat);
          return (
            <div key={cat}>
              <div
                style={{
                  fontSize: '13px',
                  color: '#636e72',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {items.map((furniture) => (
                  <div
                    key={furniture.id}
                    draggable
                    onDragStart={(e) => onDragStart(furniture, e)}
                    style={{
                      padding: '6px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #dfe6e9',
                      cursor: 'grab',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4ECDC4';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#dfe6e9';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onMouseDown={(e) => {
                      (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
                    }}
                    onMouseUp={(e) => {
                      (e.currentTarget as HTMLElement).style.cursor = 'grab';
                    }}
                    title={`${furniture.name} - ¥${furniture.price.toLocaleString()}`}
                  >
                    <div style={{ fontSize: '20px' }}>{furniture.icon}</div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#FF6B6B',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      ¥{Math.round(furniture.price / 1000)}k
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface PhotoCanvasProps {
  roomImage: string | null;
  style: string;
  placedFurniture: PlacedFurniture[];
  furnitureMap: Map<string, Furniture>;
  onDrop: (furniture: Furniture, x: number, y: number) => void;
  onFurnitureUpdate: (id: string, updates: Partial<PlacedFurniture>) => void;
  onFurnitureRemove: (id: string) => void;
}

const PhotoCanvas: React.FC<PhotoCanvasProps> = ({
  roomImage,
  style,
  placedFurniture,
  furnitureMap,
  onDrop,
  onFurnitureUpdate,
  onFurnitureRemove,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggingFurniture, setDraggingFurniture] = useState<PlacedFurniture | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapLines, setSnapLines] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const animationRef = useRef<number | null>(null);
  const positionRef = useRef({ x: 0, y: 0 });

  const styleFilter = styles[style as keyof typeof styles]?.filter || 'none';

  const SNAP_THRESHOLD = 10;

  const calculateSnap = useCallback((x: number, y: number, excludeId?: string) => {
    let snapX: number | null = null;
    let snapY: number | null = null;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return { x: snapX, y: snapY };

    const centerX = canvasRect.width / 2;
    const centerY = canvasRect.height / 2;

    if (Math.abs(x - centerX) < SNAP_THRESHOLD) snapX = centerX;
    if (Math.abs(y - centerY) < SNAP_THRESHOLD) snapY = centerY;

    placedFurniture.forEach((f) => {
      if (f.id === excludeId) return;
      if (Math.abs(x - f.x) < SNAP_THRESHOLD) snapX = f.x;
      if (Math.abs(y - f.y) < SNAP_THRESHOLD) snapY = f.y;
    });

    return { x: snapX, y: snapY };
  }, [placedFurniture]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const furnitureData = e.dataTransfer.getData('furniture');
    if (!furnitureData || !canvasRef.current) return;

    const furniture: Furniture = JSON.parse(furnitureData);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const snap = calculateSnap(x, y);
    const finalX = snap.x ?? x;
    const finalY = snap.y ?? y;

    onDrop(furniture, finalX, finalY);
  };

  const handleFurnitureMouseDown = (
    e: React.MouseEvent,
    furniture: PlacedFurniture
  ) => {
    e.stopPropagation();
    setSelectedId(furniture.id);
    setDraggingFurniture(furniture);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragOffset({
      x: e.clientX - rect.left - furniture.x,
      y: e.clientY - rect.top - furniture.y,
    });

    positionRef.current = { x: furniture.x, y: furniture.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingFurniture || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left - dragOffset.x;
    let y = e.clientY - rect.top - dragOffset.y;

    x = Math.max(0, Math.min(rect.width, x));
    y = Math.max(0, Math.min(rect.height, y));

    const snap = calculateSnap(x, y, draggingFurniture.id);
    setSnapLines(snap);

    const finalX = snap.x ?? x;
    const finalY = snap.y ?? y;

    positionRef.current = { x: finalX, y: finalY };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(() => {
      onFurnitureUpdate(draggingFurniture.id, { x: finalX, y: finalY });
    });
  }, [draggingFurniture, dragOffset, calculateSnap, onFurnitureUpdate]);

  const handleMouseUp = useCallback(() => {
    setDraggingFurniture(null);
    setSnapLines({ x: null, y: null });
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const handleCanvasClick = () => {
    setSelectedId(null);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedId) return;

    const furniture = placedFurniture.find((f) => f.id === selectedId);
    if (!furniture) return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      onFurnitureRemove(selectedId);
      setSelectedId(null);
    } else if (e.key === 'q' || e.key === 'Q') {
      onFurnitureUpdate(selectedId, { rotation: furniture.rotation - 15 });
    } else if (e.key === 'e' || e.key === 'E') {
      onFurnitureUpdate(selectedId, { rotation: furniture.rotation + 15 });
    } else if (e.key === '+' || e.key === '=') {
      onFurnitureUpdate(selectedId, { scale: Math.min(2, furniture.scale + 0.1) });
    } else if (e.key === '-') {
      onFurnitureUpdate(selectedId, { scale: Math.max(0.3, furniture.scale - 0.1) });
    }
  }, [selectedId, placedFurniture, onFurnitureUpdate, onFurnitureRemove]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseMove, handleMouseUp, handleKeyDown]);

  const handleControlPoint = (
    e: React.MouseEvent,
    action: 'scale-up' | 'scale-down' | 'rotate-left' | 'rotate-right'
  ) => {
    e.stopPropagation();
    if (!selectedId) return;

    const furniture = placedFurniture.find((f) => f.id === selectedId);
    if (!furniture) return;

    switch (action) {
      case 'scale-up':
        onFurnitureUpdate(selectedId, { scale: Math.min(2, furniture.scale + 0.1) });
        break;
      case 'scale-down':
        onFurnitureUpdate(selectedId, { scale: Math.max(0.3, furniture.scale - 0.1) });
        break;
      case 'rotate-left':
        onFurnitureUpdate(selectedId, { rotation: furniture.rotation - 15 });
        break;
      case 'rotate-right':
        onFurnitureUpdate(selectedId, { rotation: furniture.rotation + 15 });
        break;
    }
  };

  return (
    <div
      ref={canvasRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
      style={{
        flex: 1,
        position: 'relative',
        backgroundColor: roomImage ? 'transparent' : '#dfe6e9',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'filter 0.3s ease',
        filter: styleFilter,
        cursor: draggingFurniture ? 'grabbing' : 'default',
      }}
    >
      {roomImage && (
        <img
          src={roomImage}
          alt="房间"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.8s ease',
            opacity: 1,
            animation: 'fadeIn 0.8s ease',
          }}
        />
      )}

      {!roomImage && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#b2bec3',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
          <div>请上传房间照片开始设计</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>
            从左侧拖拽家具到此处
          </div>
        </div>
      )}

      {snapLines.x !== null && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: snapLines.x,
            width: '2px',
            height: '100%',
            backgroundColor: '#4ECDC4',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        />
      )}
      {snapLines.y !== null && (
        <div
          style={{
            position: 'absolute',
            top: snapLines.y,
            left: 0,
            width: '100%',
            height: '2px',
            backgroundColor: '#4ECDC4',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        />
      )}

      {placedFurniture.map((furniture) => {
        const info = furnitureMap.get(furniture.furnitureId);
        const isSelected = selectedId === furniture.id;
        const isDragging = draggingFurniture?.id === furniture.id;

        return (
          <div
            key={furniture.id}
            onMouseDown={(e) => handleFurnitureMouseDown(e, furniture)}
            style={{
              position: 'absolute',
              left: furniture.x,
              top: furniture.y,
              transform: `translate(-50%, -50%) rotate(${furniture.rotation}deg) scale(${furniture.scale})`,
              cursor: isDragging ? 'grabbing' : 'grab',
              opacity: isDragging ? 0.7 : 1,
              zIndex: isSelected ? 50 : 10,
              transition: isDragging ? 'none' : 'opacity 0.2s ease',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                padding: '8px',
                backgroundColor: isSelected ? 'rgba(78, 205, 196, 0.2)' : 'transparent',
                borderRadius: '8px',
                border: isSelected ? '2px solid #4ECDC4' : '2px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  fontSize: Math.max(24, 40 * furniture.scale) + 'px',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                {info?.icon || '📦'}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  textAlign: 'center',
                  color: '#2d3436',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  marginTop: '2px',
                }}
              >
                {info?.name || furniture.name}
              </div>
            </div>

            {isSelected && (
              <>
                <div
                  onMouseDown={(e) => handleControlPoint(e, 'rotate-left')}
                  style={{
                    position: 'absolute',
                    top: -15,
                    left: -15,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    border: '2px solid #4ECDC4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '12px',
                    zIndex: 60,
                  }}
                >
                  ↺
                </div>
                <div
                  onMouseDown={(e) => handleControlPoint(e, 'rotate-right')}
                  style={{
                    position: 'absolute',
                    top: -15,
                    right: -15,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    border: '2px solid #4ECDC4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '12px',
                    zIndex: 60,
                  }}
                >
                  ↻
                </div>
                <div
                  onMouseDown={(e) => handleControlPoint(e, 'scale-down')}
                  style={{
                    position: 'absolute',
                    bottom: -15,
                    left: -15,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    border: '2px solid #FF6B6B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    zIndex: 60,
                    color: '#FF6B6B',
                  }}
                >
                  −
                </div>
                <div
                  onMouseDown={(e) => handleControlPoint(e, 'scale-up')}
                  style={{
                    position: 'absolute',
                    bottom: -15,
                    right: -15,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    border: '2px solid #4ECDC4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    zIndex: 60,
                    color: '#4ECDC4',
                  }}
                >
                  +
                </div>
              </>
            )}
          </div>
        );
      })}

      {dragOver && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            border: '2px dashed #4ECDC4',
            pointerEvents: 'none',
            zIndex: 200,
          }}
        />
      )}
    </div>
  );
};

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  isSaving: boolean;
}

const SaveModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onSave, isSaving }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
      setName('');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          maxWidth: '90%',
          animation: 'slideUp 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '16px', color: '#2d3436' }}>保存设计方案</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="请输入方案名称（最多20字符）"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #dfe6e9',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '16px',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4ECDC4';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#dfe6e9';
            }}
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #dfe6e9',
                backgroundColor: 'white',
                color: '#636e72',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                cursor: !name.trim() || isSaving ? 'not-allowed' : 'pointer',
                opacity: !name.trim() || isSaving ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, text = '加载中...' }) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #dfe6e9',
          borderTopColor: '#4ECDC4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '12px',
        }}
      />
      <div style={{ color: '#636e72' }}>{text}</div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const {
    currentDesignId,
    loadingStates,
    isFullscreen,
    setCurrentDesignId,
    setLoading,
    toggleFullscreen,
  } = useAppStore();

  const [budgetState, setBudgetState] = useState<BudgetState>(getBudgetState());
  const [designState, setDesignState] = useState<DesignState>(getDesignState());
  const [furnitureList, setFurnitureList] = useState<Furniture[]>([]);
  const [furnitureMap, setFurnitureMap] = useState<Map<string, Furniture>>(new Map());
  const [savedDesigns, setSavedDesigns] = useState<DesignListItem[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [history, setHistory] = useState<DesignState[]>([getDesignState()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [is3DMode, setIs3DMode] = useState(false);

  useEffect(() => {
    subscribeBudget(setBudgetState);
    subscribeDesign(setDesignState);
    return () => {
      unsubscribeBudget(setBudgetState);
      unsubscribeDesign(setDesignState);
    };
  }, []);

  useEffect(() => {
    const start = performance.now();
    getFurnitureList().then((list) => {
      setFurnitureList(list);
      const map = new Map(list.map((f) => [f.id, f]));
      setFurnitureMap(map);
      const duration = performance.now() - start;
      console.log(`家具库加载耗时: ${duration.toFixed(2)}ms`);
    });
  }, []);

  useEffect(() => {
    getDesigns().then(setSavedDesigns);
  }, []);

  useEffect(() => {
    const current = designState;
    if (JSON.stringify(history[historyIndex]) !== JSON.stringify(current)) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(current);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [designState.placedFurniture.length, designState.roomImage, designState.style]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setDesignState(prevState);
      setHistoryIndex(historyIndex - 1);
      if (prevState.roomImage) setRoomImage(prevState.roomImage);
      setStyle(prevState.style);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setDesignState(nextState);
      setHistoryIndex(historyIndex + 1);
      if (nextState.roomImage) setRoomImage(nextState.roomImage);
      setStyle(nextState.style);
    }
  };

  const handleImageUpload = (imageData: string) => {
    setLoading('upload', true);
    setTimeout(() => {
      setRoomImage(imageData);
      setLoading('upload', false);
    }, 300);
  };

  const handleStyleChange = (style: string) => {
    setStyle(style);
  };

  const handleDragStart = (furniture: Furniture, e: React.DragEvent) => {
    e.dataTransfer.setData('furniture', JSON.stringify(furniture));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (furniture: Furniture, x: number, y: number) => {
    const categoryMap: Record<string, PlacedFurniture['category']> = {
      '沙发': 'sofa',
      '桌子': 'table',
      '椅子': 'chair',
      '灯具': 'lamp',
      '地毯': 'carpet',
      '装饰画': 'painting',
    };

    addFurniture({
      furnitureId: furniture.id,
      name: furniture.name,
      category: categoryMap[furniture.category] || 'sofa',
      x,
      y,
      scale: 1,
      rotation: 0,
    });
  };

  const handleFurnitureUpdate = (id: string, updates: Partial<PlacedFurniture>) => {
    updateFurniture(id, updates);
  };

  const handleFurnitureRemove = (id: string) => {
    removeFurniture(id);
  };

  const handleSave = async (name: string) => {
    setLoading('save', true);
    try {
      const canvasRect = document.querySelector('[data-canvas]')?.getBoundingClientRect();
      const result = await saveDesign({
        name,
        canvasWidth: canvasRect?.width || 1280,
        canvasHeight: canvasRect?.height || 720,
        items: designState.placedFurniture.map((f) => ({
          furnitureId: f.furnitureId,
          x: f.x,
          y: f.y,
          rotation: f.rotation,
          scale: f.scale,
        })),
        styleId: designState.style,
      });

      setCurrentDesignId(result.id);
      setShowSaveModal(false);
      getDesigns().then(setSavedDesigns);
    } catch (error) {
      alert(error instanceof Error ? error.message : '保存失败');
    } finally {
      setLoading('save', false);
    }
  };

  const handleLoadDesign = async (id: string) => {
    setLoading('load', true);
    try {
      const design = await getDesign(id);
      setRoomImage(null);
      setStyle(design.styleId || 'modern');

      designState.placedFurniture.forEach((f) => removeFurniture(f.id));

      const categoryMap: Record<string, PlacedFurniture['category']> = {
        '沙发': 'sofa',
        '桌子': 'table',
        '椅子': 'chair',
        '灯具': 'lamp',
        '地毯': 'carpet',
        '装饰画': 'painting',
      };

      await new Promise((resolve) => setTimeout(resolve, 50));

      design.items.forEach((item) => {
        addFurniture({
          furnitureId: item.furnitureId,
          name: item.furniture.name,
          category: categoryMap[item.furniture.category] || 'sofa',
          x: item.x,
          y: item.y,
          scale: item.scale,
          rotation: item.rotation,
        });
      });

      setCurrentDesignId(id);
    } catch (error) {
      alert(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading('load', false);
    }
  };

  const isUploading = loadingStates['upload'] || false;
  const isSaving = loadingStates['save'] || false;
  const isLoading = loadingStates['load'] || false;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .app-container {
            flex-direction: column !important;
          }
          .left-panel {
            width: 100% !important;
            height: 50% !important;
          }
          .right-panel {
            width: 100% !important;
            height: 50% !important;
          }
        }
        @media (max-width: 480px) {
          .furniture-icon {
            transform: scale(0.5) !important;
          }
        }
      `}</style>

      <div className="app-container" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div
          className="left-panel"
          style={{
            width: isFullscreen ? '0px' : '320px',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.3s ease',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'white',
            }}
          >
            <h1 style={{ fontSize: '20px', fontWeight: 600 }}>设计工坊</h1>
            <button
              onClick={toggleFullscreen}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isFullscreen ? '◀' : '▶'}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <PhotoUploader onImageUpload={handleImageUpload} isLoading={isUploading} />

            <StyleSelector
              currentStyle={designState.style}
              onStyleChange={handleStyleChange}
            />

            <FurnitureLibrary
              furnitureList={furnitureList}
              onDragStart={handleDragStart}
            />

            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <button
                onClick={() => setIs3DMode(!is3DMode)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  background: is3DMode
                    ? 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)'
                    : 'white',
                  color: is3DMode ? 'white' : '#2d3436',
                  cursor: 'pointer',
                  fontSize: '13px',
                  border: '1px solid #dfe6e9',
                  transition: 'all 0.2s ease',
                }}
              >
                🔲 {is3DMode ? '2D' : '3D'}预览
              </button>
              <button
                onClick={handleUndo}
                disabled={historyIndex === 0}
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: '1px solid #dfe6e9',
                  backgroundColor: 'white',
                  cursor: historyIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: historyIndex === 0 ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                ↶
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: '1px solid #dfe6e9',
                  backgroundColor: 'white',
                  cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: historyIndex >= history.length - 1 ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                ↷
              </button>
            </div>

            <div>
              <h4
                style={{
                  marginBottom: '8px',
                  color: '#2d3436',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                已保存方案
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {savedDesigns.length === 0 ? (
                  <div
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: '#b2bec3',
                      fontSize: '13px',
                    }}
                  >
                    暂无保存的方案
                  </div>
                ) : (
                  savedDesigns.slice(0, 5).map((design) => (
                    <div
                      key={design.id}
                      onClick={() => handleLoadDesign(design.id)}
                      style={{
                        padding: '12px',
                        backgroundColor:
                          currentDesignId === design.id ? '#e8f8f5' : 'white',
                        borderRadius: '8px',
                        border:
                          currentDesignId === design.id
                            ? '1px solid #4ECDC4'
                            : '1px solid #dfe6e9',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#4ECDC4';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          currentDesignId === design.id ? '#4ECDC4' : '#dfe6e9';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>{design.thumbnail}</span>
                          <div>
                            <div style={{ fontSize: '14px', color: '#2d3436' }}>
                              {design.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#b2bec3' }}>
                              {new Date(design.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#FF6B6B', fontWeight: 600 }}>
                          ¥{design.totalPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className="right-panel"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#e8e8e8',
            position: 'relative',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ fontSize: '14px', color: '#636e72' }}>
              {designState.placedFurniture.length} 件家具
            </div>
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={designState.placedFurniture.length === 0}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background:
                  designState.placedFurniture.length === 0
                    ? '#dfe6e9'
                    : 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                color: designState.placedFurniture.length === 0 ? '#636e72' : 'white',
                cursor:
                  designState.placedFurniture.length === 0
                    ? 'not-allowed'
                    : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (designState.placedFurniture.length > 0) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              💾 保存
            </button>
          </div>

          <div
            data-canvas
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <LoadingOverlay isVisible={isLoading} text="加载方案中..." />

            <PhotoCanvas
              roomImage={designState.roomImage}
              style={designState.style}
              placedFurniture={designState.placedFurniture}
              furnitureMap={furnitureMap}
              onDrop={handleDrop}
              onFurnitureUpdate={handleFurnitureUpdate}
              onFurnitureRemove={handleFurnitureRemove}
            />
          </div>

          <div style={{ padding: '16px', backgroundColor: 'white' }}>
            <BudgetPanel budgetState={budgetState} />
          </div>
        </div>
      </div>

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
};

export default App;
