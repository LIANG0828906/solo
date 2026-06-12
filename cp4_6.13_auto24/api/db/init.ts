import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
const dbPath = path.join(dataDir, 'workshop.db');

const sqlite = sqlite3.verbose();
export const db = new sqlite.Database(dbPath);

export async function initializeDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS leather (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      thickness REAL NOT NULL,
      area REAL NOT NULL,
      remaining REAL NOT NULL,
      receive_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS article (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      completion_date TEXT NOT NULL,
      main_image_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS process_step (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      step_order INTEGER NOT NULL,
      description TEXT NOT NULL,
      duration INTEGER NOT NULL,
      FOREIGN KEY (article_id) REFERENCES article(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS article_leather (
      article_id INTEGER NOT NULL,
      leather_id INTEGER NOT NULL,
      PRIMARY KEY (article_id, leather_id),
      FOREIGN KEY (article_id) REFERENCES article(id) ON DELETE CASCADE,
      FOREIGN KEY (leather_id) REFERENCES leather(id) ON DELETE CASCADE
    );
  `;

  await new Promise<void>((resolve, reject) => {
    db.exec(createTablesSql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const createIndexesSql = `
    CREATE INDEX IF NOT EXISTS idx_leather_receive_date ON leather(receive_date DESC);
    CREATE INDEX IF NOT EXISTS idx_process_step_article_id ON process_step(article_id);
    CREATE INDEX IF NOT EXISTS idx_process_step_step_order ON process_step(step_order);
    CREATE INDEX IF NOT EXISTS idx_article_leather_article_id ON article_leather(article_id);
    CREATE INDEX IF NOT EXISTS idx_article_leather_leather_id ON article_leather(leather_id);
  `;

  await new Promise<void>((resolve, reject) => {
    db.exec(createIndexesSql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await seedData();
}

async function seedData(): Promise<void> {
  const leatherCount = await new Promise<number>((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM leather', (err, row: { count: number }) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });

  if (leatherCount === 0) {
    const seedLeatherSql = `
      INSERT INTO leather (name, type, thickness, area, remaining, receive_date) VALUES
      ('意大利小牛皮', '牛皮', 1.2, 25.5, 25.5, '2026-01-15'),
      ('法国山羊皮', '羊皮', 0.9, 18.0, 18.0, '2026-02-10'),
      ('日本枥木皮', '牛皮', 1.5, 30.0, 30.0, '2026-03-05'),
      ('鳄鱼纹牛皮', '牛皮', 1.3, 22.0, 22.0, '2026-03-20'),
      ('鸵鸟皮', '特种皮', 1.0, 15.0, 15.0, '2026-04-01');
    `;
    await new Promise<void>((resolve, reject) => {
      db.exec(seedLeatherSql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  const articleCount = await new Promise<number>((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM article', (err, row: { count: number }) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });

  if (articleCount === 0) {
    const seedArticleSql = `
      INSERT INTO article (name, completion_date, main_image_url) VALUES
      ('长款钱包', '2026-05-01', '/images/wallet-long.jpg'),
      ('卡包', '2026-05-15', '/images/cardholder.jpg'),
      ('手账本封面', '2026-06-01', '/images/notebook.jpg');
    `;
    await new Promise<void>((resolve, reject) => {
      db.exec(seedArticleSql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const seedStepSql = `
      INSERT INTO process_step (article_id, step_order, description, duration) VALUES
      (1, 1, '裁皮下料', 30),
      (1, 2, '边缘处理', 45),
      (1, 3, '内里缝合', 60),
      (1, 4, '整体组装', 90),
      (1, 5, '打磨上油', 40),
      (2, 1, '裁皮下料', 20),
      (2, 2, '卡位制作', 50),
      (2, 3, '边缘处理', 30),
      (2, 4, '缝合组装', 45),
      (3, 1, '裁皮下料', 25),
      (3, 2, '压印图案', 35),
      (3, 3, '边缘处理', 40),
      (3, 4, '装订制作', 80);
    `;
    await new Promise<void>((resolve, reject) => {
      db.exec(seedStepSql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const seedRelationSql = `
      INSERT INTO article_leather (article_id, leather_id) VALUES
      (1, 1),
      (1, 2),
      (2, 2),
      (2, 3),
      (3, 3),
      (3, 4);
    `;
    await new Promise<void>((resolve, reject) => {
      db.exec(seedRelationSql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
