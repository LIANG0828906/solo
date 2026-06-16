import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import { useInvoiceStore } from '@/store/invoiceStore';
import { formatDate, formatCurrency } from '@/utils/helpers';

export default function Statistics() {
  const { invoices, getStatistics, loadInvoices } = useInvoiceStore();

  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [startDate, setStartDate] = useState(formatDate(startOfYear));
  const [endDate, setEndDate] = useState(formatDate(today));

  const lineChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const lineChartInstance = useRef<echarts.ECharts | null>(null);
  const pieChartInstance = useRef<echarts.ECharts | null>(null);

  const statistics = useMemo(
    () => getStatistics(startDate, endDate),
    [invoices, startDate, endDate, getStatistics]
  );

  const hasLineData = statistics.monthlyData.length > 0;
  const hasPieData = statistics.customerData.length > 0;

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    if (lineChartRef.current && !lineChartInstance.current) {
      lineChartInstance.current = echarts.init(lineChartRef.current);
    }
    if (pieChartRef.current && !pieChartInstance.current) {
      pieChartInstance.current = echarts.init(pieChartRef.current);
    }

    const handleResize = () => {
      lineChartInstance.current?.resize();
      pieChartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      lineChartInstance.current?.dispose();
      pieChartInstance.current?.dispose();
      lineChartInstance.current = null;
      pieChartInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!lineChartInstance.current) return;

    if (!hasLineData) {
      lineChartInstance.current.clear();
      return;
    }

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#FFFFFF',
        borderColor: '#BDC3C7',
        borderWidth: 1,
        textStyle: {
          color: '#2C3E50',
          fontSize: 13,
        },
        padding: [10, 14],
        borderRadius: 4,
        shadowBlur: 2,
        shadowColor: '#00000020',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>金额：¥${formatCurrency(data.value)}`;
        },
      },
      grid: {
        left: 60,
        right: 20,
        top: 20,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: statistics.monthlyData.map((d) => d.month),
        axisLabel: {
          color: '#7F8C8D',
          fontSize: 12,
        },
        axisLine: {
          lineStyle: {
            color: '#BDC3C7',
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#7F8C8D',
          fontSize: 12,
          formatter: (value: number) => formatCurrency(value),
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: '#F4F6F7',
          },
        },
      },
      series: [
        {
          type: 'line',
          data: statistics.monthlyData.map((d) => d.amount),
          smooth: false,
          symbol: 'circle',
          symbolSize: 10,
          itemStyle: {
            color: '#FFFFFF',
            borderColor: '#3498DB',
            borderWidth: 2,
          },
          lineStyle: {
            color: '#3498DB',
            width: 2,
          },
        },
      ],
    };

    lineChartInstance.current.setOption(option, true);
  }, [statistics.monthlyData, hasLineData]);

  useEffect(() => {
    if (!pieChartInstance.current) return;

    if (!hasPieData) {
      pieChartInstance.current.clear();
      return;
    }

    const colorPalette = [
      '#5470C6',
      '#91CC75',
      '#FAC858',
      '#EE6666',
      '#73C0DE',
      '#3BA272',
      '#FC8452',
      '#9A60B4',
      '#EA7CCC',
    ];

    const total = statistics.customerData.reduce((sum, d) => sum + d.value, 0);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#FFFFFF',
        borderColor: '#BDC3C7',
        borderWidth: 1,
        textStyle: {
          color: '#2C3E50',
          fontSize: 13,
        },
        padding: [10, 14],
        borderRadius: 4,
        shadowBlur: 2,
        shadowColor: '#00000020',
        formatter: (params: any) => {
          return `${params.name}<br/>金额：¥${formatCurrency(params.value)}`;
        },
      },
      color: colorPalette,
      series: [
        {
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#FFFFFF',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: (params: any) => {
              const percent = ((params.value / total) * 100).toFixed(1);
              return `${params.name}\n${percent}%`;
            },
            color: '#2C3E50',
            fontSize: 12,
            lineHeight: 18,
          },
          labelLine: {
            show: true,
            length: 12,
            length2: 8,
            lineStyle: {
              color: '#BDC3C7',
            },
          },
          data: statistics.customerData,
        },
      ],
    };

    pieChartInstance.current.setOption(option, true);
  }, [statistics.customerData, hasPieData]);

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1 className="page-title">统计分析</h1>
      </div>

      <div className="date-range-picker">
        <label>开始日期</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label>结束日期</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="charts-grid">
        <div className="chart-container" style={{ position: 'relative' }}>
          {hasLineData ? (
            <div ref={lineChartRef} style={{ width: '100%', height: '100%' }} />
          ) : (
            <div className="empty-state" style={{ height: '100%' }}>
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">暂无数据</div>
            </div>
          )}
        </div>

        <div className="chart-container" style={{ position: 'relative' }}>
          {hasPieData ? (
            <div ref={pieChartRef} style={{ width: '100%', height: '100%' }} />
          ) : (
            <div className="empty-state" style={{ height: '100%' }}>
              <div className="empty-state-icon">🥧</div>
              <div className="empty-state-text">暂无数据</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
