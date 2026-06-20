import { db } from '../db/init.js';
import { WorkshopStats } from '../types/index.js';

export async function getStats(): Promise<WorkshopStats> {
  const leatherResult = await new Promise<{ count: number }>((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM leather', (err, row: { count: number }) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  const articleResult = await new Promise<{ count: number }>((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM article', (err, row: { count: number }) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  const remainingResult = await new Promise<{ total: number }>((resolve, reject) => {
    db.get('SELECT COALESCE(SUM(remaining), 0) as total FROM leather', (err, row: { total: number }) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  return {
    totalLeatherTypes: leatherResult.count,
    totalArticles: articleResult.count,
    totalRemainingArea: remainingResult.total,
  };
}
