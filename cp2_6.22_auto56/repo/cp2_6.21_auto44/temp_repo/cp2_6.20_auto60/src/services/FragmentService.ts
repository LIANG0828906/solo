import { mockFragments } from '../data/mockFragments'
import type { Fragment } from '../types'

export const FragmentService = {
  async getAllFragments(): Promise<Fragment[]> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return Promise.resolve(mockFragments.map((f) => ({ ...f })))
  },

  async getFragmentsByElement(element: string): Promise<Fragment[]> {
    await new Promise((resolve) => setTimeout(resolve, 50))
    return Promise.resolve(
      mockFragments
        .filter((f) => f.element === element)
        .map((f) => ({ ...f }))
    )
  },

  async getFragmentsByRarity(rarity: number): Promise<Fragment[]> {
    await new Promise((resolve) => setTimeout(resolve, 50))
    return Promise.resolve(
      mockFragments
        .filter((f) => f.rarity === rarity)
        .map((f) => ({ ...f }))
    )
  },

  async getFragmentById(id: string): Promise<Fragment | null> {
    await new Promise((resolve) => setTimeout(resolve, 30))
    const fragment = mockFragments.find((f) => f.id === id)
    return fragment ? { ...fragment } : null
  },
}
