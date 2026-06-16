import { useState, useMemo } from 'react';
import { Trophy, Star, Users, FileText, MessageSquare, BarChart3 } from 'lucide-react';
import { useStore } from '@/store';

export default function WeeklyReport() {
  const themes = useStore(s => s.themes);
  const works = useStore(s => s.works);
  const reviews = useStore(s => s.reviews);
  const calculateWeeklyWinner = useStore(s => s.calculateWeeklyWinner);
  const getWorksWithScores = useStore(s => s.getWorksWithScores);

  const [selectedThemeId, setSelectedThemeId] = useState<string>('');

  const sortedThemes = useMemo(() =>
    [...themes].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [themes]
  );

  const selectedTheme = themes.find(t => t.id === selectedThemeId);

  const report = useMemo(() =>
    selectedThemeId ? calculateWeeklyWinner(selectedThemeId) : null,
    [selectedThemeId, calculateWeeklyWinner]
  );

  const worksWithScores = useMemo(() =>
    selectedThemeId ? getWorksWithScores(selectedThemeId) : [],
    [selectedThemeId, getWorksWithScores]
  );

  const winnerReviews = useMemo(() => {
    if (!report) return [];
    return reviews.filter(r => r.workId === report.winnerWorkId);
  }, [report, reviews]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-sans text-bark flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-ink" />
          周报统计
        </h1>
        <p className="text-bark-muted text-sm font-sans mt-1">查看各主题的评选结果和统计数据</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-sans text-bark-light mb-2">选择主题</label>
        <select
          className="input-field max-w-sm font-sans"
          value={selectedThemeId}
          onChange={e => setSelectedThemeId(e.target.value)}
        >
          <option value="">-- 请选择一个主题 --</option>
          {sortedThemes.map(theme => (
            <option key={theme.id} value={theme.id}>
              {theme.title}（{formatDate(theme.startDate)} - {formatDate(theme.endDate)}）
            </option>
          ))}
        </select>
      </div>

      {!selectedThemeId ? (
        <div className="text-center py-16">
          <BarChart3 className="w-10 h-10 text-bark-muted/40 mx-auto mb-3" />
          <p className="text-bark-muted font-sans">请选择一个主题查看评选结果</p>
        </div>
      ) : !report || report.totalWorks === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-10 h-10 text-bark-muted/40 mx-auto mb-3" />
          <p className="text-bark-muted font-sans">该主题暂无作品</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-parchment-light rounded-lg p-4 border border-parchment-dark/20">
            <h2 className="font-sans font-bold text-bark text-lg">{selectedTheme?.title}</h2>
            <p className="text-sm text-bark-muted font-sans mt-1">
              {selectedTheme?.description && <span className="mr-3">{selectedTheme.description}</span>}
              {formatDate(selectedTheme?.startDate || '')} — {formatDate(selectedTheme?.endDate || '')}
            </p>
          </div>

          {report.winnerAvgScore > 0 && (
            <div className="winner-card p-6 animate-gradient-border">
              <div className="flex items-start gap-4">
                <div className="text-4xl animate-trophy-swing origin-bottom">
                  🏆
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-gold/20 text-gold-dark text-xs font-sans font-bold px-2 py-1 rounded">
                      本周最佳
                    </span>
                  </div>
                  <h3 className="font-sans font-bold text-bark text-lg">
                    {worksWithScores.find(w => w.id === report.winnerWorkId)?.title || `作品#${worksWithScores.find(w => w.id === report.winnerWorkId)?.anonymousIndex}`}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1 text-gold-dark font-sans">
                      <Star className="w-4 h-4 fill-gold text-gold" />
                      {report.winnerAvgScore.toFixed(2)} 分
                    </span>
                    <span className="text-bark-muted font-sans">
                      {winnerReviews.length} 条评语
                    </span>
                  </div>
                  {winnerReviews.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {winnerReviews.slice(0, 3).map(r => (
                        <p key={r.id} className="text-sm text-bark-light font-serif italic" style={{ textIndent: 0 }}>
                          「{r.comment || '（未写评语）'}」
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-sans font-bold text-bark mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-ink" />
              全部作品排名
            </h3>
            <div className="space-y-2">
              {worksWithScores.map((work, idx) => {
                const isWinner = work.id === report.winnerWorkId && report.winnerAvgScore > 0;
                return (
                  <div
                    key={work.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isWinner
                        ? 'bg-gold/5 border-gold/30'
                        : 'bg-parchment-light border-parchment-dark/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-sans font-bold ${
                        isWinner
                          ? 'bg-gold/20 text-gold-dark'
                          : idx === 0 ? 'bg-ink/10 text-ink' : 'bg-parchment-dark/30 text-bark-muted'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-sans font-medium text-bark text-sm">
                          作品#{work.anonymousIndex}
                        </span>
                        <span className="text-bark-muted text-xs font-sans ml-2">
                          {work.reviewCount} 条评语
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className={`w-4 h-4 ${work.avgScore > 0 ? 'text-gold fill-gold' : 'text-bark-muted/30'}`} />
                      <span className="font-sans font-bold text-bark text-sm">
                        {work.avgScore > 0 ? work.avgScore.toFixed(2) : '暂无'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-parchment-light rounded-lg p-5 border border-parchment-dark/20 text-center">
              <FileText className="w-5 h-5 text-ink mx-auto mb-2" />
              <div className="text-2xl font-sans font-bold text-bark">{report.totalWorks}</div>
              <div className="text-xs text-bark-muted font-sans mt-1">总作品数</div>
            </div>
            <div className="bg-parchment-light rounded-lg p-5 border border-parchment-dark/20 text-center">
              <MessageSquare className="w-5 h-5 text-ink mx-auto mb-2" />
              <div className="text-2xl font-sans font-bold text-bark">{report.totalReviews}</div>
              <div className="text-xs text-bark-muted font-sans mt-1">总评分数</div>
            </div>
            <div className="bg-parchment-light rounded-lg p-5 border border-parchment-dark/20 text-center">
              <Users className="w-5 h-5 text-ink mx-auto mb-2" />
              <div className="text-2xl font-sans font-bold text-bark">{report.uniqueAuthors}</div>
              <div className="text-xs text-bark-muted font-sans mt-1">参与人数</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
