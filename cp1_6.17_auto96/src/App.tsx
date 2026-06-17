import { useState } from 'react'
import RecipeList from './RecipeModule/RecipeList'
import RecipeDetail from './RecipeModule/RecipeDetail'
import CollectionPanel from './CollectionModule/CollectionPanel'
import ShoppingList from './ShoppingModule/ShoppingList'
import { useRecipeStore } from './RecipeModule/store'
import { createRipple } from './utils'

function Navbar({
  onOpenCollection,
}: {
  onOpenCollection: () => void
}) {
  const view = useRecipeStore((s) => s.view)
  const setView = useRecipeStore((s) => s.setView)
  const favoriteIds = useRecipeStore((s) => s.favoriteIds)
  const shoppingList = useRecipeStore((s) => s.shoppingList)

  const pendingShopping = shoppingList.filter((i) => !i.checked).length

  return (
    <nav className="navbar">
      <div
        className="navbar-logo"
        onClick={() => setView('list')}
      >
        🍳 食谱分享
      </div>
      <div className="navbar-actions">
        <button
          className="nav-icon-btn ripple-button"
          onClick={(e) => {
            createRipple(e)
            setView('shopping')
          }}
          title="购物清单"
        >
          🛒
          {pendingShopping > 0 && (
            <span className="nav-badge">{pendingShopping}</span>
          )}
        </button>
        <button
          className="nav-icon-btn ripple-button"
          onClick={(e) => {
            createRipple(e)
            onOpenCollection()
          }}
          title="我的收藏"
        >
          ♥
          {favoriteIds.length > 0 && (
            <span className="nav-badge">{favoriteIds.length}</span>
          )}
        </button>
      </div>
    </nav>
  )
}

function Toasts() {
  const toasts = useRecipeStore((s) => s.toasts)
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const view = useRecipeStore((s) => s.view)
  const [collectionOpen, setCollectionOpen] = useState(false)

  return (
    <div>
      <Navbar onOpenCollection={() => setCollectionOpen(true)} />
      <div className="app-container">
        {view === 'list' && <RecipeList />}
        {view === 'detail' && <RecipeDetail />}
        {view === 'shopping' && <ShoppingList />}
      </div>
      <CollectionPanel
        isOpen={collectionOpen}
        onClose={() => setCollectionOpen(false)}
      />
      <Toasts />
    </div>
  )
}
