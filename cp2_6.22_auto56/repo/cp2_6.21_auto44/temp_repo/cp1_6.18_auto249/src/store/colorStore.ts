import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DailyRecord {
  date: string
  color: string
  text: string
  createdAt: number
}

interface ColorStore {
  records: DailyRecord[]
  selectedDate: string
  selectedColor: string
  isModalOpen: boolean
  setSelectedDate: (date: string) => void
  setSelectedColor: (color: string) => void
  addOrUpdateRecord: (record: DailyRecord) => void
  deleteRecord: (date: string) => void
  getRecordByDate: (date: string) => DailyRecord | undefined
  openModal: () => void
  closeModal: () => void
  toggleModal: () => void
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const today = formatDate(new Date())

export const useColorStore = create<ColorStore>()(
  persist(
    (set, get) => ({
      records: [],
      selectedDate: today,
      selectedColor: '#B39DDB',
      isModalOpen: false,

      setSelectedDate: (date: string) => set({ selectedDate: date }),
      setSelectedColor: (color: string) => set({ selectedColor: color }),

      addOrUpdateRecord: (record: DailyRecord) => {
        const existing = get().records.find(r => r.date === record.date)
        if (existing) {
          set({
            records: get().records.map(r =>
              r.date === record.date ? record : r
            )
          })
        } else {
          set({
            records: [...get().records, record]
          })
        }
      },

      deleteRecord: (date: string) => {
        set({
          records: get().records.filter(r => r.date !== date)
        })
      },

      getRecordByDate: (date: string) => {
        return get().records.find(r => r.date === date)
      },

      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),
      toggleModal: () => set({ isModalOpen: !get().isModalOpen }),
    }),
    {
      name: 'palette-diary-storage',
    }
  )
)

export { formatDate }
