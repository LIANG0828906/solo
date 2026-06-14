import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppAction, DiagnosisRecord } from './types';

const STORAGE_KEY = 'plant_clinic_records';

const initialState: AppState = {
  records: [],
  currentRecord: null,
  isDiagnosing: false,
  currentImage: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_IMAGE':
      return { ...state, currentImage: action.payload, currentRecord: null };
    case 'START_DIAGNOSIS':
      return { ...state, isDiagnosing: true };
    case 'SET_DIAGNOSIS_RESULT':
      return { ...state, isDiagnosing: false, currentRecord: action.payload };
    case 'CLEAR_CURRENT':
      return { ...state, currentImage: null, currentRecord: null, isDiagnosing: false };
    case 'ADD_RECORD':
      return { ...state, records: [action.payload, ...state.records] };
    case 'DELETE_RECORD':
      return {
        ...state,
        records: state.records.filter((r) => r.id !== action.payload),
      };
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
  runDiagnosis: (imageUrl: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const plantNames = ['绿萝', '吊兰', '多肉', '发财树', '君子兰', '龟背竹', '橡皮树', '仙人掌'];

const diagnosisResults = [
  {
    status: 'healthy' as const,
    diseaseName: '健康',
    symptoms: '叶片色泽鲜亮，形态舒展，无明显病斑或枯萎迹象，整体状态良好。',
    suggestions: [
      { id: '1', title: '保持光照', description: '继续保持当前明亮的散射光照环境', icon: 'sun' as const },
      { id: '2', title: '规律浇水', description: '维持现有浇水频率，保持土壤微湿', icon: 'droplets' as const },
      { id: '3', title: '定期观察', description: '每周检查叶片状态，及时发现异常', icon: 'leaf' as const },
    ],
  },
  {
    status: 'diseased' as const,
    diseaseName: '叶斑病',
    symptoms: '叶片表面出现圆形或不规则褐色斑点，边缘深褐色，中央灰白色，严重时病斑连片导致叶片枯黄脱落。',
    suggestions: [
      { id: '1', title: '剪除病叶', description: '立即剪去病叶并集中销毁，防止病菌扩散', icon: 'leaf' as const },
      { id: '2', title: '通风降湿', description: '加强通风，减少叶面喷水，降低环境湿度', icon: 'wind' as const },
      { id: '3', title: '药剂防治', description: '喷施多菌灵或代森锰锌800-1000倍液', icon: 'fertilizer' as const },
      { id: '4', title: '隔离养护', description: '与其他健康植物隔离，避免交叉感染', icon: 'temperature' as const },
    ],
  },
  {
    status: 'diseased' as const,
    diseaseName: '白粉病',
    symptoms: '叶片表面出现白色粉状霉层，后期逐渐变为灰白色，叶片扭曲变形，影响光合作用。',
    suggestions: [
      { id: '1', title: '改善通风', description: '增加空气流通，减少植株密度', icon: 'wind' as const },
      { id: '2', title: '控制浇水', description: '避免叶面积水，改从根部浇水', icon: 'droplets' as const },
      { id: '3', title: '硫磺粉防治', description: '使用硫磺粉或三唑酮类药剂喷施', icon: 'fertilizer' as const },
    ],
  },
  {
    status: 'nutrient_deficiency' as const,
    diseaseName: '缺氮症',
    symptoms: '叶片整体呈淡绿色或黄绿色，老叶先黄化并逐渐向上扩展，植株生长缓慢，叶片变小变薄。',
    suggestions: [
      { id: '1', title: '追施氮肥', description: '施用尿素或复合肥，按说明稀释后浇施', icon: 'fertilizer' as const },
      { id: '2', title: '叶面追肥', description: '喷施0.2%尿素溶液，快速补充养分', icon: 'droplets' as const },
      { id: '3', title: '检查土壤', description: '确认土壤pH值适宜，避免养分固化', icon: 'leaf' as const },
    ],
  },
  {
    status: 'nutrient_deficiency' as const,
    diseaseName: '缺铁性黄化',
    symptoms: '新叶叶脉间失绿黄化，叶脉仍保持绿色，严重时整片叶黄白色，叶缘焦枯。',
    suggestions: [
      { id: '1', title: '补充铁肥', description: '施用硫酸亚铁或螯合铁溶液灌根', icon: 'fertilizer' as const },
      { id: '2', title: '调节土壤酸碱度', description: '喜酸植物可定期浇施矾肥水', icon: 'droplets' as const },
      { id: '3', title: '避免钙过量', description: '减少含钙水的浇灌，使用雨水或放置后的自来水', icon: 'sun' as const },
    ],
  },
  {
    status: 'diseased' as const,
    diseaseName: '炭疽病',
    symptoms: '叶片出现圆形或椭圆形褐色凹陷病斑，后期病斑上产生黑色小粒点，潮湿时溢出粉红色黏液。',
    suggestions: [
      { id: '1', title: '清除病残', description: '彻底清除病叶和落叶，减少传染源', icon: 'leaf' as const },
      { id: '2', title: '药剂防治', description: '喷施咪鲜胺或苯醚甲环唑1500倍液', icon: 'fertilizer' as const },
      { id: '3', title: '减少损伤', description: '避免叶片机械损伤，减少病菌侵入途径', icon: 'temperature' as const },
    ],
  },
];

function generateDiagnosis(imageUrl: string): DiagnosisRecord {
  const result = diagnosisResults[Math.floor(Math.random() * diagnosisResults.length)];
  const plantName = plantNames[Math.floor(Math.random() * plantNames.length)];
  const baseConfidence = result.status === 'healthy' ? 92 : 78;
  const confidence = Math.min(99, baseConfidence + Math.floor(Math.random() * 15));

  return {
    id: `record_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    imageUrl,
    plantName,
    diseaseName: result.diseaseName,
    status: result.status,
    confidence,
    symptoms: result.symptoms,
    suggestions: result.suggestions.map((s) => ({ ...s, id: `${Date.now()}_${s.id}` })),
    createdAt: new Date().toISOString(),
  };
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

  const runDiagnosis = (imageUrl: string) => {
    dispatch({ type: 'START_DIAGNOSIS' });
    setTimeout(() => {
      const record = generateDiagnosis(imageUrl);
      dispatch({ type: 'SET_DIAGNOSIS_RESULT', payload: record });
      dispatch({ type: 'ADD_RECORD', payload: record });
    }, 1500 + Math.random() * 1000);
  };

  return (
    <AppContext.Provider value={{ state, dispatch, runDiagnosis }}>
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
