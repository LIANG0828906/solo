import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BgColorsOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { DataRow, ChartCardConfig, LayoutItem, ThemeConfig, ChartType } from './types';
import { THEMES, applyThemeToRoot, DEFAULT_THEME_KEY } from './theme';
import DataPanel from './components/DataPanel';
import Dashboard from './components/Dashboard';

const LS_KEYS = {
  layout: 'dashboard_layout_v1',
  theme: 'dashboard_theme_v1',
  chartConfigs: 'dashboard_chart_configs_v1',
  data: 'dashboard_data_v1',
  columns: 'dashboard_columns_v1',
  labelColumn: 'dashboard_label_col_v1',
  valueColumn: 'dashboard_value_col_v1',
  panelOpen: 'dashboard_panel_open_v1',
};

const DEFAULT_COLUMNS = ['标签', '数值'];

const DEFAULT_DATA: DataRow[] = [
  { 标签: '一月', 数值: 120 },
  { 标签: '二月', 数值: 182 },
  { 标签: '三月', 数值: 149 },
  { 标签: '四月', 数值: 210 },
  { 标签: '五月', 数值: 175 },
  { 标签: '六月', 数值: 268 },
  { 标签: '七月', 数值: 312 },
  { 标签: '八月', 数值: 285 },
  { 标签: '九月', 数值: 236 },
  { 标签: '十月', 数值: 304 },
  { 标签: '十一月', 数值: 267 },
  { 标签: '十二月', 数值: 345 },
];

const DEFAULT_CHART_CONFIGS: ChartCardConfig[] = [
  { id: 'chart-1', title: '销售趋势', chartType: 'line' },
  { id: 'chart-2', title: '数值对比', chartType: 'bar' },
  { id: 'chart-3', title: '占比分布', chartType: 'pie' },
];

const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: 'chart-1', x: 0, y: 0, w: 6, h: 3, minW: 3, minH: 2, maxW: 12, maxH: 12 },
  { i: 'chart-2', x: 6, y: 0, w: 6, h: 3, minW: 3, minH: 2, maxW: 12, maxH: 12 },
  { i: 'chart-3', x: 0, y: 3, w: 12, h: 3, minW: 3, minH: 2, maxW: 12, maxH: 12 },
];

function safeLoad<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSave(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 忽略
  }
}

