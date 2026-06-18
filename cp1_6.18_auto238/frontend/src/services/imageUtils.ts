// 压缩图片，使用Canvas将图片缩略到maxSize x maxSize
export const compressImage = (file: File, maxSize: number = 256): Promise<File> => {
  return new Promise((resolve, reject) => {
    // 创建图片对象
    const img = new Image();
    img.onload = () => {
      // 创建Canvas元素
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法获取Canvas上下文'));
        return;
      }

      // 计算缩放比例，保持宽高比
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      // 设置Canvas尺寸
      canvas.width = width;
      canvas.height = height;

      // 在Canvas上绘制缩放后的图片
      ctx.drawImage(img, 0, 0, width, height);

      // 将Canvas转换为Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('图片压缩失败'));
            return;
          }

          // 创建新的File对象
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    // 读取文件内容
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    reader.readAsDataURL(file);
  });
};

// File转Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      // reader.result 包含Base64编码的字符串
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    // 以DataURL格式读取文件，结果为Base64编码
    reader.readAsDataURL(file);
  });
};
