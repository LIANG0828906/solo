import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePuzzleStore } from './puzzleStore';
import { PuzzleBoard } from './PuzzleBoard';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const compressImage = (file: File, maxSize: number = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function App() {
  const { currentPage, recentPuzzles, setImage, setCurrentPage, initializePieces } = usePuzzleStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  const handleUploadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipple({ x, y, id });
    setTimeout(() => setRipple(null), 300);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressedImage = await compressImage(file);
      setImage(compressedImage);
      initializePieces();
      setCurrentPage('puzzle');
    } catch (error) {
      console.error('Failed to process image:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePuzzleClick = (imageData: string) => {
    setImage(imageData);
    initializePieces();
    setCurrentPage('puzzle');
  };

  if (currentPage === 'puzzle') {
    return <PuzzleBoard />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0B192C 0%, #1A3A5C 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: '40px' }}
      >
        <h1
          style={{
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '10px',
            textShadow: '0 4px 20px rgba(100, 181, 246, 0.3)',
          }}
        >
          🧩 拼图工坊
        </h1>
        <p style={{ color: '#B0BEC5', fontSize: '18px', margin: 0 }}>
          上传图片，挑战你的拼图技巧
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ marginBottom: '50px' }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <motion.button
          onClick={handleUploadClick}
          whileHover={{ backgroundColor: '#42A5F5', scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '16px 48px',
            borderRadius: '8px',
            backgroundColor: '#64B5F6',
            color: 'white',
            border: 'none',
            cursor: isUploading ? 'wait' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 4px 20px rgba(100, 181, 246, 0.4)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'background-color 0.3s',
          }}
          disabled={isUploading}
        >
          {isUploading ? '处理中...' : '📷 上传图片'}
          <AnimatePresence>
            {ripple && (
              <motion.span
                key={ripple.id}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'absolute',
                  left: ripple.x,
                  top: ripple.y,
                  width: '20px',
                  height: '20px',
                  marginLeft: '-10px',
                  marginTop: '-10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={{ width: '100%', maxWidth: '520px' }}
      >
        <h2
          style={{
            color: 'white',
            fontSize: '20px',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          {recentPuzzles.length > 0 ? '最近挑战' : '暂无记录，开始你的第一张拼图吧！'}
        </h2>
        <motion.div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
          }}
        >
          {recentPuzzles.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => handlePuzzleClick(record.thumbnail)}
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '12px',
                backgroundColor: 'white',
                boxShadow: '0 4px 20px rgba(100, 181, 246, 0.2)',
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                justifySelf: 'center',
              }}
            >
              <img
                src={record.thumbnail}
                alt={`Puzzle ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to top, rgba(11, 25, 44, 0.9) 0%, transparent 50%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  padding: '15px',
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  ⏱ {formatTime(record.completionTime)}
                </span>
              </motion.div>
            </motion.div>
          ))}
          {[...Array(Math.max(0, 4 - recentPuzzles.length))].map((_, i) => (
            <motion.div
              key={`empty-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ duration: 0.4, delay: 0.5 + (recentPuzzles.length + i) * 0.1 }}
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px dashed rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.3)',
                fontSize: '40px',
                justifySelf: 'center',
              }}
            >
              +
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        style={{
          marginTop: '50px',
          color: '#607D8B',
          fontSize: '14px',
          textAlign: 'center',
        }}
      >
        <p>💡 提示：拖拽碎块到正确位置，完成后可查看用时</p>
        <p style={{ marginTop: '5px' }}>支持上传任意图片，自动压缩到800px以内</p>
      </motion.div>
    </div>
  );
}
