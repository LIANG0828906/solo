import { useEffect, useState, useRef, CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
  BarChart, Bar,
} from 'recharts';
import { FileDown, Flame, Clock, Dumbbell, TrendingUp, Lightbulb } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '@/client/api';
import { cn } from '@/lib/utils';
import type { WeeklyReport as WeeklyReportType, Client, BaselineScores } from '@/shared/types';

const AXES = ['squat', 'pushup', 'plank', 'flexibility', 'endurance'] as const;
const AXIS_LABELS: Record<string, string> = { squat: '深蹲', pushup: '俯卧撑', plank: '平板支撑', flexibility: '柔韧性', endurance: '耐力' };
const LINE_COLORS = ['#FF6B35', '#2F4858', '#4CAF50'];

function AnimatedDot(props: { cx?: number; cy?: number; index?: number }) {
  const { cx, cy, index = 0 } = props;
  if (cx == null || cy == null) return null;
  return (
    <g style={{
      animation: 'dotSweep 0.6s ease-out forwards',
      animationDelay: `${index * 100}ms`,
      transformOrigin: `${cx}px ${cy}px`,
      opacity: 0,
    } as CSSProperties}>
      <circle cx={cx} cy={cy} r={4} fill="#FF6B35" stroke="#fff" strokeWidth={2} />
    </g>
  );
}

function RingChart({ value, size = 80, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#FF6B35" strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="text-lg font-bold fill-gray-800">
        {value}%
      </text>
    </svg>
  );
}

function baselineToRadar(scores: BaselineScores) {
  return AXES.map(key => ({ axis: AXIS_LABELS[key], value: scores[key] }));
}

function CustomRadarLegend() {
  return (
    <div className="flex items-center justify-center gap-6 mt-2">
      <span className="flex items-center gap-2 text-sm text-gray-600">
        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FF6B35', opacity: 0.6 }} /> 本周
      </span>
      <span className="flex items-center gap-2 text-sm text-gray-600">
        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#2F4858', opacity: 0.3 }} /> 上周
      </span>
    </div>
  );
}

export default function WeeklyReport() {
  const { clientId, week } = useParams<{ clientId: string; week: string }>();
  const [report, setReport] = useState<WeeklyReportType | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [radarAnim, setRadarAnim] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientId || !week) return;
    setLoading(true);
    Promise.all([
      api.get<WeeklyReportType>(`/reports/${clientId}/${week}`).catch(() => null),
      api.get<Client>(`/clients/${clientId}`).catch(() => null),
    ]).then(([reportRes, clientRes]) => {
      if (reportRes?.data) setReport(reportRes.data);
      if (clientRes?.data) setClient(clientRes.data);
    }).finally(() => setLoading(false));
  }, [clientId, week]);

  useEffect(() => {
    if (report) {
      const t = setTimeout(() => setRadarAnim(true), 100);
      return () => clearTimeout(t);
    }
  }, [report]);

  const handleExport = async () => {
    if (!contentRef.current || !client) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
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
      pdf.save(`训练周报_${client.name}_${report?.weekKey ?? week}.pdf`);
    } catch {
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return <div className="text-center py-12 text-gray-400">暂无周报数据</div>;
  }

  const currentRadar = baselineToRadar(report.currentAssessment);
  const previousRadar = baselineToRadar(report.previousAssessment);
  const mergedRadar = currentRadar.map((item, i) => ({
    axis: item.axis,
    current: item.value,
    previous: previousRadar[i].value,
  }));
  const totalExercises = report.progressCurves.reduce((sum, c) => sum + c.data.filter(d => d.value > 0).length, 0);
  const clientName = client?.name ?? '客户';

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div ref={contentRef} id="weekly-report-content" className="space-y-5">
        <div className="card flex items-center gap-6" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
          <RingChart value={report.completionRate} size={90} strokeWidth={7} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{clientName}的训练周报</h1>
            <p className="text-gray-500 mt-1">周次: {report.weekKey}</p>
            <p className="text-sm text-gray-400 mt-0.5">完成率</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4" style={{ animation: 'fadeInUp 0.5s ease-out 100ms both' }}>
          <div className="card text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-800">{report.avgDuration}<span className="text-sm font-normal text-gray-400 ml-1">分钟</span></div>
            <div className="text-xs text-gray-500 mt-1">平均训练时长</div>
          </div>
          <div className="card text-center">
            <Dumbbell className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-800">{totalExercises}</div>
            <div className="text-xs text-gray-500 mt-1">完成动作数</div>
          </div>
          <div className="card text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-gray-800">{report.totalCalories}<span className="text-sm font-normal text-gray-400 ml-1">kcal</span></div>
            <div className="text-xs text-gray-500 mt-1">消耗热量</div>
          </div>
        </div>

        <div className="card" style={{ animation: 'fadeInUp 0.5s ease-out 200ms both' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" /> 进步曲线
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={report.progressCurves[0]?.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip />
              {report.progressCurves.map((curve, i) => (
                <Line
                  key={curve.exerciseName}
                  type="monotone"
                  data={curve.data}
                  dataKey="value"
                  name={curve.exerciseName}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={<AnimatedDot />}
                  activeDot={{ r: 5, fill: LINE_COLORS[i % LINE_COLORS.length], stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ animation: 'fadeInUp 0.5s ease-out 300ms both' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">评估对比</h2>
          <div
            style={radarAnim ? { animation: 'radarSpring 0.8s ease-out forwards' } : { opacity: 0 }}
          >
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={mergedRadar} cx="50%" cy="50%" outerRadius="65%">
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Radar
                  name="本周" dataKey="current"
                  stroke="#FF6B35" fill="#FF6B35" fillOpacity={0.6}
                  animationDuration={800} animationEasing="ease-out"
                />
                <Radar
                  name="上周" dataKey="previous"
                  stroke="#2F4858" fill="#2F4858" fillOpacity={0.3}
                  animationDuration={800} animationEasing="ease-out" animationBegin={200}
                />
                <Legend content={<CustomRadarLegend />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ animation: 'fadeInUp 0.5s ease-out 400ms both' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">评估趋势</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={report.assessmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="sleepQuality" name="睡眠质量" fill="#FF6B35" radius={[4, 4, 0, 0]} barSize={20} animationDuration={800} />
              <Bar dataKey="energyLevel" name="能量水平" fill="#2F4858" radius={[4, 4, 0, 0]} barSize={20} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {report.suggestions.length > 0 && (
          <div className="card" style={{ animation: 'fadeInUp 0.5s ease-out 500ms both' }}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" /> 训练建议
            </h2>
            <ul className="space-y-2">
              {report.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={handleExport}
        disabled={exporting}
        className={cn(
          'fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 rounded-xl text-white font-medium shadow-lg transition-all',
          'bg-gradient-to-r from-orange-500 to-amber-400 hover:shadow-xl hover:scale-105',
          exporting && 'opacity-70 pointer-events-none'
        )}
      >
        <FileDown className="w-5 h-5" />
        {exporting ? '导出中...' : '导出PDF'}
      </button>
    </div>
  );
}
