import { useState } from 'react'
import OrderPanel from './components/OrderPanel'
import InventoryBoard from './components/InventoryBoard'
import OrderForm from './components/OrderForm'

function App() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2">
              <path d="M20 7h-3V4H7v3H4v13h16V7z" />
              <path d="M9 4v3" />
              <path d="M15 4v3" />
            </svg>
          </div>
          <div>
            <h1>匠心皮具工坊</h1>
            <p className="subtitle">定制订单管理与余料库存看板</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <span className="btn-icon">+</span> 新建订单
        </button>
      </header>

      <main className="main-content">
        <section className="left-panel">
          <OrderPanel />
        </section>
        <section className="right-panel">
          <InventoryBoard />
        </section>
      </main>

      {showForm && <OrderForm onClose={() => setShowForm(false)} />}
    </div>
  )
}

export default App
