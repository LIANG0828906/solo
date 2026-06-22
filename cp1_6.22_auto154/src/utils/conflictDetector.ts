import { v4 as uuidv4 } from 'uuid';
import type { Guest, Relation, Table, Conflict } from '../types';

export function detectConflicts(
  guests: Guest[],
  relations: Relation[],
  tables: Table[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  const guestToTable = new Map<string, string>();

  for (const table of tables) {
    for (const seat of table.seats) {
      if (seat) guestToTable.set(seat, table.id);
    }
  }

  const guestMap = new Map(guests.map(g => [g.id, g]));

  for (const rel of relations) {
    const g1 = guestMap.get(rel.guest1Id);
    const g2 = guestMap.get(rel.guest2Id);
    if (!g1 || !g2) continue;

    const t1 = guestToTable.get(rel.guest1Id);
    const t2 = guestToTable.get(rel.guest2Id);

    if (rel.type === 'enemy') {
      if (t1 && t2 && t1 === t2) {
        conflicts.push({
          id: uuidv4(),
          type: 'enemy_same_table',
          guestIds: [rel.guest1Id, rel.guest2Id],
          tableIds: [t1],
          message: `仇人 ${g1.name} 与 ${g2.name} 被安排在同一桌`
        });
      }
    } else if (rel.type === 'couple') {
      if ((t1 || t2) && t1 !== t2) {
        conflicts.push({
          id: uuidv4(),
          type: 'couple_separated',
          guestIds: [rel.guest1Id, rel.guest2Id],
          tableIds: [t1!, t2!].filter(Boolean),
          message: `情侣 ${g1.name} 与 ${g2.name} 被拆分到不同桌`
        });
      }
    }
  }

  return conflicts;
}

export function getTablesWithEnemyConflicts(conflicts: Conflict[]): Set<string> {
  const set = new Set<string>();
  for (const c of conflicts) {
    if (c.type === 'enemy_same_table') {
      c.tableIds.forEach(id => set.add(id));
    }
  }
  return set;
}

export function getSeparatedCouples(conflicts: Conflict[]): Conflict[] {
  return conflicts.filter(c => c.type === 'couple_separated');
}
