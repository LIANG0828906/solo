import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import Navbar from '../components/Navbar';
import FlavorTags from '../components/FlavorTags';
import api from '../utils/api';
import { ORIGINS, VARIETIES, PROCESSING_METHODS } from '../../server/models';
import './AddBatch.css';

interface RoastPoint {
  time: number;
  temperature: number;
}

interface FlavorProfile {
  acidity: number;
  sweetness: number;
  bitterness: number;
  body: number;
  aftertaste: number;
}

const AddBatch: React.FC = () => {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [origin, setOrigin] = useState('');
  const [variety, setVariety] = useState('');
  const [processingMethod, setProcessingMethod] = useState('');
  const [greenScore, setGreenScore] = useState(7);
  const [flavorInput, setFlavorInput] = useState('');
  const [flavorNotes, setFlavorNotes] = useState<string[]>([]);
  const [roastDate, setRoastDate] = useState(new Date().toISOString().split('T')[0]);
  const [roastPoints, setRoastPoints] = useState<RoastPoint[]>([
    { time: 0, temperature: 120 },
    { time: 5, temperature: 160 },
    { time: 10, temperature: 190 },
    { time: 15, temperature: 210 },
    { time: 20, temperature: 215 },
  ]);
  const [flavorProfile, setFlavorProfile] = useState<FlavorProfile>({
    acidity: 3,
    sweetness: 3,
    bitterness: 2,
    body: 3,
    aftertaste: 3,
  });
  const [submitting, setSubmitting] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = d3.scaleLinear().domain([0, 20]).range([0, innerWidth]);
  const yScale = d3.scaleLinear().domain([100, 240]).range([innerHeight, 0]);

  const drawChart = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(d => `${d}分`);
    const yAxis = d3.axisLeft(yScale).ticks(8).tickFormat(d => `${d}℃`);

    g.append('g').attr('transform', `translate(0, ${innerHeight})`).attr('class', 'x-axis').call(xAxis);
    g.append('g').attr('class', 'y-axis').call(yAxis);

    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(8))
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#E8E0D8')
      .attr('stroke-dasharray', '3,3');

    const line = d3
      .line<RoastPoint>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.temperature))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(roastPoints)
      .attr('fill', 'none')
      .attr('stroke', '#D0874C')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    const points = g
      .selectAll('.data-point')
      .data(roastPoints)
      .join('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.time))
      .attr('cy', d => yScale(d.temperature))
      .attr('r', 6)
      .attr('fill', '#FFFFFF')
      .attr('stroke', '#D0874C')
      .attr('stroke-width', 2.5)
      .style('cursor', 'pointer');

    const overlay = g
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    overlay.on('click', (event: MouseEvent) => {
      const [x, y] = d3.pointer(event);
      const time = Math.round(xScale.invert(x) * 2) / 2;
      const temperature = Math.round(yScale.invert(y));

      if (time < 0 || time > 20 || temperature < 100 || temperature > 240) return;
      if (roastPoints.length >= 10) return;

      const newPoint = { time, temperature };
      const newPoints = [...roastPoints, newPoint].sort((a, b) => a.time - b.time);
      setRoastPoints(newPoints);
    });

    points
      .on('mousedown', function(event: MouseEvent, d: RoastPoint) {
        event.stopPropagation();
        const index = roastPoints.findIndex(p => p.time === d.time && p.temperature === d.temperature);
        setDraggingIndex(index);
        d3.select(this).attr('r', 8);
      })
      .on('dblclick', function(event: MouseEvent, d: RoastPoint) {
        event.stopPropagation();
        if (roastPoints.length <= 2) return;
        setRoastPoints(prev => prev.filter(p => !(p.time === d.time && p.temperature === d.temperature)));
      });

    svg.on('mousemove', (event: MouseEvent) => {
      if (draggingIndex === null) return;

      const gElement = svg.select('g').node() as SVGGElement | null;
      if (!gElement) return;

      const [x, y] = d3.pointer(event, gElement);
      const time = Math.max(0, Math.min(20, Math.round(xScale.invert(x) * 2) / 2));
      const temperature = Math.max(100, Math.min(240, Math.round(yScale.invert(y))));

      setRoastPoints(prev => {
        const newPoints = [...prev];
        newPoints[draggingIndex] = { time, temperature };
        return newPoints.sort((a, b) => a.time - b.time);
      });
    });

    svg.on('mouseup', () => {
      setDraggingIndex(null);
      points.attr('r', 6);
    });

    svg.on('mouseleave', () => {
      setDraggingIndex(null);
      points.attr('r', 6);
    });
  }, [roastPoints, draggingIndex, xScale, yScale, innerWidth, innerHeight]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const handleAddFlavor = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const flavor = flavorInput.trim().replace(/,/g, '');
      if (flavor && !flavorNotes.includes(flavor)) {
        setFlavorNotes([...flavorNotes, flavor]);
      }
      setFlavorInput('');
    }
  };

  const handleRemoveFlavor = (flavor: string) => {
    setFlavorNotes(flavorNotes.filter(f => f !== flavor));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!origin || !variety || !processingMethod || !roastDate) {
      alert('请填写所有必填字段');
      return;
    }

    try {
      setSubmitting(true);
      const batch = await api.post('/batch', {
        origin,
        variety,
        processingMethod,
        roastProfile: roastPoints,
        greenScore,
        flavorNotes,
        roastDate,
        flavorProfile,
      });
      navigate(`/batch/${batch.id}`);
    } catch (err: any) {
      alert(err.message || '创建批次失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFlavorChange = (key: keyof FlavorProfile, value: number) => {
    setFlavorProfile(prev => ({ ...prev, [key]: value }));
  };

  const flavorLabels: { key: keyof FlavorProfile; label: string }[] = [
    { key: 'acidity', label: '酸度' },
    { key: 'sweetness', label: '甜度' },
    { key: 'bitterness', label: '苦度' },
    { key: 'body', label: '醇厚度' },
    { key: 'aftertaste', label: '余韵' },
  ];

  return (
    <div className="add-batch-page">
      <Navbar />

      <div className="form-content">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回列表
        </button>

        <h1 className="form-title">新增烘焙批次</h1>

        <form className="batch-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="section-title">基本信息</h2>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">产地 *</label>
                <select
                  className="form-select"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  required
                >
                  <option value="">请选择产地</option>
                  {ORIGINS.map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">品种 *</label>
                <select
                  className="form-select"
                  value={variety}
                  onChange={e => setVariety(e.target.value)}
                  required
                >
                  <option value="">请选择品种</option>
                  {VARIETIES.map(v => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">处理法 *</label>
                <select
                  className="form-select"
                  value={processingMethod}
                  onChange={e => setProcessingMethod(e.target.value)}
                  required
                >
                  <option value="">请选择处理法</option>
                  {PROCESSING_METHODS.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">烘焙日期 *</label>
                <input
                  type="date"
                  className="form-input"
                  value={roastDate}
                  onChange={e => setRoastDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                生豆评分: <span className="score-value">{greenScore.toFixed(1)}</span> / 10
              </label>
              <input
                type="range"
                className="form-range"
                min="0"
                max="10"
                step="0.5"
                value={greenScore}
                onChange={e => setGreenScore(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">烘焙曲线</h2>
            <p className="section-hint">
              点击图表添加数据点，拖拽调整位置，双击删除点（最多10个点）
            </p>
            <div className="chart-container">
              <svg ref={svgRef} width={width} height={height} />
            </div>
            <div className="points-count">
              当前数据点: {roastPoints.length} / 10
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">风味评价</h2>

            <div className="flavor-ratings">
              {flavorLabels.map(({ key, label }) => (
                <div key={key} className="flavor-rating-item">
                  <label className="flavor-label">{label}</label>
                  <div className="flavor-slider">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={flavorProfile[key]}
                      onChange={e => handleFlavorChange(key, parseFloat(e.target.value))}
                    />
                    <span className="flavor-value">{flavorProfile[key].toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">风味笔记</h2>
            <p className="section-hint">输入风味描述，按回车或逗号添加标签</p>

            <div className="flavor-input-wrapper">
              <input
                type="text"
                className="form-input flavor-input"
                value={flavorInput}
                onChange={e => setFlavorInput(e.target.value)}
                onKeyDown={handleAddFlavor}
                placeholder="输入风味描述..."
              />
            </div>

            {flavorNotes.length > 0 && (
              <div className="flavor-tags-preview">
                {flavorNotes.map((flavor, index) => (
                  <span key={flavor} className="flavor-tag-removable" style={{ animationDelay: `${index * 0.05}s` }}>
                    {flavor}
                    <button
                      type="button"
                      className="remove-tag-btn"
                      onClick={() => handleRemoveFlavor(flavor)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/')}
              disabled={submitting}
            >
              取消
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? '创建中...' : '创建批次'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBatch;
