import { Material, Rarity } from '../../types';

/**
 * 材料注册表类
 * 管理所有炼金材料，提供材料查询和随机获取功能
 * 稀有度概率分布：普通60%、稀有25%、史诗12%、传说3%
 */
export class MaterialRegistry {
  private static readonly materials: ReadonlyMap<string, Material> = MaterialRegistry.initMaterials();

  /**
   * 稀有度权重配置
   */
  private static readonly rarityWeights: ReadonlyMap<Rarity, number> = new Map([
    [Rarity.COMMON, 60],
    [Rarity.RARE, 25],
    [Rarity.EPIC, 12],
    [Rarity.LEGENDARY, 3]
  ]);

  /**
   * 初始化所有材料数据
   * @returns 材料映射表
   */
  private static initMaterials(): ReadonlyMap<string, Material> {
    const materialList: readonly Material[] = [
      // ========== 普通材料 (20种) ==========
      { id: 'water', name: '纯净水', rarity: Rarity.COMMON, type: 'element', color: '#4FC3F7', description: '最基础的元素，炼金术中必不可少的溶剂。' },
      { id: 'earth', name: '泥土', rarity: Rarity.COMMON, type: 'element', color: '#8D6E63', description: '大地的馈赠，万物生长的根基。' },
      { id: 'fire_ash', name: '火灰', rarity: Rarity.COMMON, type: 'element', color: '#FF7043', description: '火焰燃尽后残留的余温。' },
      { id: 'wind_dust', name: '风之尘', rarity: Rarity.COMMON, type: 'element', color: '#B0BEC5', description: '风中飘荡的细微粉末。' },
      { id: 'copper_ore', name: '铜矿石', rarity: Rarity.COMMON, type: 'mineral', color: '#FF8A65', description: '常见的金属矿石，延展性良好。' },
      { id: 'iron_ore', name: '铁矿石', rarity: Rarity.COMMON, type: 'mineral', color: '#78909C', description: '坚硬的金属矿石，用途广泛。' },
      { id: 'herb_leaf', name: '草药叶', rarity: Rarity.COMMON, type: 'biological', color: '#81C784', description: '路边随处可见的药草。' },
      { id: 'mushroom', name: '蘑菇', rarity: Rarity.COMMON, type: 'biological', color: '#A1887F', description: '阴暗潮湿处生长的菌类。' },
      { id: 'bone_dust', name: '骨粉', rarity: Rarity.COMMON, type: 'biological', color: '#ECEFF1', description: '研磨成粉的动物骨骼。' },
      { id: 'salt', name: '盐晶石', rarity: Rarity.COMMON, type: 'mineral', color: '#FFFFFF', description: '白色结晶，能保存物质不腐。' },
      { id: 'charcoal', name: '木炭', rarity: Rarity.COMMON, type: 'element', color: '#424242', description: '木材不完全燃烧的产物。' },
      { id: 'vine', name: '藤蔓', rarity: Rarity.COMMON, type: 'biological', color: '#689F38', description: '柔韧的植物茎条。' },
      { id: 'sand', name: '细沙', rarity: Rarity.COMMON, type: 'mineral', color: '#FFE082', description: '细碎的石英颗粒。' },
      { id: 'cloth', name: '粗麻布', rarity: Rarity.COMMON, type: 'biological', color: '#BCAAA4', description: '普通的植物纤维织物。' },
      { id: 'stone', name: '碎石', rarity: Rarity.COMMON, type: 'mineral', color: '#90A4AE', description: '随处可见的普通石块。' },
      { id: 'wood', name: '木材', rarity: Rarity.COMMON, type: 'biological', color: '#6D4C41', description: '经过简单加工的木料。' },
      { id: 'seed', name: '普通种子', rarity: Rarity.COMMON, type: 'biological', color: '#AED581', description: '蕴含生命潜力的种子。' },
      { id: 'feather', name: '羽毛', rarity: Rarity.COMMON, type: 'biological', color: '#E1F5FE', description: '鸟类轻盈的羽毛。' },
      { id: 'shell', name: '贝壳', rarity: Rarity.COMMON, type: 'mineral', color: '#FFCCBC', description: '来自水边的软体动物外壳。' },
      { id: 'spider_silk', name: '蛛丝', rarity: Rarity.COMMON, type: 'biological', color: '#CFD8DC', description: '蜘蛛分泌的坚韧丝线。' },

      // ========== 稀有材料 (12种) ==========
      { id: 'quicksilver', name: '水银', rarity: Rarity.RARE, type: 'mineral', color: '#B0BEC5', description: '流动的液态金属，散发着微光。' },
      { id: 'sulphur', name: '硫黄晶', rarity: Rarity.RARE, type: 'mineral', color: '#FFEB3B', description: '火焰的精华，炼金三要素之一。' },
      { id: 'crystal', name: '水晶', rarity: Rarity.RARE, type: 'mineral', color: '#B3E5FC', description: '透明的能量导体。' },
      { id: 'moonstone', name: '月光石', rarity: Rarity.RARE, type: 'mineral', color: '#9FA8DA', description: '吸收月光能量的神秘宝石。' },
      { id: 'fox_fur', name: '狐毛', rarity: Rarity.RARE, type: 'biological', color: '#FF7043', description: '灵巧狐狸的毛发，蕴含自然魔力。' },
      { id: 'snake_venom', name: '蛇毒', rarity: Rarity.RARE, type: 'biological', color: '#9CCC65', description: '剧毒液体，能腐化也能转化。' },
      { id: 'mana_pollen', name: '魔力花粉', rarity: Rarity.RARE, type: 'biological', color: '#CE93D8', description: '魔法花朵散发的粉末。' },
      { id: 'gears', name: '精密齿轮', rarity: Rarity.RARE, type: 'mechanical', color: '#B0BEC5', description: '手工打造的机械零件。' },
      { id: 'coil_spring', name: '发条弹簧', rarity: Rarity.RARE, type: 'mechanical', color: '#90A4AE', description: '储存动能的弹性装置。' },
      { id: 'glow_moss', name: '发光苔藓', rarity: Rarity.RARE, type: 'biological', color: '#69F0AE', description: '在黑暗中发出幽绿光芒。' },
      { id: 'obsidian', name: '黑曜石', rarity: Rarity.RARE, type: 'mineral', color: '#212121', description: '火山熔岩快速冷却形成的锋利玻璃。' },
      { id: 'amber', name: '琥珀', rarity: Rarity.RARE, type: 'mineral', color: '#FFB300', description: '远古树脂的化石，封存着时间。' },

      // ========== 史诗材料 (6种) ==========
      { id: 'dragon_scale', name: '龙鳞', rarity: Rarity.EPIC, type: 'biological', color: '#E91E63', description: '传说中巨龙身上坚硬的鳞片。' },
      { id: 'philosopher_stone_dust', name: '贤者之尘', rarity: Rarity.EPIC, type: 'mystical', color: '#FFD54F', description: '贤者之石研磨的粉末，蕴含转化之力。' },
      { id: 'void_crystal', name: '虚空水晶', rarity: Rarity.EPIC, type: 'energy', color: '#5E35B1', description: '来自空间裂缝的紫黑色晶体。' },
      { id: 'phoenix_feather', name: '凤凰羽', rarity: Rarity.EPIC, type: 'biological', color: '#FF5722', description: '不死之鸟的羽毛，永远燃烧。' },
      { id: 'steam_core', name: '蒸汽核心', rarity: Rarity.EPIC, type: 'mechanical', color: '#546E7A', description: '精密机械的心脏部件。' },
      { id: 'demon_essence', name: '恶魔精华', rarity: Rarity.EPIC, type: 'energy', color: '#7B1FA2', description: '深渊生物的浓缩能量。' },

      // ========== 传说材料 (4种) ==========
      { id: 'aether', name: '以太', rarity: Rarity.LEGENDARY, type: 'energy', color: '#E8EAF6', description: '构成天界的第五元素，万物之源。' },
      { id: 'world_tree_heart', name: '世界树之心', rarity: Rarity.LEGENDARY, type: 'biological', color: '#1B5E20', description: '世界之树的核心结晶，孕育无限生命。' },
      { id: 'soul_stone', name: '灵魂石', rarity: Rarity.LEGENDARY, type: 'mystical', color: '#311B92', description: '封印纯净灵魂的永恒宝石。' },
      { id: 'sun_fragment', name: '太阳碎片', rarity: Rarity.LEGENDARY, type: 'element', color: '#FF6F00', description: '坠落人间的恒星残片，永不熄灭。' }
    ];

    const map = new Map<string, Material>();
    for (const mat of materialList) {
      map.set(mat.id, mat);
    }
    return map;
  }

