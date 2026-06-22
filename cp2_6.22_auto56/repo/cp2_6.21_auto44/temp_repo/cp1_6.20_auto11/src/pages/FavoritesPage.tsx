import CodeCard from '../components/CodeCard';
import { useFavorites } from '../hooks/useSnippets';

export default function FavoritesPage() {
  const { snippets, loading, favoriteSnippet } = useFavorites();

  return (
    <div className="home-page">
      <div className="home-header">
        <h1 className="home-title">我的收藏</h1>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : snippets.length === 0 ? (
        <div className="empty-state">
          <h3>还没有收藏</h3>
          <p>去首页发现一些有趣的代码片段，点击星标收藏吧！</p>
        </div>
      ) : (
        <div className="snippets-grid">
          {snippets.map((snippet, i) => (
            <CodeCard
              key={snippet.id}
              snippet={snippet}
              onLike={async () => null}
              onFavorite={favoriteSnippet}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
