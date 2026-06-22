import { useSoundStore, type ViewName, getNickname } from '@/store/useSoundStore';

const NAV_ITEMS: { key: Exclude<ViewName, 'scene'>; label: string }[] = [
  { key: 'gallery', label: '城市图鉴' },
  { key: 'mine', label: '我的音景' },
  { key: 'ranking', label: '排行榜' },
];

export function Header(): JSX.Element {
  const { view, setView, currentAuthor, reset, currentSceneId } = useSoundStore();
  const me = getNickname();

  const backToScene = () => {
    if (!currentSceneId) reset();
    setView('scene');
  };

  return (
    <header className="header">
      <button className="header-brand" onClick={backToScene} type="button">
        都市音景
      </button>
      <nav className="header-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`header-nav-btn ${view === item.key ? 'active' : ''}`}
            onClick={() => setView(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {currentAuthor && view === 'scene' && (
        <div className="header-author">
          原作者：<strong>{currentAuthor}</strong>
        </div>
      )}
      {me && !currentAuthor && (
        <div className="header-author">
          你好，<strong>{me}</strong>
        </div>
      )}
    </header>
  );
}
