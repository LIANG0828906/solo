import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { AppState, AppAction, DiagnosisRecord, ImageFeatures, DiagnosisStatus, CareSuggestion } from './types';

const STORAGE_KEY = 'plant_clinic_records';

const initialState: AppState = {
  records: [],
  deletingIds: new Set(),
  currentRecord: null,
  isDiagnosing: false,
  currentImage: null,
  currentThumbnail: null,
  imageFeatures: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_IMAGE':
      return {
        ...state,
        currentImage: action.payload.image,
        currentThumbnail: action.payload.thumbnail,
        currentRecord: null,
        imageFeatures: null,
      };
    case 'SET_IMAGE_FEATURES':
      return { ...state, imageFeatures: action.payload };
    case 'START_DIAGNOSIS':
      return { ...state, isDiagnosing: true };
    case 'SET_DIAGNOSIS_RESULT':
      return { ...state, isDiagnosing: false, currentRecord: action.payload };
    case 'CLEAR_CURRENT':
      return {
        ...state,
        currentImage: null,
        currentThumbnail: null,
        currentRecord: null,
        isDiagnosing: false,
        imageFeatures: null,
      };
    case 'ADD_RECORD':
      return { ...state, records: [action.payload, ...state.records] };
    case 'MARK_DELETING':
      return {
        ...state,
        deletingIds: new Set(state.deletingIds).add(action.payload),
      };
    case 'DELETE_RECORD': {
      const newDeleting = new Set(state.deletingIds);
      newDeleting.delete(action.payload);
      return {
        ...state,
        records: state.records.filter((r) => r.id !== action.payload),
        deletingIds: newDeleting,
      };
    }
    case 'SET_CURRENT_RECORD':
      return { ...state, currentRecord: action.payload };
    case 'LOAD_RECORDS':
      return { ...state, records: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  runDiagnosis: (imageUrl: string, thumbnail: string, features: ImageFeatures) => void;
  deleteRecordWithAnimation: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const plantNames = ['绿萝', '吊兰', '多肉', '发财树', '君子兰', '龟背竹', '橡皮树', '仙人掌'];

const suggestionPool: Record<string, Omit<CareSuggestion, 'id'>> = {
  light: { title: '调整光照', description: '将植物移至明亮散射光处，避免强光直射', icon: 'sun' },
  water: { title: '控制浇水', description: '调整浇水频率，保持土壤微湿不积水', icon: 'droplets' },
  prune: { title: '修剪病叶', description: '及时剪除病变部位，防止扩散蔓延', icon: 'leaf' },
  fertilizer: { title: '补充养分', description: '施用均衡缓释肥，提供生长必需营养', icon: 'fertilizer' },
  temperature: { title: '温度调节', description: '保持环境温度在18-28℃之间', icon: 'temperature' },
  ventilation: { title: '加强通风', description: '改善空气流通，降低湿度预防病害', icon: 'wind' },
  iron: { title: '补充铁肥', description: '施用螯合铁或硫酸亚铁溶液', icon: 'fertilizer' },
  nitrogen: { title: '追施氮肥', description: '施用尿素或高氮复合肥促进生长', icon: 'fertilizer' },
  fungicide: { title: '药剂防治', description: '喷施多菌灵或代森锰锌杀菌剂', icon: 'fertilizer' },
  sulfur: { title: '硫磺防治', description: '使用硫磺粉防治真菌性病害', icon: 'fertilizer' },
  observe: { title: '定期观察', description: '每周检查叶片状态，及时发现异常', icon: 'leaf' },
};

function buildSuggestions(keys: string[]): CareSuggestion[] {
  return keys.map((k, i) => ({
    ...suggestionPool[k],
    id: `sugg_${Date.now()}_${i}`,
  }));
}

function diagnoseFromFeatures(features: ImageFeatures): {
  status: DiagnosisStatus;
  diseaseName: string;
  symptoms: string;
  suggestions: CareSuggestion[];
  confidence: number;
} {
  const { greenRatio, yellowTendency, brownSpotRatio, brightness, contrast } = features;

  const healthyScore = greenRatio * 40 + Math.max(0, (1 - yellowTendency)) * 30 + Math.max(0, (1 - brownSpotRatio)) * 30;
  const diseaseScore = brownSpotRatio * 60 + yellowTendency * 25 + Math.max(0, (1 - greenRatio)) * 15;
  const nutrientScore = yellowTendency * 50 + Math.max(0, (1 - greenRatio)) * 30 + Math.max(0, (1 - brightness)) * 20;

  const scores = [
    { type: 'healthy' as const, score: healthyScore },
    { type: 'diseased' as const, score: diseaseScore },
    { type: 'nutrient_deficiency' as const, score: nutrientScore },
  ];
  scores.sort((a, b) => b.score - a.score);
  const top = scores[0];
  const confidence = Math.min(98, Math.max(72, Math.round(top.score * 0.6 + 40 + (contrast - 0.5) * 10)));

  if (top.type === 'healthy') {
    return {
      status: 'healthy',
      diseaseName: '健康',
      symptoms: '叶片色泽鲜亮翠绿，形态舒展饱满，无明显病斑或枯萎迹象，整体生长状态良好。',
      suggestions: buildSuggestions(['light', 'water', 'observe']),
      confidence,
    };
  }

  if (top.type === 'diseased') {
    if (brownSpotRatio > 0.15) {
      return {
        status: 'diseased',
        diseaseName: '叶斑病',
        symptoms: '叶片表面出现圆形或不规则褐色斑点，边缘深褐色中央略浅，严重时病斑连片导致叶片枯黄脱落。',
        suggestions: buildSuggestions(['prune', 'ventilation', 'fungicide', 'temperature']),
        confidence,
      };
    }
    if (yellowTendency > 0.35 && brownSpotRatio > 0.08) {
      return {
        status: 'diseased',
        diseaseName: '炭疽病',
        symptoms: '叶片出现椭圆形褐色凹陷病斑，后期产生黑色小粒点，潮湿环境下可见粉红色黏液。',
        suggestions: buildSuggestions(['prune', 'fungicide', 'ventilation', 'water']),
        confidence,
      };
    }
    return {
      status: 'diseased',
      diseaseName: '白粉病',
      symptoms: '叶片表面出现白色粉状霉层，后期逐渐变灰白，叶片扭曲变形，影响正常光合作用。',
      suggestions: buildSuggestions(['prune', 'ventilation', 'sulfur', 'water']),
      confidence,
    };
  }

  if (yellowTendency > 0.45 && greenRatio < 0.3) {
    return {
      status: 'nutrient_deficiency',
      diseaseName: '缺铁性黄化',
      symptoms: '新叶叶脉间失绿黄化，叶脉保持绿色，严重时整片叶呈黄白色，叶缘出现焦枯现象。',
      suggestions: buildSuggestions(['iron', 'water', 'light']),
      confidence,
    };
  }

  return {
    status: 'nutrient_deficiency',
    diseaseName: '缺氮症',
    symptoms: '叶片整体呈淡绿色或黄绿色，老叶先黄化并逐渐向上扩展，植株生长缓慢，叶片变小变薄。',
    suggestions: buildSuggestions(['nitrogen', 'light', 'water']),
    confidence,
  };
}

function generateDiagnosis(imageUrl: string, thumbnail: string, features: ImageFeatures | null): DiagnosisRecord {
  const plantName = plantNames[Math.floor(Math.random() * plantNames.length)];

  let diagnosisResult;
  if (features) {
    diagnosisResult = diagnoseFromFeatures(features);
  } else {
    const fallback = ['healthy', 'diseased', 'nutrient_deficiency'][Math.floor(Math.random() * 3)] as DiagnosisStatus;
    diagnosisResult =
      fallback === 'healthy'
        ? {
            status: 'healthy' as const,
            diseaseName: '健康',
            symptoms: '叶片色泽鲜亮，形态舒展，无明显病斑或枯萎迹象，整体状态良好。',
            suggestions: buildSuggestions(['light', 'water', 'observe']),
            confidence: 88,
          }
        : fallback === 'diseased'
        ? {
            status: 'diseased' as const,
            diseaseName: '叶斑病',
            symptoms: '叶片表面出现褐色斑点，需及时处理防止蔓延。',
            suggestions: buildSuggestions(['prune', 'ventilation', 'fungicide']),
            confidence: 82,
          }
        : {
            status: 'nutrient_deficiency' as const,
            diseaseName: '缺氮症',
            symptoms: '叶片偏黄，生长迟缓，建议补充养分。',
            suggestions: buildSuggestions(['nitrogen', 'light', 'water']),
            confidence: 79,
          };
  }

  return {
    id: `record_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    imageUrl,
    thumbnailUrl: thumbnail,
    plantName,
    diseaseName: diagnosisResult.diseaseName,
    status: diagnosisResult.status,
    confidence: diagnosisResult.confidence,
    symptoms: diagnosisResult.symptoms,
    suggestions: diagnosisResult.suggestions,
    createdAt: new Date().toISOString(),
  };
}

export function extractImageFeatures(imageUrl: string): Promise<ImageFeatures> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      let rSum = 0, gSum = 0, bSum = 0;
      let brightnessSum = 0;
      let brightCount = 0;
      let yellowPixel = 0;
      let brownSpot = 0;
      let greenPixel = 0;
      const luminanceArr: number[] = [];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        rSum += r; gSum += g; bSum += b;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        brightnessSum += lum;
        luminanceArr.push(lum);
        brightCount++;
        if (r > 80 && r * 0.9 < g && g > r * 0.6 && g > b * 1.2) greenPixel++;
        if (r > 150 && g > 130 && b < 110 && Math.abs(r - g) < 50) yellowPixel++;
        if (r > 70 && r < 160 && g > 30 && g < 100 && b < 80 && r > g * 1.3) brownSpot++;
      }

      const total = brightCount;
      const avgLum = brightnessSum / total;
      let variance = 0;
      for (const l of luminanceArr) variance += (l - avgLum) ** 2;
      const contrast = Math.min(1, Math.sqrt(variance / total) / 80);

      resolve({
        avgRed: rSum / total / 255,
        avgGreen: gSum / total / 255,
        avgBlue: bSum / total / 255,
        brightness: avgLum / 255,
        contrast,
        greenRatio: greenPixel / total,
        yellowTendency: yellowPixel / total,
        brownSpotRatio: brownSpot / total,
      });
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = imageUrl;
  });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const records: DiagnosisRecord[] = JSON.parse(saved);
        dispatch({ type: 'LOAD_RECORDS', payload: records });
      } catch {
        console.error('Failed to load records');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
  }, [state.records]);

  const runDiagnosis = useCallback(
    (imageUrl: string, thumbnail: string, features: ImageFeatures) => {
      dispatch({ type: 'START_DIAGNOSIS' });
      dispatch({ type: 'SET_IMAGE_FEATURES', payload: features });
      const delay = 1200 + Math.random() * 1200;
      setTimeout(() => {
        const record = generateDiagnosis(imageUrl, thumbnail, features);
        dispatch({ type: 'SET_DIAGNOSIS_RESULT', payload: record });
        dispatch({ type: 'ADD_RECORD', payload: record });
      }, delay);
    },
    [],
  );

  const deleteRecordWithAnimation = useCallback((id: string) => {
    dispatch({ type: 'MARK_DELETING', payload: id });
    setTimeout(() => {
      dispatch({ type: 'DELETE_RECORD', payload: id });
    }, 350);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, runDiagnosis, deleteRecordWithAnimation }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
