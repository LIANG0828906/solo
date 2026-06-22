export type StyleType = 'oil' | 'watercolor' | 'sketch' | 'cyberpunk';

export interface FilterParams {
  intensity: number;
  brightness: number;
  saturation: number;
}

export interface AppState {
  originalImage: HTMLImageElement | null;
  originalImageData: ImageData | null;
  processedImageData: ImageData | null;
  currentStyle: StyleType;
  params: FilterParams;
  isProcessing: boolean;
  shareCode: string | null;
  showToast: boolean;
  toastMessage: string;
}

export type AppAction =
  | { type: 'SET_IMAGE'; payload: { image: HTMLImageElement; imageData: ImageData } }
  | { type: 'SET_STYLE'; payload: StyleType }
  | { type: 'SET_PARAMS'; payload: Partial<FilterParams> }
  | { type: 'SET_PROCESSED'; payload: ImageData | null }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_SHARE_CODE'; payload: string | null }
  | { type: 'SHOW_TOAST'; payload: string }
  | { type: 'HIDE_TOAST' };

export interface StyleConfig {
  id: StyleType;
  name: string;
  gradient: string;
}
