import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Clock, Zap, Target, PieChart, Calendar, Share2 } from 'lucide-react';
import { useStore } from '@/shared/store';
import type { ReportData } from '@/shared/types';
import { cn } from '@/lib/utils';

const PHASE_COLORS = ['#e94560', '#8be9fd', '#50fa7b', '#bd93f9', '#ffb86c', '#f1fa8c', '#ff79c6'];

export default function ReportGenerator() {
  const { id } = useParams<{ id: string }>();
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const logs = useStore((s) => s.progressLogs);
  const exportData = useStore((s) => s.exportData);

  const [exporting, setExporting] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);

  const reportData = useMemo<ReportData | null>(() => {
    if (!project) return null;
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    const taskIds = projectTasks.map((t) => t.id);
    const projectLogs = logs.filter((l) => taskIds.includes(l.taskId));

    const totalHours = projectTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const totalDays = Math.max(
      1,
      Math.ceil(
        (project.endDate - project.startDate) / (24 * 60 * 60 * 1000),
      ),
    );

    const phaseBreakdown = projectTasks.map((task, idx) => {
      const percentage = totalHours > 0 ? (task.estimatedHours / totalHours) * 100 : 0;
      return {
        title: task.title,
        hours: task.estimatedHours,
        percentage,
        color: PHASE_COLORS[idx % PHASE_COLORS.length],
      };
    });

    const completedTasks = projectTasks.filter((t) => t.status === 'completed').length;
    const completionRate = projectTasks.length > 0
      ? Math.round((completedTasks / projectTasks.length) * 100)
      : 0;

    const activeDays = Math.max(1, new Set(
      projectLogs.map((l) => new Date(l.createdAt).toDateString()),
    ).size);
    const avgDailyHours = totalHours / activeDays;

    return {
      project,
      tasks: projectTasks,
      logs: projectLogs,
      totalHours,
      totalDays,
      phaseBreakdown,
      avgDailyHours,
      completionRate,
    };
  }, [project, tasks, logs]);

  if (!project || !reportData) {
    return (
      <div className="min-h-screen bg-forge-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-white mb-4">报告不存在</h2>
          <Link to="/" className="btn-elastic px-6 py-2 rounded-xl bg-forge-accent text-white">
            返回看板
          </Link>
        </div>
      </div>
    );
  }

  const generateMarkdown = (): string => {
    const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('zh-CN');
    const fmtDateTime = (ts: number) => new Date(ts).toLocaleString('zh-CN');

    const statusMap: Record<string, string> = {
      completed: '✅ 完成',
      progress: '🔵 推进',
      blocked: '🔴 阻塞',
    };

    let md = `# ${project.title} - 项目复盘报告\n\n`;
    md += `> 生成时间：${fmtDateTime(Date.now())}\n\n`;
    md += `## 项目概览\n\n`;
    md += `- **项目描述**：${project.description}\n`;
    md += `- **项目周期**：${fmtDate(project.startDate)} 至 ${fmtDate(project.endDate)}（共 ${reportData.totalDays} 天）\n`;
    md += `- **优先级**：${project.priority === 'high' ? '高' : project.priority === 'medium' ? '中' : '低'}\n\n`;

    md += `## 核心指标\n\n`;
    md += `| 指标 | 数值 |\n`;
    md += `|------|------|\n`;
    md += `| 总预计工时 | ${reportData.totalHours} 小时 |\n`;
    md += `| 总周期 | ${reportData.totalDays} 天 |\n`;
    md += `| 平均每日推进 | ${reportData.avgDailyHours.toFixed(1)} 小时/天 |\n`;
    md += `| 任务完成率 | ${reportData.completionRate}% |\n`;
    md += `| 任务总数 | ${reportData.tasks.length} 个 |\n`;
    md += `| 进度日志 | ${reportData.logs.length} 条 |\n\n`;

    md += `## 各阶段耗时占比\n\n`;
    reportData.phaseBreakdown.forEach((phase) => {
      const bar = '█'.repeat(Math.round(phase.percentage / 5));
      md += `- **${phase.title}**：${phase.hours}h (${phase.percentage.toFixed(1)}%) ${bar}\n`;
    });
    md += '\n';

    md += `## 任务明细\n\n`;
    reportData.tasks.forEach((task, idx) => {
      md += `### ${idx + 1}. ${task.title}\n\n`;
      md += `- **预计工时**：${task.estimatedHours} 小时\n`;
      md += `- **周期**：${task.durationDays} 天\n`;
      md += `- **状态**：${task.status === 'completed' ? '✅ 已完成' : task.status === 'in_progress' ? '🔵 进行中' : '⏳ 待开始'}\n`;
      if (task.dependencyIds.length > 0) {
        const depNames = task.dependencyIds
          .map((did) => reportData.tasks.find((t) => t.id === did)?.title)
          .filter(Boolean);
        md += `- **依赖**：${depNames.join(', ')}\n`;
      }
      const taskLogs = reportData.logs
        .filter((l) => l.taskId === task.id)
        .sort((a, b) => a.createdAt - b.createdAt);
      if (taskLogs.length > 0) {
        md += `\n**进度日志**：\n\n`;
        taskLogs.forEach((log) => {
          md += `- ${fmtDateTime(log.createdAt)} ${statusMap[log.status]}：${log.content}\n`;
          if (log.imageUrl) {
            md += `  ![进度图片](${log.imageUrl.slice(0, 50)}...)\n`;
          }
        });
      }
      md += '\n';
    });

    md += `---\n\n`;
    md += `*本报告由 CreativeForge 创意工坊自动生成*\n`;

    return md;
  };

  const handleExportMarkdown = () => {
    setExporting(true);
    try {
      const md = generateMarkdown();
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title}-复盘报告.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  };

  const handleExportAllData = async () => {
    setExportingZip(true);
    try {
      const blob = await exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `creative-forge-backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setTimeout(() => setExportingZip(false), 500);
    }
  };

  const pieSlices = useMemo(() => {
    const slices: { d: string; color: string; label: string; percent: string }[] = [];
    let cumulativePercent = 0;
    const cx = 60;
    const cy = 60;
    const r = 45;

    reportData.phaseBreakdown.forEach((phase, i) => {
      const startAngle = cumulativePercent * 3.6 - 90;
      cumulativePercent += phase.percentage;
      const endAngle = cumulativePercent * 3.6 - 90;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArc = phase.percentage > 50 ? 1 : 0;

      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      slices.push({
        d,
        color: phase.color || PHASE_COLORS[i % PHASE_COLORS.length],
        label: phase.title,
        percent: phase.percentage.toFixed(1),
      });
    });

    return slices;
  }, [reportData.phaseBreakdown]);

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('zh-CN');

  const getLogStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-log-completed';
      case 'progress': return 'bg-log-progress';
      case 'blocked': return 'bg-log-blocked';
      default: return 'bg-forge-muted';
    }
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return { label: '已完成', className: 'bg-log-completed/15 text-log-completed' };
      case 'in_progress': return { label: '进行中', className: 'bg-log-progress/15 text-log-progress' };
      default: return { label: '待开始', className: 'bg-forge-muted/15 text-forge-muted' };
    }
  };

  return (
    <div className="min-h-screen bg-forge-bg">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to={`/project/${project.id}`}
              className="btn-elastic p-2 rounded-xl hover:bg-white/10 text-forge-muted hover:text-white"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="font-display text-3xl font-bold text-white">项目复盘报告</h1>
              <p className="text-forge-muted text-sm">{project.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportMarkdown}
              disabled={exporting}
              className={cn(
                'btn-elastic px-4 py-2.5 rounded-xl font-medium flex items-center gap-2',
                'bg-forge-accent text-white hover:bg-forge-accent-hover',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              )}
            >
              <FileText size={16} />
              {exporting ? '导出中...' : '导出 Markdown'}
            </button>
            <button
              type="button"
              onClick={handleExportAllData}
              disabled={exportingZip}
              className={cn(
                'btn-elastic px-4 py-2.5 rounded-xl font-medium flex items-center gap-2',
                'bg-forge-surface text-white hover:bg-forge-border',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              )}
            >
              <Download size={16} />
              {exportingZip ? '打包中...' : '导出全部数据'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-forge-accent/20 flex items-center justify-center">
                <Clock size={20} className="text-forge-accent" />
              </div>
              <span className="text-forge-muted text-sm">总预计工时</span>
            </div>
            <div className="font-display text-3xl font-bold text-white">
              {reportData.totalHours}
              <span className="text-lg font-normal text-forge-muted ml-1">小时</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-category-text/20 flex items-center justify-center">
                <Calendar size={20} className="text-category-text" />
              </div>
              <span className="text-forge-muted text-sm">总周期</span>
            </div>
            <div className="font-display text-3xl font-bold text-white">
              {reportData.totalDays}
              <span className="text-lg font-normal text-forge-muted ml-1">天</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-category-music/20 flex items-center justify-center">
                <Zap size={20} className="text-category-music" />
              </div>
              <span className="text-forge-muted text-sm">日均推进</span>
            </div>
            <div className="font-display text-3xl font-bold text-white">
              {reportData.avgDailyHours.toFixed(1)}
              <span className="text-lg font-normal text-forge-muted ml-1">h/天</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-category-video/20 flex items-center justify-center">
                <Target size={20} className="text-category-video" />
              </div>
              <span className="text-forge-muted text-sm">完成率</span>
            </div>
            <div className="font-display text-3xl font-bold text-white">
              {reportData.completionRate}
              <span className="text-lg font-normal text-forge-muted ml-1">%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart size={18} className="text-forge-accent" />
              <h3 className="font-display font-semibold text-white">各阶段耗时占比</h3>
            </div>
            <div className="flex items-center justify-center mb-4">
              <svg width="140" height="140" viewBox="0 0 120 120">
                {pieSlices.map((slice, i) => (
                  <path
                    key={i}
                    d={slice.d}
                    fill={slice.color}
                    stroke="#1a1a2e"
                    strokeWidth="1"
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
                <circle cx="60" cy="60" r="24" fill="#1a1a2e" />
                <text x="60" y="58" textAnchor="middle" fill="#e6e6e6" fontSize="12" fontWeight="600">
                  {reportData.totalHours}h
                </text>
                <text x="60" y="72" textAnchor="middle" fill="#8892b0" fontSize="9">
                  总计
                </text>
              </svg>
            </div>
            <div className="space-y-2">
              {reportData.phaseBreakdown.map((phase, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: phase.color || PHASE_COLORS[i % PHASE_COLORS.length] }}
                  />
                  <span className="text-forge-text flex-1 truncate">{phase.title}</span>
                  <span className="text-forge-muted">{phase.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-forge-accent" />
              <h3 className="font-display font-semibold text-white">项目信息</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-forge-muted mb-1">项目目标</div>
                <div className="text-forge-text">{project.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-forge-muted mb-1">开始日期</div>
                  <div className="text-forge-text font-medium">{formatDate(project.startDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-forge-muted mb-1">结束日期</div>
                  <div className="text-forge-text font-medium">{formatDate(project.endDate)}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-forge-muted mb-2">整体进度</div>
                <div className="h-2.5 rounded-full bg-forge-bg/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-forge-accent to-forge-accent-hover transition-all duration-500"
                    style={{ width: `${reportData.completionRate}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-forge-muted">
                  <span>{reportData.tasks.filter(t => t.status === 'completed').length} / {reportData.tasks.length} 任务</span>
                  <span>{reportData.logs.length} 条日志</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-8">
          <h3 className="font-display font-semibold text-white mb-4">阶段耗时明细</h3>
          <div className="space-y-3">
            {reportData.phaseBreakdown.map((phase, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-forge-text">{phase.title}</span>
                  <span className="text-forge-muted">{phase.hours}h ({phase.percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-2 rounded-full bg-forge-bg/60 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${phase.percentage}%`,
                      backgroundColor: phase.color || PHASE_COLORS[i % PHASE_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Share2 size={18} className="text-forge-accent" />
            <h3 className="font-display font-semibold text-white">任务与日志时间线</h3>
          </div>
          <div className="space-y-6">
            {reportData.tasks.map((task, taskIdx) => {
              const statusBadge = getTaskStatusBadge(task.status);
              const taskLogs = reportData.logs
                .filter((l) => l.taskId === task.id)
                .sort((a, b) => a.createdAt - b.createdAt);
              return (
                <div key={task.id} className="relative pl-8">
                  <div
                    className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-forge-bg"
                    style={{ backgroundColor: PHASE_COLORS[taskIdx % PHASE_COLORS.length] }}
                  />
                  <div className="border-l-2 border-forge-border/50 pl-6 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-display font-semibold text-white">{task.title}</h4>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusBadge.className)}>
                        {statusBadge.label}
                      </span>
                      <span className="text-xs text-forge-muted">
                        {task.estimatedHours}h · {task.durationDays}天
                      </span>
                    </div>

                    {taskLogs.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {taskLogs.map((log) => (
                          <div key={log.id} className="flex items-start gap-3 bg-forge-bg/40 rounded-lg p-3">
                            <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', getLogStatusColor(log.status))} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-forge-muted mb-0.5">
                                {new Date(log.createdAt).toLocaleString('zh-CN')}
                              </div>
                              <div className="text-sm text-forge-text whitespace-pre-wrap">{log.content}</div>
                              {log.imageUrl && (
                                <div className="mt-2">
                                  <img
                                    src={log.imageUrl}
                                    alt="Progress"
                                    className="max-h-32 rounded border border-forge-border"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-forge-muted">
          本报告由 CreativeForge 创意工坊自动生成 · {new Date().toLocaleString('zh-CN')}
        </div>
      </div>
    </div>
  );
}
