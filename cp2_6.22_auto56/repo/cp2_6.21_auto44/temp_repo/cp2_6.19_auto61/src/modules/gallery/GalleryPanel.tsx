import { useRef, useState } from 'react';
import { Palette, Upload, X, Images, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore, Frame } from '@/store/appStore';

const GalleryPanel: React.FC = () => {
  const images = useAppStore((s) => s.images);
  const frames = useAppStore((s) => s.frames);
  const addImage = useAppStore((s) => s.addImage);
  const addFrame = useAppStore((s) => s.addFrame);
  const removeImage = useAppStore((s) => s.removeImage);
  const reorderImages = useAppStore((s) => s.reorderImages);
  const facingWall = useAppStore((s) => s.facingWall);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        addImage({
          id: uuidv4(),
          imageUrl: reader.result as string,
          fileName: file.name,
          addedAt: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const computeAutoPosition = (
    wallId: 'north' | 'south' | 'east' | 'west',
    existingWallFrames: Frame[]
  ): { positionX: number; positionY: number } => {
    const isNS = wallId === 'north' || wallId === 'south';
    const colValues = isNS ? [-3.1, -0.05, 3.0] : [-2.1, 0, 2.1];
    const rowValues = [2.0, 1.0];
    const slots: { positionX: number; positionY: number }[] = [];
    for (let r = 0; r < rowValues.length; r++) {
      for (let c = 0; c < colValues.length; c++) {
        slots.push({ positionX: colValues[c], positionY: rowValues[r] });
      }
    }
    const occupied = new Set<string>();
    existingWallFrames.forEach((f) => {
      slots.forEach((s, i) => {
        if (
          Math.abs(f.positionX - s.positionX) < 0.001 &&
          Math.abs(f.positionY - s.positionY) < 0.001
        ) {
          occupied.add(String(i));
        }
      });
    });
    for (let i = 0; i < slots.length; i++) {
      if (!occupied.has(String(i))) {
        return slots[i];
      }
    }
    return { positionX: 0, positionY: 1.5 };
  };

  const handleThumbnailClick = (image: typeof images[number]) => {
    const existingWallFrames = frames.filter((f) => f.wallId === facingWall);
    const index = images.findIndex((img) => img.id === image.id);

    const isNS = facingWall === 'north' || facingWall === 'south';
    const colValues = isNS ? [-3.1, -0.05, 3.0] : [-2.1, 0, 2.1];
    const rowValues = [2.0, 1.0];
    const slots: { positionX: number; positionY: number }[] = [];
    for (let r = 0; r < rowValues.length; r++) {
      for (let c = 0; c < colValues.length; c++) {
        slots.push({ positionX: colValues[c], positionY: rowValues[r] });
      }
    }

    const preferredSlotIndex = index % 6;
    const preferred = slots[preferredSlotIndex];
    const isPreferredOccupied = existingWallFrames.some(
      (f) =>
        Math.abs(f.positionX - preferred.positionX) < 0.001 &&
        Math.abs(f.positionY - preferred.positionY) < 0.001
    );

    let positionX: number;
    let positionY: number;
    if (!isPreferredOccupied) {
      positionX = preferred.positionX;
      positionY = preferred.positionY;
    } else {
      const auto = computeAutoPosition(facingWall, existingWallFrames);
      positionX = auto.positionX;
      positionY = auto.positionY;
    }

    addFrame({
      id: uuidv4(),
      imageUrl: image.imageUrl,
      fileName: image.fileName,
      wallId: facingWall,
      positionX,
      positionY,
      addedAt: new Date().toISOString(),
    });
  };

  const handleDelete = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    removeImage(imageId);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDragFromIndex(index);
  };

  const handleDragEnd = () => {
    setDragFromIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIndex) && fromIndex !== targetIndex) {
      reorderImages(fromIndex, targetIndex);
    }
    setDragFromIndex(null);
    setDragOverIndex(null);
  };

  const renderThumbnail = (image: typeof images[number], index: number) => {
    const isDragging = dragFromIndex === index;
    const isDragOver = dragOverIndex === index;
    return (
      <div
        key={image.id}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleDragEnter(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        onClick={() => handleThumbnailClick(image)}
        className={[
          'relative group rounded-lg overflow-hidden cursor-pointer shadow-md ring-1 ring-[#D9D0C7] transition duration-200 ease-out origin-center',
          'hover:scale-[1.2] hover:shadow-[0_10px_30px_-5px_rgba(92,82,74,0.45),0_4px_12px_-2px_rgba(92,82,74,0.25)] hover:ring-2 hover:ring-[#C4A882] hover:z-20',
          isDragging ? 'opacity-35' : '',
          isDragOver ? 'ring-2 ring-offset-2 ring-[#C4A882] -translate-y-1 scale-[1.05]' : '',
        ].join(' ')}
      >
        <img
          src={image.imageUrl}
          alt={image.fileName}
          className="w-full aspect-square object-cover"
        />
        <button
          onClick={(e) => handleDelete(e, image.id)}
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="hidden md:flex flex-col h-full w-[280px] shrink-0 bg-[#F5F0EB] border-r border-[#D9D0C7]">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#D9D0C7]">
          <Palette className="w-5 h-5 text-[#8B7355]" />
          <h2 className="text-lg font-semibold text-[#5C524A]">灵感画廊</h2>
        </div>

        <div className="px-4 py-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#C4A882] hover:bg-[#B09370] text-white text-sm font-medium transition duration-300 ease-out"
          >
            <Upload className="w-4 h-4" />
            上传图片
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {images.map((image, index) => renderThumbnail(image, index))}
          </div>

          {images.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-[#A99F95] text-sm">
              <Images className="w-8 h-8 mb-2" />
              暂无图片，点击上传
            </div>
          )}
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 top-0 left-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col bg-[#F5F0EB] border-r border-[#D9D0C7] shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#D9D0C7]">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#8B7355]" />
                <h2 className="text-lg font-semibold text-[#5C524A]">灵感画廊</h2>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-[#8B7355]">
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#C4A882] hover:bg-[#B09370] text-white text-sm font-medium transition duration-300 ease-out"
              >
                <Upload className="w-4 h-4" />
                上传图片
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="grid grid-cols-2 gap-3">
                {images.map((image, index) => renderThumbnail(image, index))}
              </div>

              {images.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-[#A99F95] text-sm">
                  <Images className="w-8 h-8 mb-2" />
                  暂无图片，点击上传
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden items-center justify-around bg-[#F5F0EB] border-t border-[#D9D0C7] px-2 py-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-0.5 text-[#8B7355] px-3 py-1"
        >
          <Upload className="w-5 h-5" />
          <span className="text-[10px]">上传</span>
        </button>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex flex-col items-center gap-0.5 text-[#8B7355] px-3 py-1"
        >
          <Images className="w-5 h-5" />
          <span className="text-[10px]">图库</span>
        </button>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex flex-col items-center gap-0.5 text-[#8B7355] px-3 py-1"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
          <span className="text-[10px]">侧栏</span>
        </button>
      </div>
    </>
  );
};

export default GalleryPanel;
