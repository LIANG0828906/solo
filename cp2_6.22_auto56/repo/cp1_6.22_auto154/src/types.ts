export type GuestGroup = 'family' | 'colleague' | 'friend';

export type RelationType = 'family' | 'couple' | 'enemy';

export interface Guest {
  id: string;
  name: string;
  group: GuestGroup;
}

export interface Relation {
  id: string;
  guest1Id: string;
  guest2Id: string;
  type: RelationType;
}

export interface Table {
  id: string;
  number: number;
  seats: (string | null)[];
}

export type ConflictType = 'enemy_same_table' | 'couple_separated';

export interface Conflict {
  id: string;
  type: ConflictType;
  guestIds: string[];
  tableIds: string[];
  message: string;
}

export interface AppStateSnapshot {
  guests: Guest[];
  relations: Relation[];
  tables: Table[];
}

export const GROUP_LABELS: Record<GuestGroup, string> = {
  family: '家人',
  colleague: '同事',
  friend: '朋友'
};

export const RELATION_LABELS: Record<RelationType, string> = {
  family: '家人',
  couple: '情侣',
  enemy: '仇人'
};
