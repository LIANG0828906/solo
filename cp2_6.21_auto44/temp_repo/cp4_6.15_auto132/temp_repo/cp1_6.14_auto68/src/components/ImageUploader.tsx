import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Upload, Crop as CropIcon } from 'lucide-react';
import { uploadApi } from '../api';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

function getCroppedImg(image: HTMLImageElement, crop: Crop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const ctx = canvas.getContext('2d');

  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  if (ctx) {
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';
  }

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;

  if (ctx) {
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas is empty'));
      },
      'image/webp',
      0.9
    );
  });
}

export function ImageUploader({ images, onChange, maxImages = 3 }: ImageUploaderProps) {
  const [showCropper, setShowCropper] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number>(1);
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.includes('image/')) return;

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  }, [aspect]);

  const handleCropConfirm = async () => {
    if (!completedCrop || !imgRef.current || !imgSrc) return;

    try {
      setUploading(true);
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      const file = new File([croppedBlob], 'cropped-image.webp', { type: 'image/webp' });
      const res = await uploadApi.uploadImage(file);
      onChange([...images, res.data.url]);
      setShowCropper(false);
      setImgSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-3">
        {images.map((img, index) => (
          <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={img} alt={`成品 ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={triggerUpload}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-400 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-orange-500 transition-colors"
          >
            <Upload size={24} />
            <span className="text-xs">上传图片</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onSelectFile}
        className="hidden"
      />

      {showCropper && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">裁剪图片</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAspect(1)}
                  className={`px-3 py-1 rounded-lg text-sm ${aspect === 1 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  1:1
                </button>
                <button
                  type="button"
                  onClick={() => setAspect(4 / 3)}
                  className={`px-3 py-1 rounded-lg text-sm ${aspect === 4 / 3 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  4:3
                </button>
                <button
                  type="button"
                  onClick={() => setAspect(16 / 9)}
                  className={`px-3 py-1 rounded-lg text-sm ${aspect === 16 / 9 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  16:9
                </button>
              </div>
            </div>
            <div className="p-4 max-h-[60vh] overflow-auto flex justify-center">
              {imgSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  className="max-w-full"
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-h-[55vh] max-w-full"
                  />
                </ReactCrop>
              )}
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCropper(false);
                  setImgSrc('');
                }}
                className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                disabled={uploading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-400 text-white flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ borderRadius: '10px' }}
              >
                <CropIcon size={16} />
                {uploading ? '上传中...' : '确认裁剪'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
