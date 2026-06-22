export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const getDurationColor = (minutes: number): string => {
  const clamped = Math.max(1, Math.min(60, minutes));
  const t = (clamped - 1) / 59;
  const r1 = 39, g1 = 174, b1 = 96;
  const r2 = 231, g2 = 76, b2 = 60;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
};

export const getDurationRingSize = (minutes: number): number => {
  const clamped = Math.max(1, Math.min(60, minutes));
  const minSize = 36;
  const maxSize = 64;
  return minSize + ((clamped - 1) / 59) * (maxSize - minSize);
};

export const getProjectColor = (createdAt: number): string => {
  const hue = (createdAt % 360);
  return `hsl(${hue}, 60%, 50%)`;
};

export const compressImage = (file: File, maxWidth: number = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取canvas上下文'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);

        while (result.length > 200 * 1024 && quality > 0.3) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(result);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

export const textDiff = (text1: string, text2: string): Array<{ type: 'added' | 'removed' | 'unchanged'; content: string }> => {
  const sentences1 = text1.split(/([。！？.!?\n])/).filter(s => s.trim());
  const sentences2 = text2.split(/([。！？.!?\n])/).filter(s => s.trim());

  const result: Array<{ type: 'added' | 'removed' | 'unchanged'; content: string }> = [];
  const set1 = new Set(sentences1);
  const set2 = new Set(sentences2);

  let i = 0, j = 0;

  while (i < sentences1.length || j < sentences2.length) {
    if (i < sentences1.length && j < sentences2.length && sentences1[i] === sentences2[j]) {
      result.push({ type: 'unchanged', content: sentences1[i] });
      i++;
      j++;
    } else if (i < sentences1.length && !set2.has(sentences1[i])) {
      result.push({ type: 'removed', content: sentences1[i] });
      i++;
    } else if (j < sentences2.length && !set1.has(sentences2[j])) {
      result.push({ type: 'added', content: sentences2[j] });
      j++;
    } else {
      if (i < sentences1.length) {
        result.push({ type: 'removed', content: sentences1[i] });
        i++;
      }
      if (j < sentences2.length) {
        result.push({ type: 'added', content: sentences2[j] });
        j++;
      }
    }
  }

  return result;
};
