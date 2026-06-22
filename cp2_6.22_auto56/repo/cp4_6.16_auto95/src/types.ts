export type PlantType =
  | '多肉'
  | '绿萝'
  | '吊兰'
  | '发财树'
  | '芦荟'
  | '薄荷'
  | '仙人掌'
  | '龟背竹'
  | '蕨类'
  | '虎皮兰'
  | '常春藤'
  | '白掌'
  | '红掌'
  | '富贵竹'
  | '橡皮树'
  | '鸭脚木'
  | '金钱树'
  | '孔雀木'
  | '散尾葵'
  | '琴叶榕';

export type LightPreference = '直射光' | '散射光' | '阴凉';

export type PlantStatus = '健康' | '缺水' | '缺肥';

export interface Plant {
  id: string;
  name: string;
  plantType: PlantType;
  photo?: string;
  lightPreference: LightPreference;
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  lastWateredDate: string;
  lastFertilizedDate: string;
  createdAt: string;
  status: PlantStatus;
}

export interface CareRecord {
  id: string;
  plantId: string;
  type: '浇水' | '施肥' | '换盆';
  date: string;
  note?: string;
}

export interface GrowthRecord {
  id: string;
  plantId: string;
  date: string;
  height?: number;
  leafCount?: number;
}