  /**
   * 根据材料ID获取材料
   * @param id - 材料唯一标识
   * @returns 对应材料，未找到返回null
   */
  public static getMaterialById(id: string): Material | null {
    return this.materials.get(id) ?? null;
  }

  /**
   * 获取所有材料
   * @returns 所有材料的只读数组
   */
  public static getAllMaterials(): readonly Material[] {
    return Array.from(this.materials.values());
  }

  /**
   * 根据稀有度获取材料列表
   * @param rarity - 目标稀有度
   * @returns 对应稀有度的材料数组
   */
  public static getMaterialsByRarity(rarity: Rarity): readonly Material[] {
    return this.getAllMaterials().filter(m => m.rarity === rarity);
  }

  /**
   * 随机选择一个稀有度（按配置概率）
   * @returns 选中的稀有度
   */
  private static rollRarity(): Rarity {
    const totalWeight = Array.from(this.rarityWeights.values()).reduce((sum, w) => sum + w, 0);
    let roll = Math.random() * totalWeight;

    for (const [rarity, weight] of this.rarityWeights) {
      roll -= weight;
      if (roll <= 0) {
        return rarity;
      }
    }

    return Rarity.COMMON;
  }

  /**
   * 按稀有度概率随机获取一个材料
   * 概率分布：普通60%、稀有25%、史诗12%、传说3%
   * @returns 随机材料
   */
  public static getRandomMaterial(): Material {
    const rarity = this.rollRarity();
    const materialsOfRarity = this.getMaterialsByRarity(rarity);

    if (materialsOfRarity.length === 0) {
      const fallback = this.getAllMaterials();
      return fallback[Math.floor(Math.random() * fallback.length)];
    }

    return materialsOfRarity[Math.floor(Math.random() * materialsOfRarity.length)];
  }

  /**
   * 获取稀有度对应的中文名称
   * @param rarity - 稀有度枚举值
   * @returns 中文稀有度名称
   */
  public static getRarityName(rarity: Rarity): string {
    const names: ReadonlyMap<Rarity, string> = new Map([
      [Rarity.COMMON, '普通'],
      [Rarity.RARE, '稀有'],
      [Rarity.EPIC, '史诗'],
      [Rarity.LEGENDARY, '传说']
    ]);
    return names.get(rarity) ?? '未知';
  }
}
