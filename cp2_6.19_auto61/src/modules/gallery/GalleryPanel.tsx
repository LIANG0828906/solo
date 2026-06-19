import { useRef } from 'react';
import { Palette, Upload, X, Images, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '@/store/appStore';

const GalleryPanel: React.FC = () => {
  const images = useAppStore((s) => s.images);
  const frames = useAppStore((s) => s.frames);
  const addImage = useAppStore((s) => s.addImage);
  const addFrame = useAppStore((s) => s.addFrame);
  const removeImage = useAppStore((s) => s.removeImage);
  const facingWall = useAppStore((s) => s.facingWall);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleThumbnailClick = (image: typeof images[number]) => {
    addFrame({
      id: uuidv4(),
      imageUrl: image.imageUrl,
      fileName: image.fileName,
      wallId: facingWall,
      positionX: Math.random() * 4 - 2,
      positionY: Math.random() + 1,
      addedAt: new Date().toISOString(),
    });
  };

  const handleDelete = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    removeImage(imageId);
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
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group rounded-lg overflow-hidden cursor-pointer shadow-md ring-1 ring-[#D9D0C7] transition duration-300 ease-out hover:scale-[1.2] hover:shadow-[0_10px_30px_-5px_rgba(92,82,74,0.45),0_4px_12px_-2px_rgba(92,82,74,0.25)] hover:ring-2 hover:ring-[#C4A882] hover:z-20 origin-center"
                onClick={() => handleThumbnailClick(image)}
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
            ))}
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
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative group rounded-lg overflow-hidden cursor-pointer shadow-md ring-1 ring-[#D9D0C7] transition duration-300 ease-out hover:scale-[1.2] hover:shadow-[0_10px_30px_-5px_rgba(92,82,74,0.45),0_4px_12px_-2px_rgba(92,82,74,0.25)] hover:ring-2 hover:ring-[#C4A882] hover:z-20 origin-center"
                    onClick={() => handleThumbnailClick(image)}
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
                ))}
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
