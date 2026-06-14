import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Dropdown, Modal, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  HolderOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  DownOutlined,
  FullscreenOutlined,
  DownloadOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { DataRow, ChartType, ThemeConfig, StatsSummary } from '../types';
import { processData } from '../utils/processData';

interface ChartCardProps {
  id: string;
  title: string;
  chartType: ChartType;
  data: DataRow[];
  labelColumn: string;
  valueColumn: string;
  theme: ThemeConfig;
  onTitleChange: (id: string, title: string) => void;
  onChartTypeChange: (id: string, type: ChartType) => void;
}

const CHART_ICON: Record<ChartType, React.ReactNode> = {
  line: <LineChartOutlined />,
  bar: <BarChartOutlined />,
  pie: <PieChartOutlined />,
};

const CHART_LABEL: Record<ChartType, string> = {
  line: '折线图',
  bar: '柱状图',
  pie: '饼图',
};

const StatCell: React.FC<{ label: string; value: React.ReactNode; highlight?: boolean }> = ({
  label, value, highlight,
}) => (
  <div className="stat-item">
    <div className="stat-label">{label}</div>
    <div className={`stat-value ${highlight ? 'highlight' : ''}`}>{value}</div>
  </div>
);

const ChartCard: React.FC<ChartCardProps> = ({
  id,
  title,
  chartType,
  data,
  labelColumn,
  valueColumn,
  theme,
  onTitleChange,
  onChartTypeChange,
}) => {
  const chartRef = useRef<ReactECharts | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
  const [fading, setFading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  useEffect(() => {
    setTitleInput(title);
  }, [title]);

  const hasData = useMemo(
    () => data.length > 0 && labelColumn && valueColumn,
    [data.length, labelColumn, valueColumn],
  );

  const processed = useMemo<{ option: Record<string, unknown>; stats: StatsSummary } | null>(() => {
    if (!hasData) return null;
    return processData(data, labelColumn, valueColumn, chartType, theme.colors, selectedIndex);
  }, [data, labelColumn, valueColumn, chartType, theme.colors, selectedIndex, hasData]);

  const labels = useMemo(() => {
    if (!hasData) return [];
    const seen = new Map<string, number>();
    data.forEach((row) => {
      const label = row[labelColumn] === undefined || row[labelColumn] === null || row[labelColumn] === ''
        ? '(空)'
        : String(row[labelColumn]);
      if (!seen.has(label)) seen.set(label, seen.size);
    });
    return Array.from(seen.keys());
  }, [data, labelColumn, hasData]);

  const onEvents = useMemo(() => {
    const handler = (params: { name?: string; dataIndex?: number }) => {
      if (chartType === 'pie') {
        const name = params.name;
        if (name === undefined) return;
        const idx = labels.indexOf(name);
        if (idx === -1) return;
        setSelectedIndex((prev) => (prev === idx ? null : idx));
      } else {
        const di = params.dataIndex;
        if (typeof di !== 'number') return;
        setSelectedIndex((prev) => (prev === di ? null : di));
      }
    };
    return {
      click: handler,
    };
  }, [chartType, labels]);

  const handleTypeChange = (type: ChartType) => {
    if (type === chartType) return;
    setFading(true);
    setSelectedIndex(null);
    window.setTimeout(() => {
      onChartTypeChange(id, type);
      window.setTimeout(() => setFading(false), 30);
    }, 150);
  };

  const typeMenu: MenuProps = {
    items: (['line', 'bar', 'pie'] as ChartType[]).map((t) => ({
      key: t,
      icon: CHART_ICON[t],
      label: CHART_LABEL[t],
      onClick: () => handleTypeChange(t),
    })),
  };

  const handleExport = () => {
    try {
      const instance = chartRef.current?.getEchartsInstance();
      if (!instance) {
        message.error('图表尚未初始化');
        return;
      }
      const url = instance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#1a1a2e',
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'chart'}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      message.success('图表已导出为PNG');
    } catch {
      message.error('导出失败');
    }
  };

  const handleTitleSubmit = () => {
    const trimmed = titleInput.trim();
    if (trimmed.length === 0) {
      setTitleInput(title);
    } else if (trimmed !== title) {
      onTitleChange(id, trimmed);
    }
    setEditingTitle(false);
  };

  const stats = processed?.stats;

  return (
    <>
      <div className="chart-card" data-chart-id={id}>
        <div className="chart-card-header">
          <div className="chart-card-title">
            <span className="drag-handle" data-grid-drag-handle>
              <HolderOutlined />
            </span>
            {editingTitle ? (
              <input
                autoFocus
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setTitleInput(title);
                    setEditingTitle(false);
                  }
                }}
                onBlur={handleTitleSubmit}
              />
            ) : (
              <span
                className="title-text"
                onDoubleClick={() => setEditingTitle(true)}
                title="双击编辑标题"
              >
                {title}
              </span>
            )}
          </div>
          <div className="chart-card-actions">
            <Dropdown menu={typeMenu} trigger={['click']} placement="bottomRight">
              <button type="button" className="chart-type-menu-trigger" onClick={(e) => e.stopPropagation()}>
                {CHART_ICON[chartType]}
                <span>{CHART_LABEL[chartType]}</span>
                <DownOutlined style={{ fontSize: 9 }} />
              </button>
            </Dropdown>
            <button type="button" className="btn-icon" style={{ width: 28, height: 28, fontSize: 12 }} onClick={handleExport} title="导出PNG">
              <DownloadOutlined />
            </button>
            <button type="button" className="btn-icon" style={{ width: 28, height: 28, fontSize: 12 }} onClick={() => setFullscreenOpen(true)} title="全屏查看">
              <FullscreenOutlined />
            </button>
          </div>
        </div>
        <div className="chart-card-body">
          {selectedIndex !== null && (
            <div
              className="selection-banner"
              onClick={() => setSelectedIndex(null)}
              title="点击取消选中"
            >
              <CloseOutlined style={{ fontSize: 10 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stats?.selectedLabel}: {stats?.selectedValue}
              </span>
            </div>
          )}
          {!hasData ? (
            <div className="empty-data-hint">
              <BarChartOutlined />
              <div>暂无数据</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                请从左侧面板添加数据或上传CSV
              </div>
            </div>
          ) : (
            <ReactECharts
              ref={(el) => { chartRef.current = el; }}
              option={processed?.option ?? {}}
              notMerge={false}
              lazyUpdate
              style={{ width: '100%', height: '100%' }}
              className={`chart-wrapper ${fading ? 'fading' : ''}`}
              onEvents={onEvents}
              opts={{ renderer: 'canvas' }}
            />
          )}
        </div>
        <div className="chart-card-footer">
          <StatCell label="总和" value={stats?.sum ?? '-'} />
          <StatCell label="平均" value={stats?.average ?? '-'} />
          <StatCell label="最大" value={stats?.max ?? '-'} highlight={selectedIndex === null} />
          <StatCell label="最小" value={stats?.min ?? '-'} />
        </div>
      </div>

      <Modal
        open={fullscreenOpen}
        title={title}
        onCancel={() => setFullscreenOpen(false)}
        footer={null}
        width="90vw"
        styles={{ body: { padding: 16, height: '75vh' }, content: { background: '#1a1a2e', border: '1px solid var(--border-color)' } }}
        destroyOnClose
      >
        {hasData && (
          <ReactECharts
            option={processed?.option ?? {}}
            notMerge
            lazyUpdate
            style={{ width: '100%', height: '100%' }}
            onEvents={onEvents}
            opts={{ renderer: 'canvas' }}
          />
        )}
      </Modal>
    </>
  );
};

export default ChartCard;
