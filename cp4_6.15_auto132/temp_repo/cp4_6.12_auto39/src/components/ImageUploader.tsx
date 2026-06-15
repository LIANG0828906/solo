import { useState, useRef } from 'react';
import './ImageUploader.css';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const compressImage = (file: File, maxSize: number = 200 * 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height / width) * maxDim;
            width = maxDim;
          } else {
            width = (width / height) * maxDim;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);

        while (result.length > maxSize && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(result);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ImageUploader = ({ images, onChange, maxImages = 3 }: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = maxImages - images.length;
    const filesToProcess = files.slice(0, remainingSlots);

    const compressedImages = await Promise.all(
      filesToProcess.map((file) => compressImage(file))
    );

    onChange([...images, ...compressedImages]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="image-uploader">
      {images.map((img, index) => (
        <div key={index} className="uploaded-image">
          <img src={img} alt={`物品图片${index + 1}`} />
          <button
            className="remove-btn"
            onClick={() => removeImage(index)}
            type="button"
          >
            ×
          </button>
        </div>
      ))}
      {images.length < maxImages && (
        <div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}>
          <span className="upload-icon">+</span>
          <span className="upload-text">上传图片</span>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <p className="upload-hint">最多上传{maxImages}张，自动压缩至200KB以内</p>
    </div>
  );
};

export default ImageUploader;
