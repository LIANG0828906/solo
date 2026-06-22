import { Link } from 'react-router-dom'
import { useFlowerStore, type Flower } from '../store'

function Home() {
  const flowers = useFlowerStore((state) => state.flowers)

  return (
    <div>
      <h1 className="page-title">今日花束精选</h1>
      <p className="page-subtitle">每一束都是独立花艺师的匠心之作</p>

      <div className="flower-grid">
        {flowers.map((flower: Flower) => (
          <Link
            key={flower.id}
            to={`/flower/${flower.id}`}
            className="flower-card"
          >
            <img
              src={flower.imageUrl}
              alt={flower.name}
              className="flower-card-image"
              loading="lazy"
            />
            <div className="flower-card-body">
              <div className="flower-card-name">{flower.name}</div>
              <div className="flower-card-price">¥{flower.price}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Home
