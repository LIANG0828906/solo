import { useSoundStore } from '@/store/useSoundStore';
import type { CityScape, ViewName } from '@/store/useSoundStore';

interface Props {
  view: ViewName;
}

function ScapeCard({ s, onClick }: { s: CityScape; onClick: () => void }): JSX.Element {
  return (
    <div className="view-card" onClick={onClick}>
      <h4 className="view-card-title">{s.title}</h4>
      <div className="view-card-meta">作者：{s.author}</div>
      <div className="view-card-meta">
        {s.tracks.length} 个音轨{s.overlayCount ? ` · 叠加唱片 ×${s.overlayCount}` : ''}
      </div>
      <div className="view-card-meta">{new Date(s.createdAt).toLocaleString('zh-CN')}</div>
    </div>
  );
}

export function Views({ view }: Props): JSX.Element | null {
  const savedScapes = useSoundStore((s) => s.savedScapes);
  const loadScape = useSoundStore((s) => s.loadScape);
  const setView = useSoundStore((s) => s.setView);

  const list = (() => {
    if (view === 'mine') {
      return savedScapes;
    }
    if (view === 'gallery') {
      return savedScapes.slice().sort((a, b) => b.tracks.length - a.tracks.length);
    }
    if (view === 'ranking') {
      return savedScapes
        .slice()
        .sort((a, b) => b.overlayCount - a.overlayCount || b.tracks.length - a.tracks.length);
    }
    return [];
  })();

  const title =
    view === 'gallery' ? '城市图鉴' : view === 'mine' ? '我的音景' : view === 'ranking' ? '排行榜' : '';

  if (view === 'scene') return null;

  const handleClick = (id: string) => {
    void loadScape(id);
    setView('scene');
  };

  return (
    <div className="view-wrap">
      <h2 className="view-title">{title}</h2>
      {list.length === 0 ? (
        <div className="view-empty">还没有内容，回到场景创作你的第一份音景吧。</div>
      ) : (
        <div className="view-grid">
          {list.map((s) => (
            <ScapeCard key={s.id} s={s} onClick={() => handleClick(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
