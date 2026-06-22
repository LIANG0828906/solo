import { useEffect, useRef, useState } from 'react';
import { Modal, Tabs } from 'antd';
import { Line } from '@ant-design/charts';
import dayjs from 'dayjs';
import { useAirStore } from '@/stores/airStore';
import { PollutantKey, POLLUTANT_CONFIG } from '@/api/airApi';

const CITY_COLORS: Record<string, string> = {
  city1: '#00b4d8',
  city2: '#ff6b6b',
};

export default function TrendPanel() {
  const {
    compareVisible,
    setCompareVisible,
    selectedCities,
    cities,
    historyData,
    fetchHistory,
    activePollutant,
    setActivePollutant,
  } = useAirStore();

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (compareVisible) {
      selectedCities.forEach((id) => fetchHistory(id));
    }
  }, [compareVisible, selectedCities, fetchHistory]);

  const handleClose = () => {
    setCompareVisible(false);
    setPosition(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position ? position.x : rect.left,
      posY: position ? position.y : rect.top,
    };
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.posX + dx,
      y: dragRef.current.posY + dy,
    });
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  const city1 = cities.find((c) => c.id === selectedCities[0]);
  const city2 = cities.find((c) => c.id === selectedCities[1]);
  const history1 = historyData[selectedCities[0]];
  const history2 = historyData[selectedCities[1]];

  const getChartData = () => {
    if (!history1 || !history2) return [];
    const data1 = history1[activePollutant];
    const data2 = history2[activePollutant];
    const result: Array<{ date: string; value: number; city: string }> = [];

    data1.forEach((d, idx) => {
      if (idx % 4 === 0) {
        result.push({
          date: dayjs(d.timestamp).format('MM-DD HH:00'),
          value: d.value,
          city: city1?.name || '城市1',
        });
      }
    });
    data2.forEach((d, idx) => {
      if (idx % 4 === 0) {
        result.push({
          date: dayjs(d.timestamp).format('MM-DD HH:00'),
          value: d.value,
          city: city2?.name || '城市2',
        });
      }
    });

    return result;
  };

  const pollutantTabs: PollutantKey[] = ['pm25', 'pm10', 'ozone', 'no2'];

  const config = {
    data: getChartData(),
    xField: 'date',
    yField: 'value',
    seriesField: 'city',
    smooth: true,
    height: 380,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    color: [CITY_COLORS.city1, CITY_COLORS.city2],
    lineStyle: (_: unknown, idx: number) => ({
      lineWidth: 3,
      shadowColor: idx === 0 ? CITY_COLORS.city1 : CITY_COLORS.city2,
      shadowBlur: 12,
      shadowOffsetY: 4,
    }),
    point: {
      size: 4,
      shape: 'circle',
      style: {
        lineWidth: 2,
        fill: '#0a1628',
      },
    },
    state: {
      active: {
        style: {
          lineWidth: 5,
          shadowBlur: 20,
        },
      },
    },
    tooltip: {
      showCrosshairs: true,
      shared: true,
      formatter: (datum: { value: number; city: string; date: string }) => ({
        name: `${datum.city} - ${POLLUTANT_CONFIG[activePollutant].name}`,
        value: `${datum.value} ${POLLUTANT_CONFIG[activePollutant].unit}`,
      }),
    },
    yAxis: {
      label: { style: { fill: 'rgba(255,255,255,0.6)', fontSize: 12 } },
      grid: { line: { style: { stroke: 'rgba(255,255,255,0.06)' } } },
      title: {
        text: `${POLLUTANT_CONFIG[activePollutant].name} (${POLLUTANT_CONFIG[activePollutant].unit})`,
        style: { fill: 'rgba(255,255,255,0.8)', fontSize: 12 },
      },
    },
    xAxis: {
      label: { style: { fill: 'rgba(255,255,255,0.6)', fontSize: 11 }, autoHide: true, autoRotate: false },
      grid: null,
    },
    legend: {
      position: 'top',
      itemName: { style: { fill: '#fff', fontSize: 13 } },
      marker: { symbol: 'circle', style: { r: 5 } },
    },
    theme: {
      background: 'transparent',
    },
  };

  if (selectedCities.length < 2) {
    return null;
  }

  return (
    <Modal
      open={compareVisible}
      onCancel={handleClose}
      footer={null}
      centered={!position}
      width={900}
      styles={{
        mask: { background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' },
        content: {
          background: 'rgba(20, 35, 60, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24,
          maxHeight: 600,
          overflow: 'hidden',
          padding: 0,
          ...(position ? { position: 'fixed', left: position.x, top: position.y, margin: 0 } : {}),
        },
        header: { display: 'none' },
        body: { padding: 0 },
      }}
      modalRender={(node) => (
        <div
          ref={panelRef}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseUp}
          style={{ width: '100%', height: '100%' }}
        >
          <div
            onMouseDown={handleMouseDown}
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              cursor: 'move',
              userSelect: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>📊</span>
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
                趋势对比：{city1?.icon} {city1?.name} vs {city2?.icon} {city2?.name}
              </span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>拖动标题栏可移动面板</span>
          </div>
          <div style={{ padding: '8px 24px 24px' }}>
            <Tabs
              activeKey={activePollutant}
              onChange={(k) => setActivePollutant(k as PollutantKey)}
              items={pollutantTabs.map((key) => ({
                key,
                label: (
                  <span style={{ color: '#fff', fontSize: 14 }}>
                    {POLLUTANT_CONFIG[key].name}
                  </span>
                ),
              }))}
              style={{ marginBottom: 16 }}
              indicator={{ size: (len) => len - 16, align: 'center' }}
              itemsRender={(items) => items}
            />
            <Line {...config} />
          </div>
          {node && <div style={{ display: 'none' }}>{node}</div>}
        </div>
      )}
    />
  );
}
