import type { Material, Recipe, RecipeResult, Potion } from "@/types"

export const ALL_MATERIALS: Material[] = [
  { id: "fire_flower", name: "火焰花", icon: "🔥", rarity: "common", category: "plant", quantity: 0 },
  { id: "frost_herb", name: "冰霜草", icon: "❄️", rarity: "common", category: "plant", quantity: 0 },
  { id: "moon_grass", name: "月光草", icon: "🌙", rarity: "common", category: "plant", quantity: 0 },
  { id: "poison_mushroom", name: "毒蘑菇", icon: "🍄", rarity: "common", category: "plant", quantity: 0 },
  { id: "moonstone", name: "月光石", icon: "💎", rarity: "rare", category: "mineral", quantity: 0 },
  { id: "dragon_scale_ore", name: "龙鳞矿", icon: "🪨", rarity: "rare", category: "mineral", quantity: 0 },
  { id: "shadow_iron", name: "暗铁碎片", icon: "⛓️", rarity: "common", category: "mineral", quantity: 0 },
  { id: "crystal_shard", name: "水晶碎片", icon: "💠", rarity: "common", category: "mineral", quantity: 0 },
  { id: "soul_essence", name: "灵魂精华", icon: "👻", rarity: "epic", category: "essence", quantity: 0 },
  { id: "chaos_core", name: "混沌之核", icon: "🌀", rarity: "legendary", category: "essence", quantity: 0 },
]

