const TAG_COLORS = [
  '#6A5ACD', '#7B68EE', '#9370DB', '#8A2BE2', '#4A3B6B',
  '#6959CD', '#483D8B', '#556B2F', '#20B2AA', '#CD853F',
  '#E066FF', '#836FFF', '#4169E1', '#00CED1', '#3CB371'
];

export function getColorForTag(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
}

export function getColorForNote(tags: string[]): string {
  if (!tags || tags.length === 0) {
    return '#6A5ACD';
  }
  return getColorForTag(tags[0]);
}
