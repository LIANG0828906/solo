import {
  DailySummary,
  FoodRecord,
  MacroRatio,
  RadarDataItem,
  RecommendedIntake,
  AnalysisResponse,
  DiagnosisAdvice,
  FoodItem,
} from '@/types';

export const RECOMMENDED_INTAKE: RecommendedIntake = {
  calories: 2000,
  protein: 55,
  fat: 65,
  carbs: 275,
  fiber: 28,
  sodium: 2000,
};

const NUTRIENT_LABELS: Record<string, string> = {
  calories: '热量',
  protein: '蛋白质',
  fat: '脂肪',
  carbs: '碳水化合物',
  fiber: '膳食纤维',
  sodium: '钠',
};

export function calculateMacroRatio(summary: DailySummary): MacroRatio {
  const proteinCal = summary.totalProtein * 4;
  const fatCal = summary.totalFat * 9;
  const carbsCal = summary.totalCarbs * 4;
  const totalMacroCal = proteinCal + fatCal + carbsCal;

  if (totalMacroCal === 0) {
    return { protein: 0, fat: 0, carbs: 0 };
  }

  return {
    protein: Math.round((proteinCal / totalMacroCal) * 100),
    fat: Math.round((fatCal / totalMacroCal) * 100),
    carbs: Math.round((carbsCal / totalMacroCal) * 100),
  };
}

export function generateRadarData(summary: DailySummary): RadarDataItem[] {
  const nutrients = [
    { key: 'calories', current: summary.totalCalories, recommended: RECOMMENDED_INTAKE.calories },
    { key: 'protein', current: summary.totalProtein, recommended: RECOMMENDED_INTAKE.protein },
    { key: 'fat', current: summary.totalFat, recommended: RECOMMENDED_INTAKE.fat },
    { key: 'carbs', current: summary.totalCarbs, recommended: RECOMMENDED_INTAKE.carbs },
    { key: 'fiber', current: summary.totalFiber, recommended: RECOMMENDED_INTAKE.fiber },
    { key: 'sodium', current: summary.totalSodium, recommended: RECOMMENDED_INTAKE.sodium },
  ];

  return nutrients.map((n) => ({
    label: NUTRIENT_LABELS[n.key] || n.key,
    current: parseFloat(n.current.toFixed(1)),
    recommended: n.recommended,
    percentage: Math.round((n.current / n.recommended) * 100),
  }));
}

export function isNutrientDeficient(percentage: number): boolean {
  return percentage < 80;
}

export function isNutrientExcess(percentage: number): boolean {
  return percentage > 120;
}

export function getNutrientStatus(percentage: number): 'deficient' | 'normal' | 'excess' {
  if (percentage < 80) return 'deficient';
  if (percentage > 120) return 'excess';
  return 'normal';
}

export function calculateDailySummary(records: FoodRecord[], date: string): DailySummary {
  const summary: DailySummary = {
    date,
    totalCalories: 0,
    totalProtein: 0,
    totalFat: 0,
    totalCarbs: 0,
    totalFiber: 0,
    totalSodium: 0,
    records,
  };

  records.forEach((record) => {
    summary.totalCalories += record.calories;
    summary.totalProtein += record.protein;
    summary.totalFat += record.fat;
    summary.totalCarbs += record.carbs;
    summary.totalFiber += record.fiber;
    summary.totalSodium += record.sodium;
  });

  summary.totalCalories = parseFloat(summary.totalCalories.toFixed(1));
  summary.totalProtein = parseFloat(summary.totalProtein.toFixed(1));
  summary.totalFat = parseFloat(summary.totalFat.toFixed(1));
  summary.totalCarbs = parseFloat(summary.totalCarbs.toFixed(1));
  summary.totalFiber = parseFloat(summary.totalFiber.toFixed(1));
  summary.totalSodium = parseFloat(summary.totalSodium.toFixed(1));

  return summary;
}

