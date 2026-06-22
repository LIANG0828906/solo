export interface NoteSummary {
  id: string;
  fileName: string;
  title: string;
  tags: string[];
}

export interface TagFrequency {
  tag: string;
  count: number;
}

const TITLE_REGEX = /^#\s+(.+)$/m;
const TAG_REGEX = /#([a-zA-Z0-9\u4e00-\u9fa5]+)/g;

export function extractNoteSummary(
  id: string,
  fileName: string,
  content: string
): NoteSummary {
  const titleMatch = content.match(TITLE_REGEX);
  const title = titleMatch ? titleMatch[1].trim() : fileName.replace(/\.md$/, '');

  const tags: string[] = [];
  const seenTags = new Set<string>();
  let match: RegExpExecArray | null;

  TAG_REGEX.lastIndex = 0;
  while ((match = TAG_REGEX.exec(content)) !== null) {
    const tag = match[1];
    if (!seenTags.has(tag)) {
      seenTags.add(tag);
      tags.push(tag);
    }
  }

  return {
    id,
    fileName,
    title,
    tags,
  };
}

export function computeTagFrequencies(notes: NoteSummary[]): TagFrequency[] {
  const frequencyMap = new Map<string, number>();

  for (const note of notes) {
    for (const tag of note.tags) {
      frequencyMap.set(tag, (frequencyMap.get(tag) || 0) + 1);
    }
  }

  return Array.from(frequencyMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
