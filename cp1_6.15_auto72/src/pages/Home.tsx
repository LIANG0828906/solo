import { Link } from 'react-router-dom'
import { Flower2, Truck, Sparkles } from 'lucide-react'

function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              让每一束花都<br />
              <span className="hero-title-accent">传递心意</span>
            </h1>
            <p className="hero-subtitle">
              花语派FlowerPie · 专业鲜花订阅与定制配送服务
            </p>
            <div className="hero-buttons">
              <Link to="/custom-order" className="btn btn-accent btn-lg">
                <Sparkles size={20} />
                开始定制花束
              </Link>
              <Link to="/subscriptions" className="btn btn-secondary btn-lg">
                <Flower2 size={20} />
                浏览订阅套餐
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <img 
              src="https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=500&fit=crop" 
              alt="精美花束"
              className="hero-img"
            />
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2 className="section-title-center">为什么选择花语派</h2>
          <div className="features-grid">
            <div className="feature-card card">
              <div className="feature-icon icon-pink">
                <Flower2 size={32} />
              </div>
              <h3 className="feature-title">订阅便利</h3>
              <p className="feature-desc">
                每周/每月定期配送，新鲜花材直达家门，省去挑选烦恼
              </p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon icon-green">
                <Sparkles size={32} />
              </div>
              <h3 className="feature-title">定制自由</h3>
              <p className="feature-desc">
                上百种花材自由搭配，专属花束为你而生，每一束都是独一无二
              </p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon icon-brown">
                <Truck size={32} />
              </div>
              <h3 className="feature-title">配送保障</h3>
              <p className="feature-desc">
                专业保鲜包装，专人专车配送，确保鲜花完好无损送达
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-content">
          <h2 className="cta-title">准备好为TA定制一束专属花束了吗？</h2>
          <p className="cta-desc">现在下单，享受首单9折优惠</p>
          <Link to="/custom-order" className="btn btn-accent btn-lg">
            立即定制
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
