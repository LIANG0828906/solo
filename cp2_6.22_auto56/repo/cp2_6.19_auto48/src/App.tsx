import IdeaList from './IdeaList'
import IdeaForm from './IdeaForm'

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">💡</span>
            创意点子平台
          </h1>
          <p className="app-subtitle">分享你的奇思妙想，为优秀创意投票</p>
        </div>
      </header>

      <main className="app-main">
        <IdeaForm />
        <IdeaList />
      </main>
    </div>
  )
}
