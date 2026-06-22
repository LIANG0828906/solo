import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Search, X } from 'lucide-react'
import ItemList from '@/components/ItemList'
import { useDebounce } from '@/hooks/useDebounce'
import type { Item } from '@/components/ItemCard'

const categoryOptions = [
  { value: '', label: '全部' },
  { value: 'electronics', label: '电子' },
  { value: 'furniture', label: '家具' },
  { value: 'books', label: '书籍' },
  { value: 'clothing', label: '衣物' },
  { value: 'other', label: '其他' },
]

export default function Home() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')

  const debouncedKeyword = useDebounce(keyword, 300)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (debouncedKeyword) params.keyword = debouncedKeyword
      if (category) params.category = category
      const res = await axios.get('/api/items', { params })
      setItems(res.data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, category])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleCardClick = (item: Item) => {
    navigate(`/item/${item.id}`)
  }

  const handleReset = () => {
    setKeyword('')
    setCategory('')
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索物品标题或描述..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {keyword && (
            <button
              onClick={handleReset}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary md:w-40"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <ItemList items={items} loading={loading} onCardClick={handleCardClick} />
    </div>
  )
}
