import { X, Calendar, GitMerge, AlertCircle, MessageSquare, Code2, FileText, Check } from 'lucide-react';
import type { WeeklyReport } from './types';

interface Props {
  report: WeeklyReport;
  dateRange: { start: string; end: string };
  onDateChange: (range: { start: string; end: string }) => void;
  onExport: (message: string) => void;
  onClose: () => void;
}

function generateMarkdown(report: WeeklyReport): string {
  let md = `# 代码贡献周报\n\n`;
  md += `**统计周期**：${report.startDate} 至 ${report.endDate}\n\n`;
  md += `---\n\n`;
  md += `## 总览数据\n\n`;
  md += `| 指标 | 数值 |\n`;
  md += `|------|------|\n`;
  md += `| 合并 PR 数 | ${report.mergedPRs} |\n`;
  md += `| 关闭 Issue 数 | ${report.closedIssues} |\n`;
  md += `| 新增评论数 | ${report.newComments} |\n`;
  md += `| 预计新增代码行数 | ${report.totalLinesAdded.toLocaleString()} |\n\n`;
  md += `## 各仓库贡献明细\n\n`;
  md += `| 仓库 | 合并 PR 数 | 新增代码行数 |\n`;
  md += `|------|-----------|-------------|\n`;
  report.reposBreakdown.forEach((b) => {
    md += `| ${b.repoName} | ${b.mergedPRs} | ${b.linesAdded.toLocaleString()} |\n`;
  });
  md += `\n---\n\n`;
  md += `_报告由 GitHub 看板自动生成_ 🚀\n`;
  return md;
}

export default function ReportGenerator({ report, dateRange, onDateChange, onExport, onClose }: Props) {
  const handleExport = async () => {
    const md = generateMarkdown(report);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(md);
      } else {
        const ta = document.createElement('textarea');
        ta.value = md;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      onExport('周报已复制到剪贴板');
      onClose();
    } catch {
      onExport('复制失败，请手动选择');
    }
  };

  const stats = [
    {
      label: '合并 PR 数',
      value: report.mergedPRs,
      icon: GitMerge,
      color: '#2ecc71',
      unit: '个',
    },
    {
      label: '关闭 Issue 数',
      value: report.closedIssues,
      icon: AlertCircle,
      color: '#e74c3c',
      unit: '个',
    },
    {
      label: '新增评论数',
      value: report.newComments,
      icon: MessageSquare,
      color: '#f39c12',
      unit: '条',
    },
    {
      label: '预计代码行数',
      value: report.totalLinesAdded,
      icon: Code2,
      color: '#3498db',
      unit: '行',
      format: (n: number) => n.toLocaleString(),
    },
  ];

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        borderRadius: 16,
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={22} color="#ecf0f1" />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>代码贡献周报</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="关闭"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.6)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '20px 24px' }}>
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ecf0f1', fontSize: 12, fontWeight: 500 }}>
            <Calendar size={14} />
            开始日期
          </label>
          <input
            type="date"
            value={dateRange.start}
            max={dateRange.end}
            onChange={(e) => onDateChange({ ...dateRange, start: e.target.value })}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ecf0f1',
              fontSize: 12,
              colorScheme: 'dark',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>~</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ecf0f1', fontSize: 12, fontWeight: 500 }}>
            结束日期
          </label>
          <input
            type="date"
            value={dateRange.end}
            min={dateRange.start}
            onChange={(e) => onDateChange({ ...dateRange, end: e.target.value })}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ecf0f1',
              fontSize: 12,
              colorScheme: 'dark',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {stats.map((s) => {
            const Icon = s.icon;
            const display = s.format ? s.format(s.value as number) : s.value;
            return (
              <div
                key={s.label}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 10,
                  padding: '16px 18px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 7,
                      background: s.color + '22',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={16} color={s.color} />
                  </div>
                  <span style={{ fontSize: 12, color: '#95a5a6', fontWeight: 500 }}>{s.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 26, fontWeight: 700, color: '#ecf0f1', lineHeight: 1 }}>{display}</span>
                  <span style={{ fontSize: 12, color: '#7f8c8d', fontWeight: 500 }}>{s.unit}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 10,
            padding: 16,
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, color: '#95a5a6', fontWeight: 500, marginBottom: 12 }}>各仓库明细</div>
          {report.reposBreakdown.filter((b) => b.mergedPRs > 0 || b.linesAdded > 0).length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 20,
                color: '#7f8c8d',
                fontSize: 12,
              }}
            >
              该时间段内暂无贡献数据
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {report.reposBreakdown
                .filter((b) => b.mergedPRs > 0 || b.linesAdded > 0)
                .map((b) => {
                  const maxLines = Math.max(...report.reposBreakdown.map((x) => x.linesAdded), 1);
                  const pct = Math.max(4, (b.linesAdded / maxLines) * 100);
                  return (
                    <div key={b.repoName}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 5,
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color: '#ecf0f1', fontWeight: 500 }}>{b.repoName}</span>
                        <span style={{ color: '#95a5a6' }}>
                          {b.mergedPRs} PR · {b.linesAdded.toLocaleString()} 行
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          background: 'rgba(0,0,0,0.3)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: pct + '%',
                            height: '100%',
                            background: 'linear-gradient(90deg, #3498db, #2ecc71)',
                            borderRadius: 3,
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <button
          onClick={handleExport}
          style={{
            width: '100%',
            height: 46,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: '2px solid rgba(255,255,255,0.3)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            background: 'transparent',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#fff';
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.background = 'transparent';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <FileText size={16} />
          导出为 Markdown
          <Check size={14} style={{ marginLeft: 4 }} />
        </button>
      </div>
    </div>
  );
}
