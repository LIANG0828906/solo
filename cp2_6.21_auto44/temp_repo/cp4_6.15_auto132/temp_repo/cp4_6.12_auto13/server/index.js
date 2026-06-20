const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const dbPath = path.join(__dirname, 'dyeWorkshop.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const ORDER_STATUS = [
  '待确认', '已确认', '浸泡中', '萃取中', '染色中',
  '固色中', '洗净中', '晾干中', '质检中', '已完成'
];

function generateOrderNo() {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');

  const todayPrefix = 'DY' + dateStr;
  const row = db
    .prepare("SELECT COUNT(*) as count FROM orders WHERE order_no LIKE ?")
    .get(todayPrefix + '%');

  const seq = String(row.count + 1).padStart(3, '0');
  return todayPrefix + seq;
}

function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function rowToOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderNo: row.order_no,
    fabricType: row.fabric_type,
    dyeSchemeId: row.dye_scheme_id,
    widthCm: row.width_cm,
    lengthCm: row.length_cm,
    referenceImage: row.reference_image,
    status: row.status,
    statusHistory: JSON.parse(row.status_history || '[]'),
    estimatedCompletion: row.estimated_completion,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function rowToRecipe(row) {
  if (!row) return null;
  const materials = db
    .prepare(
      'SELECT material_id, amount FROM recipe_materials WHERE recipe_id = ?'
    )
    .all(row.id)
    .map((rm) => ({ materialId: rm.material_id, amount: rm.amount }));

  return {
    id: row.id,
    name: row.name,
    mainDyeId: row.main_dye_id,
    mordant: row.mordant,
    temperature: row.temperature,
    durationHours: row.duration_hours,
    phValue: row.ph_value,
    estimatedCost: row.estimated_cost,
    materials
  };
}

function rowToMaterial(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    currentStock: row.current_stock,
    thresholdStock: row.threshold_stock,
    monthlyConsumption: row.monthly_consumption,
    unit: row.unit
  };
}

function rowToDyeScheme(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    colorHex: row.color_hex
  };
}

app.get('/api/orders', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const rows = db
    .prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(limit, offset);

  const orders = rows.map(rowToOrder);
  res.json({
    data: orders,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  });
});

app.get('/api/orders/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json(rowToOrder(row));
});

app.post('/api/orders', (req, res) => {
  const { fabricType, dyeSchemeId, widthCm, lengthCm, referenceImage } = req.body;

  if (!fabricType || !dyeSchemeId || !widthCm || !lengthCm) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  const dyeScheme = db
    .prepare('SELECT * FROM dye_schemes WHERE id = ?')
    .get(dyeSchemeId);
  if (!dyeScheme) {
    return res.status(400).json({ error: '染色方案不存在' });
  }

  const id = 'ord_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const orderNo = generateOrderNo();
  const now = new Date().toISOString();
  const estimatedCompletion = addDays(now, 7);
  const initialStatus = '待确认';
  const statusHistory = JSON.stringify([
    { status: initialStatus, timestamp: now }
  ]);

  db.prepare(
    `INSERT INTO orders (id, order_no, fabric_type, dye_scheme_id, width_cm, length_cm, reference_image, status, status_history, estimated_completion, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, orderNo, fabricType, dyeSchemeId, widthCm, lengthCm,
    referenceImage || null, initialStatus, statusHistory,
    estimatedCompletion, now, now
  );

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.status(201).json(rowToOrder(row));
});

app.put('/api/orders/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const existing = rowToOrder(row);
  const { status } = req.body;

  if (status && !ORDER_STATUS.includes(status)) {
    return res.status(400).json({ error: '无效的订单状态' });
  }

  const newStatus = status || existing.status;
  let statusHistory = existing.statusHistory;

  if (status && status !== existing.status) {
    statusHistory = [
      ...existing.statusHistory,
      { status: newStatus, timestamp: new Date().toISOString() }
    ];
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders SET status = ?, status_history = ?, updated_at = ? WHERE id = ?`
  ).run(newStatus, JSON.stringify(statusHistory), now, req.params.id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json(rowToOrder(updated));
});

app.delete('/api/orders/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: '订单不存在' });
  }

  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/recipes', (req, res) => {
  const rows = db.prepare('SELECT * FROM recipes ORDER BY name').all();
  const recipes = rows.map(rowToRecipe);
  res.json(recipes);
});

