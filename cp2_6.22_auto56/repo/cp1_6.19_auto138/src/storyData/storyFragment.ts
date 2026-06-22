import { eventBus, StoryFragment } from '../eventBus';

const TYPE_COLORS: Record<StoryFragment['type'], string> = {
  character: '#FF6B6B',
  scene: '#4ECDC4',
  'plot-twist': '#FFE66D',
};

const TYPE_LABELS: Record<StoryFragment['type'], string> = {
  character: '角色',
  scene: '场景',
  'plot-twist': '情节转折',
};

class StoryFragmentManager {
  private fragments: Map<string, StoryFragment> = new Map();
  private idCounter = 0;

  getAll(): StoryFragment[] {
    return Array.from(this.fragments.values()).sort(
      (a, b) => a.createdAt - b.createdAt
    );
  }

  getById(id: string): StoryFragment | undefined {
    return this.fragments.get(id);
  }

  create(type: StoryFragment['type'], content: string): StoryFragment {
    const id = `frag_${++this.idCounter}_${Date.now()}`;
    const fragment: StoryFragment = {
      id,
      type,
      content,
      color: TYPE_COLORS[type],
      createdAt: Date.now(),
    };
    this.fragments.set(id, fragment);
    eventBus.emit('fragment:created', fragment);
    return fragment;
  }

  update(id: string, updates: Partial<Pick<StoryFragment, 'content' | 'type'>>): StoryFragment | undefined {
    const fragment = this.fragments.get(id);
    if (!fragment) return undefined;

    const updated: StoryFragment = {
      ...fragment,
      ...updates,
      color: updates.type ? TYPE_COLORS[updates.type] : fragment.color,
    };
    this.fragments.set(id, updated);
    eventBus.emit('fragment:updated', updated);
    return updated;
  }

  delete(id: string): boolean {
    const existed = this.fragments.delete(id);
    if (existed) {
      eventBus.emit('fragment:deleted', id);
    }
    return existed;
  }

  getTypeColor(type: StoryFragment['type']): string {
    return TYPE_COLORS[type];
  }

  getTypeLabel(type: StoryFragment['type']): string {
    return TYPE_LABELS[type];
  }
}

export const fragmentManager = new StoryFragmentManager();
export { TYPE_COLORS, TYPE_LABELS };
