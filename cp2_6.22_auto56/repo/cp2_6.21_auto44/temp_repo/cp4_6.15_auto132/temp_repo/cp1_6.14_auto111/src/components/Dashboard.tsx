import React, { useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import type { DataRow, ChartCardConfig, ThemeConfig, LayoutItem } from '../types';
import ChartCard from './ChartCard';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardProps {
  data: DataRow[];
  labelColumn: string;
  valueColumn: string;
  chartConfigs: ChartCardConfig[];
  layout: LayoutItem[];
  theme: ThemeConfig;
  onLayoutChange: (layout: LayoutItem[]) => void;
  onTitleChange: (id: string, title: string) => void;
  onChartTypeChange: (id: string, type: ChartCardConfig['chartType']) => void;
}

const ROW_HEIGHT = 120;

const Dashboard: React.FC<DashboardProps> = ({
  data,
  labelColumn,
  valueColumn,
  chartConfigs,
  layout,
  theme,
  onLayoutChange,
  onTitleChange,
  onChartTypeChange,
}) => {
  const handleLayoutChange = useCallback(
    (currentLayout: Layout[]) => {
      const mapped: LayoutItem[] = currentLayout.map((l) => ({
        i: l.i,
        x: l.x,
        y: l.y,
        w: l.w,
        h: l.h,
      }));
      onLayoutChange(mapped);
    },
    [onLayoutChange],
  );

  const layouts = { lg: layout };

  return (
    <div className="dashboard-area">
      <ResponsiveGridLayout
        className="rgl-container"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 6, xxs: 2 }}
        rowHeight={ROW_HEIGHT}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        draggableHandle="[data-grid-drag-handle]"
        onLayoutChange={handleLayoutChange}
        isResizable
        isDraggable
        useCSSTransforms
        compactType="vertical"
        preventCollision={false}
      >
        {chartConfigs.map((cfg) => (
          <div key={cfg.id}>
            <ChartCard
              id={cfg.id}
              title={cfg.title}
              chartType={cfg.chartType}
              data={data}
              labelColumn={labelColumn}
              valueColumn={valueColumn}
              theme={theme}
              onTitleChange={onTitleChange}
              onChartTypeChange={onChartTypeChange}
            />
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default Dashboard;
