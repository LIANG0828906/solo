import React, { useState, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { CoffeeBean, BrewRecord, getBrews, createBrew } from '../api';

interface BeanCardProps {
  bean: CoffeeBean;
  onRemoveFlavor?: (beanId: string, flavor: string) => void;
}

const roastColors: Record<string, string> = {
  light: '#F5DEB3',
  medium: '#D2691E',
  dark: '#8B4513',
};

const roastLabels: Record<string, string> = {
  light: '浅焙',
  medium: '中焙',
  dark: '深焙',
};

const softColors = [
  '#E57373',
  '#81C784',
  '#64B5F6',
  '#FFB74D',
  '#BA68C8',
  '#4DB6AC',
  '#A1887F',
  '#7986CB',
];

function getSoftColor(index: number): string {
  return softColors[index % softColors.length];
}

const BeanCard: React.FC<BeanCardProps> = ({ bean, onRemoveFlavor }) => {
  const [expanded, setExpanded] = useState(false);
  const [brews, setBrews] = useState<BrewRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    waterTemp: 92,
    grindSize: '中细',
    pourMethod: '三段式',
    tasteNotes: '',
    rating: 5,
  });
  const [chartVisible, setChartVisible] = useState(false);

  useEffect(() => {
    if (expanded) {
      setChartVisible(false);
      getBrews(bean.id).then((data) => {
        setBrews(data);
        setTimeout(() => setChartVisible(true), 50);
      });
    }
  }, [expanded, bean.id]);

  const handleAddBrew = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newBrew = await createBrew(bean.id, formData);
      setBrews([...brews, newBrew]);
      setShowModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        waterTemp: 92,
        grindSize: '中细',
        pourMethod: '三段式',
        tasteNotes: '',
        rating: 5,
      });
    } catch (error) {
      console.error('Failed to create brew:', error);
    }
  };

  const radarData = [
    { subject: '酸度', value: bean.flavorProfile.acidity, fullMark: 10 },
    { subject: '甜度', value: bean.flavorProfile.sweetness, fullMark: 10 },
    { subject: '苦度', value: bean.flavorProfile.bitterness, fullMark: 10 },
    { subject: '醇厚度', value: bean.flavorProfile.body, fullMark: 10 },
    { subject: '果香', value: bean.flavorProfile.aroma, fullMark: 10 },
  ];

  const recentBrews = [...brews]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const renderStars = (rating: number, interactive = false, onClick?: (r: number) => void) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating;
      stars.push(
        <span
          key={i}
          style={{
            color: filled ? '#FFD700' : '#BDBDBD',
            fontSize: interactive ? '28px' : '16px',
            cursor: interactive ? 'pointer' : 'default',
            userSelect: 'none',
            transition: 'color 0.2s ease-out',
            lineHeight: 1,
          }}
          onClick={interactive && onClick ? () => onClick(i) : undefined}
        >
          ★
        </span>
      );
    }
    return <div style={{ display: 'flex', gap: '4px' }}>{stars}</div>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '280px',
          backgroundColor: '#FFFFFF',
          borderRadius: '3px',
          boxShadow: '0 4px 12px rgba(62, 39, 35, 0.1)',
          padding: '20px',
          cursor: 'pointer',
          transition: 'box-shadow 0.3s ease-out, transform 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(62, 39, 35, 0.15)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(62, 39, 35, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#3E2723' }}>{bean.name}</div>
        <div style={{ fontSize: '14px', color: '#757575' }}>{bean.origin}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: roastColors[bean.roastLevel],
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          />
          <span style={{ fontSize: '13px', color: '#3E2723' }}>{roastLabels[bean.roastLevel]}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
          {bean.flavorNotes.slice(0, 5).map((note, index) => (
            <span
              key={note}
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                backgroundColor: getSoftColor(index),
                color: '#FFFFFF',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease-out',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onRemoveFlavor) {
                  onRemoveFlavor(bean.id, note);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {note}
            </span>
          ))}
        </div>
      </div>

      {expanded && (
        <div
          style={{
            backgroundColor: '#F5F5F5',
            border: '2px solid #E0E0E0',
            borderTop: 'none',
            borderRadius: '0 0 3px 3px',
            padding: '20px',
            marginTop: '-2px',
            width: '280px',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  color: '#3E2723',
                }}
              >
                详细信息
              </h4>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#3E2723' }}>
                <p>
                  <strong>产地：</strong>
                  {bean.origin}
                </p>
                <p>
                  <strong>海拔：</strong>
                  {bean.altitude || '未知'}
                </p>
                <p>
                  <strong>处理法：</strong>
                  {bean.process || '未知'}
                </p>
                <p style={{ marginTop: '8px' }}>{bean.description}</p>
              </div>
            </div>

            <div
              style={{
                opacity: chartVisible ? 1 : 0,
                transition: 'opacity 0.5s ease-in-out',
              }}
            >
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  color: '#3E2723',
                }}
              >
                风味雷达图
              </h4>
              <div style={{ width: '100%', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="70%">
                    <PolarGrid stroke="#BDBDBD" strokeOpacity={0.3} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#3E2723' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 9 }} />
                    <Radar
                      name="风味"
                      dataKey="value"
                      stroke="#8B4513"
                      fill="#8B4513"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  color: '#3E2723',
                }}
              >
                最近冲泡记录
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentBrews.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#757575' }}>暂无冲泡记录</p>
                ) : (
                  recentBrews.map((brew) => (
                    <div
                      key={brew.id}
                      style={{
                        padding: '10px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#3E2723',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{brew.date}</span>
                        {renderStars(Math.round(brew.rating / 2))}
                      </div>
                      <div style={{ color: '#757575', fontSize: '11px' }}>
                        水温：{brew.waterTemp}℃ | 研磨度：{brew.grindSize} | {brew.pourMethod}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1976D2',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'background-color 0.2s ease-out',
                fontFamily: "'Roboto Slab', serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1565C0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1976D2';
              }}
            >
              添加冲泡记录
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <>
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 1000,
              animation: 'fadeIn 0.3s ease-out',
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              maxWidth: '90vw',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E0E0E0',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              padding: '24px',
              zIndex: 1001,
              animation: 'bounceIn 0.3s ease-out',
            }}
          >
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '20px',
                color: '#3E2723',
              }}
            >
              添加冲泡记录
            </h3>
            <form onSubmit={handleAddBrew} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#3E2723', marginBottom: '6px', display: 'block' }}>
                  日期
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #BDBDBD',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: "'Roboto Slab', serif",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#3E2723', marginBottom: '6px', display: 'block' }}>
                  水温：{formData.waterTemp}℃
                </label>
                <input
                  type="range"
                  min="85"
                  max="96"
                  value={formData.waterTemp}
                  onChange={(e) => setFormData({ ...formData, waterTemp: parseInt(e.target.value) })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#757575' }}>
                  <span>85℃</span>
                  <span>96℃</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#3E2723', marginBottom: '6px', display: 'block' }}>
                  研磨度
                </label>
                <select
                  value={formData.grindSize}
                  onChange={(e) => setFormData({ ...formData, grindSize: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #BDBDBD',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: "'Roboto Slab', serif",
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="粗">粗</option>
                  <option value="中粗">中粗</option>
                  <option value="中">中</option>
                  <option value="细">细</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#3E2723', marginBottom: '6px', display: 'block' }}>
                  注水方式
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['一刀流', '三段式', '搅拌法'].map((method) => (
                    <label
                      key={method}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        color: '#3E2723',
                      }}
                    >
                      <input
                        type="radio"
                        name="pourMethod"
                        value={method}
                        checked={formData.pourMethod === method}
                        onChange={(e) => setFormData({ ...formData, pourMethod: e.target.value })}
                        style={{ cursor: 'pointer' }}
                      />
                      {method}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#3E2723', marginBottom: '6px', display: 'block' }}>
                  口感描述
                </label>
                <textarea
                  value={formData.tasteNotes}
                  onChange={(e) => setFormData({ ...formData, tasteNotes: e.target.value })}
                  maxLength={200}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #BDBDBD',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: "'Roboto Slab', serif",
                    resize: 'vertical',
                  }}
                />
                <div style={{ fontSize: '11px', color: '#757575', textAlign: 'right' }}>
                  {formData.tasteNotes.length}/200
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#3E2723', marginBottom: '6px', display: 'block' }}>
                  品鉴评分
                </label>
                {renderStars(Math.round(formData.rating / 2), true, (r) =>
                  setFormData({ ...formData, rating: r * 2 })
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#E0E0E0',
                    color: '#3E2723',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'background-color 0.2s ease-out',
                    fontFamily: "'Roboto Slab', serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#BDBDBD';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#E0E0E0';
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#1976D2',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'background-color 0.2s ease-out',
                    fontFamily: "'Roboto Slab', serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1565C0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1976D2';
                  }}
                >
                  提交
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default BeanCard;
