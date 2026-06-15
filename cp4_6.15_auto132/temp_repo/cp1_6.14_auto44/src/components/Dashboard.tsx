import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { itemApi, suggestionApi, consumptionApi, locationApi } from '../api';
import { ToastContext } from '../App';
import type { InventoryItem, SupplySuggestion, ConsumptionRecord, StorageLocation } from '../types';
import moment from 'moment';

interface DashboardProps {
  family: { id: string; name: string; location: string };
}

const Dashboard: React.FC<DashboardProps> = ({ family }) => {
  const navigate = useNavigate();
  const showToast = useContext(ToastContext);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<SupplySuggestion[]>([]);
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);

  useEffect(() => {
    if (!family.id) return;

    const loadData = async () => {
      try {
        const [itemsData, suggestionsData, recordsData, locationsData] = await Promise.all([
          itemApi.getAll(family.id),
          suggestionApi.getAll(family.id),
          consumptionApi.get(family.id, 7),
          locationApi.getAll(family.id),
        ]);
        setItems(itemsData);
        setSuggestions(suggestionsData);
        setConsumptionRecords(recordsData);
        setLocations(locationsData);
      } catch {
        showToast('加载数据失败', 'error');
      }
    };

    loadData();
  }, [family.id]);

  const totalItems = items.length;

  const expiringItems = items.filter(
    (item) => moment(item.expiryDate).diff(moment(), 'days') <= 3 && moment(item.expiryDate).diff(moment(), 'days') >= 0
  ).length;

  const lowStockItems = items.filter((item) => item.quantity < item.minThreshold).length;

  const suggestionCount = suggestions.length;

  const getChartData = () => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      days.push(moment().subtract(i, 'days').format('YYYY-MM-DD'));
    }

    const locationMap = new Map<string, string>();
    locations.forEach((loc) => locationMap.set(loc.id, loc.name));

    const locationIds = [...new Set(consumptionRecords.map((r) => r.storageLocationId))];

    const chartData = days.map((day) => {
      const point: Record<string, string | number> = {
        date: moment(day).format('MM/DD'),
      };

      locationIds.forEach((locId) => {
        const locName = locationMap.get(locId) || locId;
        const dayRecords = consumptionRecords.filter(
          (r) => moment(r.date).format('YYYY-MM-DD') === day && r.storageLocationId === locId
        );
        const added = dayRecords
          .filter((r) => r.type === 'added')
          .reduce((sum, r) => sum + r.quantity, 0);
        const consumed = dayRecords
          .filter((r) => r.type === 'consumed')
          .reduce((sum, r) => sum + r.quantity, 0);
        point[`${locName}_added`] = added;
        point[`${locName}_consumed`] = consumed;
      });

      return point;
    });

    return { chartData, locationIds, locationMap };
  };

  const { chartData, locationIds, locationMap } = getChartData();

  const locationColorMap = new Map<string, string>();
  locations.forEach((loc) => locationColorMap.set(loc.id, loc.color));

  const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4', '#ff5722', '#795548'];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon">📦</div>
          <div className="stat-value">{totalItems}</div>
          <div className="stat-label">总物品数</div>
        </div>

        <div
          className="stat-card danger"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/inventory?status=expiring')}
        >
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{expiringItems}</div>
          <div className="stat-label">过期预警 (3天内)</div>
        </div>

        <div className="stat-card warning" style={{ cursor: 'default' }}>
          <div className="stat-icon">📉</div>
          <div className="stat-value">{lowStockItems}</div>
          <div className="stat-label">低库存物品</div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/supply')}
        >
          <div className="stat-icon">🛒</div>
          <div className="stat-value">{suggestionCount}</div>
          <div className="stat-label">采购清单项</div>
        </div>
      </div>

      <div className="chart-container">
        <h3 style={{ marginBottom: '16px' }}>近一周物品变动趋势</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {locationIds.map((locId, index) => {
              const locName = locationMap.get(locId) || locId;
              const color = locationColorMap.get(locId) || COLORS[index % COLORS.length];
              return (
                <React.Fragment key={locId}>
                  <Line
                    type="monotone"
                    dataKey={`${locName}_added`}
                    name={`${locName} - 新增`}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${locName}_consumed`}
                    name={`${locName} - 消耗`}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </React.Fragment>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