export function generateDiagnosis(
  historyData: DailySummary[],
  foodList: FoodItem[]
): AnalysisResponse {
  const days = historyData.length || 1;
  const avgCalories =
    historyData.reduce((sum, d) => sum + d.totalCalories, 0) / days;
  const avgProtein =
    historyData.reduce((sum, d) => sum + d.totalProtein, 0) / days;
  const avgFat = historyData.reduce((sum, d) => sum + d.totalFat, 0) / days;
  const avgCarbs =
    historyData.reduce((sum, d) => sum + d.totalCarbs, 0) / days;
  const avgFiber =
    historyData.reduce((sum, d) => sum + d.totalFiber, 0) / days;
  const avgSodium =
    historyData.reduce((sum, d) => sum + d.totalSodium, 0) / days;

  const avgSummary: DailySummary = {
    date: 'average',
    totalCalories: avgCalories,
    totalProtein: avgProtein,
    totalFat: avgFat,
    totalCarbs: avgCarbs,
    totalFiber: avgFiber,
    totalSodium: avgSodium,
    records: [],
  };

  const macroRatio = calculateMacroRatio(avgSummary);

  const advices: DiagnosisAdvice[] = [];

  if (avgCalories > RECOMMENDED_INTAKE.calories * 1.15) {
    const alternatives = getAlternativesByCategory(foodList, ['vegetable', 'fruit']);
    advices.push({
      id: 'calories-excess',
      title: '热量摄入超标',
      description: `近${days}天平均热量摄入约${avgCalories.toFixed(0)}千卡，超出推荐量${(
        ((avgCalories - RECOMMENDED_INTAKE.calories) / RECOMMENDED_INTAKE.calories) *
        100
      ).toFixed(0)}%。建议适当减少高热量食物，增加蔬菜和水果的摄入比例。`,
      severity: 'high',
      category: 'calories',
      alternatives,
    });
  } else if (avgCalories < RECOMMENDED_INTAKE.calories * 0.8) {
    const alternatives = getAlternativesByCategory(foodList, ['grain', 'meat']);
    advices.push({
      id: 'calories-deficient',
      title: '热量摄入不足',
      description: `近${days}天平均热量摄入约${avgCalories.toFixed(0)}千卡，低于推荐量${(
        ((RECOMMENDED_INTAKE.calories - avgCalories) / RECOMMENDED_INTAKE.calories) *
        100
      ).toFixed(0)}%。建议适当增加主食和优质蛋白的摄入。`,
      severity: 'medium',
      category: 'calories',
      alternatives,
    });
  }

  if (avgProtein < RECOMMENDED_INTAKE.protein * 0.8) {
    const alternatives = getAlternativesByCategory(foodList, ['meat', 'egg', 'bean']);
    advices.push({
      id: 'protein-deficient',
      title: '蛋白质摄入不足',
      description: `近${days}天平均蛋白质摄入约${avgProtein.toFixed(1)}克，仅为推荐量的${(
        (avgProtein / RECOMMENDED_INTAKE.protein) *
        100
      ).toFixed(0)}%。蛋白质是身体修复和免疫的基础，建议增加优质蛋白食物。`,
      severity: 'high',
      category: 'protein',
      alternatives,
    });
  }

  if (avgFat > RECOMMENDED_INTAKE.fat * 1.2) {
    const alternatives = getAlternativesByCategory(foodList, ['vegetable', 'grain']);
    advices.push({
      id: 'fat-excess',
      title: '脂肪摄入超标',
      description: `近${days}天平均脂肪摄入约${avgFat.toFixed(1)}克，超出推荐量${(
        ((avgFat - RECOMMENDED_INTAKE.fat) / RECOMMENDED_INTAKE.fat) *
        100
      ).toFixed(0)}%。建议减少油炸食品和肥肉，选择更健康的烹饪方式。`,
      severity: 'high',
      category: 'fat',
      alternatives,
    });
  }

  if (avgFiber < RECOMMENDED_INTAKE.fiber * 0.8) {
    const alternatives = getAlternativesByCategory(foodList, ['vegetable', 'fruit', 'grain']);
    advices.push({
      id: 'fiber-deficient',
      title: '膳食纤维缺乏',
      description: `近${days}天平均膳食纤维摄入约${avgFiber.toFixed(1)}克，仅为推荐量的${(
        (avgFiber / RECOMMENDED_INTAKE.fiber) *
        100
      ).toFixed(0)}%。膳食纤维有助于肠道健康和饱腹感，建议多吃全谷物、蔬菜和水果。`,
      severity: 'medium',
      category: 'fiber',
      alternatives,
    });
  }

  if (avgSodium > RECOMMENDED_INTAKE.sodium * 1.2) {
    const alternatives = getAlternativesByCategory(foodList, ['vegetable', 'fruit']);
    advices.push({
      id: 'sodium-excess',
      title: '钠摄入超标',
      description: `近${days}天平均钠摄入约${avgSodium.toFixed(0)}毫克，超出推荐量${(
        ((avgSodium - RECOMMENDED_INTAKE.sodium) / RECOMMENDED_INTAKE.sodium) *
        100
      ).toFixed(0)}%。高钠饮食会增加高血压风险，建议减少盐和加工食品的摄入。`,
      severity: 'high',
      category: 'sodium',
      alternatives,
    });
  }

  if (avgCarbs > RECOMMENDED_INTAKE.carbs * 1.2) {
    const alternatives = getAlternativesByCategory(foodList, ['vegetable', 'meat']);
    advices.push({
      id: 'carbs-excess',
      title: '碳水化合物摄入偏高',
      description: `近${days}天平均碳水化合物摄入约${avgCarbs.toFixed(1)}克，占比偏高。建议适当减少精制碳水，选择低GI食物。`,
      severity: 'low',
      category: 'carbs',
      alternatives,
    });
  }

  if (advices.length === 0) {
    const alternatives = getAlternativesByCategory(foodList, ['fruit', 'nut']);
    advices.push({
      id: 'keep-going',
      title: '膳食结构良好',
      description: `近${days}天营养摄入整体均衡，继续保持！建议多样化饮食，确保微量元素的摄入。`,
      severity: 'low',
      category: 'calories',
      alternatives,
    });
  }

  return {
    period: `${days}天`,
    avgCalories: parseFloat(avgCalories.toFixed(0)),
    advices: advices.slice(0, 5),
    macroRatio,
  };
}