export const ALL_RECIPES: Recipe[] = [
  {
    id: "recipe_healing_draught",
    name: "治愈药水",
    material1Id: "fire_flower",
    material2Id: "frost_herb",
    product: { id: "potion_healing_draught", name: "治愈药水", icon: "🧪", rarity: "common", type: "heal", power: 15, description: "冰火交融，化为温和的治愈之力" },
    flavorText: "冰与火的妥协，孕育出生命的甘露",
    discovered: false,
  },
  {
    id: "recipe_weak_poison",
    name: "微效毒药",
    material1Id: "moon_grass",
    material2Id: "crystal_shard",
    product: { id: "potion_weak_poison", name: "微效毒药", icon: "☠️", rarity: "common", type: "damage", power: 12, description: "月光浸润的毒液，虽弱却难以察觉" },
    flavorText: "月光之下，毒意悄然蔓延",
    discovered: false,
  },
  {
    id: "recipe_clear_mind",
    name: "清心露",
    material1Id: "frost_herb",
    material2Id: "crystal_shard",
    product: { id: "potion_clear_mind", name: "清心露", icon: "💧", rarity: "common", type: "heal", power: 10, description: "冰霜与水晶的精华，抚平身心创伤" },
    flavorText: "水晶映照冰霜，心静自然凉",
    discovered: false,
  },
  {
    id: "recipe_weaken_powder",
    name: "削弱粉末",
    material1Id: "poison_mushroom",
    material2Id: "shadow_iron",
    product: { id: "potion_weaken_powder", name: "削弱粉末", icon: "💫", rarity: "common", type: "weaken", power: 10, description: "毒与暗的混合，削弱敌人的意志与力量" },
    flavorText: "暗铁承载毒意，蚀人筋骨",
    discovered: false,
  },
  {
    id: "recipe_flame_potion",
    name: "烈焰药水",
    material1Id: "fire_flower",
    material2Id: "moonstone",
    product: { id: "potion_flame_potion", name: "烈焰药水", icon: "🌋", rarity: "rare", type: "damage", power: 20, description: "月光石催化火焰花的精华，燃起不灭之火" },
    flavorText: "月石为引，烈焰焚天",
    discovered: false,
  },
  {
    id: "recipe_moon_spirit",
    name: "月华灵液",
    material1Id: "moon_grass",
    material2Id: "soul_essence",
    product: { id: "potion_moon_spirit", name: "月华灵液", icon: "✨", rarity: "rare", type: "heal", power: 25, description: "灵魂精华注入月光草，唤起深层治愈" },
    flavorText: "月华倾泻，灵魂归位",
    discovered: false,
  },
  {
    id: "recipe_dragon_breath",
    name: "龙息烈酒",
    material1Id: "dragon_scale_ore",
    material2Id: "fire_flower",
    product: { id: "potion_dragon_breath", name: "龙息烈酒", icon: "🐉", rarity: "rare", type: "damage", power: 22, description: "龙鳞矿的炽热与火焰花共鸣，喷吐龙息" },
    flavorText: "龙之怒焰，焚尽一切",
    discovered: false,
  },
  {
    id: "recipe_soul_rot",
    name: "蚀魂之雾",
    material1Id: "poison_mushroom",
    material2Id: "soul_essence",
    product: { id: "potion_soul_rot", name: "蚀魂之雾", icon: "🌫️", rarity: "rare", type: "weaken", power: 18, description: "灵魂精华被毒意侵蚀，化为侵蚀之雾" },
    flavorText: "灵魂染毒，雾中人无所遁形",
    discovered: false,
  },
  {
    id: "recipe_cold_iron_curse",
    name: "寒铁咒液",
    material1Id: "frost_herb",
    material2Id: "shadow_iron",
    product: { id: "potion_cold_iron_curse", name: "寒铁咒液", icon: "🧿", rarity: "rare", type: "weaken", power: 16, description: "冰霜封印暗铁之咒，缓缓削弱敌人" },
    flavorText: "寒铁封咒，步步蚕食",
    discovered: false,
  },
  {
    id: "recipe_dragon_blood",
    name: "龙血炼金",
    material1Id: "dragon_scale_ore",
    material2Id: "chaos_core",
    product: { id: "potion_dragon_blood", name: "龙血炼金", icon: "🩸", rarity: "epic", type: "heal", power: 35, description: "混沌之核激发龙鳞矿中沉睡的龙血，焕发生机" },
    flavorText: "龙血沸腾，混沌重塑肉身",
    discovered: false,
  },
  {
    id: "recipe_shadow_erosion",
    name: "暗影侵蚀",
    material1Id: "shadow_iron",
    material2Id: "soul_essence",
    product: { id: "potion_shadow_erosion", name: "暗影侵蚀", icon: "🌑", rarity: "epic", type: "weaken", power: 28, description: "暗铁碎片引导灵魂精华化为无尽暗影" },
    flavorText: "暗影吞噬光芒，灵魂归于虚无",
    discovered: false,
  },
  {
    id: "recipe_void_rift",
    name: "虚空裂隙",
    material1Id: "moonstone",
    material2Id: "chaos_core",
    product: { id: "potion_void_rift", name: "虚空裂隙", icon: "🕳️", rarity: "epic", type: "damage", power: 32, description: "混沌撕裂月光石的秩序，撕开虚空裂隙" },
    flavorText: "秩序崩塌，虚空降临",
    discovered: false,
  },
  {
    id: "recipe_frost_heart",
    name: "寒霜之心",
    material1Id: "frost_herb",
    material2Id: "soul_essence",
    product: { id: "potion_frost_heart", name: "寒霜之心", icon: "💙", rarity: "epic", type: "heal", power: 30, description: "灵魂精华凝结冰霜之力，形成护心寒冰" },
    flavorText: "寒冰封心，万法不侵",
    discovered: false,
  },
  {
    id: "recipe_chaos_grail",
    name: "混沌圣杯",
    material1Id: "chaos_core",
    material2Id: "soul_essence",
    product: { id: "potion_chaos_grail", name: "混沌圣杯", icon: "🏆", rarity: "legendary", type: "heal", power: 50, description: "混沌与灵魂的终极融合，铸就不朽圣杯" },
    flavorText: "混沌为杯，灵魂为酒，饮者永生",
    discovered: false,
  },
  {
    id: "recipe_ancient_dragon",
    name: "远古龙灵",
    material1Id: "dragon_scale_ore",
    material2Id: "moonstone",
    product: { id: "potion_ancient_dragon", name: "远古龙灵", icon: "🐲", rarity: "legendary", type: "damage", power: 45, description: "龙鳞矿与月光石共鸣，唤醒沉睡的远古龙灵" },
    flavorText: "远古龙灵苏醒，天地为之震颤",
    discovered: false,
  },
]

export function calculateResult(material1Id: string, material2Id: string, discoveredRecipeIds: string[]): RecipeResult {
  const recipe = ALL_RECIPES.find(
    (r) =>
      (r.material1Id === material1Id && r.material2Id === material2Id) ||
      (r.material1Id === material2Id && r.material2Id === material1Id)
  )

  if (!recipe) {
    return {
      success: false,
      potion: null,
      recipeId: null,
      isNewDiscovery: false,
      message: "这两种材料无法合成任何药水……",
    }
  }

  const isNewDiscovery = !discoveredRecipeIds.includes(recipe.id)

  return {
    success: true,
    potion: recipe.product,
    recipeId: recipe.id,
    isNewDiscovery,
    message: isNewDiscovery
      ? `新配方发现！成功合成了「${recipe.product.name}」！\n${recipe.flavorText}`
      : `成功合成了「${recipe.product.name}」`,
  }
}

export function getInitialInventory(): Material[] {
  return ALL_MATERIALS.map((m) => ({
    ...m,
    quantity: m.rarity === "common" ? 5 : m.rarity === "rare" ? 3 : m.rarity === "epic" ? 1 : 1,
  }))
}
