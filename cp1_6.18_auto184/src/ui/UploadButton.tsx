import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface UploadButtonProps {
  onFileSelect: (file: File) => void;
}

export const UploadButton: React.FC<UploadButtonProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
    triggerHaptic();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  };

  return (
    <div className="upload-button-wrapper">
      <button
        className="upload-button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        <Upload size={20} />
        <span className="upload-button-text">上传音频</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};
