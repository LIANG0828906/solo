import { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, GitPullRequest, Calendar, Menu, X, FileText } from 'lucide-react';
import RepoManager from './RepoManager';
import IssueBoard from './IssueBoard';
import PRTracker from './PRTracker';
import ReportGenerator from './ReportGenerator';
import { createInitialRepos, createInitialIssues, createInitialPRs } from './mock/data';
import { Repo, Issue, PullRequest, LabelName, WeeklyReport } from './types';

type TabId = 'issues' | 'prs';

export default function App() {
  const initialRepos = useMemo(() => createInitialRepos(), []);
  const [repos, setRepos] = useState<Repo[]>(initialRepos);
  const [issues, setIssues] = useState<Issue[]>(() => createInitialIssues(initialRepos));
  const [prs, setPrs] = useState<PullRequest[]>(() => createInitialPRs(initialRepos));
  const [activeRepoId, setActiveRepoId] = useState<string>(initialRepos[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<TabId>('issues');
  const [searchQuery, setSearchQuery] = useState('');
  const [labelFilters, setLabelFilters] = useState<LabelName[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reportDateRange, setReportDateRange] = useState<{ start: string; end: string }>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  });

  const activeRepo = repos.find((r) => r.id === activeRepoId) ?? null;
  const currentIssues = issues.filter((i) => i.repoId === activeRepoId);
  const currentPRs = prs.filter((p) => p.repoId === activeRepoId);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddRepo = (fullName: string) => {
    if (repos.length >= 5) {
      showToast('最多只能添加 5 个仓库');
      return false;
    }
    const parts = fullName.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      showToast('请输入正确格式：owner/repo');
      return false;
    }
    if (repos.some((r) => r.fullName.toLowerCase() === fullName.toLowerCase())) {
      showToast('该仓库已存在');
      return false;
    }
    const colors = ['#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#e67e22'];
    const newRepo: Repo = {
      id: `repo-${Date.now()}`,
      owner: parts[0],
      name: parts[1],
      fullName,
      openIssuesCount: 0,
      color: colors[repos.length % colors.length],
    };
    const newRepos = [...repos, newRepo];
    const newIssues = [
      ...issues,
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `issue-new-${newRepo.id}-${i}`,
        repoId: newRepo.id,
        number: 200 + i,
        title: [
          `[${parts[1]}] 新功能：支持暗色模式`,
          `[${parts[1]}] 修复首页加载缓慢问题`,
          `[${parts[1]}] 文档：完善 API 说明`,
          `[${parts[1]}] 求助：国际化最佳实践`,
          `[${parts[1]}] 优化构建产物体积`,
          `[${parts[1]}] 新增：WebSocket 长连接支持`,
        ][i],
        description:
          '## 说明\n\n这是一条自动生成的示例 Issue 描述。\n\n### 详细内容\n\n请根据实际需求补充具体信息。',
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        labels: [
          { name: (['bug', 'enhancement', 'documentation', 'help wanted'] as LabelName[])[i % 4], color: '' },
        ].map((l) => ({
          ...l,
          color:
            l.name === 'bug'
              ? '#e74c3c'
              : l.name === 'enhancement'
                ? '#2ecc71'
                : l.name === 'documentation'
                  ? '#3498db'
                  : '#9b59b6',
        })),
        commentsCount: i * 3,
        isOpen: true,
      })),
    ];
    const newPRs = [
      ...prs,
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `pr-new-${newRepo.id}-${i}`,
        repoId: newRepo.id,
        number: 300 + i,
        title: [`${parts[1]}: 修复登录问题`, `${parts[1]}: 新增搜索功能`, `${parts[1]}: 升级依赖`, `${parts[1]}: 重构样式`][i],
        author: 'contributor-' + (i + 1),
        status: (['unreviewed', 'changes_requested', 'ready_to_merge', 'merged'] as const)[i],
        createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
        mergedAt: i === 3 ? new Date().toISOString() : undefined,
        linesAdded: 50 + i * 40,
        linesDeleted: 10 + i * 20,
      })),
    ];
    newRepo.openIssuesCount = newIssues.filter((x) => x.repoId === newRepo.id && x.isOpen).length;
    setRepos(newRepos);
    setIssues(newIssues);
    setPrs(newPRs);
    setActiveRepoId(newRepo.id);
    return true;
  };

  const handleRemoveRepo = (repoId: string) => {
    const next = repos.filter((r) => r.id !== repoId);
    setRepos(next);
    setIssues(issues.filter((i) => i.repoId !== repoId));
    setPrs(prs.filter((p) => p.repoId !== repoId));
    if (activeRepoId === repoId) {
      setActiveRepoId(next[0]?.id ?? '');
    }
  };

  const handleMergePR = (prId: string) => {
    setPrs((prev) =>
      prev.map((p) =>
        p.id === prId
          ? { ...p, status: 'merged' as const, mergedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const weeklyReport = useMemo<WeeklyReport>(() => {
    const start = new Date(reportDateRange.start + 'T00:00:00');
    const end = new Date(reportDateRange.end + 'T23:59:59');
    const inRange = (iso?: string) => {
      if (!iso) return false;
      const d = new Date(iso);
      return d >= start && d <= end;
    };
    const mergedPRList = prs.filter((p) => p.status === 'merged' && inRange(p.mergedAt));
    const closedIssuesList = issues.filter((i) => !i.isOpen && inRange(i.createdAt));
    const totalComments = issues.reduce((acc, i) => (inRange(i.createdAt) ? acc + i.commentsCount : acc), 0);
    const breakdown = repos.map((r) => {
      const rPRs = mergedPRList.filter((p) => p.repoId === r.id);
      return {
        repoName: r.fullName,
        mergedPRs: rPRs.length,
        linesAdded: rPRs.reduce((a, p) => a + p.linesAdded, 0),
      };
    });
    return {
      startDate: reportDateRange.start,
      endDate: reportDateRange.end,
      mergedPRs: mergedPRList.length,
      closedIssues: closedIssuesList.length,
      newComments: totalComments,
      totalLinesAdded: mergedPRList.reduce((a, p) => a + p.linesAdded, 0),
      reposBreakdown: breakdown,
    };
  }, [prs, issues, repos, reportDateRange]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        background: 'var(--bg-primary)',
      }}
    >
      <button
        onClick={() => setSidebarOpen(true)}
        aria-label="展开菜单"
        style={{
          display: 'none',
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: 60,
          width: 40,
          height: 40,
          borderRadius: 8,
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-card)',
          '@media (max-width: 768px)': { display: 'flex' },
        } as React.CSSProperties}
      >
        <Menu size={20} />
      </button>

      <div
        style={{
          width: 320,
          minWidth: 320,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease',
          '@media (max-width: 768px)': {
            position: 'fixed',
            left: 0,
            top: 0,
            height: '100vh',
            zIndex: 70,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          },
        } as React.CSSProperties}
      >
        {sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="关闭菜单"
            style={{
              display: 'none',
              position: 'absolute',
              top: 12,
              right: 12,
              width: 32,
              height: 32,
              borderRadius: 6,
              alignItems: 'center',
              justifyContent: 'center',
              '@media (max-width: 768px)': { display: 'flex' },
            } as React.CSSProperties}
          >
            <X size={18} />
          </button>
        )}
        <RepoManager
          repos={repos}
          activeRepoId={activeRepoId}
          onSelect={(id) => {
            setActiveRepoId(id);
            setSidebarOpen(false);
          }}
          onAdd={handleAddRepo}
          onRemove={handleRemoveRepo}
        />
      </div>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 65,
            '@media (max-width: 768px)': { display: 'block' },
          } as React.CSSProperties}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
            background: 'var(--bg-primary)',
          }}
        >
          <div style={{ flex: 1, minWidth: 240, maxWidth: 480 }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索 Issue 标题或标签..."
              style={{
                width: '100%',
                height: 40,
                padding: '0 14px',
                borderRadius: 8,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['bug', 'enhancement', 'documentation', 'help wanted'] as LabelName[]).map((lb) => {
              const active = labelFilters.includes(lb);
              const colors: Record<LabelName, string> = {
                bug: '#e74c3c',
                enhancement: '#2ecc71',
                documentation: '#3498db',
                'help wanted': '#9b59b6',
              };
              return (
                <button
                  key={lb}
                  onClick={() =>
                    setLabelFilters((prev) =>
                      active ? prev.filter((l) => l !== lb) : [...prev, lb]
                    )
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: active ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    border: '1px solid',
                    borderColor: active ? colors[lb] : 'var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: colors[lb],
                    }}
                  />
                  {lb}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setReportOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 16px',
              height: 40,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #3498db, #2980b9)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              boxShadow: '0 2px 8px rgba(52,152,219,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(52,152,219,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(52,152,219,0.3)';
            }}
          >
            <FileText size={16} />
            生成周报
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            padding: '0 24px',
            gap: 4,
          }}
        >
          {([
            { id: 'issues' as TabId, label: 'Issue 看板', icon: LayoutDashboard },
            { id: 'prs' as TabId, label: 'PR 状态', icon: GitPullRequest },
          ]).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 18px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  borderBottom: '2px solid',
                  borderColor: active ? 'var(--accent)' : 'transparent',
                  background: 'transparent',
                  transition: 'all 0.2s',
                  position: 'relative',
                  top: 1,
                }}
              >
                <Icon size={16} />
                {tab.label}
                {tab.id === 'issues' && activeRepo && (
                  <span
                    style={{
                      padding: '1px 8px',
                      borderRadius: 10,
                      background: 'var(--bg-card)',
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {currentIssues.filter((i) => i.isOpen).length}
                  </span>
                )}
                {tab.id === 'prs' && activeRepo && (
                  <span
                    style={{
                      padding: '1px 8px',
                      borderRadius: 10,
                      background: 'var(--bg-card)',
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {currentPRs.filter((p) => p.status !== 'merged').length}
                  </span>
                )}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
            <Calendar size={14} />
            <span>
              {weeklyReport.startDate} ~ {weeklyReport.endDate}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              transform: activeTab === 'issues' ? 'translateX(0)' : 'translateX(-50%)',
            }}
          >
            <div style={{ width: '50%', minWidth: '50%', height: '100%', overflow: 'auto', padding: 24 }}>
              {activeRepo ? (
                <IssueBoard
                  issues={currentIssues}
                  searchQuery={searchQuery}
                  labelFilters={labelFilters}
                />
              ) : (
                <EmptyState text="请先添加一个仓库" />
              )}
            </div>
            <div style={{ width: '50%', minWidth: '50%', height: '100%', overflow: 'auto', padding: 24 }}>
              {activeRepo ? (
                <PRTracker prs={currentPRs} onMerge={handleMergePR} />
              ) : (
                <EmptyState text="请先添加一个仓库" />
              )}
            </div>
          </div>
        </div>
      </div>

      {reportOpen && (
        <div
          onClick={() => setReportOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560 }}>
            <ReportGenerator
              report={weeklyReport}
              dateRange={reportDateRange}
              onDateChange={setReportDateRange}
              onExport={showToast}
              onClose={() => setReportOpen(false)}
            />
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 20px',
            background: '#2ecc71',
            color: '#fff',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(46,204,113,0.4)',
            fontWeight: 500,
            fontSize: 14,
            animation: 'toastIn 0.3s ease',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}
