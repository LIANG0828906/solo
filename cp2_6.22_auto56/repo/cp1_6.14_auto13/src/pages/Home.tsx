import { useState, useEffect } from 'react'
import { Item, User, itemApi } from '../api'
import ItemCard from '../components/ItemCard'
import ItemForm from '../components/ItemForm'

interface HomeProps {
  user: User | null
}

function SkeletonCard() {
  return (
    <div className="card" style={{ pointerEvents: 'none' }}>
      <div className="card-image-wrapper">
        <div className="image-placeholder" />
      </div>
      <div style={{ padding: '20px' }}>
        <div className="image-placeholder" style={{ height: '24px', width: '60%', borderRadius: '6px', marginBottom: '12px' }} />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div className="image-placeholder" style={{ height: '24px', width: '50px', borderRadius: '20px' }} />
          <div className="image-placeholder" style={{ height: '24px', width: '60px', borderRadius: '20px' }} />
        </div>
        <div className="image-placeholder" style={{ height: '16px', width: '100%', borderRadius: '4px', marginBottom: '8px' }} />
        <div className="image-placeholder" style={{ height: '16px', width: '80%', borderRadius: '4px', marginBottom: '16px' }} />
        <div className="image-placeholder" style={{ height: '24px', width: '40%', borderRadius: '4px' }} />
      </div>
    </div>
  )
}

function Home({ user }: HomeProps) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadItems = async () => {
    try {
      const data = await itemApi.list()
      setItems(data.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">旧物新语</h1>
        <p className="page-subtitle">让每件旧物带着故事继续温暖</p>
        {user && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            style={{ marginTop: '24px' }}
          >
            <span>✨</span> 发布旧物
          </button>
        )}
      </div>

      {loading ? (
        <div className="items-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="items-grid">
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-text">
            还没有旧物发布
            {user && <div style={{ marginTop: '8px' }}>点击上方按钮发布你的第一件旧物吧～</div>}
          </div>
        </div>
      )}

      {showForm && (
        <ItemForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            loadItems()
          }}
        />
      )}
    </div>
  )
}

export default Home
