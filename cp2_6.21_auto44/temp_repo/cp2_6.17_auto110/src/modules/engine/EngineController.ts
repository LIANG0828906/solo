import { Recipe, AlchemySchool, CraftResult, CraftResultType, Material } from '../../types';
import { MaterialRegistry } from './MaterialRegistry';

/**
 * 合成引擎控制器
 * 管理所有炼金配方，提供配方匹配、合成验证、解锁判定等核心功能
 * 包含6个炼金学派，每个学派6个配方，共36个配方
 */
export class EngineController {
  private static readonly recipes: ReadonlyMap<string, Recipe> = EngineController.initRecipes();

  /**
   * 初始化所有配方数据
   * @returns 配方映射表
   */
  private static initRecipes(): ReadonlyMap<string, Recipe> {
    const recipeList: readonly Recipe[] = [
      // ========== 基础元素学派 (6个配方) ==========
      { id: 'r_steam', name: '蒸汽元素', materials: ['water', 'fire_ash'], output: 'quicksilver', school: AlchemySchool.BASIC_ELEMENT, hint: '水与火的交融，化作流动的银。', probability: 0.85 },
      { id: 'r_lava', name: '熔岩精华', materials: ['earth', 'fire_ash', 'stone'], output: 'obsidian', school: AlchemySchool.BASIC_ELEMENT, hint: '大地吞噬火焰，凝成黑暗的利刃。', probability: 0.75 },
      { id: 'r_glass', name: '玻璃之魂', materials: ['sand', 'fire_ash'], output: 'crystal', school: AlchemySchool.BASIC_ELEMENT, hint: '沙粒在烈火中蜕变，透明如初生之心。', probability: 0.8 },
      { id: 'r_mud', name: '生命泥', materials: ['water', 'earth', 'seed'], output: 'vine', school: AlchemySchool.BASIC_ELEMENT, hint: '水土孕育，种子萌发，缠绕向上。', probability: 0.9 },
      { id: 'r_dust_storm', name: '尘暴核心', materials: ['wind_dust', 'sand', 'earth'], output: 'moonstone', school: AlchemySchool.BASIC_ELEMENT, hint: '风卷起大地的记忆，凝结成月的光辉。', probability: 0.65 },
      { id: 'r_sun', name: '太阳精华', materials: ['fire_ash', 'crystal', 'sulphur'], output: 'sun_fragment', school: AlchemySchool.BASIC_ELEMENT, hint: '火焰穿透晶石，硫磺点燃永恒之光。', probability: 0.3 },

      // ========== 生命物质学派 (6个配方) ==========
      { id: 'r_healing_potion', name: '治愈药剂', materials: ['herb_leaf', 'water'], output: 'glow_moss', school: AlchemySchool.LIFE_MATTER, hint: '草叶的温柔溶于清泉，生长出治愈之光。', probability: 0.85 },
      { id: 'r_bone_reagent', name: '骸骨试剂', materials: ['bone_dust', 'salt', 'charcoal'], output: 'amber', school: AlchemySchool.LIFE_MATTER, hint: '白骨与盐封印于黑炭之中，时光凝固成金。', probability: 0.7 },
      { id: 'r_fox_elixir', name: '灵狐秘药', materials: ['fox_fur', 'mana_pollen', 'moonstone'], output: 'phoenix_feather', school: AlchemySchool.LIFE_MATTER, hint: '狐毛汲取月华与魔力，燃烧成不死之羽。', probability: 0.35 },
      { id: 'r_poison_brew', name: '剧毒酿', materials: ['snake_venom', 'mushroom', 'water'], output: 'demon_essence', school: AlchemySchool.LIFE_MATTER, hint: '菌菇吸收毒液，黑水孕育深渊之息。', probability: 0.45 },
      { id: 'r_growth_serum', name: '生长血清', materials: ['seed', 'herb_leaf', 'vine'], output: 'world_tree_heart', school: AlchemySchool.LIFE_MATTER, hint: '种子、草叶与藤蔓缠绕，编织世界之根。', probability: 0.2 },
      { id: 'r_spider_elixir', name: '蛛丝精华', materials: ['spider_silk', 'feather', 'water'], output: 'mana_pollen', school: AlchemySchool.LIFE_MATTER, hint: '细丝与轻羽共舞于水，化为魔法之粉。', probability: 0.7 },

      // ========== 魔法能量学派 (6个配方) ==========
      { id: 'r_mana_basic', name: '魔力结晶', materials: ['crystal', 'mana_pollen'], output: 'moonstone', school: AlchemySchool.MAGIC_ENERGY, hint: '晶石吸收魔法之粉，映射月光。', probability: 0.8 },
      { id: 'r_void_essence', name: '虚空精华', materials: ['void_crystal', 'quicksilver'], output: 'aether', school: AlchemySchool.MAGIC_ENERGY, hint: '虚空之石溶解于流动的银，凝为天界元素。', probability: 0.35 },
      { id: 'r_soul_charge', name: '灵魂充能', materials: ['soul_stone', 'mana_pollen', 'crystal'], output: 'philosopher_stone_dust', school: AlchemySchool.MAGIC_ENERGY, hint: '纯净灵魂与魔力共鸣，化作贤者之尘。', probability: 0.25 },
      { id: 'r_fire_magic', name: '火焰魔能', materials: ['sulphur', 'fire_ash', 'crystal'], output: 'phoenix_feather', school: AlchemySchool.MAGIC_ENERGY, hint: '硫磺点燃火焰晶石，重生之鸟降临。', probability: 0.4 },
      { id: 'r_moon_charm', name: '月光护符', materials: ['moonstone', 'feather', 'cloth'], output: 'soul_stone', school: AlchemySchool.MAGIC_ENERGY, hint: '月光石以羽毛织入布中，封印一缕灵魂。', probability: 0.3 },
      { id: 'r_arcane_dust', name: '奥术粉末', materials: ['crystal', 'sulphur', 'bone_dust'], output: 'void_crystal', school: AlchemySchool.MAGIC_ENERGY, hint: '晶石、硫磺与骨粉共振，撕裂空间的缝隙。', probability: 0.5 },

      // ========== 机械构造学派 (6个配方) ==========
      { id: 'r_gears_basic', name: '齿轮组件', materials: ['iron_ore', 'copper_ore'], output: 'gears', school: AlchemySchool.MECHANICAL_CONSTRUCT, hint: '铁与铜的咬合，转动文明的车轮。', probability: 0.85 },
      { id: 'r_spring_make', name: '发条制作', materials: ['iron_ore', 'charcoal'], output: 'coil_spring', school: AlchemySchool.MECHANICAL_CONSTRUCT, hint: '铁经过炭的淬炼，获得反弹之力。', probability: 0.8 },
      { id: 'r_steam_machine', name: '蒸汽机关', materials: ['gears', 'water', 'fire_ash'], output: 'steam_core', school: AlchemySchool.MECHANICAL_CONSTRUCT, hint: '齿轮在水火之间咆哮，机械之心跳动。', probability: 0.55 },
      { id: 'r_automaton', name: '自动人偶', materials: ['gears', 'coil_spring', 'cloth'], output: 'glow_moss', school: AlchemySchool.MECHANICAL_CONSTRUCT, hint: '齿轮、发条与麻布结合，点亮生命之绿。', probability: 0.6 },
      { id: 'r_glass_engine', name: '水晶引擎', materials: ['crystal', 'gears', 'steam_core'], output: 'void_crystal', school: AlchemySchool.MECHANICAL_CONSTRUCT, hint: '水晶齿轮与蒸汽心脏共鸣，洞穿虚空之门。', probability: 0.35 },
      { id: 'r_timepiece', name: '时之钟', materials: ['amber', 'gears', 'coil_spring', 'moonstone'], output: 'world_tree_heart', hint: '琥珀封存时光，齿轮转动岁月，月华见证永恒。', school: AlchemySchool.MECHANICAL_CONSTRUCT, probability: 0.2 },

      // ========== 暗影物质学派 (6个配方) ==========
      { id: 'r_shadow_basic', name: '暗影墨水', materials: ['charcoal', 'water', 'obsidian'], output: 'snake_venom', school: AlchemySchool.SHADOW_MATTER, hint: '黑炭、黑水与黑石，酝酿毒牙之液。', probability: 0.75 },
      { id: 'r_demon_breath', name: '恶魔之息', materials: ['demon_essence', 'sulphur'], output: 'void_crystal', school: AlchemySchool.SHADOW_MATTER, hint: '恶魔之血燃烧硫磺，炸开空间裂缝。', probability: 0.55 },
      { id: 'r_soul_bind', name: '灵魂束缚', materials: ['soul_stone', 'spider_silk', 'demon_essence'], output: 'philosopher_stone_dust', school: AlchemySchool.SHADOW_MATTER, hint: '蛛丝缠绕灵魂与恶魔，提炼转化之力。', probability: 0.3 },
      { id: 'r_black_flame', name: '黑焰核心', materials: ['obsidian', 'fire_ash', 'demon_essence'], output: 'sun_fragment', school: AlchemySchool.SHADOW_MATTER, hint: '黑暗吞噬火焰，却点燃了太阳的残骸。', probability: 0.25 },
      { id: 'r_nightmare', name: '梦魇精华', materials: ['snake_venom', 'moonstone', 'mushroom'], output: 'demon_essence', school: AlchemySchool.SHADOW_MATTER, hint: '剧毒、月华与毒菌，编织最深的噩梦。', probability: 0.45 },
      { id: 'r_death_catalyst', name: '死亡催化剂', materials: ['bone_dust', 'snake_venom', 'demon_essence', 'soul_stone'], output: 'aether', school: AlchemySchool.SHADOW_MATTER, hint: '白骨、毒液、恶魔与灵魂，死亡尽头是新生。', probability: 0.15 },

      // ========== 圣光精华学派 (6个配方) ==========
      { id: 'r_holy_water', name: '圣水', materials: ['water', 'salt', 'crystal'], output: 'glow_moss', school: AlchemySchool.HOLY_ESSENCE, hint: '清水被盐与晶石祝福，散发圣洁之光。', probability: 0.8 },
      { id: 'r_phoenix_ash', name: '凤凰灰烬', materials: ['phoenix_feather', 'fire_ash'], output: 'sun_fragment', school: AlchemySchool.HOLY_ESSENCE, hint: '不死之羽燃尽，留存太阳的碎片。', probability: 0.5 },
      { id: 'r_salvation', name: '救赎之光', materials: ['aether', 'soul_stone', 'crystal'], output: 'philosopher_stone_dust', school: AlchemySchool.HOLY_ESSENCE, hint: '以太、灵魂与水晶交汇，贤者之石显现。', probability: 0.3 },
      { id: 'r_dragon_ward', name: '龙鳞护盾', materials: ['dragon_scale', 'obsidian', 'amber'], output: 'world_tree_heart', school: AlchemySchool.HOLY_ESSENCE, hint: '龙鳞、黑曜石与琥珀结合，孕育世界之根。', probability: 0.25 },
      { id: 'r_holy_relic', name: '圣遗物', materials: ['sun_fragment', 'aether', 'phoenix_feather'], output: 'soul_stone', school: AlchemySchool.HOLY_ESSENCE, hint: '太阳、以太与不死鸟，铸就永恒灵魂。', probability: 0.2 },
      { id: 'r_elixir_life', name: '生命之剂', materials: ['world_tree_heart', 'soul_stone', 'philosopher_stone_dust', 'phoenix_feather'], output: 'aether', school: AlchemySchool.HOLY_ESSENCE, hint: '四神圣物合一，炼就万物之源。', probability: 0.1 }
    ];

    const map = new Map<string, Recipe>();
    for (const recipe of recipeList) {
      map.set(recipe.id, recipe);
    }
    return map;
  }

