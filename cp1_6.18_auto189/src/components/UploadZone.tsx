import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '@/store/useStore';
import { uploadImage } from '@/engines/uploadEngine';
import { Upload, Image } from 'lucide-react';

export default function UploadZone() {
  const imageUrl = useStore((s) => s.imageUrl);
  const isUploading = useStore((s) => s.isUploading);
  const setUploading = useStore((s) => s.setUploading);
  const setImage = useStore((s) => s.setImage);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      try {
        const result = await uploadImage(file);
        setImage(result.id, result.url, result.width, result.height);
      } catch {
        setUploading(false);
      }
    },
    [setUploading, setImage],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  if (imageUrl !== null) return null;

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div
        {...getRootProps()}
        className="upload-zone flex flex-col items-center justify-center w-full max-w-lg h-72 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 cursor-pointer transition-colors hover:border-white/40 hover:bg-white/10"
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-white/20 border-t-[#D4A76A] rounded-full animate-spin" />
            <span className="text-white/60 text-sm">上传中...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-[#D4A76A]" />
            </div>
            <Image className="w-5 h-5 text-white/30" />
            <p className="text-white/80 text-lg font-medium">拖拽或点击上传房间照片</p>
            <p className="text-white/40 text-sm">支持 JPG/PNG，最大 5MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
