import { useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import jsPDF from 'jspdf';
import { Activity } from '../data/mockData';

const styles = `
  .review-container {}
  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    background: white;
    border: 1.5px solid #e1e8ef;
    border-radius: 10px;
    font-size: 13px;
    color: #5a6c7d;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    font-weight: 500;
  }
  .back-btn:hover {
    border-color: #1A73E8;
    color: #1A73E8;
    transform: translateX(-2px);
  }
  .export-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 20px;
    background: linear-gradient(135deg, #1A73E8, #2E86F5);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
    transition: all 0.2s;
    font-family: inherit;
    position: relative;
    overflow: hidden;
  }
  .export-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(26, 115, 232, 0.4);
  }
  .report-card {
    background: white;
    border-radius: 14px;
    box-shadow: 0 2px 12px rgba(26, 115, 232, 0.06);
    padding: 24px;
    margin-bottom: 20px;
    animation: fadeInUp 0.3s ease both;
  }
  .report-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .report-title::before {
    content: '';
    width: 4px;
    height: 18px;
    background: linear-gradient(180deg, #1A73E8, #5DADE2);
    border-radius: 2px;
  }
  .activity-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
    margin-bottom: 12px;
  }
  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .summary-label {
    font-size: 11px;
    color: #95a5a6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .summary-value {
    font-size: 14px;
    font-weight: 600;
    color: #2c3e50;
  }
  .summary-value.highlight { color: #1A73E8; }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  .kpi-card {
    background: linear-gradient(135deg, #ffffff, #f8fbff);
    border-radius: 14px;
    padding: 20px;
    border: 1px solid #e8eff8;
    position: relative;
    overflow: hidden;
    animation: fadeInUp 0.3s ease both;
  }
  .kpi-card::after {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 80px; height: 80px;
    background: radial-gradient(circle, rgba(26,115,232,0.08), transparent 70%);
    border-radius: 50%;
    transform: translate(30%, -30%);
  }
  .kpi-icon {
    font-size: 24px;
    margin-bottom: 10px;
  }
  .kpi-label {
    font-size: 11px;
    color: #95a5a6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .kpi-value {
    font-size: 26px;
    font-weight: 700;
    color: #1a1a2e;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }
  .kpi-delta {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }
  .kpi-delta.up { background: #e8f8ef; color: #27ae60; }
  .kpi-delta.down { background: #fde8e8; color: #e74c3c; }

  .charts-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }
  .funnel-container {
    background: white;
    border-radius: 14px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(26, 115, 232, 0.06);
  }
  .funnel-stage {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 12px;
  }
  .funnel-bar-wrap {
    flex: 1;
    position: relative;
    height: 44px;
    display: flex;
    align-items: center;
  }
  .funnel-bar {
    height: 100%;
    background: linear-gradient(90deg, #1A73E8, #5DADE2);
    border-radius: 8px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 12px;
    min-width: 80px;
  }
  .funnel-bar-value {
    color: white;
    font-weight: 600;
    font-size: 13px;
  }
  .funnel-meta {
    width: 90px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .funnel-label {
    font-size: 12px;
    font-weight: 500;
    color: #1a1a2e;
    margin-bottom: 2px;
  }
  .funnel-rate {
    font-size: 11px;
    color: #95a5a6;
  }
  .funnel-icon {
    width: 36px; height: 36px;
    background: #f0f6ff;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }
  .arrow-down {
    text-align: center;
    color: #bdc3c7;
    font-size: 14px;
    margin-bottom: 6px;
    position: relative;
  }
  .arrow-down .conv-label {
    font-size: 10px;
    background: #f0f4f8;
    color: #7f8c8d;
    padding: 2px 8px;
    border-radius: 10px;
    margin-left: 6px;
    font-weight: 500;
  }
  .ranking-table {
    width: 100%;
    border-collapse: collapse;
  }
  .ranking-table th {
    text-align: left;
    font-size: 11px;
    color: #95a5a6;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 12px;
    border-bottom: 2px solid #eef4fb;
    background: #fafbfd;
  }
  .ranking-table th:first-child { border-radius: 8px 0 0 0; }
  .ranking-table th:last-child { border-radius: 0 8px 0 0; text-align: right; }
  .ranking-table td {
    padding: 14px 12px;
    font-size: 13px;
    color: #2c3e50;
    border-bottom: 1px solid #f0f4f8;
    vertical-align: middle;
  }
  .ranking-table td:last-child { text-align: right; font-weight: 600; color: #1A73E8; }
  .ranking-table tr:last-child td { border-bottom: none; }
  .ranking-table tr:hover td { background: #f8faff; }
  .rank-badge {
    width: 26px; height: 26px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    margin-right: 10px;
  }
  .rank-badge.gold { background: linear-gradient(135deg, #FFD700, #FFA500); color: white; }
  .rank-badge.silver { background: linear-gradient(135deg, #C0C0C0, #A0A0A0); color: white; }
  .rank-badge.bronze { background: linear-gradient(135deg, #CD7F32, #A0522D); color: white; }
  .rank-badge.normal { background: #f0f4f8; color: #7f8c8d; }
  .prod-info { display: flex; align-items: center; gap: 10px; }
  .prod-emoji {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #e8f1ff, #d4e6ff);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .prod-name { font-weight: 500; color: #1a1a2e; }
  .prod-qty { font-size: 11px; color: #95a5a6; margin-top: 2px; }
  .bar-info { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  .qty-badge {
    background: #f0f6ff;
    color: #1A73E8;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
  }
  .conclusion-box {
    background: linear-gradient(135deg, #eef4ff, #f8fbff);
    border-radius: 12px;
    padding: 18px;
    border-left: 4px solid #1A73E8;
  }
  .conclusion-title {
    font-size: 13px;
    font-weight: 600;
    color: #1A73E8;
    margin-bottom: 10px;
  }
  .conclusion-text {
    font-size: 13px;
    color: #5a6c7d;
    line-height: 1.8;
  }
  .conclusion-text li { margin-bottom: 4px; }
  .empty-review {
    text-align: center;
    padding: 80px 20px;
    background: white;
    border-radius: 14px;
    box-shadow: 0 2px 12px rgba(26, 115, 232, 0.06);
  }
  .empty-review-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }
  .empty-review-title { font-size: 18px; font-weight: 600; color: #1a1a2e; margin-bottom: 8px; }
  .empty-review-desc { font-size: 13px; color: #95a5a6; }
  .empty-review-btn {
    margin-top: 20px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    background: linear-gradient(135deg, #1A73E8, #2E86F5);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
    font-family: inherit;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (max-width: 1100px) {
    .charts-row { grid-template-columns: 1fr; }
    .kpi-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 640px) {
    .kpi-grid { grid-template-columns: 1fr 1fr; }
    .kpi-value { font-size: 20px; }
    .activity-summary { grid-template-columns: 1fr 11fr; }
  }
  .chart-tooltip {
    background: white;
    border: 1px solid #e8eff8;
    border-radius: 10px;
    padding: 10px 12px;
    box-shadow: 0 8px 24px rgba(26, 115, 232, 0.12);
    font-size: 12px;
  }
`;

interface Props {
  activityId: string | null;
  onBack: () => void;
}

interface ReviewData {
  activity: Activity;
  comparison: {
    before: { avgDailyRevenue: number; avgDailyOrders: number; totalRevenue: number; totalOrders: number };
    during: { avgDailyRevenue: number; avgDailyOrders: number; totalRevenue: number; totalOrders: number };
  };
  growth: { revenueGrowth: number; orderGrowth: number };
  funnel: { views: number; coupons: number; orders: number; payments: number };
  productSales: { productId: string; productName: string; quantity: number; revenue: number }[];
}

const PIE_COLORS = ['#1A73E8', '#3498DB', '#5DADE2', '#85C1E9', '#AED6F1'];

const ReviewReport = ({ activityId, onBack }: Props) => {
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activityId) loadReviewData();
    else setLoading(false);
  }, [activityId]);

  const loadReviewData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/activities/${activityId}/review`);
      const data = await res.json();
      setReviewData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const comparisonChartData = useMemo(() => {
    if (!reviewData) return [];
    return [
      {
        name: '日均订单',
        活动前: Math.round(reviewData.comparison.before.avgDailyOrders),
        活动期间: Math.round(reviewData.comparison.during.avgDailyOrders),
      },
      {
        name: '日均营收(元)',
        活动前: Math.round(reviewData.comparison.before.avgDailyRevenue),
        活动期间: Math.round(reviewData.comparison.during.avgDailyRevenue),
      },
      {
        name: '总订单数',
        活动前: reviewData.comparison.before.totalOrders,
        活动期间: reviewData.comparison.during.totalOrders,
      },
      {
        name: '总营收(元)',
        活动前: reviewData.comparison.before.totalRevenue,
        活动期间: reviewData.comparison.during.totalRevenue,
      },
    ];
  }, [reviewData]);

  const funnelStages = useMemo(() => {
    if (!reviewData?.funnel) return [];
    const f = reviewData.funnel;
    const maxVal = f.views;
    const stages = [
      { icon: '👀', label: '活动浏览', value: f.views, key: 'views' },
      { icon: '🎫', label: '领取优惠', value: f.coupons, key: 'coupons' },
      { icon: '🛒', label: '下单转化', value: f.orders, key: 'orders' },
      { icon: '💳', label: '完成支付', value: f.payments, key: 'payments' },
    ];
    return stages.map((s, i) => ({
      ...s,
      percent: maxVal > 0 ? (s.value / maxVal) * 100 : 0,
      prevRate: i > 0 && stages[i - 1].value > 0
        ? Math.round((s.value / stages[i - 1].value) * 10000) / 100
        : 100,
      totalRate: maxVal > 0 ? Math.round((s.value / maxVal) * 10000) / 100 : 0,
    }));
  }, [reviewData]);

  const pieData = useMemo(() => {
    if (!reviewData?.productSales) return [];
    const total = reviewData.productSales.reduce((sum, p) => sum + p.revenue, 0);
    return reviewData.productSales.slice(0, 5).map((p, i) => ({
      name: p.productName.slice(0, 8),
      value: p.revenue,
      percent: total > 0 ? Math.round((p.revenue / total) * 10000) / 100 : 0,
    }));
  }, [reviewData]);

  const formatNumber = (n: number) => {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toLocaleString();
  };

  const generateConclusion = () => {
    if (!reviewData) return [];
    const tips = [];
    const rg = reviewData.growth.revenueGrowth;
    const og = reviewData.growth.orderGrowth;

    if (rg >= 30) tips.push(`🎉 营收增长 <strong style="color:#27ae60">${rg}%</strong>，活动效果优秀！建议总结成功经验复制到后续活动。`);
    else if (rg >= 10) tips.push(`📈 营收增长 <strong style="color:#27ae60">${rg}%</strong>，表现良好。可通过增加参与商品进一步提升。`);
    else if (rg >= 0) tips.push(`📊 营收增长 <strong>${rg}%</strong>，效果平稳。建议优化折扣力度吸引更多用户。`);
    else tips.push(`⚠️ 营收下滑 <strong style="color:#e74c3c">${rg}%</strong>，需复盘折扣策略和选品。`);

    if (og >= 20) tips.push(`🛒 订单增长 <strong style="color:#27ae60">${og}%</strong>，用户参与度高，活动吸引力充足。`);
    else if (og < 0) tips.push(`📉 订单下滑 <strong style="color:#e74c3c">${og}%</strong>，建议优化推广渠道引入更多流量。`);

    if (reviewData.funnel) {
      const f = reviewData.funnel;
      const couponRate = f.views > 0 ? (f.coupons / f.views) * 100 : 0;
      const payRate = f.orders > 0 ? (f.payments / f.orders) * 100 : 0;
      if (couponRate < 40) tips.push(`🎫 优惠领取率 <strong>${couponRate.toFixed(1)}%</strong> 偏低，建议优化优惠展示位置。`);
      if (payRate < 80) tips.push(`💳 支付转化率 <strong>${payRate.toFixed(1)}%</strong> 较低，可优化结算流程减少流失。`);
    }

    if (reviewData.productSales && reviewData.productSales.length > 0) {
      const top = reviewData.productSales[0];
      tips.push(`🏆 销售冠军是 <strong>${top.productName}</strong>，贡献 ¥${formatNumber(top.revenue)}，可重点备货。`);
    }

    return tips;
  };

  const exportPDF = async () => {
    if (!reviewData || exporting) return;
    setExporting(true);
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 50;

      doc.setFillColor(26, 115, 232);
      doc.rect(0, 0, pageWidth, 80, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Promotion Activity Review', 40, 40);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString('zh-CN')}`, 40, 62);

      y = 110;

      doc.setTextColor(26, 26, 46);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(reviewData.activity.name, 40, y);
      y += 20;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(127, 140, 141);
      const startD = new Date(reviewData.activity.startTime).toLocaleDateString('zh-CN');
      const endD = new Date(reviewData.activity.endTime).toLocaleDateString('zh-CN');
      doc.text(`Activity Period: ${startD} ~ ${endD}`, 40, y);
      y += 30;

      const kpis = [
        { label: 'Total Revenue', val: `¥${formatNumber(reviewData.activity.stats.revenue)}`, delta: `${reviewData.growth.revenueGrowth}%` },
        { label: 'Total Orders', val: formatNumber(reviewData.activity.stats.orders), delta: `${reviewData.growth.orderGrowth}%` },
        { label: 'Total Discount', val: `¥${formatNumber(reviewData.activity.stats.totalDiscount)}` },
        { label: 'ROI', val: `${reviewData.activity.stats.roi}x` },
      ];

      const kpiWidth = (pageWidth - 80) / 4;
      kpis.forEach((kpi, i) => {
        const x = 40 + i * kpiWidth;
        doc.setDrawColor(232, 239, 248);
        doc.roundedRect(x, y, kpiWidth - 6, 70, 6, 6, 'S');
        doc.setTextColor(149, 165, 166);
        doc.setFontSize(9);
        doc.text(kpi.label, x + 12, y + 20);
        doc.setTextColor(26, 26, 46);
        doc.setFontSize(15);
        doc.setFont('helvetica', 'bold');
        doc.text(kpi.val, x + 12, y + 44);
        if (kpi.delta) {
          doc.setTextColor(kpi.delta.startsWith('-') ? 231 : 39, 76, kpi.delta.startsWith('-') ? 60 : 96, kpi.delta.startsWith('-') ? 60 : 142);
          doc.setFontSize(10);
          doc.text((kpi.delta.startsWith('-') ? '' : '+') + kpi.delta, x + 12, y + 60);
        }
      });
      y += 100;

      doc.setTextColor(26, 26, 46);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales Comparison (Before vs During)', 40, y);
      y += 20;

      const comp = reviewData.comparison;
      const compData = [
        ['Metric', 'Before Activity', 'During Activity', 'Growth'],
        ['Avg Daily Orders', String(Math.round(comp.before.avgDailyOrders)), String(Math.round(comp.during.avgDailyOrders)), `${reviewData.growth.orderGrowth}%`],
        ['Avg Daily Revenue', `¥${Math.round(comp.before.avgDailyRevenue).toLocaleString()}`, `¥${Math.round(comp.during.avgDailyRevenue).toLocaleString()}`, `${reviewData.growth.revenueGrowth}%`],
        ['Total Orders', comp.before.totalOrders.toLocaleString(), comp.during.totalOrders.toLocaleString(), '-'],
        ['Total Revenue', `¥${comp.before.totalRevenue.toLocaleString()}`, `¥${comp.during.totalRevenue.toLocaleString()}`, '-'],
      ];

      const colWidths = [130, 130, 130, 80];
      let tableY = y;
      compData.forEach((row, rIdx) => {
        let colX = 40;
        row.forEach((cell, cIdx) => {
          if (rIdx === 0) {
            doc.setFillColor(245, 250, 255);
            doc.rect(colX, tableY - 10, colWidths[cIdx], 22, 'F');
            doc.setTextColor(149, 165, 166);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
          } else {
            doc.setTextColor(44, 62, 80);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
          }
          doc.text(String(cell), colX + 6, tableY);
          colX += colWidths[cIdx];
        });
        tableY += 22;
      });
      y = tableY + 20;

      if (reviewData.funnel && y + 160 < 780) {
        doc.setTextColor(26, 26, 46);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('User Conversion Funnel', 40, y);
        y += 20;
        const f = reviewData.funnel;
        const funnelItems = [
          { label: 'Views', val: f.views, rate: '100%' },
          { label: 'Coupons Claimed', val: f.coupons, rate: `${(f.views > 0 ? f.coupons / f.views * 100 : 0).toFixed(1)}%` },
          { label: 'Orders Placed', val: f.orders, rate: `${(f.views > 0 ? f.orders / f.views * 100 : 0).toFixed(1)}%` },
          { label: 'Payments Complete', val: f.payments, rate: `${(f.views > 0 ? f.payments / f.views * 100 : 0).toFixed(1)}%` },
        ];
        funnelItems.forEach((item, i) => {
          doc.setTextColor(44, 62, 80);
          doc.setFontSize(10);
          doc.text(`${item.label}: ${item.val.toLocaleString()} (${item.rate})`, 50, y + i * 18);
        });
        y += funnelItems.length * 18 + 30;
      }

      if (reviewData.productSales && reviewData.productSales.length > 0 && y < 700) {
        doc.setTextColor(26, 26, 46);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Top Selling Products', 40, y);
        y += 20;

        reviewData.productSales.slice(0, 5).forEach((p, i) => {
          doc.setTextColor(i < 3 ? 26 : 44, i < 3 ? 115 : 62, i < 3 ? 232 : 80);
          doc.setFontSize(10);
          doc.setFont('helvetica', i < 3 ? 'bold' : 'normal');
          doc.text(
            `${i + 1}. ${p.productName.slice(0, 22)} - Qty: ${p.quantity}, Revenue: ¥${formatNumber(p.revenue)}`,
            50, y + i * 18
          );
        });
      }

      doc.setFontSize(8);
      doc.setTextColor(189, 195, 199);
      doc.text('Generated by E-Commerce Promotion Planner', 40, 820);
      doc.text(`Activity ID: ${reviewData.activity.id.slice(0, 8)}...`, pageWidth - 200, 820);

      doc.save(`活动复盘报告_${reviewData.activity.name}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  if (!activityId) {
    return (
      <>
        <style>{styles}</style>
        <div className="empty-review">
          <div className="empty-review-icon">📋</div>
          <div className="empty-review-title">暂无复盘报告</div>
          <div className="empty-review-desc">请前往活动看板，点击已结束活动卡片上的"复盘"按钮查看报告</div>
          <button className="empty-review-btn" onClick={onBack}>
            📊 前往活动看板
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="review-container" ref={chartRef}>
        <div className="review-header">
          <button className="back-btn" onClick={onBack}>
            ← 返回活动看板
          </button>
          <button
            className="export-btn"
            onClick={exportPDF}
            disabled={exporting || !reviewData}
            style={{ opacity: exporting || !reviewData ? 0.6 : 1 }}
          >
            {exporting ? '⏳ 导出中...' : '📄 导出PDF报告'}
          </button>
        </div>

        {loading || !reviewData ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#95a5a6' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div>正在生成复盘报告...</div>
          </div>
        ) : (
          <>
            <div className="report-card" style={{ animationDelay: '0.05s' }}>
              <div className="report-title">活动基本信息</div>
              <div className="activity-summary">
                <div className="summary-item">
                  <span className="summary-label">活动名称</span>
                  <span className="summary-value highlight">{reviewData.activity.name}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">活动时间</span>
                  <span className="summary-value">
                    {new Date(reviewData.activity.startTime).toLocaleDateString('zh-CN')} ~{' '}
                    {new Date(reviewData.activity.endTime).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">优惠类型</span>
                  <span className="summary-value">
                    {reviewData.activity.discountType === 'full_reduction' && '💰 满减优惠'}
                    {reviewData.activity.discountType === 'percentage' && '🏷️ 打折促销'}
                    {reviewData.activity.discountType === 'buy_gift' && '🎁 买赠活动'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">参与商品</span>
                  <span className="summary-value">{reviewData.activity.products.length} 件</span>
                </div>
              </div>
            </div>

            <div className="kpi-grid">
              {[
                { icon: '💰', label: '总营收', value: `¥${formatNumber(reviewData.activity.stats.revenue)}`, delta: reviewData.growth.revenueGrowth, delay: 0.1 },
                { icon: '🛒', label: '总订单数', value: formatNumber(reviewData.activity.stats.orders), delta: reviewData.growth.orderGrowth, delay: 0.13 },
                { icon: '🎁', label: '优惠总额', value: `¥${formatNumber(reviewData.activity.stats.totalDiscount)}`, delay: 0.16 },
                { icon: '📊', label: '投资回报率', value: `${reviewData.activity.stats.roi}x`, delay: 0.19 },
              ].map((kpi, i) => (
                <div key={i} className="kpi-card" style={{ animationDelay: `${kpi.delay}s` }}>
                  <div className="kpi-icon">{kpi.icon}</div>
                  <div className="kpi-label">{kpi.label}</div>
                  <div className="kpi-value">{kpi.value}</div>
                  {kpi.delta !== undefined && (
                    <span className={`kpi-delta ${kpi.delta >= 0 ? 'up' : 'down'}`}>
                      {kpi.delta >= 0 ? '↑' : '↓'} {Math.abs(kpi.delta)}% vs 活动前
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="charts-row">
              <div className="report-card" style={{ marginBottom: 0, animationDelay: '0.22s' }}>
                <div className="report-title">📈 活动前后销售对比</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={comparisonChartData} barCategoryGap="30%" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef4fb" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#95a5a6' }}
                      axisLine={{ stroke: '#eef4fb' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#95a5a6' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : String(v)}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: '1px solid #e8eff8', fontSize: 12, boxShadow: '0 8px 24px rgba(26,115,232,0.12)' }}
                      formatter={(value: number) => value.toLocaleString()}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                      iconType="circle"
                    />
                    <Bar dataKey="活动前" fill="#bdc3c7" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="活动期间" fill="#1A73E8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="funnel-container" style={{ animationDelay: '0.25s' }}>
                <div className="report-title">🔄 用户转化漏斗</div>
                {funnelStages.map((stage, i) => (
                  <div key={stage.key}>
                    <div className="funnel-stage">
                      <div className="funnel-icon">{stage.icon}</div>
                      <div className="funnel-bar-wrap">
                        <div
                          className="funnel-bar"
                          style={{
                            width: `${Math.max(20, stage.percent)}%`,
                            opacity: 0.55 + stage.percent / 200,
                          }}
                        >
                          <span className="funnel-bar-value">
                            {stage.value >= 10000 ? `${(stage.value / 10000).toFixed(1)}万` : stage.value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="funnel-meta">
                        <span className="funnel-label">{stage.label}</span>
                        <span className="funnel-rate">占比 {stage.totalRate}%</span>
                      </div>
                    </div>
                    {i < funnelStages.length - 1 && (
                      <div className="arrow-down">
                        ↓
                        <span className="conv-label">转化率 {stage.prevRate}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="charts-row">
              <div className="report-card" style={{ marginBottom: 0, animationDelay: '0.28s' }}>
                <div className="report-title">🏆 商品销量排名</div>
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60%' }}>商品</th>
                      <th style={{ width: '20%' }}>销量</th>
                      <th style={{ width: '20%' }}>营收</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reviewData.productSales || []).slice(0, 8).map((p, i) => (
                      <tr key={p.productId}>
                        <td>
                          <div className="prod-info">
                            <span className={`rank-badge ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal'}`}>
                              {i + 1}
                            </span>
                            <div>
                              <div className="prod-name">{p.productName}</div>
                              <div className="prod-qty">销量占比: {
                                reviewData.productSales && reviewData.productSales[0]
                                  ? `${Math.round(p.quantity / reviewData.productSales[0].quantity * 100)}%`
                                  : '0%'
                              }</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="bar-info">
                            <span className="qty-badge">{p.quantity} 件</span>
                          </div>
                        </td>
                        <td>¥{formatNumber(p.revenue)}</td>
                      </tr>
                    ))}
                    {(reviewData.productSales || []).length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: 30, color: '#bdc3c7' }}>
                          暂无商品销售数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="report-card" style={{ marginBottom: 0, animationDelay: '0.31s' }}>
                <div className="report-title">🥧 营收占比分布</div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={800}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: '1px solid #e8eff8', fontSize: 12 }}
                      formatter={(value: number, name: string, props: any) => [
                        `¥${formatNumber(value)} (${props.payload.percent}%)`,
                        name,
                      ]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="report-card" style={{ animationDelay: '0.34s' }}>
              <div className="report-title">💡 活动总结与建议</div>
              <div className="conclusion-box">
                <div className="conclusion-title">基于数据的智能洞察</div>
                <ul className="conclusion-text" style={{ paddingLeft: 20 }}>
                  {generateConclusion().map((tip, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: tip }} />
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ReviewReport;
