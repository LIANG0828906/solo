import { useEffect, useState, useRef, CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  BarChart, Bar,
} from 'recharts';
import { FileDown, Flame, Clock, Dumbbell, TrendingUp, Lightbulb, ArrowLeft, Eye } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '@/client/shared/api/client';
import type { WeeklyReport as WeeklyReportType, Client, BaselineScores } from '../../../../shared/types';

const AXES = ['squat', 'pushup', 'plank', 'flexibility', 'endurance'] as const;
const AXIS_LABELS: Record<string, string> = {
  squat: '深蹲', pushup: '俯卧撑', plank: '平板支撑', flexibility: '柔韧性', endurance: '耐力',
};
const LINE_COLORS = ['#FF6B35', '#2F4858', '#4CAF50', '#8B5CF6', '#EC4899'];

function AnimatedDot(props: { cx?: number; cy?: number; index?: number; strokeColor?: string }) {
  const { cx, cy, index = 0, strokeColor = '#FF6B35' } = props;
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number>();

  useEffect(() => {
    const delay = index * 120;
    rafRef.current = requestAnimationFrame(() => {
      const start = performance.now();
      const target = delay;
      const tick = (now: number) => {
        if (now - start >= target) {
          setMounted(true);
        } else {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [index]);

  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={strokeColor}
        stroke="#fff"
        strokeWidth={2}
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          animation: mounted ? 'dotSweep 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
          opacity: mounted ? undefined : 0,
          transform: mounted ? undefined : 'scale(0)',
        } as CSSProperties}
      />
    </g>
  );
}

function RingChart({ value, size = 90, strokeWidth = 7 }: { value: number; size?: number; strokeWidth?: number }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedValue(value * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="url(#ringGrad)" strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.1s linear' }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#FF8C42" />
        </linearGradient>
      </defs>
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="text-lg font-bold fill-gray-800 rotate-90"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {Math.round(animatedValue)}%
      </text>
    </svg>
  );
}

function baselineToRadar(scores: BaselineScores) {
  return AXES.map(key => ({ axis: AXIS_LABELS[key], value: scores[key] }));
}

function CustomRadarLegend() {
  return (
    <div className="flex items-center justify-center gap-6 mt-1">
      <span className="flex items-center gap-2 text-sm text-gray-600 font-medium">
        <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#FF6B35', opacity: 0.6 }} /> 本周
      </span>
      <span className="flex items-center gap-2 text-sm text-gray-600 font-medium">
        <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#2F4858', opacity: 0.3, border: '1px solid rgba(47,72,88,0.3)' }} /> 上周
      </span>
    </div>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
  padding: '10px 14px',
  fontSize: '13px',
};

export default function WeeklyReport() {
  const { clientId, week } = useParams<{ clientId: string; week: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<WeeklyReportType | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [radarReady, setRadarReady] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const actualClientId = clientId ?? 'client-1';
  const actualWeek = week ?? new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!actualClientId || !actualWeek) return;
    setLoading(true);
    Promise.all([
      api.get<WeeklyReportType>(`/reports/${actualClientId}/${actualWeek}`).catch(() => null),
      api.get<Client>(`/clients/${actualClientId}`).catch(() => null),
    ]).then(([reportRes, clientRes]) => {
      if (reportRes?.data) setReport(reportRes.data);
      if (clientRes?.data) setClient(clientRes.data);
    }).finally(() => setLoading(false));
  }, [actualClientId, actualWeek]);

  useEffect(() => {
    if (report) {
      const t = setTimeout(() => setRadarReady(true), 150);
      return () => clearTimeout(t);
    }
  }, [report]);

  const handleExport = async () => {
    if (!contentRef.current || !client) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F0F4F8',
        logging: false,
        windowWidth: contentRef.current.scrollWidth,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);
      }

      const clientName = client?.name ?? '客户';
      pdf.save(`训练周报_${clientName}_${report?.weekKey ?? actualWeek}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="card py-16 animate-fade-in">
          <TrendingUp size={56} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">暂无周报数据</h2>
          <p className="text-gray-500 mb-6">完成本周围训练后可查看训练报告</p>
          <button className="btn-primary" onClick={() => navigate('/')}>返回首页</button>
        </div>
      </div>
    );
  }

  const currentRadar = baselineToRadar(report.currentAssessment);
  const previousRadar = baselineToRadar(report.previousAssessment);
  const mergedRadar = currentRadar.map((item, i) => ({
    axis: item.axis,
    current: item.value,
    previous: previousRadar[i]?.value ?? 0,
  }));
  const totalExercises = report.progressCurves.reduce(
    (sum, c) => sum + c.data.filter(d => d.value > 0).length, 0
  );
  const clientName = client?.name ?? '客户';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
      <div className="flex items-center gap-3 mb-6 animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">📊 训练周报</h1>
      </div>

      <div ref={contentRef} id="weekly-report-content" className="space-y-5">
        <div className="card animate-fade-in" style={{ animationDelay: '0ms' }}>
          <div className="flex flex-wrap items-center gap-6">
            <RingChart value={report.completionRate} size={100} strokeWidth={8} />
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">{clientName}的训练周报</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="badge badge-orange">📅 {report.weekKey}</span>
                {report.completionRate >= 80 ? (
                  <span className="badge badge-green">🔥 训练达人</span>
                ) : report.completionRate >= 50 ? (
                  <span className="badge badge-blue">💪 值得鼓励</span>
                ) : (
                  <span className="badge badge-red">😅 继续努力</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">完成率 · 每周目标完成度</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-delay-1">
          <div className="card text-center m-0!">
            <Clock className="w-7 h-7 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl md:text-3xl font-bold text-gray-800">
              {report.avgDuration}<span className="text-sm font-normal text-gray-400 ml-1">分钟</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">平均训练时长</div>
          </div>
          <div className="card text-center m-0!">
            <Dumbbell className="w-7 h-7 text-green-500 mx-auto mb-2" />
            <div className="text-2xl md:text-3xl font-bold text-gray-800">{totalExercises}</div>
            <div className="text-xs text-gray-500 mt-1">完成动作数</div>
          </div>
          <div className="card text-center m-0!">
            <Flame className="w-7 h-7 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl md:text-3xl font-bold text-gray-800">
              {report.totalCalories}<span className="text-sm font-normal text-gray-400 ml-1">kcal</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">累计消耗热量</div>
          </div>
        </div>

        <div className="card animate-fade-in-delay-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" /> 进步曲线
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={report.progressCurves[0]?.data ?? []}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: '#FF6B35', strokeWidth: 1, strokeDasharray: '4 4' }} />
              {report.progressCurves.map((curve, i) => {
                const color = LINE_COLORS[i % LINE_COLORS.length];
                return (
                  <Line
                    key={curve.exerciseName}
                    type="monotone"
                    data={curve.data}
                    dataKey="value"
                    name={curve.exerciseName}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={(dotProps: any) => <AnimatedDot {...dotProps} index={dotProps.index ?? i} strokeColor={color} />}
                    activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2.5 }}
                    animationDuration={1400}
                    animationEasing="ease-in-out"
                    animationBegin={100 * i}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
          {report.progressCurves.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">暂无进步数据，完成训练后可见</div>
          )}
        </div>

        <div className="card animate-fade-in-delay-3">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">体能力量对比</h2>
          <p className="text-sm text-gray-500 mb-1">本周与上周基线体能数据对比</p>
          <div
            style={{
              animation: radarReady ? 'radarSpring 1s cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'opacity 0.3s',
              opacity: radarReady ? undefined : 0,
            }}
          >
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={mergedRadar} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="#e5e7eb" strokeWidth={1} />
                <PolarAngleAxis dataKey="axis" tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 500 }} />
                <PolarRadiusAxis angle={90} domain={[0, 30]} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickCount={4} />
                <Radar
                  name="上周"
                  dataKey="previous"
                  stroke="#2F4858"
                  strokeWidth={1.5}
                  fill="#2F4858"
                  fillOpacity={0.3}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  animationBegin={0}
                />
                <Radar
                  name="本周"
                  dataKey="current"
                  stroke="#FF6B35"
                  strokeWidth={2.5}
                  fill="#FF6B35"
                  fillOpacity={0.6}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  animationBegin={250}
                />
                <Legend content={<CustomRadarLegend />} verticalAlign="bottom" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card animate-fade-in-delay-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">每日状态趋势</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={report.assessmentTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 10]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,107,53,0.05)' }} />
              <Bar dataKey="sleepQuality" name="睡眠质量" fill="#FF6B35" radius={[5, 5, 0, 0]} barSize={22} animationDuration={900} animationEasing="ease-out" />
              <Bar dataKey="energyLevel" name="能量水平" fill="#2F4858" radius={[5, 5, 0, 0]} barSize={22} animationDuration={900} animationBegin={150} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
          {report.assessmentTrend.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">暂无状态趋势，完成每日自评后可见</div>
          )}
        </div>

        {report.suggestions.length > 0 && (
          <div className="card animate-fade-in-delay-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" /> 💡 教练建议
            </h2>
            <ul className="space-y-3">
              {report.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm md:text-base text-gray-600 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-transparent border-l-4 border-orange-300"
                  style={{ animation: `fadeSlideUp 0.4s ease-out ${i * 80}ms both` }}
                >
                  <span className="w-6 h-6 rounded-full bg-white border-2 border-orange-300 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 flex gap-3 z-20">
        <button
          onClick={() => navigate(`/training-plans/${actualClientId}`)}
          className="hidden md:flex items-center gap-2 px-4 py-3 rounded-xl bg-white text-gray-700 font-medium shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <Eye size={18} /> 查看计划
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-white font-medium shadow-lg transition-all ${
            exporting
              ? 'bg-gray-400 shadow-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 active:scale-95'
          }`}
        >
          <FileDown size={18} />
          {exporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              导出中...
            </>
          ) : '导出PDF'}
        </button>
      </div>
    </div>
  );
}
