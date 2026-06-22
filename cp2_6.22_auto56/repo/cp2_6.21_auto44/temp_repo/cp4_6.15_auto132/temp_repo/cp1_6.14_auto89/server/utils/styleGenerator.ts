// ============================================================
// 风格标签生成工具
// 数据流向：Cloth 数组 → Outfit 的 styleTags
// 调用关系：server/routes/outfits.ts 创建搭配时调用
// ============================================================

import type { Cloth, ClothStyle } from '../../src/types/index.js';

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
 * 根据衣物数组生成风格标签数组
 * 
 * 算法流程：
 * 1. 收集所有衣物的风格标签并去重
 * 2. 根据风格生成多个风格描述标签
 * 3. 返回风格标签数组
 * 
 * @param clothes 衣物数组
 * @returns 风格标签字符串数组
 */
export function generateStyleTags(clothes: Cloth[]): string[] {
  if (clothes.length === 0) {
    return ['基础百搭'];
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
    return ['基础百搭'];
  }

  const tags: string[] = [];

  // 生成主风格标签
  allStyles.forEach(style => {
    const adj = pickRandom(styleAdjectives[style]);
    tags.push(`${adj}${style}`);
  });

  // 生成组合风格描述
  if (allStyles.length >= 2) {
    const style1 = allStyles[0];
    const style2 = allStyles[1];
    const adj = pickRandom(styleAdjectives[style1]);
    const color = pickRandom(styleColors[style2]);
    const suffix = pickRandom(suffixWords);
    tags.push(`${adj}${style1}${style2}${color}${suffix}`);
  } else if (allStyles.length === 1) {
    const style = allStyles[0];
    const adj = pickRandom(styleAdjectives[style]);
    const color = pickRandom(styleColors[style]);
    const suffix = pickRandom(suffixWords);
    tags.push(`${adj}${style}${color}${suffix}`);
  }

  return tags;
}

export default generateStyleTags;
