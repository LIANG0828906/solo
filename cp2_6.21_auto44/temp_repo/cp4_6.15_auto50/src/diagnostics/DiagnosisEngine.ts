import type { SymptomRecord, SymptomType, MatchedCause, SeverityLevel } from '@/utils/db';

export interface DiseaseEntry {
  name: string;
  symptoms: SymptomType[];
  description: string;
  careMeasures: string[];
  severity: SeverityLevel;
  wateringSensitivity: number;
  fertilizingSensitivity: number;
  lightSensitivity: number;
}

const symptomEmojiMap: Record<SymptomType, string> = {
  '叶片发黄': '🍂',
  '枯萎': '🥀',
  '虫害': '🐛',
  '霉斑': '🦠',
  '生长缓慢': '🐌',
  '烂根': '�',
};

export function getSymptomEmoji(symptom: SymptomType): string {
  return symptomEmojiMap[symptom] || '❓';
}

export const diseaseDatabase: DiseaseEntry[] = [
  {
    name: '浇水过多',
    symptoms: ['叶片发黄', '烂根', '枯萎'],
    description: '土壤长期过湿导致根系缺氧腐烂，叶片发黄脱落。',
    careMeasures: ['减少浇水频率', '确保花盆有排水孔', '让土壤表面干燥后再浇水', '检查根部是否腐烂并修剪'],
    severity: 'moderate',
    wateringSensitivity: 0.9,
    fertilizingSensitivity: 0.1,
    lightSensitivity: 0.2,
  },
  {
    name: '光照不足',
    symptoms: ['叶片发黄', '生长缓慢'],
    description: '植物长期缺乏充足光照，导致光合作用不足，叶片变黄且生长缓慢。',
    careMeasures: ['移至光线更好的位置', '每天保证4-6小时光照', '考虑使用植物补光灯', '定期转动花盆使受光均匀'],
    severity: 'mild',
    wateringSensitivity: 0.2,
    fertilizingSensitivity: 0.1,
    lightSensitivity: 0.9,
  },
  {
    name: '蚜虫侵害',
    symptoms: ['虫害', '叶片发黄', '生长缓慢'],
    description: '蚜虫吸食植物汁液，导致叶片卷曲发黄，影响植物正常生长。',
    careMeasures: ['用肥皂水喷洒叶片', '引入瓢虫等天敌', '使用吡虫啉等低毒杀虫剂', '隔离受害植物防止扩散'],
    severity: 'moderate',
    wateringSensitivity: 0.1,
    fertilizingSensitivity: 0.2,
    lightSensitivity: 0.1,
  },
  {
    name: '真菌感染',
    symptoms: ['霉斑', '枯萎', '叶片发黄'],
    description: '真菌在潮湿环境下繁殖，导致叶片出现霉斑并逐渐枯萎。',
    careMeasures: ['改善通风条件', '避免叶片积水', '使用杀菌剂喷洒', '清除受感染的叶片'],
    severity: 'moderate',
    wateringSensitivity: 0.5,
    fertilizingSensitivity: 0.1,
    lightSensitivity: 0.3,
  },
  {
    name: '缺肥',
    symptoms: ['生长缓慢', '叶片发黄'],
    description: '土壤养分不足，导致植物缺乏必要营养元素，生长缓慢且叶片泛黄。',
    careMeasures: ['定期施加复合肥', '根据植物需求补充微量元素', '使用有机肥改善土壤', '避免一次性施肥过多'],
    severity: 'mild',
    wateringSensitivity: 0.1,
    fertilizingSensitivity: 0.9,
    lightSensitivity: 0.1,
  },
  {
    name: '根腐病',
    symptoms: ['烂根', '枯萎', '霉斑'],
    description: '由真菌引起的根部腐烂，严重影响植物吸收水分和养分的能力。',
    careMeasures: ['脱盆检查根系', '剪除腐烂根系', '更换新的培养土', '使用杀菌剂浸泡根部后重新栽种'],
    severity: 'severe',
    wateringSensitivity: 0.8,
    fertilizingSensitivity: 0.2,
    lightSensitivity: 0.2,
  },
  {
    name: '红蜘蛛侵害',
    symptoms: ['虫害', '叶片发黄', '枯萎'],
    description: '红蜘蛛在干燥环境下大量繁殖，吸食叶片汁液导致叶片发黄枯萎。',
    careMeasures: ['增加环境湿度', '用水冲洗叶片', '使用螨虫专用杀虫剂', '定期检查叶片背面'],
    severity: 'severe',
    wateringSensitivity: 0.3,
    fertilizingSensitivity: 0.1,
    lightSensitivity: 0.3,
  },
  {
    name: '浇水不足',
    symptoms: ['枯萎', '生长缓慢', '叶片发黄'],
    description: '长期缺水导致植物萎蔫，生长停滞，叶片边缘干枯发黄。',
    careMeasures: ['增加浇水频率', '确保浇透水', '使用保水性好的土壤', '在高温天气增加浇水量'],
    severity: 'moderate',
    wateringSensitivity: 0.8,
    fertilizingSensitivity: 0.1,
    lightSensitivity: 0.2,
  },
];

export function diagnose(record: SymptomRecord): MatchedCause[] {
  const causes: MatchedCause[] = diseaseDatabase
    .map((disease) => {
      const symptomOverlap = disease.symptoms.filter((s) => record.symptomTypes.includes(s)).length;
      const totalSymptoms = record.symptomTypes.length;
      const symptomScore = totalSymptoms > 0 ? symptomOverlap / totalSymptoms : 0;

      const wateringScore = Math.abs(record.wateringLevel / 100 - 0.5) * 2 * disease.wateringSensitivity;
      const fertilizingScore = (record.fertilizingLevel < 30 ? 0.8 : 0.2) * disease.fertilizingSensitivity;
      const lightScore = (record.lightLevel < 30 ? 0.8 : 0.2) * disease.lightSensitivity;

      const probability = Math.min(
        0.99,
        symptomScore * 0.6 + wateringScore * 0.15 + fertilizingScore * 0.15 + lightScore * 0.1
      );

      return {
        name: disease.name,
        probability: Math.round(probability * 100) / 100,
        description: disease.description,
        careMeasures: disease.careMeasures,
        severity: disease.severity,
      };
    })
    .filter((c) => c.probability > 0.2)
    .sort((a, b) => b.probability - a.probability);

  return causes;
}
