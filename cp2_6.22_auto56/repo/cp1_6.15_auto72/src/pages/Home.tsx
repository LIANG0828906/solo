import { Link } from 'react-router-dom'
import { Sparkles, Truck, Heart, ArrowRight, Calendar, Edit3 } from 'lucide-react'

function Home() {
  return (
    <div className="container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>用鲜花点缀生活<br/>让每一刻都充满芬芳</h1>
          <p>花语派FlowerPie — 专业的在线鲜花订阅与定制配送平台。精选当季优质花材，由资深花艺师精心搭配，新鲜直达您家门口。</p>
          <div className="hero-buttons">
            <Link to="/custom-order" className="btn btn-accent">
              <Edit3 size={18} />
              立即定制花束
            </Link>
            <Link to="/subscriptions" className="btn btn-secondary">
              <Calendar size={18} />
              查看订阅套餐
            </Link>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=400&fit=crop"
          alt="精美花艺"
          className="hero-image"
        />
      </section>

      <section>
        <div className="section-header">
          <h2 className="section-title">为什么选择花语派</h2>
        </div>
        <div className="features-grid">
          <div className="card feature-card">
            <div className="feature-icon"><Sparkles size={40} color="#A68B6B" /></div>
            <h3>精选优质花材</h3>
            <p>每日从云南鲜花基地直采，确保每一枝花都新鲜饱满，花期更长，香气更持久。</p>
          </div>
          <div className="card feature-card">
            <div className="feature-icon"><Heart size={40} color="#E8B4B8" /></div>
            <h3>个性定制搭配</h3>
            <p>根据您的喜好和场合需求，自由选择花材组合，打造独一无二的专属花束。</p>
          </div>
          <div className="card feature-card">
            <div className="feature-icon"><Truck size={40} color="#7A8B7A" /></div>
            <h3>专业冷链配送</h3>
            <p>全程恒温冷链运输，专业包装保护，确保鲜花在配送途中不受损伤，完美送达。</p>
          </div>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2 className="section-title">快速开始</h2>
        </div>
        <div className="quick-links">
          <Link to="/subscriptions" className="card quick-link-card">
            <div className="quick-link-icon pink">🌸</div>
            <div className="quick-link-content">
              <h3>鲜花订阅服务</h3>
              <p>每周/每月定期收到惊喜花束，省心又划算</p>
            </div>
            <ArrowRight size={20} color="#E8B4B8" />
          </Link>
          <Link to="/custom-order" className="card quick-link-card">
            <div className="quick-link-icon green">💐</div>
            <div className="quick-link-content">
              <h3>定制专属花束</h3>
              <p>亲手挑选每一朵花，定制贺卡和配送时间</p>
            </div>
            <ArrowRight size={20} color="#7A8B7A" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
