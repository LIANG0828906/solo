import type { PlantStatus, RequestStatus } from './types';

interface StatusDisplay {
  label: string;
  className: string;
}

export function getPlantStatusDisplay(status: PlantStatus | null | undefined | string): StatusDisplay {
  if (status === 'available') {
    return { label: '待领养', className: 'bg-olive-600 text-white' };
  }
  if (status === 'adopted') {
    return { label: '已领养', className: 'bg-gray-400 text-white' };
  }
  return { label: '待领养', className: 'bg-gray-400 text-white' };
}

export function getRequestStatusDisplay(
  status: RequestStatus | null | undefined | string
): StatusDisplay {
  if (status === 'pending') {
    return { label: '待处理', className: 'bg-orange-100 text-orange-600' };
  }
  if (status === 'approved') {
    return { label: '已同意', className: 'bg-olive-100 text-olive-700' };
  }
  if (status === 'rejected') {
    return { label: '已拒绝', className: 'bg-gray-100 text-gray-500' };
  }
  return { label: '待处理', className: 'bg-orange-100 text-orange-600' };
}

export function getDifficultyLabel(difficulty: number | null | undefined): string {
  if (difficulty === null || difficulty === undefined) return '未知';
  if (difficulty <= 2) return '容易';
  if (difficulty <= 3) return '中等';
  return '困难';
}

export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return '未知时间';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}个月前`;
  const years = Math.floor(days / 365);
  return `${years}年前`;
}

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '未知日期';
  const date = new Date(isoString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function uploadFileWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
      } else {
        reject(new Error(`上传失败: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('网络错误'));

    const formData = new FormData();
    formData.append('file', file);

    const blob = new Blob([file], { type: file.type });
    const reader = new FileReader();
    reader.onload = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          onProgress(progress);
          clearInterval(interval);
          setTimeout(() => {
            resolve(reader.result as string);
          }, 100);
        } else {
          onProgress(Math.min(progress, 99));
        }
      }, 150);
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(blob);
  });
}
