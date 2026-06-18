import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Droplet, Leaf, TrendingUp, Plus, X } from 'lucide-react';
import type { Plant, GrowthLog, WaterRecord } from '@/types';
import { useGrowthData } from '@/hooks/useGrowthData';
import {
  generateId,
  formatDate,
  getOperationTypeColor,
  getOperationTypeName,
} from '@/utils/plantHelper';

interface PlantDetailProps {
  plant: Plant;
  onUpdatePlant: (plant: Plant) => void;
  onAddGrowthLog: (plantId: string, log: GrowthLog) => void;
  onAddWaterRecord: (plantId: string, record: WaterRecord) => void;
  onDeletePlant: (plantId: string) => void;
}

export const PlantDetail: React.FC<PlantDetailProps> = ({
  plant,
  onUpdatePlant,
  onAddGrowthLog,
  onAddWaterRecord,
  onDeletePlant,
}) => {
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');
  const [isEditing, setIsEditing] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const { data, hasData } = useGrowthData(plant, chartRange);

  const [editForm, setEditForm] = useState({
    name: plant.name,
    variety: plant.variety,
    plantDate: plant.plantDate,
    location: plant.location,
    waterPreference: plant.waterPreference,
    category: plant.category,
  });

  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    height: '',
    leafCount: '',
    soilMoisture: '',
    leafColor: 'green' as GrowthLog['leafColor'],
    markedAbnormal: false,
  });

  const [recordForm, setRecordForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'water' as WaterRecord['type'],
    amount: '',
    note: '',
  });

  const handleSaveEdit = () => {
    onUpdatePlant({ ...plant, ...editForm });
    setIsEditing(false);
  };

  const handleAddLog = () => {
    if (!logForm.height || !logForm.leafCount || !logForm.soilMoisture) return;
    const newLog: GrowthLog = {
      id: generateId(),
      date: logForm.date,
      height: parseFloat(logForm.height),
      leafCount: parseInt(logForm.leafCount),
      soilMoisture: parseInt(logForm.soilMoisture),
      leafColor: logForm.leafColor,
      markedAbnormal: logForm.markedAbnormal,
    };
    onAddGrowthLog(plant.id, newLog);
    setShowLogForm(false);
    setLogForm({
      date: new Date().toISOString().split('T')[0],
      height: '',
      leafCount: '',
      soilMoisture: '',
      leafColor: 'green',
      markedAbnormal: false,
    });
  };

  const handleAddRecord = () => {
    const newRecord: WaterRecord = {
      id: generateId(),
      date: recordForm.date,
      type: recordForm.type,
      amount: recordForm.amount ? parseInt(recordForm.amount) : undefined,
      note: recordForm.note || undefined,
    };
    onAddWaterRecord(plant.id, newRecord);
    setShowRecordForm(false);
    setRecordForm({
      date: new Date().toISOString().split('T')[0],
      type: 'water',
      amount: '',
      note: '',
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: 'white',
            padding: '8px 12px',
            border: '1px solid #E0E0E0',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: '4px', fontSize: '12px' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color, fontSize: '11px', margin: '2px 0' }}>
              {entry.name}: {entry.value}
              {entry.name === '高度' ? ' cm' : entry.name === '湿度' ? '%' : ' 片'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="right-sidebar"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="detail-header">
        <h2 className="detail-title">{plant.name}</h2>
        <button
          className="btn btn-small btn-secondary"
          onClick={() => setIsEditing(!isEditing)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Edit3 size={14} /> 编辑
        </button>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            className="detail-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="form-group">
              <label className="form-label">名称</label>
              <input
                type="text"
                className="form-input"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">品种</label>
              <input
                type="text"
                className="form-input"
                value={editForm.variety}
                onChange={(e) => setEditForm({ ...editForm, variety: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">种植日期</label>
              <input
                type="date"
                className="form-input"
                value={editForm.plantDate}
                onChange={(e) => setEditForm({ ...editForm, plantDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">位置编号</label>
              <input
                type="text"
                className="form-input"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">浇水偏好</label>
              <select
                className="form-select"
                value={editForm.waterPreference}
                onChange={(e) => setEditForm({ ...editForm, waterPreference: e.target.value as Plant['waterPreference'] })}
              >
                <option value="low">低水分（耐旱）</option>
                <option value="medium">中等水分</option>
                <option value="high">高水分（喜湿）</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">分类</label>
              <select
                className="form-select"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              >
                <option value="蔬菜">蔬菜</option>
                <option value="花卉">花卉</option>
                <option value="香草">香草</option>
                <option value="果树">果树</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                保存
              </button>
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                取消
              </button>
            </div>
            <button
              className="btn btn-danger"
              style={{ marginTop: '8px', width: '100%' }}
              onClick={() => {
                if (confirm(`确定要删除「${plant.name}」吗？`)) {
                  onDeletePlant(plant.id);
                }
              }}
            >
              删除植物
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="detail-section">
        <div className="detail-header">
          <h3 className="section-title" style={{ marginBottom: 0 }}>
            <TrendingUp size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            生长趋势
          </h3>
          <div className="chart-controls">
            <button
              className={`chart-btn ${chartRange === '7d' ? 'active' : ''}`}
              onClick={() => setChartRange('7d')}
            >
              7天
            </button>
            <button
              className={`chart-btn ${chartRange === '30d' ? 'active' : ''}`}
              onClick={() => setChartRange('30d')}
            >
              30天
            </button>
          </div>
        </div>
        <div className="chart-container">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="height"
                  name="高度"
                  stroke="#4CAF50"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={true}
                  animationDuration={300}
                />
                <Line
                  type="monotone"
                  dataKey="leafCount"
                  name="叶片数"
                  stroke="#FF9800"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={true}
                  animationDuration={300}
                />
                <Line
                  type="monotone"
                  dataKey="soilMoisture"
                  name="湿度"
                  stroke="#2196F3"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={true}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '20px' }}>
              <Leaf size={32} style={{ opacity: 0.3 }} />
              <div style={{ fontSize: '12px' }}>暂无生长数据</div>
            </div>
          )}
        </div>
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#4CAF50' }}></div>
            高度(cm)
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#FF9800' }}></div>
            叶片数(片)
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#2196F3' }}></div>
            湿度(%)
          </div>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-header">
          <h3 className="section-title" style={{ marginBottom: 0 }}>
            <Leaf size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            生长记录
          </h3>
          <button
            className="btn btn-small btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setShowLogForm(!showLogForm)}
          >
            {showLogForm ? <X size={14} /> : <Plus size={14} />}
            {showLogForm ? '取消' : '添加'}
          </button>
        </div>

        <AnimatePresence>
          {showLogForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ marginBottom: '12px' }}
            >
              <div className="form-group">
                <label className="form-label">日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={logForm.date}
                  onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">高度 (cm)</label>
                <input
                  type="number"
                  className="form-input"
                  value={logForm.height}
                  onChange={(e) => setLogForm({ ...logForm, height: e.target.value })}
                  placeholder="输入高度"
                />
              </div>
              <div className="form-group">
                <label className="form-label">叶片数量</label>
                <input
                  type="number"
                  className="form-input"
                  value={logForm.leafCount}
                  onChange={(e) => setLogForm({ ...logForm, leafCount: e.target.value })}
                  placeholder="输入叶片数"
                />
              </div>
              <div className="form-group">
                <label className="form-label">土壤湿度 (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={logForm.soilMoisture}
                  onChange={(e) => setLogForm({ ...logForm, soilMoisture: e.target.value })}
                  placeholder="0-100"
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label className="form-label">叶片颜色</label>
                <select
                  className="form-select"
                  value={logForm.leafColor}
                  onChange={(e) => setLogForm({ ...logForm, leafColor: e.target.value as GrowthLog['leafColor'] })}
                >
                  <option value="green">🟢 正常绿色</option>
                  <option value="yellow">🟡 发黄</option>
                  <option value="brown">🟤 褐斑</option>
                  <option value="spotted">🔴 斑点</option>
                </select>
              </div>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="markedAbnormal"
                  checked={logForm.markedAbnormal}
                  onChange={(e) => setLogForm({ ...logForm, markedAbnormal: e.target.checked })}
                />
                <label htmlFor="markedAbnormal" style={{ fontSize: '13px' }}>
                  标记为异常状态
                </label>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddLog}>
                保存记录
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="detail-section">
        <div className="detail-header">
          <h3 className="section-title" style={{ marginBottom: 0 }}>
            <Droplet size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            养护时间线
          </h3>
          <button
            className="btn btn-small btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setShowRecordForm(!showRecordForm)}
          >
            {showRecordForm ? <X size={14} /> : <Plus size={14} />}
            {showRecordForm ? '取消' : '添加'}
          </button>
        </div>

        <AnimatePresence>
          {showRecordForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ marginBottom: '12px' }}
            >
              <div className="form-group">
                <label className="form-label">日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={recordForm.date}
                  onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">操作类型</label>
                <select
                  className="form-select"
                  value={recordForm.type}
                  onChange={(e) => setRecordForm({ ...recordForm, type: e.target.value as WaterRecord['type'] })}
                >
                  <option value="water">💧 浇水</option>
                  <option value="fertilize">🌱 施肥</option>
                  <option value="prune">✂️ 修剪</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">用量 (ml)</label>
                <input
                  type="number"
                  className="form-input"
                  value={recordForm.amount}
                  onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                  placeholder="选填"
                />
              </div>
              <div className="form-group">
                <label className="form-label">备注</label>
                <input
                  type="text"
                  className="form-input"
                  value={recordForm.note}
                  onChange={(e) => setRecordForm({ ...recordForm, note: e.target.value })}
                  placeholder="选填"
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddRecord}>
                保存记录
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {plant.waterRecords.length > 0 ? (
          <div className="timeline">
            {plant.waterRecords.slice(0, 10).map((record) => (
              <div key={record.id} className="timeline-item">
                <div
                  className="timeline-dot"
                  style={{ backgroundColor: getOperationTypeColor(record.type) }}
                />
                <div className="timeline-date">{formatDate(record.date)}</div>
                <div className="timeline-content">
                  <span
                    className="timeline-type"
                    style={{ backgroundColor: getOperationTypeColor(record.type) }}
                  >
                    {getOperationTypeName(record.type)}
                  </span>
                  {record.amount && <span>{record.amount}ml</span>}
                  {record.note && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}> - {record.note}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '20px' }}>
            <Droplet size={32} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: '12px' }}>暂无养护记录</div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
