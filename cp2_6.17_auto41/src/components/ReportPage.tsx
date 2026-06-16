import { useEffect, useRef, ReactNode } from 'react';
import * as echarts from 'echarts';
import { useStore } from '@/stores/useStore';

const TasksIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="#3498DB" strokeWidth="2" fill="none" />
    <path d="M7 9h10M7 13h10M7 17h6" stroke="#3498DB" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="#27AE60" strokeWidth="2" fill="none" />
    <path d="M8 12l3 3 5-6" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="#F39C12" strokeWidth="2" fill="none" />
    <path d="M12 7v5l3 2" stroke="#F39C12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  bgColor: string;
}

function StatCard({ icon, label, value, subValue, bgColor }: StatCardProps) {
  return (
    <div
      style={{
        width: '160px',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '4px',
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: '13px', color: '#7F8C8D', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#2C3E50' }}>
        {value}
      </div>
      {subValue && (
        <div style={{ fontSize: '12px', color: '#95A5A6' }}>{subValue}</div>
      )}
    </div>
  );
}

export default function ReportPage() {
  const getStats = useStore(s => s.getStats);
  const stats = getStats();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const projectNames = stats.projectStats.map(p => p.projectName);
    const todoData = stats.projectStats.map(p => p.todo);
    const inProgressData = stats.projectStats.map(p => p.inProgress);
    const doneData = stats.projectStats.map(p => p.done);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E8EB',
        borderWidth: 1,
        textStyle: { color: '#2C3E50', fontSize: 13 },
      },
      legend: {
        data: ['待办', '进行中', '已完成'],
        top: 0,
        right: 0,
        textStyle: { color: '#5D6D7E', fontSize: 13 },
        itemWidth: 14,
        itemHeight: 14,
      },
      grid: {
        left: '3%',
        right: '3%',
        bottom: '3%',
        top: '50px',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: projectNames,
        axisLine: { lineStyle: { color: '#D5D8DC' } },
        axisLabel: {
          color: '#5D6D7E',
          fontSize: 13,
          interval: 0,
          rotate: projectNames.length > 5 ? 20 : 0,
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '任务数',
        nameTextStyle: { color: '#7F8C8D', fontSize: 12 },
        axisLine: { show: false },
        axisLabel: { color: '#7F8C8D', fontSize: 12 },
        splitLine: { lineStyle: { color: '#ECF0F1', type: 'dashed' } },
        minInterval: 1,
      },
      series: [
        {
          name: '待办',
          type: 'bar',
          data: todoData,
          itemStyle: {
            color: '#95A5A6',
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: 24,
        },
        {
          name: '进行中',
          type: 'bar',
          data: inProgressData,
          itemStyle: {
            color: '#3498DB',
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: 24,
        },
        {
          name: '已完成',
          type: 'bar',
          data: doneData,
          itemStyle: {
            color: '#2ECC71',
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: 24,
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [stats.projectStats]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#2C3E50',
            marginBottom: '6px',
          }}
        >
          📊 项目统计报告
        </h1>
        <p style={{ fontSize: '14px', color: '#7F8C8D' }}>
          全方位掌握团队任务执行情况与项目进度
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '32px',
          flexWrap: 'wrap',
        }}
      >
        <StatCard
          icon={<TasksIcon />}
          label="总任务数"
          value={stats.totalTasks}
          subValue="全项目任务合计"
          bgColor="#EBF5FB"
        />
        <StatCard
          icon={<CheckIcon />}
          label="已完成数"
          value={stats.completedTasks}
          subValue={`完成率 ${completionRate}%`}
          bgColor="#EAFAF1"
        />
        <StatCard
          icon={<ClockIcon />}
          label="平均完成时长"
          value={stats.avgCompletionTime}
          subValue="单位：小时"
          bgColor="#FEF9E7"
        />
      </div>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: '24px',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#2C3E50',
              marginBottom: '4px',
            }}
          >
            按项目分组任务状态分布
          </h3>
          <p style={{ fontSize: '12px', color: '#95A5A6' }}>
            X轴：项目名称 &nbsp;&nbsp; Y轴：任务数量
          </p>
        </div>
        <div
          ref={chartRef}
          style={{
            width: '100%',
            height: '420px',
          }}
        />
      </div>

      <div
        style={{
          marginTop: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {stats.projectStats.map(p => {
          const total = p.todo + p.inProgress + p.done;
          const rate = total > 0 ? Math.round((p.done / total) * 100) : 0;
          return (
            <div
              key={p.projectName}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '10px',
                padding: '16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                border: '1px solid #ECF0F1',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#2C3E50',
                  marginBottom: '12px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={p.projectName}
              >
                📁 {p.projectName}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: '#F2F3F4',
                    color: '#7F8C8D',
                  }}
                >
                  待办 {p.todo}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: '#D6EAF8',
                    color: '#2980B9',
                  }}
                >
                  进行 {p.inProgress}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: '#D5F5E3',
                    color: '#27AE60',
                  }}
                >
                  完成 {p.done}
                </span>
              </div>
              <div>
                <div
                  style={{
                    height: '6px',
                    backgroundColor: '#ECF0F1',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${rate}%`,
                      backgroundColor: rate >= 80 ? '#27AE60' : rate >= 40 ? '#3498DB' : '#E67E22',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#95A5A6' }}>
                    共 {total} 个任务
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#5D6D7E' }}>
                    {rate}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
