export type RelationshipType = 'family' | 'colleague' | 'friend' | 'couple' | 'enemy';

export interface Guest {
  id: string;
  name: string;
  relationships: {
    guestId: string;
    type: RelationshipType;
  }[];
}

export interface Table {
  id: string;
  tableNumber: number;
  seats: (string | null)[];
}

export interface Conflict {
  type: 'enemy_same_table' | 'couple_separated';
  guestIds: string[];
  tableIds?: string[];
  message: string;
}

export const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  family: '#10B981',
  colleague: '#3B82F6',
  friend: '#F59E0B',
  couple: '#EC4899',
  enemy: '#EF4444',
};

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  family: '家人',
  colleague: '同事',
  friend: '朋友',
  couple: '情侣',
  enemy: '仇人',
};

export function getGuestRelationships(guestId: string, guests: Guest[]): Guest['relationships'] {
  const guest = guests.find(g => g.id === guestId);
  if (!guest) return [];
  
  const allRelationships = [...guest.relationships];
  
  guests.forEach(g => {
    if (g.id !== guestId) {
      g.relationships.forEach(rel => {
        if (rel.guestId === guestId) {
          const exists = allRelationships.some(r => r.guestId === g.id);
          if (!exists) {
            allRelationships.push({ guestId: g.id, type: rel.type });
          }
        }
      });
    }
  });
  
  return allRelationships;
}

export function getRelationshipBetween(
  guest1Id: string,
  guest2Id: string,
  guests: Guest[]
): RelationshipType | null {
  const relationships = getGuestRelationships(guest1Id, guests);
  const rel = relationships.find(r => r.guestId === guest2Id);
  return rel ? rel.type : null;
}

export function checkConflicts(tables: Table[], guests: Guest[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const guestTableMap = new Map<string, string>();

  tables.forEach(table => {
    table.seats.forEach(guestId => {
      if (guestId) {
        guestTableMap.set(guestId, table.id);
      }
    });
  });

  tables.forEach(table => {
    const seatedGuests = table.seats.filter((id): id is string => id !== null);
    
    for (let i = 0; i < seatedGuests.length; i++) {
      for (let j = i + 1; j < seatedGuests.length; j++) {
        const relationship = getRelationshipBetween(seatedGuests[i], seatedGuests[j], guests);
        if (relationship === 'enemy') {
          conflicts.push({
            type: 'enemy_same_table',
            guestIds: [seatedGuests[i], seatedGuests[j]],
            tableIds: [table.id],
            message: `仇人不能同桌: ${getGuestName(seatedGuests[i], guests)} 和 ${getGuestName(seatedGuests[j], guests)}`,
          });
        }
      }
    }
  });

  const couplePairs: [string, string][] = [];
  const processed = new Set<string>();

  guests.forEach(guest => {
    const relationships = getGuestRelationships(guest.id, guests);
    relationships.forEach(rel => {
      if (rel.type === 'couple') {
        const pairKey = [guest.id, rel.guestId].sort().join('-');
        if (!processed.has(pairKey)) {
          processed.add(pairKey);
          couplePairs.push([guest.id, rel.guestId]);
        }
      }
    });
  });

  couplePairs.forEach(([guest1Id, guest2Id]) => {
    const table1 = guestTableMap.get(guest1Id);
    const table2 = guestTableMap.get(guest2Id);
    
    if (table1 && table2 && table1 !== table2) {
      conflicts.push({
        type: 'couple_separated',
        guestIds: [guest1Id, guest2Id],
        tableIds: [table1, table2],
        message: `情侣被拆散: ${getGuestName(guest1Id, guests)} 和 ${getGuestName(guest2Id, guests)}`,
      });
    }
  });

  return conflicts;
}

export function validateSeating(tables: Table[], guests: Guest[]): {
  valid: boolean;
  conflicts: Conflict[];
  tableStatus: Record<string, 'valid' | 'conflict' | 'empty'>;
} {
  const conflicts = checkConflicts(tables, guests);
  const tableStatus: Record<string, 'valid' | 'conflict' | 'empty'> = {};

  const conflictTableIds = new Set<string>();
  conflicts.forEach(conflict => {
    conflict.tableIds?.forEach(id => conflictTableIds.add(id));
  });

  tables.forEach(table => {
    const hasGuests = table.seats.some(s => s !== null);
    if (!hasGuests) {
      tableStatus[table.id] = 'empty';
    } else if (conflictTableIds.has(table.id)) {
      tableStatus[table.id] = 'conflict';
    } else {
      tableStatus[table.id] = 'valid';
    }
  });

  return {
    valid: conflicts.length === 0,
    conflicts,
    tableStatus,
  };
}

function getGuestName(guestId: string, guests: Guest[]): string {
  const guest = guests.find(g => g.id === guestId);
  return guest?.name || '未知';
}
