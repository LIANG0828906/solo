import { create } from 'zustand';
import type { Flower, Bouquet, EmotionTag, FlowerStore, EmotionTagType } from './types';
import { FLOWERS, PRESET_BOUQUETS, getEmotionColor } from './data';

const TAG_MULTIPLIER: EmotionTagType[] = ['浪漫', '温暖', '治愈', '祝福', '惊喜', '清新', '优雅', '鼓励'];

export const useFlowerStore = create<FlowerStore>((set, get) => ({
  flowers: FLOWERS,
  selectedFlowers: [],
  emotionTags: [],
  recommendedBouquets: PRESET_BOUQUETS,
  activeTag: null,

  addFlower: (flower: Flower) => {
    const current = get().selectedFlowers;
    if (current.length >= 20) return;
    set({ selectedFlowers: [...current, flower] });
    get().calculateEmotionTags();
    get().generateRecommendations();
  },

  removeFlower: (flowerId: string) => {
    const current = get().selectedFlowers;
    const index = current.findIndex(f => f.id === flowerId);
    if (index === -1) return;
    const newFlowers = [...current];
    newFlowers.splice(index, 1);
    set({ selectedFlowers: newFlowers });
    get().calculateEmotionTags();
    get().generateRecommendations();
  },

  reorderFlowers: (fromIndex: number, toIndex: number) => {
    const current = get().selectedFlowers;
    const newFlowers = [...current];
    const [removed] = newFlowers.splice(fromIndex, 1);
    newFlowers.splice(toIndex, 0, removed);
    set({ selectedFlowers: newFlowers });
  },

  clearBouquet: () => {
    set({ selectedFlowers: [], activeTag: null });
    get().calculateEmotionTags();
    get().generateRecommendations();
  },

  calculateEmotionTags: () => {
    const selected = get().selectedFlowers;
    if (selected.length === 0) {
      set({ emotionTags: [] });
      return;
    }

    const tagCounts: Record<string, number> = {};
    selected.forEach(flower => {
      flower.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const totalFlowers = selected.length;
    const tags: EmotionTag[] = TAG_MULTIPLIER
      .filter(tag => tagCounts[tag] !== undefined)
      .map(tag => ({
        name: tag,
        color: getEmotionColor(tag),
        score: Math.round((tagCounts[tag] / totalFlowers) * 100)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    set({ emotionTags: tags });
  },

  generateRecommendations: () => {
    const selected = get().selectedFlowers;
    if (selected.length === 0) {
      set({ recommendedBouquets: PRESET_BOUQUETS.slice(0, 5) });
      return;
    }

    const currentTags = new Set<EmotionTagType>();
    selected.forEach(f => f.tags.forEach(t => currentTags.add(t)));

    const activeTag = get().activeTag;

    const scored = PRESET_BOUQUETS.map(bouquet => {
      let score = 0;
      bouquet.tags.forEach(tag => {
        if (currentTags.has(tag)) score += 2;
        if (activeTag && tag === activeTag) score += 5;
      });

      const overlapCount = bouquet.flowerIds.filter(id =>
        selected.some(f => f.id === id)
      ).length;
      score += overlapCount;

      return { bouquet, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const topBouquets = scored
      .map(s => s.bouquet)
      .slice(0, 5);

    set({ recommendedBouquets: topBouquets });
  },

  setActiveTag: (tag: EmotionTagType | null) => {
    set({ activeTag: tag });
    get().generateRecommendations();
  },

  applyBouquet: (bouquet: Bouquet) => {
    const newFlowers: Flower[] = [];
    bouquet.flowerIds.forEach(id => {
      const flower = FLOWERS.find(f => f.id === id);
      if (flower) newFlowers.push(flower);
    });
    set({ selectedFlowers: newFlowers });
    get().calculateEmotionTags();
    get().generateRecommendations();
  }
}));
