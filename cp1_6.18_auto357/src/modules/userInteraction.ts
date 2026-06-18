import { useClothingStore, DesignParams } from '../store/useClothingStore';
import { updateDesignParams, updateFabricColor, applyFabricTexture } from './threeRender';
import axios from 'axios';

export const SWATCH_COLORS = [
  '#F4A460',
  '#8B4513',
  '#222222',
  '#F5F5DC',
  '#CD853F',
  '#A0522D',
];

export const STYLE_OPTIONS = [
  { id: 'retro', name: '复古', icon: '🕰️' },
  { id: 'minimalist', name: '极简', icon: '◻️' },
  { id: 'bohemian', name: '波西米亚', icon: '🌿' },
  { id: 'classic', name: '经典', icon: '👔' },
  { id: 'casual', name: '休闲', icon: '👕' },
  { id: 'elegant', name: '优雅', icon: '👗' },
];

export interface UploadResponse {
  id: string;
  imageUrl: string;
  dominantColor: string;
  width: number;
  height: number;
  size?: {
    shoulder: number;
    chest: number;
    length: number;
    sleeve: number;
  };
}

export const handleFileUpload = async (file: File): Promise<UploadResponse | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<UploadResponse>('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const setClothing = useClothingStore.getState().setClothing;
    setClothing({
      id: response.data.id,
      imageUrl: response.data.imageUrl,
      originalColor: response.data.dominantColor,
      currentColor: response.data.dominantColor,
    });

    updateFabricColor(response.data.dominantColor);
    applyFabricTexture(response.data.imageUrl);

    return response.data;
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
};

export const handleColorReplace = async (
  imageId: string,
  targetColor: string
): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('imageId', imageId);
    formData.append('targetColor', targetColor);

    const response = await axios.post<{ imageUrl: string; success: boolean }>(
      '/api/color-replace',
      formData
    );

    if (response.data.success) {
      const setClothing = useClothingStore.getState().setClothing;
      setClothing({
        currentColor: targetColor,
        imageUrl: response.data.imageUrl,
      });

      updateFabricColor(targetColor);
      applyFabricTexture(response.data.imageUrl);

      return response.data.imageUrl;
    }

    return null;
  } catch (error) {
    console.error('Color replacement failed:', error);
    return null;
  }
};

export const handleSleeveLengthChange = (value: number): void => {
  const steppedValue = Math.round(value / 5) * 5;
  useClothingStore.getState().setDesignParams({ sleeveLength: steppedValue });
  updateDesignParams({ sleeveLength: steppedValue });
};

export const handleClothingLengthChange = (value: number): void => {
  const steppedValue = Math.round(value / 5) * 5;
  useClothingStore.getState().setDesignParams({ clothingLength: steppedValue });
  updateDesignParams({ clothingLength: steppedValue });
};

export const handleWaistFitChange = (value: number): void => {
  const steppedValue = Math.round(value / 5) * 5;
  useClothingStore.getState().setDesignParams({ waistFit: steppedValue });
  updateDesignParams({ waistFit: steppedValue });
};

export const handleSwatchClick = async (color: string): Promise<void> => {
  const state = useClothingStore.getState();
  const { id } = state.clothing;

  updateFabricColor(color);
  
  const setClothing = useClothingStore.getState().setClothing;
  setClothing({ currentColor: color });

  if (id) {
    await handleColorReplace(id, color);
  }
};

export const handleDragOver = (e: React.DragEvent): void => {
  e.preventDefault();
  e.stopPropagation();
  useClothingStore.getState().setIsDragging(true);
};

export const handleDragLeave = (e: React.DragEvent): void => {
  e.preventDefault();
  e.stopPropagation();
  useClothingStore.getState().setIsDragging(false);
};

export const handleDrop = async (e: React.DragEvent): Promise<UploadResponse | null> => {
  e.preventDefault();
  e.stopPropagation();
  useClothingStore.getState().setIsDragging(false);

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      return await handleFileUpload(file);
    }
  }
  return null;
};

export const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>): Promise<UploadResponse | null> => {
  const files = e.target.files;
  if (files && files.length > 0) {
    return await handleFileUpload(files[0]);
  }
  return null;
};

export const resetDesignParams = (): void => {
  const defaultParams: DesignParams = {
    sleeveLength: 50,
    clothingLength: 50,
    waistFit: 50,
  };
  useClothingStore.getState().setDesignParams(defaultParams);
  updateDesignParams(defaultParams);
};
