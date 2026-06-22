// ============================================================
// 图片上传 Hook
// 数据流向：用户选择图片 -> FileReader 读取预览 -> 组件显示 -> 提交时上传
// 调用关系：被衣物创建/编辑组件等需要图片上传的组件调用
// ============================================================

import { useState, useCallback, useRef } from 'react';

/**
 * 图片上传 Hook
 * 处理图片选择、预览、重置逻辑
 * @returns 图片上传相关状态和方法
 */
export const useImageUpload = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 处理文件选择变化
   * 使用 FileReader 实现本地图片预览
   * 数据流向：input file -> FileReader -> previewUrl state -> 组件显示
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  /**
   * 重置上传状态
   * 清空预览图和选中的文件
   */
  const resetUpload = useCallback(() => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  /**
   * 触发文件选择对话框
   */
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    previewUrl,
    selectedFile,
    fileInputRef,
    handleFileChange,
    resetUpload,
    triggerFileInput,
  };
};