  /**
   * 获取所有配方
   * @returns 所有配方的只读数组
   */
  public static getAllRecipes(): readonly Recipe[] {
    return Array.from(this.recipes.values());
  }

  /**
   * 根据配方ID获取配方
   * @param id - 配方唯一标识
   * @returns 对应配方，未找到返回null
   */
  public static getRecipeById(id: string): Recipe | null {
    return this.recipes.get(id) ?? null;
  }

  /**
   * 根据炼金学派获取配方列表
   * @param school - 目标炼金学派
   * @returns 对应学派的配方数组
   */
  public static getRecipesBySchool(school: AlchemySchool): readonly Recipe[] {
    return this.getAllRecipes().filter(r => r.school === school);
  }

  /**
   * 对材料ID数组进行标准化排序（用于无序匹配）
   * @param materialIds - 材料ID数组
   * @returns 排序后的新数组
   */
  private static normalizeMaterialIds(materialIds: readonly string[]): readonly string[] {
    return [...materialIds].sort();
  }

  /**
   * 比较两个材料ID数组是否包含相同数量和种类的材料（忽略顺序）
   * @param a - 材料ID数组A
   * @param b - 材料ID数组B
   * @returns 是否匹配
   */
  private static materialsMatch(a: readonly string[], b: readonly string[]): boolean {
    if (a.length !== b.length) return false;

    const sortedA = this.normalizeMaterialIds(a);
    const sortedB = this.normalizeMaterialIds(b);

    for (let i = 0; i < sortedA.length; i++) {
      if (sortedA[i] !== sortedB[i]) return false;
    }
    return true;
  }

