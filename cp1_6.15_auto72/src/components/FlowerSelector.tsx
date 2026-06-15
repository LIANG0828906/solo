import { useState } from 'react'

interface Flower {
  id: string
  name: string
  category: string
  image: string
  price: number
  stock: number
  threshold: number
}

interface FlowerSelectorProps {
  flowers: Flower[]
  onSelect: (flower: Flower) => void
}

function FlowerSelector({ flowers, onSelect }: FlowerSelectorProps) {
  const categories = ['全部', ...Array.from(new Set(flowers.map(f => f.category)))]
  const [activeCategory, setActiveCategory] = useState('全部')
  const [clickedId, setClickedId] = useState<string | null>(null)

  const filteredFlowers = activeCategory === '全部'
    ? flowers
    : flowers.filter(f => f.category === activeCategory)

  const handleClick = (flower: Flower) => {
    setClickedId(flower.id)
    onSelect(flower)
    setTimeout(() => setClickedId(null), 500)
  }

  return (
    <div>
      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="flower-thumb-grid">
        {filteredFlowers.map(flower => (
          <div
            key={flower.id}
            className={`flower-thumb ${clickedId === flower.id ? 'clicked' : ''}`}
            onClick={() => handleClick(flower)}
          >
            <img
              src={flower.image}
              alt={flower.name}
              className="flower-thumb-img"
              loading="lazy"
            />
            <div className="flower-thumb-name">{flower.name}</div>
            <div className="flower-thumb-price">¥{flower.price}/枝</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FlowerSelector
