import { useState, useMemo, useRef } from 'react';
import { Download, Printer, FileBarChart, TrendingUp, CalendarDays, Award } from 'lucide-react';
import { ExpenseService, CATEGORY_LIST } from '../services/ExpenseService';
import jsPDF from 'jspdf';

export default function Report() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [generated, setGenerated] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const availableMonths = ExpenseService.getAvailableMonths();

  const summary = useMemo(
    () => ExpenseService.getMonthlySummary(year, month),
    [year, month]
  );

  const sortedCategories = useMemo(() => {
    return CATEGORY_LIST
      .filter((c) => summary.byCategory[c.name] > 0)
      .sort((a, b) => summary.byCategory[b.name] - summary.byCategory[a.name]);
  }, [summary]);

  const topCategory = sortedCategories[0];

  const handleGenerate = () => {
    setGenerated(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 20;
    let y = 25;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(245, 166, 35);
    doc.text(`${year}年${month}月 家庭支出报告`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 45, 45);
    doc.text('核心数据', marginLeft, y);
    y += 2;
    doc.setDrawColor(245, 166, 35);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, y + 2, marginLeft + 30, y + 2);
    y += 10;

    const metrics = [
      { label: '本月总支出', value: ExpenseService.formatMoney(summary.total), color: [245, 166, 35] },
      { label: '日均支出', value: ExpenseService.formatMoney(summary.dailyAvg), color: [74, 144, 217] },
      { label: '支出笔数', value: `${summary.expenses.length} 笔`, color: [155, 89, 182] },
      { label: '消费类别数', value: `${sortedCategories.length} 类`, color: [46, 204, 113] },
    ];

    metrics.forEach((m, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = marginLeft + col * 85;
      const yy = y + row * 20;

      doc.setFillColor(m.color[0], m.color[1], m.color[2]);
      doc.roundedRect(x, yy, 78, 16, 3, 3, 'F');

      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text(m.label, x + 5, yy + 6);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(m.value, x + 5, yy + 12);
    });

    y += Math.ceil(metrics.length / 2) * 20 + 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 45, 45);
    doc.text('类别分析', marginLeft, y);
    y += 2;
    doc.setDrawColor(245, 166, 35);
    doc.line(marginLeft, y + 2, marginLeft + 30, y + 2);
    y += 10;

    if (sortedCategories.length === 0) {
      doc.setFontSize(11);
      doc.setTextColor(128, 128, 128);
      doc.text('本月暂无支出数据', marginLeft, y);
    } else {
      sortedCategories.forEach((cat) => {
        const amt = summary.byCategory[cat.name];
        const pct = summary.categoryPercentages[cat.name];
        const barMaxWidth = 130;
        const barWidth = Math.max(2, (pct / 100) * barMaxWidth);

        doc.setFillColor(parseInt(cat.color.slice(1, 3), 16), parseInt(cat.color.slice(3, 5), 16), parseInt(cat.color.slice(5, 7), 16));
        doc.roundedRect(marginLeft, y, barWidth, 7, 1.5, 1.5, 'F');

        doc.setFontSize(10);
        doc.setTextColor(45, 45, 45);
        doc.setFont('helvetica', 'bold');
        doc.text(`${cat.icon} ${cat.name}`, marginLeft + 2, y + 5);

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'normal');
        doc.text(`${ExpenseService.formatMoney(amt)} (${pct.toFixed(1)}%)`, marginLeft + barMaxWidth + 5, y + 5);

        y += 12;
        if (y > 260) {
          doc.addPage();
          y = 25;
        }
      });
    }

    y += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 45, 45);
    doc.text('关键洞察', marginLeft, y);
    y += 2;
    doc.setDrawColor(245, 166, 35);
    doc.line(marginLeft, y + 2, marginLeft + 30, y + 2);
    y += 10;

    const insights: string[] = [];
    if (summary.total === 0) {
      insights.push('本月暂无支出记录，点击"记一笔"开始记录吧。');
    } else {
      if (topCategory) {
        insights.push(`本月支出最多的类别是「${topCategory.name}」，共花费 ${ExpenseService.formatMoney(summary.byCategory[topCategory.name])}，占比 ${summary.categoryPercentages[topCategory.name].toFixed(1)}%。`);
      }
      if (summary.highestDate.date !== '-') {
        insights.push(`支出最高的一天是 ${ExpenseService.formatDateDisplay(summary.highestDate.date)}，当天花费 ${ExpenseService.formatMoney(summary.highestDate.amount)}。`);
      }
      insights.push(`本月共产生 ${summary.expenses.length} 笔消费，日均支出 ${ExpenseService.formatMoney(summary.dailyAvg)}。`);
      if (summary.categoryPercentages['食品'] > 40) {
        insights.push('食品类支出占比较高（>40%），可以考虑适当优化饮食支出。');
      }
      if (sortedCategories.length <= 2) {
        insights.push('消费类别较为单一，注意生活均衡与多元化。');
      }
    }

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    insights.forEach((ins) => {
      const lines = doc.splitTextToSize(`• ${ins}`, pageWidth - marginLeft - 20);
      lines.forEach((line: string) => {
        doc.text(line, marginLeft + 2, y);
        y += 5.5;
      });
      y += 2;
    });

    y += 5;
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text('—— 家庭支出管理系统 生成 ——', pageWidth / 2, pageHeight - 15, { align: 'center' });

    doc.save(`家庭支出报告_${year}${month.toString().padStart(2, '0')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap no-print">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#2D2D2D' }}>月度报告</h2>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>生成并导出月度消费分析报告</p>
        </div>
      </div>

      <div className="card p-6 fade-in no-print">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: '#2D2D2D' }}>
          <FileBarChart size={18} style={{ color: '#F5A623' }} /> 选择月份生成报告
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium mb-1" style={{ color: '#6B7280' }}>年份</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 focus:border-orange-300 transition-all outline-none bg-white"
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>{y} 年</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium mb-1" style={{ color: '#6B7280' }}>月份</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-300 transition-all outline-none bg-white"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m} 月</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium mb-1" style={{ color: '#6B7280' }}>快捷选择（有数据的月份）</label>
            <select
              value={`${year}-${month}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number);
                setYear(y);
                setMonth(m);
              }}
              className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 focus:border-purple-300 transition-all outline-none bg-white"
            >
              {availableMonths.map(({ year: y, month: m }) => (
                <option key={`${y}-${m}`} value={`${y}-${m}`}>
                  {y}年{m}月（{ExpenseService.getMonthlySummary(y, m).expenses.length}笔）
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            className="btn btn-primary text-base flex items-center gap-2"
          >
            <FileBarChart size={18} /> 生成报告
          </button>
        </div>
      </div>

      {generated && (
        <div ref={reportRef} className="card p-8 print-area fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="text-center pb-6 mb-6" style={{ borderBottom: '2px solid #FEF3C7' }}>
            <div className="text-3xl font-bold" style={{ color: '#F5A623' }}>
              {year} 年 {month} 月 家庭支出报告
            </div>
            <div className="text-sm mt-2" style={{ color: '#6B7280' }}>
              生成时间：{new Date().toLocaleString('zh-CN')}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#2D2D2D' }}>
              <TrendingUp size={18} style={{ color: '#F5A623' }} /> 核心数据
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '💰', label: '本月总支出', value: ExpenseService.formatMoney(summary.total), gradient: 'linear-gradient(135deg, #F5A623, #F093FB)' },
                { icon: '📅', label: '日均支出', value: ExpenseService.formatMoney(summary.dailyAvg), gradient: 'linear-gradient(135deg, #4A90D9, #667eea)' },
                { icon: '📝', label: '支出笔数', value: `${summary.expenses.length} 笔`, gradient: 'linear-gradient(135deg, #9B59B6, #F093FB)' },
                { icon: '🏷️', label: '消费类别数', value: `${sortedCategories.length} 类`, gradient: 'linear-gradient(135deg, #2ECC71, #27ae60)' },
              ].map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl text-white"
                  style={{ background: m.gradient, boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
                >
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <div className="text-xs opacity-80 mb-1">{m.label}</div>
                  <div className="text-xl font-bold">{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#2D2D2D' }}>
              <CalendarDays size={18} style={{ color: '#F5A623' }} /> 类别占比分析
            </h3>
            {sortedCategories.length === 0 ? (
              <div className="p-8 rounded-xl text-center" style={{ background: '#F9FAFB', color: '#9CA3AF' }}>
                本月暂无支出数据
              </div>
            ) : (
              <div className="space-y-3">
                {sortedCategories.map((cat) => {
                  const amt = summary.byCategory[cat.name];
                  const pct = summary.categoryPercentages[cat.name];
                  return (
                    <div key={cat.name} className="p-4 rounded-xl" style={{ background: cat.color + '10' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cat.icon}</span>
                          <span className="font-semibold" style={{ color: cat.color }}>{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold" style={{ color: '#2D2D2D' }}>
                            {ExpenseService.formatMoney(amt)}
                          </span>
                          <span className="ml-2 text-sm font-semibold" style={{ color: cat.color }}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: '#FFFFFF' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${cat.color}, ${cat.color}CC)`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#2D2D2D' }}>
              <Award size={18} style={{ color: '#F5A623' }} /> 关键洞察
            </h3>
            <div className="space-y-3">
              {summary.total === 0 ? (
                <div className="p-4 rounded-xl text-center" style={{ background: '#F9FAFB', color: '#9CA3AF' }}>
                  本月暂无支出记录，点击「记一笔」开始记录吧。
                </div>
              ) : (
                [
                  topCategory
                    ? `💡 本月支出最多的类别是「${topCategory.name}」，共花费 ${ExpenseService.formatMoney(summary.byCategory[topCategory.name])}，占比 ${summary.categoryPercentages[topCategory.name].toFixed(1)}%。`
                    : '',
                  summary.highestDate.date !== '-'
                    ? `📆 支出最高的一天是 ${ExpenseService.formatDateDisplay(summary.highestDate.date)}，当天花费 ${ExpenseService.formatMoney(summary.highestDate.amount)}。`
                    : '',
                  `📊 本月共产生 ${summary.expenses.length} 笔消费，日均支出 ${ExpenseService.formatMoney(summary.dailyAvg)}。`,
                  summary.categoryPercentages['食品'] > 40
                    ? '🍔 食品类支出占比较高（>40%），可以考虑适当优化饮食支出。'
                    : '',
                  sortedCategories.length <= 2 && summary.total > 0
                    ? '🎯 消费类别较为单一，注意生活均衡与多元化。'
                    : '',
                  summary.total > 0 && summary.dailyAvg < 30
                    ? '👍 本月日均支出较低，保持良好的消费习惯！'
                    : '',
                ]
                  .filter(Boolean)
                  .map((text, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl fade-in"
                      style={{
                        background: 'linear-gradient(90deg, #FFF7E6 0%, #FFFFFF 100%)',
                        borderLeft: '4px solid #F5A623',
                        animationDelay: `${idx * 0.1}s`,
                      }}
                    >
                      <div className="text-sm" style={{ color: '#374151' }}>{text}</div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {summary.expenses.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#2D2D2D' }}>
                <span>📋</span> 消费明细一览
              </h3>
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#F3F4F6' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#FEF3C7' }}>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: '#92400E' }}>日期</th>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: '#92400E' }}>类别</th>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: '#92400E' }}>备注</th>
                      <th className="text-right py-3 px-4 font-semibold" style={{ color: '#92400E' }}>金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.expenses
                      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt))
                      .map((exp, i) => {
                        const cat = ExpenseService.getCategoryInfo(exp.category);
                        return (
                          <tr
                            key={exp.id}
                            style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FFFCF7', borderTop: '1px solid #F3F4F6' }}
                          >
                            <td className="py-3 px-4" style={{ color: '#374151' }}>{exp.date.slice(5)}</td>
                            <td className="py-3 px-4">
                              <span style={{ color: cat.color }}>{cat.icon} {cat.name}</span>
                            </td>
                            <td className="py-3 px-4" style={{ color: '#6B7280' }}>{exp.note || '-'}</td>
                            <td className="py-3 px-4 text-right font-semibold" style={{ color: '#2D2D2D' }}>
                              {ExpenseService.formatMoney(exp.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    <tr style={{ background: '#FEF9C3', borderTop: '2px solid #F5A623' }}>
                      <td colSpan={3} className="py-3 px-4 font-bold text-right" style={{ color: '#92400E' }}>合计：</td>
                      <td className="py-3 px-4 text-right font-bold text-lg" style={{ color: '#F5A623' }}>
                        {ExpenseService.formatMoney(summary.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="text-center pt-6" style={{ borderTop: '1px dashed #E5E7EB', color: '#9CA3AF' }}>
            <div className="text-xs">—— 家庭支出管理系统 生成 · 所有数据仅供参考 ——</div>
          </div>
        </div>
      )}

      {generated && (
        <div className="flex justify-center gap-4 no-print fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={handlePrint}
            className="btn btn-secondary flex items-center gap-2 text-base"
          >
            <Printer size={18} /> 打印报告
          </button>
          <button
            onClick={handleExportPDF}
            className="btn btn-primary flex items-center gap-2 text-base"
          >
            <Download size={18} /> 导出为 PDF
          </button>
        </div>
      )}
    </div>
  );
}
