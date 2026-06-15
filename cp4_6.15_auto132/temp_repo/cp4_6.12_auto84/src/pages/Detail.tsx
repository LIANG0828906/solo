import { useParams, Link, useNavigate } from 'react-router-dom'
import { useFlowerStore } from '../store'
import { showToast } from '../components/Toast'

function Detail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const flowers = useFlowerStore((state) => state.flowers)
  const addToCart = useFlowerStore((state) => state.addToCart)

  const flower = flowers.find((f) => f.id === Number(id))

  if (!flower) {
    return (
      <div>
        <Link to="/" className="back-link">
          <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>
        <p style={{ color: 'rgba(107,76,46,0.6)', padding: '40px 0' }}>
          未找到该花束
        </p>
      </div>
    )
  }

  const handleAddToCart = () => {
    addToCart(flower)
    showToast(`已将「${flower.name}」加入购物车`)
    setTimeout(() => navigate('/cart'), 800)
  }

  return (
    <div>
      <Link to="/" className="back-link">
        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回全部花束
      </Link>

      <div className="detail-container">
        <img
          src={flower.imageUrl}
          alt={flower.name}
          className="detail-image"
        />
        <div className="detail-info">
          <h1>{flower.name}</h1>
          <div className="detail-price">¥{flower.price}</div>

          <div className="detail-section-title">花束详情</div>
          <p className="detail-description">{flower.description}</p>

          <div className="detail-section-title">花材成分</div>
          <ul className="detail-ingredients">
            {flower.ingredients.map((ingredient, idx) => (
              <li key={idx}>{ingredient}</li>
            ))}
          </ul>

          <button className="btn-primary" onClick={handleAddToCart}>
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            加入购物车
          </button>
        </div>
      </div>
    </div>
  )
}

export default Detail
