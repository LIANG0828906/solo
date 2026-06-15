export const generateThumbnail = (file: File, size = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.max(size / img.width, size / img.height);
        const x = (img.width * scale - size) / 2;
        const y = (img.height * scale - size) / 2;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, -x, -y, img.width * scale, img.height * scale);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

export const validateImage = (file: File): { valid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: '仅支持 JPG/PNG 格式' };
  }
  const maxSize = 8 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: '图片大小不能超过 8MB' };
  }
  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

export const statusLabels: Record<string, string> = {
  pending: '待确认',
  inProgress: '进行中',
  completed: '已完成',
};

export const statusColors: Record<string, string> = {
  pending: '#fcc419',
  inProgress: '#4facfe',
  completed: '#51cf66',
};
