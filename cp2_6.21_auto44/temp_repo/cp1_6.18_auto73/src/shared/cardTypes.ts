export interface Card {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: number;
}

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  createdAt: number;
}

export const TAG_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77',
  '#A78BFA', '#F472B6', '#FB923C', '#38BDF8',
  '#E879F9', '#34D399', '#FBBF24', '#818CF8',
];

export function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function getRelationCountForCard(cardId: string, relations: Relation[]): number {
  return relations.filter(r => r.sourceId === cardId || r.targetId === cardId).length;
}

export function getNodeRadius(relationCount: number): number {
  return Math.min(30 + (Math.max(0, relationCount - 1)) * 5, 60);
}

export function isCardMatchingFilter(
  card: Card,
  searchQuery: string,
  selectedTags: string[]
): boolean {
  const matchesSearch = !searchQuery ||
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

  const matchesTags = selectedTags.length === 0 ||
    selectedTags.some(tag => card.tags.includes(tag));

  return matchesSearch && matchesTags;
}
