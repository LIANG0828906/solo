import { create } from 'zustand'
import axios from 'axios'
import { jsPDF } from 'jspdf'

interface GroceryItem {
  name: string
  amount: string
  category: 'vegetable' | 'meat' | 'seasoning' | 'other'
  checked: boolean
  recipeSource: string
}

interface GroceryState {
  items: GroceryItem[]
  drawerOpen: boolean
  addFromRecipe: (recipeId: string) => Promise<void>
  removeItem: (index: number) => void
  toggleCheck: (index: number) => void
  updateQuantity: (index: number, newAmount: string) => void
  clearList: () => void
  openDrawer: () => void
  closeDrawer: () => void
  exportAsText: () => void
  exportAsPDF: () => void
}

const categoryLabels: Record<GroceryItem['category'], string> = {
  vegetable: '蔬菜',
  meat: '肉类',
  seasoning: '调料',
  other: '其他',
}

const categoryOrder: GroceryItem['category'][] = ['vegetable', 'meat', 'seasoning', 'other']

export const useGroceryStore = create<GroceryState>((set, get) => ({
  items: [],
  drawerOpen: false,

  addFromRecipe: async (recipeId: string) => {
    try {
      const res = await axios.post('/api/grocery/generate-list', {
        recipeIds: [recipeId],
      })
      const newItems: GroceryItem[] = res.data.data.items
      set((state) => {
        const merged = [...state.items]
        for (const item of newItems) {
          const existingIdx = merged.findIndex(
            (m) => m.name === item.name && m.category === item.category
          )
          if (existingIdx !== -1) {
            merged[existingIdx] = {
              ...merged[existingIdx],
              amount: merged[existingIdx].amount + ' + ' + item.amount,
            }
          } else {
            merged.push(item)
          }
        }
        return { items: merged }
      })
    } catch {
      // noop
    }
  },

  removeItem: (index: number) => {
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    }))
  },

  toggleCheck: (index: number) => {
    set((state) => ({
      items: state.items.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      ),
    }))
  },

  updateQuantity: (index: number, newAmount: string) => {
    set((state) => ({
      items: state.items.map((item, i) =>
        i === index ? { ...item, amount: newAmount } : item
      ),
    }))
  },

  clearList: () => {
    set({ items: [] })
  },

  openDrawer: () => {
    set({ drawerOpen: true })
  },

  closeDrawer: () => {
    set({ drawerOpen: false })
  },

  exportAsText: () => {
    const { items } = get()
    const grouped = categoryOrder
      .map((cat) => {
        const catItems = items.filter((i) => i.category === cat)
        if (catItems.length === 0) return ''
        const lines = catItems.map((i) => `  - ${i.name}: ${i.amount} (from: ${i.recipeSource})${i.checked ? ' [x]' : ''}`)
        return `${categoryLabels[cat]}:\n${lines.join('\n')}`
      })
      .filter(Boolean)
      .join('\n\n')

    const text = grouped || 'No items in grocery list.'
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'grocery-list.txt'
    a.click()
    URL.revokeObjectURL(url)
  },

  exportAsPDF: () => {
    const { items } = get()
    const doc = new jsPDF()
    let y = 20

    doc.setFontSize(18)
    doc.text('Grocery List', 20, y)
    y += 12

    doc.setFontSize(12)

    for (const cat of categoryOrder) {
      const catItems = items.filter((i) => i.category === cat)
      if (catItems.length === 0) continue

      if (y > 270) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(14)
      doc.text(categoryLabels[cat], 20, y)
      y += 8
      doc.setFontSize(11)

      for (const item of catItems) {
        if (y > 275) {
          doc.addPage()
          y = 20
        }
        const checkMark = item.checked ? '[x]' : '[ ]'
        doc.text(`${checkMark} ${item.name}: ${item.amount} (from: ${item.recipeSource})`, 28, y)
        y += 7
      }

      y += 4
    }

    doc.save('grocery-list.pdf')
  },
}))
