// ============================================================
// 风格描述生成工具
// 数据流向：Cloth 数组 → 风格描述文本
// 调用关系：src/pages/Home.tsx、src/components/OutfitCard.tsx 等组件调用
// ============================================================

import type { Cloth, ClothStyle } from '@/types';

/**
 * 风格修饰词映射表
 * 每种风格对应的气质修饰词
 */
const styleAdjectives: Record<ClothStyle, string[]> = {
  '通勤': ['简约', '干练', '知性', '优雅', '利落'],
  '休闲': ['随性', '舒适', '慵懒', '轻松', '自在'],
  '约会': ['甜美', '温柔', '浪漫', '灵动', '娇羞'],
  '运动': ['活力', '动感', '清爽', '阳光', '元气'],
  '正式': ['端庄', '大气', '精致', '稳重', '典雅'],
  '复古': ['怀旧', '经典', '文艺', '古韵', '怀旧'],
  '街头': ['潮流', '个性', '酷炫', '前卫', '潮酷'],
};

/**
 * 色系描述映射表
 * 根据风格匹配对应的色系描述
 */
const styleColors: Record<ClothStyle, string[]> = {
  '通勤': ['蓝调', '灰调', '裸粉', '米白', '驼色'],
  '休闲': ['暖棕', '牛仔', '军绿', '米白', '浅灰'],
  '约会': ['樱花', '蜜桃', '奶油', '薰衣草', '玫瑰'],
  '运动': ['亮橙', '荧光', '深蓝', '纯白', '活力红'],
  '正式': ['藏青', '炭灰', '酒红', '墨黑', '深棕'],
  '复古': ['焦糖', '砖红', '墨绿', '米黄', '铁锈'],
  '街头': ['荧光', '撞色', '金属', '霓虹', '涂鸦'],
};

/**
 * 结尾词库
 */
const suffixWords = ['风', '系', '感', '范儿', '调调'];

/**
 * 从数组中随机选取一个元素
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 根据衣物数组生成风格描述文本
 * 
 * 算法流程：
 * 1. 收集所有衣物的风格标签并去重
 * 2. 根据风格数量选择不同的组合策略
 * 3. 从对应的修饰词和色系中随机选取组合
 * 4. 拼接成自然的风格描述
 * 
 * @param clothes 衣物数组
 * @returns 风格描述字符串，例如 "简约通勤蓝调风"、"复古休闲暖棕系"
 */
export function generateStyleDescription(clothes: Cloth[]): string {
  if (clothes.length === 0) {
    return '暂无风格标签';
  }

  // 收集所有风格标签并去重
  const allStyles: ClothStyle[] = [];
  clothes.forEach(cloth => {
    cloth.styles.forEach(style => {
      if (!allStyles.includes(style)) {
        allStyles.push(style);
      }
    });
  });

  if (allStyles.length === 0) {
    return '基础百搭款';
  }

  // 根据风格数量选择不同策略
  if (allStyles.length === 1) {
    // 单一风格：修饰词 + 风格 + 色系 + 结尾
    const style = allStyles[0];
    const adj = pickRandom(styleAdjectives[style]);
    const color = pickRandom(styleColors[style]);
    const suffix = pickRandom(suffixWords);
    return `${adj}${style}${color}${suffix}`;
  }

  if (allStyles.length === 2) {
    // 两种风格组合：第一种风格的修饰词 + 两种风格 + 第二种风格的色系 + 结尾
    const style1 = allStyles[0];
    const style2 = allStyles[1];
    const adj = pickRandom(styleAdjectives[style1]);
    const color = pickRandom(styleColors[style2]);
    const suffix = pickRandom(suffixWords);
    return `${adj}${style1}${style2}${color}${suffix}`;
  }

  // 三种及以上风格：取前两种主要风格 + 混合感描述
  const mainStyles = allStyles.slice(0, 2);
  const adj = pickRandom(styleAdjectives[mainStyles[0]]);
  const color = pickRandom(styleColors[mainStyles[1]]);
  return `${adj}${mainStyles.join('')}${color}混搭风`;
}

/**
 * 根据季节数组生成季节描述
 * 
 * @param seasons 季节数组
 * @returns 季节描述字符串
 */
export function generateSeasonDescription(seasons: string[]): string {
  if (seasons.length === 0) {
    return '四季皆宜';
  }

  if (seasons.includes('四季')) {
    return '四季皆宜';
  }

  if (seasons.length === 1) {
    return `${seasons[0]}季单品`;
  }

  if (seasons.length === 2) {
    return `${seasons.join('')}两季皆宜`;
  }

  return `${seasons.slice(0, 3).join('')}三季款`;
}
