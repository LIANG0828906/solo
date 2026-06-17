import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePollStore } from '../pollStore';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const polls = usePollStore((s) => s.polls);
  const currentPoll = usePollStore((s) => s.currentPoll);
  const currentPollId = currentPoll?.id ?? null;

  const activePollId = useMemo(() => {
    const m = location.pathname.match(/^\/poll\/([^/]+)/);
    return m ? m[1] : currentPollId;
  }, [location.pathname, currentPollId]);

  const goDashboard = () => navigate('/');
  const goCreate = () => navigate('/create');
  const goPoll = (id: string) => navigate(`/poll/${id}`);

  const sortedPolls = useMemo(
    () => polls.slice().sort((a, b) => b.createdAt - a.createdAt),
    [polls]
  );

  const formatDate = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}小时前`;
    const days = Math.floor(hrs / 24);
    return `${days}天前`;
  };

  return (
    <aside className="qv-sidebar">
      <div
        className="qv-sidebar-logo"
        onClick={goDashboard}
        style={{ cursor: 'pointer' }}
      >
        <div className="qv-logo-box">QV</div>
        <div>
          <div className="qv-logo-text">QuickVote</div>
          <div className="qv-logo-sub">实时投票 · 即时洞察</div>
        </div>
      </div>

      <div className="qv-sidebar-list">
        <div className="qv-sidebar-item" onClick={goDashboard}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={location.pathname === '/' ? '#3F51B5' : '#757575'}
            strokeWidth="2"
            style={{ marginRight: 10 }}
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="qv-sidebar-item-title">仪表盘</span>
        </div>

        <div
          className="qv-sidebar-item"
          onClick={goCreate}
          style={{ marginBottom: 12 }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={location.pathname === '/create' ? '#3F51B5' : '#757575'}
            strokeWidth="2"
            style={{ marginRight: 10 }}
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="qv-sidebar-item-title">创建新投票</span>
        </div>

        <div className="qv-sidebar-section-title">
          我的投票 · {sortedPolls.length}
        </div>

        {sortedPolls.length === 0 ? (
          <div className="qv-sidebar-empty">
            暂无投票
            <br />
            点击上方「创建新投票」开始
          </div>
        ) : (
          sortedPolls.slice(0, 50).map((p) => (
            <div
              key={p.id}
              className={`qv-sidebar-item anim-fade ${
                activePollId === p.id ? 'active' : ''
              }`}
              onClick={() => goPoll(p.id)}
              title={`${p.title}\n${formatDate(p.createdAt)}创建`}
            >
              <span className="qv-sidebar-item-code">{p.shortCode}</span>
              <span className="qv-sidebar-item-title">{p.title}</span>
              <span className="qv-sidebar-item-count">{p.submissionCount}票</span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