  /**
   * 匹配配方（忽略材料顺序，但需要相同数量和种类）
   * @param materialIds - 坩埚中的材料ID数组
   * @returns 匹配到的配方，未找到返回null
   */
  public static matchRecipe(materialIds: string[]): Recipe | null {
    if (materialIds.length < 2 || materialIds.length > 4) {
      return null;
    }

    for (const recipe of this.recipes.values()) {
      if (this.materialsMatch(materialIds, recipe.materials)) {
        return recipe;
      }
    }

    return null;
  }

  /**
   * 验证合成是否会成功（基于配方概率）
   * @param recipe - 要尝试的配方
   * @returns 是否成功
   */
  public static rollCraftSuccess(recipe: Recipe): boolean {
    return Math.random() < recipe.probability;
  }

  /**
   * 验证库存中是否有足够材料
   * @param recipe - 要合成的配方
   * @param inventory - 当前材料库存
   * @returns 是否有足够材料
   */
  public static hasEnoughMaterials(
    recipe: Recipe,
    inventory: ReadonlyMap<string, number>
  ): boolean {
    const materialCount = new Map<string, number>();
    for (const matId of recipe.materials) {
      materialCount.set(matId, (materialCount.get(matId) ?? 0) + 1);
    }

    for (const [matId, needed] of materialCount) {
      const have = inventory.get(matId) ?? 0;
      if (have < needed) return false;
    }

    return true;
  }

