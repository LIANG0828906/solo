const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dyeWorkshop.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS dye_schemes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    current_stock REAL NOT NULL DEFAULT 0,
    threshold_stock REAL NOT NULL DEFAULT 10,
    monthly_consumption REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'g'
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    main_dye_id TEXT,
    mordant TEXT,
    temperature INTEGER NOT NULL DEFAULT 60,
    duration_hours REAL NOT NULL DEFAULT 2,
    ph_value REAL NOT NULL DEFAULT 7,
    estimated_cost REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (main_dye_id) REFERENCES materials(id)
  );

  CREATE TABLE IF NOT EXISTS recipe_materials (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
    FOREIGN KEY (material_id) REFERENCES materials(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_no TEXT UNIQUE NOT NULL,
    fabric_type TEXT NOT NULL,
    dye_scheme_id TEXT NOT NULL,
    width_cm INTEGER NOT NULL,
    length_cm INTEGER NOT NULL,
    reference_image TEXT,
    status TEXT NOT NULL DEFAULT '待确认',
    status_history TEXT NOT NULL DEFAULT '[]',
    estimated_completion TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (dye_scheme_id) REFERENCES dye_schemes(id)
  );

  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
`);

const dyeSchemesCount = db.prepare('SELECT COUNT(*) as count FROM dye_schemes').get().count;
if (dyeSchemesCount === 0) {
  const insertDyeScheme = db.prepare(`
    INSERT INTO dye_schemes (id, name, color_hex) VALUES (?, ?, ?)
  `);
  const dyeSchemes = [
    ['madder-red', '茜草红', '#B22222'],
    ['gardenia-yellow', '栀子黄', '#FFD700'],
    ['sappanwood-purple', '苏木紫', '#8A2BE2'],
    ['indigo-blue', '蓝草蓝', '#4169E1']
  ];
  const tx = db.transaction((schemes) => {
    for (const scheme of schemes) {
      insertDyeScheme.run(...scheme);
    }
  });
  tx(dyeSchemes);
}

const materialsCount = db.prepare('SELECT COUNT(*) as count FROM materials').get().count;
if (materialsCount === 0) {
  const insertMaterial = db.prepare(`
    INSERT INTO materials (id, name, current_stock, threshold_stock, monthly_consumption, unit) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const materials = [
    ['madder-root', '茜草根', 500, 100, 200, 'g'],
    ['gardenia-fruit', '栀子果', 300, 80, 150, 'g'],
    ['sappanwood', '苏木', 200, 60, 100, 'g'],
    ['indigo-leaf', '蓝草叶', 400, 100, 180, 'g'],
    ['alum', '明矾（媒染剂）', 150, 50, 80, 'g'],
    ['iron-mordant', '铁媒染剂', 5, 30, 40, 'g']
  ];
  const tx = db.transaction((mats) => {
    for (const mat of mats) {
      insertMaterial.run(...mat);
    }
  });
  tx(materials);
}

const recipesCount = db.prepare('SELECT COUNT(*) as count FROM recipes').get().count;
if (recipesCount === 0) {
  const insertRecipe = db.prepare(`
    INSERT INTO recipes (id, name, main_dye_id, mordant, temperature, duration_hours, ph_value, estimated_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const recipes = [
    ['recipe-madder-red', '经典茜草红染', 'madder-root', 'alum', 60, 2.5, 6.5, 45.0],
    ['recipe-gardenia-yellow', '淡雅栀子黄染', 'gardenia-fruit', 'alum', 50, 2, 6, 35.0],
    ['recipe-sappan-purple', '深郁苏木紫染', 'sappanwood', 'iron-mordant', 70, 3, 5.5, 55.0],
    ['recipe-indigo-blue', '传统蓝草蓝染', 'indigo-leaf', 'alum', 45, 4, 8, 50.0]
  ];
  const tx = db.transaction((recs) => {
    for (const rec of recs) {
      insertRecipe.run(...rec);
    }
  });
  tx(recipes);

  const insertRecipeMaterial = db.prepare(`
    INSERT INTO recipe_materials (id, recipe_id, material_id, amount) VALUES (?, ?, ?, ?)
  `);
  const recipeMaterials = [
    ['rm-1', 'recipe-madder-red', 'madder-root', 50],
    ['rm-2', 'recipe-madder-red', 'alum', 20],
    ['rm-3', 'recipe-gardenia-yellow', 'gardenia-fruit', 40],
    ['rm-4', 'recipe-gardenia-yellow', 'alum', 15],
    ['rm-5', 'recipe-sappan-purple', 'sappanwood', 60],
    ['rm-6', 'recipe-sappan-purple', 'iron-mordant', 10],
    ['rm-7', 'recipe-indigo-blue', 'indigo-leaf', 55],
    ['rm-8', 'recipe-indigo-blue', 'alum', 25]
  ];
  const tx2 = db.transaction((rms) => {
    for (const rm of rms) {
      insertRecipeMaterial.run(...rm);
    }
  });
  tx2(recipeMaterials);
}

console.log('Database initialized successfully at:', dbPath);
db.close();
