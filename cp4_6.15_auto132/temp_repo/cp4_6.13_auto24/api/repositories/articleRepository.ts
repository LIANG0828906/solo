import { db } from '../db/init.js';
import {
  Article,
  ArticleDbRow,
  ProcessStep,
  ProcessStepDbRow,
  Leather,
  LeatherDbRow,
  mapArticle,
  mapProcessStep,
  mapLeather,
} from '../types/index.js';

function run(sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row: T) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows: T[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export async function getAllArticles(): Promise<Article[]> {
  const articleRows = await all<ArticleDbRow>('SELECT * FROM article ORDER BY completion_date DESC');
  return articleRows.map(mapArticle);
}

export async function getArticleById(id: number): Promise<Article | undefined> {
  const row = await get<ArticleDbRow>('SELECT * FROM article WHERE id = ?', [id]);
  if (!row) return undefined;

  const article = mapArticle(row);
  const steps = await getStepsByArticleId(article.id);
  const leatherIds = await getLeatherIdsByArticleId(article.id);
  const leathers = await getLeathersByIds(leatherIds);
  article.steps = steps;
  article.leatherIds = leatherIds;
  article.leathers = leathers;

  return article;
}

async function getStepsByArticleId(articleId: number): Promise<ProcessStep[]> {
  const rows = await all<ProcessStepDbRow>(
    'SELECT * FROM process_step WHERE article_id = ? ORDER BY step_order ASC',
    [articleId]
  );
  return rows.map(mapProcessStep);
}

async function getLeatherIdsByArticleId(articleId: number): Promise<number[]> {
  const rows = await all<{ leather_id: number }>(
    'SELECT leather_id FROM article_leather WHERE article_id = ?',
    [articleId]
  );
  return rows.map((r) => r.leather_id);
}

async function getLeathersByIds(ids: number[]): Promise<Leather[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await all<LeatherDbRow>(
    `SELECT * FROM leather WHERE id IN (${placeholders})`,
    ids
  );
  return rows.map(mapLeather);
}

export async function createArticle(data: {
  name: string;
  completionDate: string;
  mainImageUrl: string;
  steps: Array<{ stepOrder: number; description: string; duration: number }>;
  leatherIds: number[];
}): Promise<Article> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const articleSql =
        'INSERT INTO article (name, completion_date, main_image_url) VALUES (?, ?, ?)';
      const articleParams = [data.name, data.completionDate, data.mainImageUrl];

      db.run(articleSql, articleParams, function (err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }

        const articleId = this.lastID;
        const stepPromises: Promise<void>[] = [];

        for (const step of data.steps) {
          stepPromises.push(
            new Promise<void>((stepResolve, stepReject) => {
              const stepSql =
                'INSERT INTO process_step (article_id, step_order, description, duration) VALUES (?, ?, ?, ?)';
              const stepParams = [articleId, step.stepOrder, step.description, step.duration];
              db.run(stepSql, stepParams, (stepErr) => {
                if (stepErr) stepReject(stepErr);
                else stepResolve();
              });
            })
          );
        }

        const leatherPromises: Promise<void>[] = [];
        for (const leatherId of data.leatherIds) {
          leatherPromises.push(
            new Promise<void>((lrResolve, lrReject) => {
              const lrSql =
                'INSERT OR IGNORE INTO article_leather (article_id, leather_id) VALUES (?, ?)';
              db.run(lrSql, [articleId, leatherId], (lrErr) => {
                if (lrErr) lrReject(lrErr);
                else lrResolve();
              });
            })
          );
        }

        Promise.all([...stepPromises, ...leatherPromises])
          .then(() => {
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                db.run('ROLLBACK');
                reject(commitErr);
              } else {
                resolve({
                  id: articleId,
                  name: data.name,
                  completionDate: data.completionDate,
                  mainImageUrl: data.mainImageUrl,
                  steps: data.steps.map((s, i) => ({ ...s, id: i + 1, articleId })),
                  leatherIds: data.leatherIds,
                });
              }
            });
          })
          .catch((promiseErr) => {
            db.run('ROLLBACK');
            reject(promiseErr);
          });
      });
    });
  });
}

export async function updateArticle(
  id: number,
  data: {
    name?: string;
    completionDate?: string;
    mainImageUrl?: string;
    steps?: Array<{ stepOrder: number; description: string; duration: number }>;
    leatherIds?: number[];
  }
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const fields: string[] = [];
      const params: unknown[] = [];

      if (data.name !== undefined) {
        fields.push('name = ?');
        params.push(data.name);
      }
      if (data.completionDate !== undefined) {
        fields.push('completion_date = ?');
        params.push(data.completionDate);
      }
      if (data.mainImageUrl !== undefined) {
        fields.push('main_image_url = ?');
        params.push(data.mainImageUrl);
      }

      const runStep = (err: Error | null): void => {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }

        const deleteStepsPromise =
          data.steps !== undefined
            ? new Promise<void>((dsResolve, dsReject) => {
                db.run('DELETE FROM process_step WHERE article_id = ?', [id], (dsErr) => {
                  if (dsErr) dsReject(dsErr);
                  else dsResolve();
                });
              })
            : Promise.resolve();

        const deleteLeathersPromise =
          data.leatherIds !== undefined
            ? new Promise<void>((dlResolve, dlReject) => {
                db.run('DELETE FROM article_leather WHERE article_id = ?', [id], (dlErr) => {
                  if (dlErr) dlReject(dlErr);
                  else dlResolve();
                });
              })
            : Promise.resolve();

        Promise.all([deleteStepsPromise, deleteLeathersPromise])
          .then(() => {
            const stepPromises: Promise<void>[] = [];
            if (data.steps !== undefined) {
              for (const step of data.steps) {
                stepPromises.push(
                  new Promise<void>((sResolve, sReject) => {
                    const sql =
                      'INSERT INTO process_step (article_id, step_order, description, duration) VALUES (?, ?, ?, ?)';
                    db.run(
                      sql,
                      [id, step.stepOrder, step.description, step.duration],
                      (sErr) => {
                        if (sErr) sReject(sErr);
                        else sResolve();
                      }
                    );
                  })
                );
              }
            }

            const leatherPromises: Promise<void>[] = [];
            if (data.leatherIds !== undefined) {
              for (const leatherId of data.leatherIds) {
                leatherPromises.push(
                  new Promise<void>((lResolve, lReject) => {
                    const sql =
                      'INSERT OR IGNORE INTO article_leather (article_id, leather_id) VALUES (?, ?)';
                    db.run(sql, [id, leatherId], (lErr) => {
                      if (lErr) lReject(lErr);
                      else lResolve();
                    });
                  })
                );
              }
            }

            return Promise.all([...stepPromises, ...leatherPromises]);
          })
          .then(() => {
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                db.run('ROLLBACK');
                reject(commitErr);
              } else {
                resolve();
              }
            });
          })
          .catch((pErr) => {
            db.run('ROLLBACK');
            reject(pErr);
          });
      };

      if (fields.length > 0) {
        params.push(id);
        db.run(`UPDATE article SET ${fields.join(', ')} WHERE id = ?`, params, runStep);
      } else {
        runStep(null);
      }
    });
  });
}

export async function deleteArticle(id: number): Promise<void> {
  await run('DELETE FROM article WHERE id = ?', [id]);
}

export async function getArticleExists(id: number): Promise<boolean> {
  const row = await get<{ count: number }>('SELECT COUNT(*) as count FROM article WHERE id = ?', [
    id,
  ]);
  return (row?.count ?? 0) > 0;
}