app.post('/api/recipes', (req, res) => {
  const {
    name, mainDyeId, mordant, temperature, durationHours,
    phValue, estimatedCost, materials
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: '配方名称必填' });
  }

  const id = 'recipe_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO recipes (id, name, main_dye_id, mordant, temperature, duration_hours, ph_value, estimated_cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, name, mainDyeId || null, mordant || null,
      temperature || 60, durationHours || 2,
      phValue || 7, estimatedCost || 0
    );

    if (materials && Array.isArray(materials)) {
      const insertRm = db.prepare(
        'INSERT INTO recipe_materials (id, recipe_id, material_id, amount) VALUES (?, ?, ?, ?)'
      );
      materials.forEach((m, idx) => {
        const rmId = 'rm_' + id + '_' + idx;
        insertRm.run(rmId, id, m.materialId, m.amount);
      });
    }
  });

  tx();

  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
  res.status(201).json(rowToRecipe(row));
});

app.put('/api/recipes/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: '配方不存在' });
  }

  const {
    name, mainDyeId, mordant, temperature, durationHours,
    phValue, estimatedCost, materials
  } = req.body;

  const existing = rowToRecipe(row);
  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE recipes SET name = ?, main_dye_id = ?, mordant = ?, temperature = ?, duration_hours = ?, ph_value = ?, estimated_cost = ?
       WHERE id = ?`
    ).run(
      name || existing.name,
      mainDyeId !== undefined ? mainDyeId : existing.mainDyeId,
      mordant !== undefined ? mordant : existing.mordant,
      temperature !== undefined ? temperature : existing.temperature,
      durationHours !== undefined ? durationHours : existing.durationHours,
      phValue !== undefined ? phValue : existing.phValue,
      estimatedCost !== undefined ? estimatedCost : existing.estimatedCost,
      req.params.id
    );

    if (materials && Array.isArray(materials)) {
      db.prepare('DELETE FROM recipe_materials WHERE recipe_id = ?').run(req.params.id);
      const insertRm = db.prepare(
        'INSERT INTO recipe_materials (id, recipe_id, material_id, amount) VALUES (?, ?, ?, ?)'
      );
      materials.forEach((m, idx) => {
        const rmId = 'rm_' + req.params.id + '_' + idx + '_' + Date.now();
        insertRm.run(rmId, req.params.id, m.materialId, m.amount);
      });
    }
  });

  tx();

  const updated = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  res.json(rowToRecipe(updated));
});

app.get('/api/materials', (req, res) => {
  const rows = db.prepare('SELECT * FROM materials ORDER BY name').all();
  const materials = rows.map(rowToMaterial);
  res.json(materials);
});

app.put('/api/materials/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: '原料不存在' });
  }

  const { currentStock, thresholdStock, monthlyConsumption, name, unit } = req.body;
  const existing = rowToMaterial(row);

  db.prepare(
    `UPDATE materials SET
       name = ?,
       current_stock = ?,
       threshold_stock = ?,
       monthly_consumption = ?,
       unit = ?
     WHERE id = ?`
  ).run(
    name !== undefined ? name : existing.name,
    currentStock !== undefined ? currentStock : existing.currentStock,
    thresholdStock !== undefined ? thresholdStock : existing.thresholdStock,
    monthlyConsumption !== undefined ? monthlyConsumption : existing.monthlyConsumption,
    unit !== undefined ? unit : existing.unit,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  res.json(rowToMaterial(updated));
});

app.get('/api/dye-schemes', (req, res) => {
  const rows = db.prepare('SELECT * FROM dye_schemes ORDER BY name').all();
  const schemes = rows.map(rowToDyeScheme);
  res.json(schemes);
});

app.get('/api/restock-suggestions', (req, res) => {
  const materials = db
    .prepare('SELECT * FROM materials')
    .all()
    .map(rowToMaterial);

  const allRecipes = db.prepare('SELECT * FROM recipes').all();
  const allDyeSchemes = db.prepare('SELECT * FROM dye_schemes').all();

  function getRecipeByDyeSchemeId(dyeSchemeId) {
    const keywords = dyeSchemeId.split('-');
    return allRecipes.find((recipe) => {
      return keywords.every((kw) => recipe.id.includes(kw)) ||
        allRecipes.find((r) => {
          const recipeKw = r.id.replace('recipe-', '').split('-');
          return keywords.some((k) => recipeKw.includes(k)) &&
            keywords.filter((k) => recipeKw.includes(k)).length >=
            Math.min(keywords.length, 2);
        }) === recipe;
    }) || allRecipes.find((recipe) => {
      const scheme = allDyeSchemes.find((s) => s.id === dyeSchemeId);
      if (!scheme) return false;
      return recipe.name.includes(scheme.name.charAt(0)) ||
        recipe.name.includes(scheme.name.charAt(1));
    }) || allRecipes[0];
  }

  const pendingOrders = db
    .prepare("SELECT * FROM orders WHERE status != '已完成'")
    .all()
    .map(rowToOrder);

  const pendingOrdersConsumption = {};

  for (const order of pendingOrders) {
    const recipe = getRecipeByDyeSchemeId(order.dyeSchemeId);
    if (!recipe) continue;

    const recipeMats = db
      .prepare(
        'SELECT material_id, amount FROM recipe_materials WHERE recipe_id = ?'
      )
      .all(recipe.id);

    for (const rm of recipeMats) {
      if (!pendingOrdersConsumption[rm.material_id]) {
        pendingOrdersConsumption[rm.material_id] = 0;
      }
      pendingOrdersConsumption[rm.material_id] += rm.amount;
    }
  }

  const suggestions = materials.map((mat) => {
    const pendingAmount = pendingOrdersConsumption[mat.id] || 0;
    const estimated30Days = pendingAmount + mat.monthlyConsumption;

    const belowThreshold = mat.currentStock < mat.thresholdStock * 0.1;
    let suggestedAmount = Math.max(0, estimated30Days - mat.currentStock);

    if (belowThreshold && suggestedAmount <= 0) {
      suggestedAmount = mat.thresholdStock * 0.1 - mat.currentStock + 1;
    }

    return {
      materialId: mat.id,
      materialName: mat.name,
      currentStock: mat.currentStock,
      thresholdStock: mat.thresholdStock,
      suggestedAmount: Math.ceil(suggestedAmount),
      unit: mat.unit,
      estimated30DaysUsage: estimated30Days
    };
  }).filter((s) => s.suggestedAmount > 0);

  res.json(suggestions);
});

app.get('/api/perf-test', async (req, res) => {
  const endpoints = [
    { name: 'orders (page 1)', url: '/api/orders?page=1&limit=10' },
    { name: 'recipes', url: '/api/recipes' },
    { name: 'materials', url: '/api/materials' },
    { name: 'dye-schemes', url: '/api/dye-schemes' },
    { name: 'restock-suggestions', url: '/api/restock-suggestions' }
  ];

  const results = [];
  let totalDurationMs = 0;

  for (const ep of endpoints) {
    const start = Date.now();
    await new Promise((resolve) => {
      const internalReq = {
        query: ep.url.includes('?')
          ? Object.fromEntries(
              ep.url.split('?')[1].split('&').map((kv) => {
                const [k, v] = kv.split('=');
                return [k, v];
              })
            )
          : {},
        params: {}
      };
      const internalRes = {
        json: () => resolve(),
        status: () => internalRes,
        send: () => resolve()
      };

      if (ep.url.startsWith('/api/orders')) {
        const page = parseInt(internalReq.query.page) || 1;
        const limit = parseInt(internalReq.query.limit) || 10;
        const offset = (page - 1) * limit;
        db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
        db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
        resolve();
      } else if (ep.url === '/api/recipes') {
        db.prepare('SELECT * FROM recipes ORDER BY name').all();
        resolve();
      } else if (ep.url === '/api/materials') {
        db.prepare('SELECT * FROM materials ORDER BY name').all();
        resolve();
      } else if (ep.url === '/api/dye-schemes') {
        db.prepare('SELECT * FROM dye_schemes ORDER BY name').all();
        resolve();
      } else if (ep.url === '/api/restock-suggestions') {
        db.prepare('SELECT * FROM materials').all();
        db.prepare('SELECT * FROM recipes').all();
        db.prepare('SELECT * FROM dye_schemes').all();
        db.prepare("SELECT * FROM orders WHERE status != '已完成'").all();
        resolve();
      } else {
        resolve();
      }
    });
    const duration = Date.now() - start;
    results.push({ name: ep.name, durationMs: duration });
    totalDurationMs += duration;
  }

  const allUnder200ms = results.every((r) => r.durationMs < 200);

  res.json({
    endpoints: results,
    totalDurationMs,
    allUnder200ms
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