const App: React.FC = () => {
  const [data, setData] = useState<DataRow[]>(() => safeLoad<DataRow[]>(LS_KEYS.data, DEFAULT_DATA));
  const [columns, setColumns] = useState<string[]>(() => safeLoad<string[]>(LS_KEYS.columns, DEFAULT_COLUMNS));
  const [labelColumn, setLabelColumn] = useState<string>(() => safeLoad<string>(LS_KEYS.labelColumn, DEFAULT_COLUMNS[0]));
  const [valueColumn, setValueColumn] = useState<string>(() => safeLoad<string>(LS_KEYS.valueColumn, DEFAULT_COLUMNS[1]));

  const [chartConfigs, setChartConfigs] = useState<ChartCardConfig[]>(() =>
    safeLoad<ChartCardConfig[]>(LS_KEYS.chartConfigs, DEFAULT_CHART_CONFIGS),
  );

  const [layout, setLayout] = useState<LayoutItem[]>(() =>
    safeLoad<LayoutItem[]>(LS_KEYS.layout, DEFAULT_LAYOUT),
  );

  const [themeKey, setThemeKey] = useState<string>(() =>
    safeLoad<string>(LS_KEYS.theme, DEFAULT_THEME_KEY),
  );

  const [panelOpen, setPanelOpen] = useState<boolean>(() =>
    safeLoad<boolean>(LS_KEYS.panelOpen, true),
  );

  const theme: ThemeConfig = useMemo(
    () => THEMES.find((t) => t.key === themeKey) ?? THEMES[0],
    [themeKey],
  );

  useEffect(() => {
    applyThemeToRoot(theme);
  }, [theme]);

  useEffect(() => {
    const cols = columns;
    if (!cols.includes(labelColumn)) setLabelColumn(cols[0] ?? '');
    if (!cols.includes(valueColumn)) setValueColumn(cols[1] ?? cols[0] ?? '');
  }, [columns, labelColumn, valueColumn]);

  const handleDataChange = useCallback((rows: DataRow[], cols: string[]) => {
    setData(rows);
    setColumns(cols);
    safeSave(LS_KEYS.data, rows);
    safeSave(LS_KEYS.columns, cols);
    if (cols.length > 0) {
      const nextLabel = cols.includes(labelColumn) ? labelColumn : cols[0];
      const nextValue = cols.includes(valueColumn) ? valueColumn : cols[1] ?? cols[0];
      if (nextLabel !== labelColumn) {
        setLabelColumn(nextLabel);
        safeSave(LS_KEYS.labelColumn, nextLabel);
      }
      if (nextValue !== valueColumn) {
        setValueColumn(nextValue);
        safeSave(LS_KEYS.valueColumn, nextValue);
      }
    }
  }, [labelColumn, valueColumn]);

  const handleLabelColumnChange = useCallback((col: string) => {
    setLabelColumn(col);
    safeSave(LS_KEYS.labelColumn, col);
  }, []);

  const handleValueColumnChange = useCallback((col: string) => {
    setValueColumn(col);
    safeSave(LS_KEYS.valueColumn, col);
  }, []);

  const handleLayoutChange = useCallback((next: LayoutItem[]) => {
    const normalized = next.map((l) => ({ ...l, minW: l.minW ?? 2, minH: l.minH ?? 2, maxW: l.maxW ?? 12, maxH: l.maxH ?? 12 }));
    setLayout(normalized);
    safeSave(LS_KEYS.layout, normalized);
  }, []);

  const handleTitleChange = useCallback((id: string, title: string) => {
    setChartConfigs((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, title } : c));
      safeSave(LS_KEYS.chartConfigs, next);
      return next;
    });
  }, []);

  const handleChartTypeChange = useCallback((id: string, type: ChartType) => {
    setChartConfigs((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, chartType: type } : c));
      safeSave(LS_KEYS.chartConfigs, next);
      return next;
    });
  }, []);

  const handleThemeChange = useCallback((key: string) => {
    setThemeKey(key);
    safeSave(LS_KEYS.theme, key);
  }, []);

  const handleTogglePanel = useCallback(() => {
    setPanelOpen((prev) => {
      const next = !prev;
      safeSave(LS_KEYS.panelOpen, next);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setData(DEFAULT_DATA);
    setColumns(DEFAULT_COLUMNS);
    setLabelColumn(DEFAULT_COLUMNS[0]);
    setValueColumn(DEFAULT_COLUMNS[1]);
    setChartConfigs(DEFAULT_CHART_CONFIGS);
    setLayout(DEFAULT_LAYOUT);
    Object.values(LS_KEYS).forEach((k) => localStorage.removeItem(k));
    safeSave(LS_KEYS.data, DEFAULT_DATA);
    safeSave(LS_KEYS.columns, DEFAULT_COLUMNS);
    safeSave(LS_KEYS.chartConfigs, DEFAULT_CHART_CONFIGS);
    safeSave(LS_KEYS.layout, DEFAULT_LAYOUT);
    safeSave(LS_KEYS.panelOpen, panelOpen);
    message.success('已重置为默认数据与布局');
  }, [panelOpen]);

  const themeMenu: MenuProps = {
    items: THEMES.map((t) => ({
      key: t.key,
      label: (
        <div className="theme-selector-option">
          <span
          className="theme-swatch"
          style={{
            background: `linear-gradient(90deg, ${t.colors.slice(0, 4).join(', ')}`,
          }}
        />
        <span className="theme-name">{t.name}</span>
        {t.key === themeKey && (
          <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>✓</span>
        )}
        </div>
      ),
      onClick: () => handleThemeChange(t.key),
    })),
  };

  return (
    <div className="app-root">
      <nav className="top-navbar">
        <button
          type="button"
          className="btn-icon"
          onClick={handleTogglePanel}
          title={panelOpen ? '关闭数据面板' : '打开数据面板'}
        >
          {panelOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
        </button>
        <div className="nav-title">
          <div className="nav-logo">DV</div>
          <span>DataViz Dashboard</span>
        </div>
        <div className="spacer" />
        <button
          type="button"
          className="btn-icon"
          onClick={handleReset}
          title="重置为默认数据"
        >
          <ReloadOutlined />
        </button>
        <Dropdown menu={themeMenu} trigger={['click']} placement="bottomRight">
          <button type="button" className="btn-icon" title="切换配色主题">
            <BgColorsOutlined />
            <span
              className="theme-dot"
              style={{ marginLeft: 6 }}
            />
          </button>
        </Dropdown>
      </nav>

      <div className="main-container">
        <DataPanel
          open={panelOpen}
          onClose={handleTogglePanel}
          data={data}
          columns={columns}
          labelColumn={labelColumn}
          valueColumn={valueColumn}
          onDataChange={handleDataChange}
          onLabelColumnChange={handleLabelColumnChange}
          onValueColumnChange={handleValueColumnChange}
        />
        <Dashboard
          data={data}
          labelColumn={labelColumn}
          valueColumn={valueColumn}
          chartConfigs={chartConfigs}
          layout={layout}
          theme={theme}
          onLayoutChange={handleLayoutChange}
          onTitleChange={handleTitleChange}
          onChartTypeChange={handleChartTypeChange}
        />
      </div>
    </div>
  );
};

export default App;