  /**
   * 检查配方是否已解锁
   * 解锁条件：已发现配方产出材料或已发现配方中所有材料
   * @param recipeId - 配方ID
   * @param discoveredMaterials - 已发现材料集合
   * @returns 是否已解锁
   */
  public static isRecipeUnlocked(
    recipeId: string,
    discoveredMaterials: ReadonlySet<string>
  ): boolean {
    const recipe = this.getRecipeById(recipeId);
    if (!recipe) return false;

    if (discoveredMaterials.has(recipe.output)) {
      return true;
    }

    return recipe.materials.every(matId => discoveredMaterials.has(matId));
  }

  /**
   * 获取学派的中文名称
   * @param school - 炼金学派
   * @returns 中文学派名称
   */
  public static getSchoolName(school: AlchemySchool): string {
    const names: ReadonlyMap<AlchemySchool, string> = new Map([
      [AlchemySchool.BASIC_ELEMENT, '基础元素'],
      [AlchemySchool.LIFE_MATTER, '生命物质'],
      [AlchemySchool.MAGIC_ENERGY, '魔法能量'],
      [AlchemySchool.MECHANICAL_CONSTRUCT, '机械构造'],
      [AlchemySchool.SHADOW_MATTER, '暗影物质'],
      [AlchemySchool.HOLY_ESSENCE, '圣光精华']
    ]);
    return names.get(school) ?? '未知学派';
  }

  /**
   * 执行合成操作
   * @param materialIds - 坩埚中的材料ID数组
   * @param inventory - 当前库存（用于材料充足性检查）
   * @returns 合成结果
   */
  public static performCraft(
    materialIds: readonly string[],
    inventory: ReadonlyMap<string, number>
  ): CraftResult {
    const recipe = this.matchRecipe([...materialIds]);

    if (!recipe) {
      return {
        type: 'no_recipe' as CraftResultType,
        recipe: null,
        output: null,
        message: '坩埚中的材料没有反应，似乎缺少正确的配方。'
      };
    }

    if (!this.hasEnoughMaterials(recipe, inventory)) {
      return {
        type: 'missing_materials' as CraftResultType,
        recipe,
        output: null,
        message: '库存材料不足，无法进行合成。'
      };
    }

    const success = this.rollCraftSuccess(recipe);
    const outputMaterial: Material | null = success
      ? MaterialRegistry.getMaterialById(recipe.output)
      : null;

    if (success && outputMaterial) {
      return {
        type: 'success' as CraftResultType,
        recipe,
        output: outputMaterial,
        message: `合成成功！获得了【${outputMaterial.name}】。`
      };
    }

    return {
      type: 'failure' as CraftResultType,
      recipe,
      output: null,
      message: '合成失败了，材料在坩埚中化为烟雾消散。'
    };
  }
}
