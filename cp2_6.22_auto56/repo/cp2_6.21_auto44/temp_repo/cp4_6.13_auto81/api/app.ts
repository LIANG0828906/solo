import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const dbPath = path.resolve(__dirname, '../data.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS player (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS material (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      rarity TEXT NOT NULL,
      description TEXT,
      lore TEXT,
      base_properties TEXT
    );

    CREATE TABLE IF NOT EXISTS recipe (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      product_type TEXT NOT NULL,
      product_name TEXT NOT NULL,
      effect TEXT,
      effect_value REAL,
      effect_type TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS recipe_material (
      recipe_id TEXT NOT NULL,
      material_id TEXT NOT NULL,
      PRIMARY KEY (recipe_id, material_id),
      FOREIGN KEY (recipe_id) REFERENCES recipe(id),
      FOREIGN KEY (material_id) REFERENCES material(id)
    );

    CREATE TABLE IF NOT EXISTS player_material (
      player_id TEXT NOT NULL,
      material_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      PRIMARY KEY (player_id, material_id),
      FOREIGN KEY (player_id) REFERENCES player(id),
      FOREIGN KEY (material_id) REFERENCES material(id)
    );

    CREATE TABLE IF NOT EXISTS player_recipe (
      player_id TEXT NOT NULL,
      recipe_id TEXT NOT NULL,
      is_favorite INTEGER DEFAULT 0,
      PRIMARY KEY (player_id, recipe_id),
      FOREIGN KEY (player_id) REFERENCES player(id),
      FOREIGN KEY (recipe_id) REFERENCES recipe(id)
    );

    CREATE TABLE IF NOT EXISTS weapon (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      base_attack INTEGER DEFAULT 0,
      base_defense INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES player(id)
    );

    CREATE TABLE IF NOT EXISTS enchantment (
      id TEXT PRIMARY KEY,
      weapon_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      description TEXT,
      FOREIGN KEY (weapon_id) REFERENCES weapon(id)
    );
  `)
} catch (err) {
  console.error('Failed to create tables:', err)
}

const materialsSeed = [
  { id: 'moonstone', name: '月光石', icon: '💎', rarity: 'common', description: '在满月之夜才能采集的神秘矿石', lore: '传说月光石是月神遗落在人间的泪滴', base_properties: JSON.stringify({ element: 'moon' }) },
  { id: 'fireflower', name: '火焰花', icon: '🔥', rarity: 'common', description: '生长在火山口的炽热花朵', lore: '龙族领地中随处可见的火焰植物', base_properties: JSON.stringify({ element: 'fire' }) },
  { id: 'dragon_scale', name: '龙鳞', icon: '🐉', rarity: 'rare', description: '从远古巨龙身上脱落的鳞片', lore: '每片龙鳞都蕴含着龙族的远古力量', base_properties: JSON.stringify({ element: 'dragon' }) },
  { id: 'phoenix_feather', name: '凤凰羽毛', icon: '🪶', rarity: 'epic', description: '凤凰涅槃时飘落的金色羽毛', lore: '据说持有凤凰羽毛者可获得重生之力', base_properties: JSON.stringify({ element: 'phoenix' }) },
  { id: 'shadow_herb', name: '暗影草', icon: '🌿', rarity: 'common', description: '只在午夜暗影中生长的草药', lore: '暗影草是暗夜精灵的秘密配方原料', base_properties: JSON.stringify({ element: 'shadow' }) },
  { id: 'crystal_dew', name: '晶露', icon: '💧', rarity: 'rare', description: '凝结在千年水晶上的晨露', lore: '晶露有着净化一切的力量', base_properties: JSON.stringify({ element: 'crystal' }) },
  { id: 'thunder_ore', name: '雷霆矿', icon: '⚡', rarity: 'rare', description: '被雷击中的矿石蕴含雷电之力', lore: '雷霆矿只在暴风雨后的山顶出现', base_properties: JSON.stringify({ element: 'thunder' }) },
  { id: 'frost_essence', name: '霜华', icon: '❄️', rarity: 'common', description: '极寒之地凝结的冰霜精华', lore: '北方冰原法师们最常用的材料', base_properties: JSON.stringify({ element: 'frost' }) },
  { id: 'ancient_bark', name: '远古树皮', icon: '🌳', rarity: 'common', description: '千年古树外层的坚硬树皮', lore: '世界树最外层的守护，蕴含生命之力', base_properties: JSON.stringify({ element: 'nature' }) },
  { id: 'void_crystal', name: '虚空水晶', icon: '🔮', rarity: 'epic', description: '来自虚空裂隙的神秘水晶', lore: '虚空水晶中封印着混沌初开时的原始能量', base_properties: JSON.stringify({ element: 'void' }) },
]

const recipesSeed = [
  { id: 'recipe1', name: '月焰药剂', product_type: 'potion', product_name: 'Moonflame Potion', effect: '提升锻造成功率', effect_value: 15, effect_type: 'forge_boost', description: '月光石与火焰花的融合药剂' },
  { id: 'recipe2', name: '暗影药剂', product_type: 'potion', product_name: 'Shadow Elixir', effect: '增加暴击伤害', effect_value: 25, effect_type: 'crit_damage', description: '暗影草与虚空水晶的暗黑药剂' },
  { id: 'recipe3', name: '冰霜矿石', product_type: 'ore', product_name: 'Frost Ore', effect: '赋予冰霜伤害', effect_value: 20, effect_type: 'frost_damage', description: '霜华与雷霆矿的冰寒融合' },
  { id: 'recipe4', name: '龙焰矿石', product_type: 'ore', product_name: 'Dragonflame Ore', effect: '赋予火焰伤害', effect_value: 30, effect_type: 'fire_damage', description: '龙鳞与火焰花的炽热矿石' },
  { id: 'recipe5', name: '凤凰之泪', product_type: 'potion', product_name: 'Phoenix Tear', effect: '恢复生命值', effect_value: 20, effect_type: 'life_steal', description: '凤凰羽毛与晶露的神圣药剂' },
  { id: 'recipe6', name: '雷鸣矿石', product_type: 'ore', product_name: 'Thunder Ore', effect: '赋予雷电伤害', effect_value: 25, effect_type: 'lightning_damage', description: '雷霆矿与远古树皮的雷鸣矿石' },
  { id: 'recipe7', name: '生命精华', product_type: 'potion', product_name: 'Life Essence', effect: '增加生命值', effect_value: 30, effect_type: 'health_boost', description: '远古树皮与晶露的生命精华' },
  { id: 'recipe8', name: '虚空之影', product_type: 'potion', product_name: 'Void Shadow', effect: '赋予暗影伤害', effect_value: 35, effect_type: 'shadow_damage', description: '虚空水晶、暗影草与霜华的暗影药剂' },
  { id: 'recipe9', name: '月华矿石', product_type: 'ore', product_name: 'Moonlight Ore', effect: '赋予月光伤害', effect_value: 28, effect_type: 'moon_damage', description: '月光石、晶露与霜华的月华矿石' },
  { id: 'recipe10', name: '凤凰矿石', product_type: 'ore', product_name: 'Phoenix Ore', effect: '赋予重生之力', effect_value: 40, effect_type: 'resurrection', description: '凤凰羽毛、火焰花与雷霆矿的凤凰矿石' },
  { id: 'recipe11', name: '远古守护', product_type: 'potion', product_name: 'Ancient Guard', effect: '增加防御力', effect_value: 35, effect_type: 'defense_boost', description: '远古树皮、龙鳞与月光石的守护药剂' },
  { id: 'recipe12', name: '龙血熔岩', product_type: 'ore', product_name: 'Dragonblood Lava', effect: '赋予龙焰伤害', effect_value: 45, effect_type: 'dragon_fire', description: '龙鳞、凤凰羽毛与火焰花的龙血熔岩' },
]

const recipeMaterialsSeed: { recipe_id: string; material_id: string }[] = [
  { recipe_id: 'recipe1', material_id: 'moonstone' },
  { recipe_id: 'recipe1', material_id: 'fireflower' },
  { recipe_id: 'recipe2', material_id: 'shadow_herb' },
  { recipe_id: 'recipe2', material_id: 'void_crystal' },
  { recipe_id: 'recipe3', material_id: 'frost_essence' },
  { recipe_id: 'recipe3', material_id: 'thunder_ore' },
  { recipe_id: 'recipe4', material_id: 'dragon_scale' },
  { recipe_id: 'recipe4', material_id: 'fireflower' },
  { recipe_id: 'recipe5', material_id: 'phoenix_feather' },
  { recipe_id: 'recipe5', material_id: 'crystal_dew' },
  { recipe_id: 'recipe6', material_id: 'thunder_ore' },
  { recipe_id: 'recipe6', material_id: 'ancient_bark' },
  { recipe_id: 'recipe7', material_id: 'ancient_bark' },
  { recipe_id: 'recipe7', material_id: 'crystal_dew' },
  { recipe_id: 'recipe8', material_id: 'void_crystal' },
  { recipe_id: 'recipe8', material_id: 'shadow_herb' },
  { recipe_id: 'recipe8', material_id: 'frost_essence' },
  { recipe_id: 'recipe9', material_id: 'moonstone' },
  { recipe_id: 'recipe9', material_id: 'crystal_dew' },
  { recipe_id: 'recipe9', material_id: 'frost_essence' },
  { recipe_id: 'recipe10', material_id: 'phoenix_feather' },
  { recipe_id: 'recipe10', material_id: 'fireflower' },
  { recipe_id: 'recipe10', material_id: 'thunder_ore' },
  { recipe_id: 'recipe11', material_id: 'ancient_bark' },
  { recipe_id: 'recipe11', material_id: 'dragon_scale' },
  { recipe_id: 'recipe11', material_id: 'moonstone' },
  { recipe_id: 'recipe12', material_id: 'dragon_scale' },
  { recipe_id: 'recipe12', material_id: 'phoenix_feather' },
  { recipe_id: 'recipe12', material_id: 'fireflower' },
]

const seedMaterials = db.prepare('SELECT COUNT(*) as count FROM material').get() as { count: number }
if (seedMaterials.count === 0) {
  const insertMaterial = db.prepare(
    'INSERT INTO material (id, name, icon, rarity, description, lore, base_properties) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const insertRecipe = db.prepare(
    'INSERT INTO recipe (id, name, product_type, product_name, effect, effect_value, effect_type, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertRecipeMaterial = db.prepare(
    'INSERT INTO recipe_material (recipe_id, material_id) VALUES (?, ?)'
  )

  const seedAll = db.transaction(() => {
    for (const m of materialsSeed) {
      insertMaterial.run(m.id, m.name, m.icon, m.rarity, m.description, m.lore, m.base_properties)
    }
    for (const r of recipesSeed) {
      insertRecipe.run(r.id, r.name, r.product_type, r.product_name, r.effect, r.effect_value, r.effect_type, r.description)
    }
    for (const rm of recipeMaterialsSeed) {
      insertRecipeMaterial.run(rm.recipe_id, rm.material_id)
    }
  })

  seedAll()
}

app.post('/api/player', (req: Request, res: Response): void => {
  try {
    const { name } = req.body
    if (!name) {
      res.status(400).json({ success: false, error: 'Name is required' })
      return
    }

    const id = uuidv4()
    const insertPlayer = db.prepare('INSERT INTO player (id, name) VALUES (?, ?)')
    insertPlayer.run(id, name)

    const insertPlayerMaterial = db.prepare(
      'INSERT INTO player_material (player_id, material_id, quantity) VALUES (?, ?, ?)'
    )

    const initMaterials = db.transaction(() => {
      for (const m of materialsSeed) {
        insertPlayerMaterial.run(id, m.id, 3)
      }
    })
    initMaterials()

    const player = db.prepare('SELECT * FROM player WHERE id = ?').get(id) as any
    const materials = db.prepare(
      `SELECT m.*, pm.quantity FROM material m
       JOIN player_material pm ON m.id = pm.material_id
       WHERE pm.player_id = ?`
    ).all(id)

    res.status(201).json({ success: true, player, materials })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to create player' })
  }
})

app.get('/api/player/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const player = db.prepare('SELECT * FROM player WHERE id = ?').get(id) as any
    if (!player) {
      res.status(404).json({ success: false, error: 'Player not found' })
      return
    }

    const materials = db.prepare(
      `SELECT m.*, pm.quantity FROM material m
       JOIN player_material pm ON m.id = pm.material_id
       WHERE pm.player_id = ?`
    ).all(id)

    const recipes = db.prepare(
      `SELECT r.*, pr.is_favorite FROM recipe r
       JOIN player_recipe pr ON r.id = pr.recipe_id
       WHERE pr.player_id = ?`
    ).all(id)

    const weapons = db.prepare(
      'SELECT * FROM weapon WHERE player_id = ?'
    ).all(id) as any[]

    const weaponIds = weapons.map(w => w.id)
    let enchantments: any[] = []
    if (weaponIds.length > 0) {
      const placeholders = weaponIds.map(() => '?').join(',')
      enchantments = db.prepare(
        `SELECT * FROM enchantment WHERE weapon_id IN (${placeholders})`
      ).all(...weaponIds)
    }

    const weaponsWithEnchantments = weapons.map(w => ({
      ...w,
      enchantments: enchantments.filter(e => e.weapon_id === w.id),
    }))

    res.json({
      success: true,
      player,
      materials,
      recipes,
      weapons: weaponsWithEnchantments,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to get player' })
  }
})

app.get('/api/materials', (_req: Request, res: Response): void => {
  try {
    const materials = db.prepare('SELECT * FROM material').all()
    res.json({ success: true, materials })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to get materials' })
  }
})

app.post('/api/materials/gather', (req: Request, res: Response): void => {
  try {
    const { playerId } = req.body
    if (!playerId) {
      res.status(400).json({ success: false, error: 'playerId is required' })
      return
    }

    const player = db.prepare('SELECT * FROM player WHERE id = ?').get(playerId) as any
    if (!player) {
      res.status(404).json({ success: false, error: 'Player not found' })
      return
    }

    const randomIndex = Math.floor(Math.random() * materialsSeed.length)
    const materialId = materialsSeed[randomIndex].id
    const quantity = Math.floor(Math.random() * 3) + 1

    const existing = db.prepare(
      'SELECT * FROM player_material WHERE player_id = ? AND material_id = ?'
    ).get(playerId, materialId) as any

    if (existing) {
      db.prepare(
        'UPDATE player_material SET quantity = quantity + ? WHERE player_id = ? AND material_id = ?'
      ).run(quantity, playerId, materialId)
    } else {
      db.prepare(
        'INSERT INTO player_material (player_id, material_id, quantity) VALUES (?, ?, ?)'
      ).run(playerId, materialId, quantity)
    }

    const updated = db.prepare(
      'SELECT * FROM player_material WHERE player_id = ? AND material_id = ?'
    ).get(playerId, materialId) as any

    const material = db.prepare('SELECT * FROM material WHERE id = ?').get(materialId) as any

    res.json({
      success: true,
      material,
      quantityAdded: quantity,
      newQuantity: updated.quantity,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to gather material' })
  }
})

app.get('/api/recipes', (_req: Request, res: Response): void => {
  try {
    const recipes = db.prepare('SELECT * FROM recipe').all() as any[]
    const recipeMaterials = db.prepare('SELECT * FROM recipe_material').all() as any[]

    const recipesWithMaterials = recipes.map(r => ({
      ...r,
      materialIds: recipeMaterials.filter(rm => rm.recipe_id === r.id).map(rm => rm.material_id),
    }))

    res.json({ success: true, recipes: recipesWithMaterials })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to get recipes' })
  }
})

app.post('/api/recipes/experiment', (req: Request, res: Response): void => {
  try {
    const { playerId, materialIds } = req.body
    if (!playerId || !materialIds || !Array.isArray(materialIds)) {
      res.status(400).json({ success: false, error: 'playerId and materialIds are required' })
      return
    }

    const player = db.prepare('SELECT * FROM player WHERE id = ?').get(playerId) as any
    if (!player) {
      res.status(404).json({ success: false, error: 'Player not found' })
      return
    }

    for (const mid of materialIds) {
      const pm = db.prepare(
        'SELECT * FROM player_material WHERE player_id = ? AND material_id = ?'
      ).get(playerId, mid) as any
      if (!pm || pm.quantity < 1) {
        res.status(400).json({ success: false, error: `Insufficient material: ${mid}` })
        return
      }
    }

    const sortedMaterialIds = [...materialIds].sort()
    const allRecipes = db.prepare('SELECT * FROM recipe').all() as any[]
    const allRecipeMaterials = db.prepare('SELECT * FROM recipe_material').all() as any[]

    let matchedRecipe: any = null
    for (const recipe of allRecipes) {
      const rmIds = allRecipeMaterials
        .filter(rm => rm.recipe_id === recipe.id)
        .map(rm => rm.material_id)
        .sort()
      if (rmIds.length === sortedMaterialIds.length && rmIds.every((id, i) => id === sortedMaterialIds[i])) {
        matchedRecipe = recipe
        break
      }
    }

    if (matchedRecipe) {
      const existing = db.prepare(
        'SELECT * FROM player_recipe WHERE player_id = ? AND recipe_id = ?'
      ).get(playerId, matchedRecipe.id) as any

      if (existing) {
        res.json({
          success: true,
          recipe: matchedRecipe,
          message: 'Already discovered',
        })
        return
      }

      db.prepare(
        'INSERT INTO player_recipe (player_id, recipe_id, is_favorite) VALUES (?, ?, 0)'
      ).run(playerId, matchedRecipe.id)

      res.json({ success: true, recipe: matchedRecipe })
    } else {
      const decreaseMaterial = db.prepare(
        'UPDATE player_material SET quantity = quantity - 1 WHERE player_id = ? AND material_id = ?'
      )
      const consumeMaterials = db.transaction(() => {
        for (const mid of materialIds) {
          decreaseMaterial.run(playerId, mid)
        }
      })
      consumeMaterials()

      res.json({ success: false, message: 'The combination yields nothing...' })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to experiment' })
  }
})

app.post('/api/recipes/favorite', (req: Request, res: Response): void => {
  try {
    const { playerId, recipeId } = req.body
    if (!playerId || !recipeId) {
      res.status(400).json({ success: false, error: 'playerId and recipeId are required' })
      return
    }

    const existing = db.prepare(
      'SELECT * FROM player_recipe WHERE player_id = ? AND recipe_id = ?'
    ).get(playerId, recipeId) as any

    if (!existing) {
      res.status(404).json({ success: false, error: 'Recipe not discovered by this player' })
      return
    }

    const newFav = existing.is_favorite ? 0 : 1
    db.prepare(
      'UPDATE player_recipe SET is_favorite = ? WHERE player_id = ? AND recipe_id = ?'
    ).run(newFav, playerId, recipeId)

    const favorites = db.prepare(
      `SELECT r.*, pr.is_favorite FROM recipe r
       JOIN player_recipe pr ON r.id = pr.recipe_id
       WHERE pr.player_id = ? AND pr.is_favorite = 1`
    ).all(playerId)

    res.json({ success: true, favorites })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to toggle favorite' })
  }
})

app.post('/api/forge', (req: Request, res: Response): void => {
  try {
    const { playerId, weaponType, consumableId } = req.body
    if (!playerId || !weaponType || !consumableId) {
      res.status(400).json({ success: false, error: 'playerId, weaponType, and consumableId are required' })
      return
    }

    const player = db.prepare('SELECT * FROM player WHERE id = ?').get(playerId) as any
    if (!player) {
      res.status(404).json({ success: false, error: 'Player not found' })
      return
    }

    const discovered = db.prepare(
      'SELECT * FROM player_recipe WHERE player_id = ? AND recipe_id = ?'
    ).get(playerId, consumableId) as any
    if (!discovered) {
      res.status(400).json({ success: false, error: 'Recipe not discovered' })
      return
    }

    const recipe = db.prepare('SELECT * FROM recipe WHERE id = ?').get(consumableId) as any
    if (!recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found' })
      return
    }

    const weaponId = uuidv4()
    const weaponName = `${recipe.product_name} ${weaponType}`
    const baseAttack = Math.floor(Math.random() * 20) + 10
    const baseDefense = Math.floor(Math.random() * 10) + 5

    const forgeWeapon = db.transaction(() => {
      db.prepare(
        'INSERT INTO weapon (id, player_id, name, type, base_attack, base_defense) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(weaponId, playerId, weaponName, weaponType, baseAttack, baseDefense)

      const enchantmentId = uuidv4()
      db.prepare(
        'INSERT INTO enchantment (id, weapon_id, name, type, value, description) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(enchantmentId, weaponId, recipe.name, recipe.effect_type, recipe.effect_value, recipe.effect)
    })

    forgeWeapon()

    const weapon = db.prepare('SELECT * FROM weapon WHERE id = ?').get(weaponId) as any
    const enchantments = db.prepare('SELECT * FROM enchantment WHERE weapon_id = ?').all(weaponId)

    res.json({
      success: true,
      weapon: { ...weapon, enchantments },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to forge weapon' })
  }
})

app.get('/api/weapons/:playerId', (req: Request, res: Response): void => {
  try {
    const { playerId } = req.params
    const weapons = db.prepare('SELECT * FROM weapon WHERE player_id = ?').all(playerId) as any[]
    const weaponIds = weapons.map(w => w.id)
    let enchantments: any[] = []
    if (weaponIds.length > 0) {
      const placeholders = weaponIds.map(() => '?').join(',')
      enchantments = db.prepare(
        `SELECT * FROM enchantment WHERE weapon_id IN (${placeholders})`
      ).all(...weaponIds)
    }

    const weaponsWithEnchantments = weapons.map(w => ({
      ...w,
      enchantments: enchantments.filter(e => e.weapon_id === w.id),
    }))

    res.json({ success: true, weapons: weaponsWithEnchantments })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to get weapons' })
  }
})

app.use('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: 'ok' })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(error)
  res.status(500).json({ success: false, error: 'Server internal error' })
})

app.use((_req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: 'API not found' })
})

export default app
