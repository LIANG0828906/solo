import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';
import { createStore, ChocolateItem, GiftBoxConfig, FLAVORS } from '../useStore';
import * as orderApi from '../../api/orderApi';

vi.mock('../../api/orderApi');

type StoreState = ReturnType<typeof createStore>;

const createTestStore = () => {
  return create<StoreState>((set, get) => createStore(set, get));
};

describe('useStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addChocolate', () => {
    it('should add a chocolate with correct defaults', () => {
      const store = createTestStore();
      
      store.getState().addChocolate('matcha');
      
      const chocolates = store.getState().selectedChocolates;
      expect(chocolates).toHaveLength(1);
      expect(chocolates[0].flavorId).toBe('matcha');
      expect(chocolates[0].shape).toBe('circle');
      expect(chocolates[0].color).toBe('#5D4037');
      expect(chocolates[0].texture).toBe('glossy');
      expect(chocolates[0].id).toBeDefined();
    });

    it('should enforce max 6 chocolates', () => {
      const store = createTestStore();
      
      for (let i = 0; i < 8; i++) {
        store.getState().addChocolate(FLAVORS[i % FLAVORS.length].id);
      }
      
      expect(store.getState().selectedChocolates).toHaveLength(6);
    });
  });

  describe('removeChocolate', () => {
    it('should remove chocolate by id', () => {
      const store = createTestStore();
      store.getState().addChocolate('matcha');
      store.getState().addChocolate('dark-chocolate');
      
      const chocolates = store.getState().selectedChocolates;
      const idToRemove = chocolates[0].id;
      
      store.getState().removeChocolate(idToRemove);
      
      const remaining = store.getState().selectedChocolates;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(chocolates[1].id);
    });

    it('should clear selectedChocolateId if removed chocolate was selected', () => {
      const store = createTestStore();
      store.getState().addChocolate('matcha');
      
      const chocolate = store.getState().selectedChocolates[0];
      store.getState().selectChocolate(chocolate.id);
      expect(store.getState().selectedChocolateId).toBe(chocolate.id);
      
      store.getState().removeChocolate(chocolate.id);
      expect(store.getState().selectedChocolateId).toBeNull();
    });

    it('should not change selectedChocolateId if other chocolate is removed', () => {
      const store = createTestStore();
      store.getState().addChocolate('matcha');
      store.getState().addChocolate('dark-chocolate');
      
      const [choco1, choco2] = store.getState().selectedChocolates;
      store.getState().selectChocolate(choco1.id);
      
      store.getState().removeChocolate(choco2.id);
      expect(store.getState().selectedChocolateId).toBe(choco1.id);
    });
  });

  describe('updateChocolate', () => {
    it('should update partial fields correctly', () => {
      const store = createTestStore();
      store.getState().addChocolate('matcha');
      
      const chocolate = store.getState().selectedChocolates[0];
      store.getState().updateChocolate(chocolate.id, {
        shape: 'heart',
        color: '#FF0000',
      });
      
      const updated = store.getState().selectedChocolates[0];
      expect(updated.shape).toBe('heart');
      expect(updated.color).toBe('#FF0000');
      expect(updated.flavorId).toBe('matcha');
      expect(updated.texture).toBe('glossy');
    });

    it('should do nothing for invalid id', () => {
      const store = createTestStore();
      store.getState().addChocolate('matcha');
      
      store.getState().updateChocolate('invalid-id', { shape: 'heart' });
      
      const chocolates = store.getState().selectedChocolates;
      expect(chocolates[0].shape).toBe('circle');
    });
  });

  describe('swapChocolates', () => {
    it('should swap positions correctly', () => {
      const store = createTestStore();
      store.getState().addChocolate('matcha');
      store.getState().addChocolate('dark-chocolate');
      store.getState().addChocolate('strawberry');
      
      const [choco1, choco2, choco3] = store.getState().selectedChocolates;
      
      store.getState().swapChocolates(choco1.id, choco3.id);
      
      const result = store.getState().selectedChocolates;
      expect(result[0].id).toBe(choco3.id);
      expect(result[1].id).toBe(choco2.id);
      expect(result[2].id).toBe(choco1.id);
    });

    it('should handle invalid ids gracefully', () => {
      const store = createTestStore();
      store.getState().addChocolate('matcha');
      store.getState().addChocolate('dark-chocolate');
      
      const [choco1, choco2] = store.getState().selectedChocolates;
      
      store.getState().swapChocolates(choco1.id, 'invalid-id');
      
      const result = store.getState().selectedChocolates;
      expect(result[0].id).toBe(choco1.id);
      expect(result[1].id).toBe(choco2.id);
    });
  });

  describe('reorderChocolates', () => {
    it('should reorder the entire array correctly', () => {
      const store = createTestStore();
      store.getState().addChocolate('matcha');
      store.getState().addChocolate('dark-chocolate');
      store.getState().addChocolate('strawberry');
      
      const [choco1, choco2, choco3] = store.getState().selectedChocolates;
      const newOrder = [choco3, choco1, choco2];
      
      store.getState().reorderChocolates(newOrder);
      
      const result = store.getState().selectedChocolates;
      expect(result[0].id).toBe(choco3.id);
      expect(result[1].id).toBe(choco1.id);
      expect(result[2].id).toBe(choco2.id);
    });
  });

  describe('selectChocolate', () => {
    it('should set selection correctly', () => {
      const store = createTestStore();
      store.getState().addChocolate('matcha');
      
      const chocolate = store.getState().selectedChocolates[0];
      store.getState().selectChocolate(chocolate.id);
      
      expect(store.getState().selectedChocolateId).toBe(chocolate.id);
    });

    it('should clear selection when passing null', () => {
      const store = createTestStore();
      store.getState().addChocolate('matcha');
      
      const chocolate = store.getState().selectedChocolates[0];
      store.getState().selectChocolate(chocolate.id);
      store.getState().selectChocolate(null);
      
      expect(store.getState().selectedChocolateId).toBeNull();
    });
  });

  describe('updateGiftBox', () => {
    it('should update box config partially', () => {
      const store = createTestStore();
      
      store.getState().updateGiftBox({
        boxShape: 'heart',
        cardText: 'Happy Birthday!',
      });
      
      const giftBox = store.getState().giftBox;
      expect(giftBox.boxShape).toBe('heart');
      expect(giftBox.cardText).toBe('Happy Birthday!');
      expect(giftBox.ribbonColor).toBeDefined();
      expect(giftBox.cardFont).toBeDefined();
      expect(giftBox.cardColor).toBeDefined();
    });
  });
});
