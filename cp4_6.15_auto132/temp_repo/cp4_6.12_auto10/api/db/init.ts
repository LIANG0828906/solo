import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '..', '..', 'data.db')

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      vessel_type TEXT NOT NULL,
      caliber REAL NOT NULL,
      height REAL NOT NULL,
      base_diameter REAL NOT NULL,
      reference_images TEXT,
      clay_type TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS glaze_formulas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      base_type TEXT NOT NULL,
      target_temp_min INTEGER NOT NULL,
      target_temp_max INTEGER NOT NULL,
      heating_curve TEXT,
      holding_time INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS glaze_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      glaze_id TEXT NOT NULL,
      material TEXT NOT NULL,
      percentage REAL NOT NULL,
      FOREIGN KEY (glaze_id) REFERENCES glaze_formulas(id)
    );

    CREATE TABLE IF NOT EXISTS kiln_firings (
      id TEXT PRIMARY KEY,
      batch_number TEXT NOT NULL UNIQUE,
      glaze_ids TEXT,
      positions TEXT,
      start_time TEXT NOT NULL,
      target_temperature INTEGER NOT NULL,
      heating_rate INTEGER NOT NULL,
      holding_duration INTEGER NOT NULL,
      temperature_records TEXT,
      status TEXT NOT NULL DEFAULT 'preparing',
      report TEXT
    );

    CREATE TABLE IF NOT EXISTS greenware_stock (
      id TEXT PRIMARY KEY,
      clay_type TEXT NOT NULL,
      vessel_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      shelf_area TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS raw_material_stock (
      id TEXT PRIMARY KEY,
      material TEXT NOT NULL UNIQUE,
      current_stock INTEGER NOT NULL,
      min_threshold INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS finished_products (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      glaze_id TEXT,
      firing_batch_id TEXT,
      caliber REAL NOT NULL,
      height REAL NOT NULL,
      weight INTEGER NOT NULL,
      quality_rating INTEGER NOT NULL,
      photo_url TEXT,
      created_at TEXT NOT NULL
    );
  `)

  seedMockData()
}

function seedMockData(): void {
  const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as {
    count: number
  }
  if (ordersCount.count > 0) return

  const now = new Date().toISOString()

  const orderIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4()]
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer_name, customer_phone, vessel_type, caliber, height, base_diameter, reference_images, clay_type, notes, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertStatusHistory = db.prepare(`
    INSERT INTO order_status_history (order_id, status, timestamp)
    VALUES (?, ?, ?)
  `)

  const ordersData = [
    {
      id: orderIds[0],
      customerName: '张伟',
      customerPhone: '13800138001',
      vesselType: 'cup' as const,
      caliber: 8,
      height: 10,
      baseDiameter: 4,
      referenceImages: JSON.stringify([]),
      clayType: 'white_porcelain' as const,
      notes: '把手要圆润',
      status: 'completed' as const,
    },
    {
      id: orderIds[1],
      customerName: '李娜',
      customerPhone: '13800138002',
      vesselType: 'vase' as const,
      caliber: 15,
      height: 30,
      baseDiameter: 10,
      referenceImages: JSON.stringify([]),
      clayType: 'stoneware' as const,
      notes: '需要刻花纹',
      status: 'glaze' as const,
    },
    {
      id: orderIds[2],
      customerName: '王强',
      customerPhone: '13800138003',
      vesselType: 'bowl' as const,
      caliber: 12,
      height: 6,
      baseDiameter: 5,
      referenceImages: JSON.stringify([]),
      clayType: 'red_clay' as const,
      notes: '',
      status: 'throwing' as const,
    },
    {
      id: orderIds[3],
      customerName: '刘洋',
      customerPhone: '13800138004',
      vesselType: 'teapot' as const,
      caliber: 10,
      height: 12,
      baseDiameter: 6,
      referenceImages: JSON.stringify([]),
      clayType: 'coarse_pottery' as const,
      notes: '壶嘴要流畅',
      status: 'bisque' as const,
    },
    {
      id: orderIds[4],
      customerName: '陈静',
      customerPhone: '13800138005',
      vesselType: 'plate' as const,
      caliber: 20,
      height: 2,
      baseDiameter: 12,
      referenceImages: JSON.stringify([]),
      clayType: 'white_porcelain' as const,
      notes: '要描金边',
      status: 'pending' as const,
    },
  ]

  const statuses: Array<Array<{ status: string; timestamp: string }>> = [
    [
      { status: 'pending', timestamp: new Date(Date.now() - 7 * 86400000).toISOString() },
      { status: 'confirmed', timestamp: new Date(Date.now() - 6 * 86400000).toISOString() },
      { status: 'preparing', timestamp: new Date(Date.now() - 5 * 86400000).toISOString() },
      { status: 'throwing', timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
      { status: 'trimming', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
      { status: 'bisque', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
      { status: 'glaze', timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
      { status: 'polishing', timestamp: new Date(Date.now() - 12 * 3600000).toISOString() },
      { status: 'completed', timestamp: now },
    ],
    [
      { status: 'pending', timestamp: new Date(Date.now() - 5 * 86400000).toISOString() },
      { status: 'confirmed', timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
      { status: 'preparing', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
      { status: 'throwing', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
      { status: 'trimming', timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
      { status: 'bisque', timestamp: new Date(Date.now() - 8 * 3600000).toISOString() },
      { status: 'glaze', timestamp: now },
    ],
    [
      { status: 'pending', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
      { status: 'confirmed', timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
      { status: 'preparing', timestamp: new Date(Date.now() - 6 * 3600000).toISOString() },
      { status: 'throwing', timestamp: now },
    ],
    [
      { status: 'pending', timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
      { status: 'confirmed', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
      { status: 'preparing', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
      { status: 'throwing', timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
      { status: 'trimming', timestamp: new Date(Date.now() - 12 * 3600000).toISOString() },
      { status: 'bisque', timestamp: now },
    ],
    [{ status: 'pending', timestamp: now }],
  ]

  for (let i = 0; i < ordersData.length; i++) {
    const o = ordersData[i]
    insertOrder.run(
      o.id,
      o.customerName,
      o.customerPhone,
      o.vesselType,
      o.caliber,
      o.height,
      o.baseDiameter,
      o.referenceImages,
      o.clayType,
      o.notes,
      o.status,
      statuses[i][0].timestamp,
    )
    for (const h of statuses[i]) {
      insertStatusHistory.run(o.id, h.status, h.timestamp)
    }
  }

  const glazeIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4()]
  const insertGlaze = db.prepare(`
    INSERT INTO glaze_formulas (id, name, base_type, target_temp_min, target_temp_max, heating_curve, holding_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const insertIngredient = db.prepare(`
    INSERT INTO glaze_ingredients (glaze_id, material, percentage)
    VALUES (?, ?, ?)
  `)

  const glazesData = [
    {
      id: glazeIds[0],
      name: '青瓷透明釉',
      baseType: 'transparent' as const,
      targetTempMin: 1230,
      targetTempMax: 1250,
      heatingCurve: '标准还原焰',
      holdingTime: 30,
      ingredients: [
        { material: 'feldspar', percentage: 40 },
        { material: 'quartz', percentage: 25 },
        { material: 'kaolin', percentage: 20 },
        { material: 'limestone', percentage: 15 },
      ],
    },
    {
      id: glazeIds[1],
      name: '哑光白釉',
      baseType: 'opaque' as const,
      targetTempMin: 1200,
      targetTempMax: 1220,
      heatingCurve: '氧化焰慢速',
      holdingTime: 20,
      ingredients: [
        { material: 'feldspar', percentage: 35 },
        { material: 'quartz', percentage: 30 },
        { material: 'kaolin', percentage: 25 },
        { material: 'limestone', percentage: 10 },
      ],
    },
    {
      id: glazeIds[2],
      name: '结晶铁红釉',
      baseType: 'crystalline' as const,
      targetTempMin: 1260,
      targetTempMax: 1280,
      heatingCurve: '还原焰保温',
      holdingTime: 45,
      ingredients: [
        { material: 'feldspar', percentage: 30 },
        { material: 'quartz', percentage: 20 },
        { material: 'kaolin', percentage: 15 },
        { material: 'limestone', percentage: 10 },
        { material: 'iron_oxide', percentage: 25 },
      ],
    },
    {
      id: glazeIds[3],
      name: '钴蓝金属釉',
      baseType: 'metallic' as const,
      targetTempMin: 1240,
      targetTempMax: 1260,
      heatingCurve: '还原焰',
      holdingTime: 35,
      ingredients: [
        { material: 'feldspar', percentage: 38 },
        { material: 'quartz', percentage: 22 },
        { material: 'kaolin', percentage: 18 },
        { material: 'limestone', percentage: 12 },
        { material: 'cobalt_oxide', percentage: 10 },
      ],
    },
  ]

  for (const g of glazesData) {
    insertGlaze.run(
      g.id,
      g.name,
      g.baseType,
      g.targetTempMin,
      g.targetTempMax,
      g.heatingCurve,
      g.holdingTime,
    )
    for (const ing of g.ingredients) {
      insertIngredient.run(g.id, ing.material, ing.percentage)
    }
  }

  const insertKiln = db.prepare(`
    INSERT INTO kiln_firings (id, batch_number, glaze_ids, positions, start_time, target_temperature, heating_rate, holding_duration, temperature_records, status, report)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const kilnIds = [uuidv4(), uuidv4()]
  const positions1 = [
    { row: 0, col: 0, clayType: 'white_porcelain', orderId: orderIds[0] },
    { row: 0, col: 1, clayType: 'stoneware', orderId: orderIds[1] },
    { row: 1, col: 0, clayType: 'red_clay', orderId: null },
    { row: 1, col: 1, clayType: null, orderId: null },
  ]
  const tempRecords1 = [
    { timestamp: new Date(Date.now() - 10 * 3600000).toISOString(), temperature: 20, remainingMinutes: 480 },
    { timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), temperature: 300, remainingMinutes: 360 },
    { timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), temperature: 600, remainingMinutes: 240 },
    { timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), temperature: 900, remainingMinutes: 120 },
    { timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), temperature: 1200, remainingMinutes: 30 },
    { timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), temperature: 1240, remainingMinutes: 0 },
  ]
  const positions2 = [
    { row: 0, col: 0, clayType: 'coarse_pottery', orderId: orderIds[3] },
    { row: 0, col: 1, clayType: null, orderId: null },
    { row: 1, col: 0, clayType: null, orderId: null },
    { row: 1, col: 1, clayType: null, orderId: null },
  ]
  const tempRecords2 = [
    { timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), temperature: 20, remainingMinutes: 480 },
    { timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), temperature: 200, remainingMinutes: 420 },
  ]

  insertKiln.run(
    kilnIds[0],
    'BATCH-2024-001',
    JSON.stringify([glazeIds[0], glazeIds[2]]),
    JSON.stringify(positions1),
    new Date(Date.now() - 10 * 3600000).toISOString(),
    1240,
    150,
    30,
    JSON.stringify(tempRecords1),
    'completed',
    JSON.stringify({ tempDeviation: '±5°C，控制良好', colorEffect: '色泽均匀，釉面光滑' }),
  )
  insertKiln.run(
    kilnIds[1],
    'BATCH-2024-002',
    JSON.stringify([glazeIds[1]]),
    JSON.stringify(positions2),
    new Date(Date.now() - 3 * 3600000).toISOString(),
    1210,
    120,
    20,
    JSON.stringify(tempRecords2),
    'firing',
    null,
  )

  const insertGreenware = db.prepare(`
    INSERT INTO greenware_stock (id, clay_type, vessel_type, quantity, shelf_area)
    VALUES (?, ?, ?, ?, ?)
  `)
  const greenwareData = [
    { id: uuidv4(), clayType: 'white_porcelain' as const, vesselType: 'cup' as const, quantity: 20, shelfArea: 'A' as const },
    { id: uuidv4(), clayType: 'white_porcelain' as const, vesselType: 'bowl' as const, quantity: 15, shelfArea: 'A' as const },
    { id: uuidv4(), clayType: 'stoneware' as const, vesselType: 'vase' as const, quantity: 8, shelfArea: 'B' as const },
    { id: uuidv4(), clayType: 'red_clay' as const, vesselType: 'plate' as const, quantity: 12, shelfArea: 'B' as const },
    { id: uuidv4(), clayType: 'coarse_pottery' as const, vesselType: 'teapot' as const, quantity: 5, shelfArea: 'C' as const },
  ]
  for (const g of greenwareData) {
    insertGreenware.run(g.id, g.clayType, g.vesselType, g.quantity, g.shelfArea)
  }

  const insertMaterial = db.prepare(`
    INSERT INTO raw_material_stock (id, material, current_stock, min_threshold)
    VALUES (?, ?, ?, ?)
  `)
  const materialData = [
    { id: uuidv4(), material: 'feldspar' as const, currentStock: 50000, minThreshold: 10000 },
    { id: uuidv4(), material: 'quartz' as const, currentStock: 45000, minThreshold: 10000 },
    { id: uuidv4(), material: 'kaolin' as const, currentStock: 30000, minThreshold: 10000 },
    { id: uuidv4(), material: 'limestone' as const, currentStock: 8000, minThreshold: 10000 },
    { id: uuidv4(), material: 'iron_oxide' as const, currentStock: 5000, minThreshold: 2000 },
    { id: uuidv4(), material: 'cobalt_oxide' as const, currentStock: 1500, minThreshold: 2000 },
  ]
  for (const m of materialData) {
    insertMaterial.run(m.id, m.material, m.currentStock, m.minThreshold)
  }

  const insertFinished = db.prepare(`
    INSERT INTO finished_products (id, order_id, glaze_id, firing_batch_id, caliber, height, weight, quality_rating, photo_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const finishedData = [
    {
      id: uuidv4(),
      orderId: orderIds[0],
      glazeId: glazeIds[0],
      firingBatchId: kilnIds[0],
      caliber: 8,
      height: 10,
      weight: 180,
      qualityRating: 5 as const,
      photoUrl: '',
      createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
    {
      id: uuidv4(),
      orderId: null,
      glazeId: glazeIds[2],
      firingBatchId: kilnIds[0],
      caliber: 12,
      height: 6,
      weight: 250,
      qualityRating: 4 as const,
      photoUrl: '',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: uuidv4(),
      orderId: null,
      glazeId: glazeIds[0],
      firingBatchId: kilnIds[0],
      caliber: 10,
      height: 8,
      weight: 200,
      qualityRating: 5 as const,
      photoUrl: '',
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    },
  ]
  for (const f of finishedData) {
    insertFinished.run(
      f.id,
      f.orderId,
      f.glazeId,
      f.firingBatchId,
      f.caliber,
      f.height,
      f.weight,
      f.qualityRating,
      f.photoUrl,
      f.createdAt,
    )
  }
}

export default db