function getAlternativesByCategory(
  foodList: FoodItem[],
  categories: string[]
): FoodItem[] {
  const filtered = foodList.filter((f) => categories.includes(f.category));
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

export function generateWeeklyReportText(
  weekData: DailySummary[]
): string {
  const totalDays = weekData.length;
  const avgCalories =
    weekData.reduce((s, d) => s + d.totalCalories, 0) / totalDays;
  const avgProtein =
    weekData.reduce((s, d) => s + d.totalProtein, 0) / totalDays;
  const avgFat = weekData.reduce((s, d) => s + d.totalFat, 0) / totalDays;
  const avgCarbs =
    weekData.reduce((s, d) => s + d.totalCarbs, 0) / totalDays;

  const lines = [
    '周度营养报告',
    '='.repeat(30),
    '',
    `统计周期：${weekData[0]?.date || '-'} 至 ${weekData[weekData.length - 1]?.date || '-'}`,
    `统计天数：${totalDays}天`,
    '',
    '平均每日摄入：',
    `  热量：${avgCalories.toFixed(0)} 千卡`,
    `  蛋白质：${avgProtein.toFixed(1)} 克`,
    `  脂肪：${avgFat.toFixed(1)} 克`,
    `  碳水化合物：${avgCarbs.toFixed(1)} 克`,
    '',
    '推荐摄入量参考：',
    `  热量：${RECOMMENDED_INTAKE.calories} 千卡`,
    `  蛋白质：${RECOMMENDED_INTAKE.protein} 克`,
    `  脂肪：${RECOMMENDED_INTAKE.fat} 克`,
    `  碳水化合物：${RECOMMENDED_INTAKE.carbs} 克`,
    '',
    '---',
    '保持均衡饮食，祝您健康！',
  ];

  return lines.join('\n');
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayStr(): string {
  return formatDate(new Date());
}

export function getDateRange(days: number): string[] {
  const result: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push(formatDate(d));
  }
  return result;
}
