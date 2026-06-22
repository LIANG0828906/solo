import RecipeManager from '@/RecipeManager';

export default function Home() {
  return (
    <div className="page-home">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo">🍳</span>
          <h1 className="app-header__title">味集</h1>
          <span className="app-header__subtitle">食谱分享与协作编辑</span>
        </div>
      </header>
      <RecipeManager />
    </div>
  );
}
