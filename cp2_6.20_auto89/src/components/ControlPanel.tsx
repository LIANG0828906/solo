import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { scaleLinear } from 'd3-scale';
import { useMoleculeStore, PRESET_MOLECULES } from '../store/useMoleculeStore';
import { ELEMENT_INFO, ElementType, BondOrder } from '../modules/MoleculeEngine';

const ELEMENTS: ElementType[] = ['C', 'N', 'O', 'H', 'S', 'P', 'Cl', 'Br', 'I'];
const BOND_ORDERS: { value: BondOrder; label: string; count: number }[] = [
  { value: 1, label: '单键', count: 1 },
  { value: 2, label: '双键', count: 2 },
  { value: 3, label: '三键', count: 3 },
];

const EnergyChart: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const reactionResult = useMoleculeStore((s) => s.reactionResult);
  const animationProgress = useMoleculeStore((s) => s.animationProgress);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const d3svg = d3.select(svg);
    d3svg.selectAll('*').remove();

    const width = 248;
    const height = 180;
    const margin = { top: 20, right: 15, bottom: 30, left: 40 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = d3svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    if (!reactionResult || reactionResult.path.length === 0) {
      g.append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6e7681')
        .style('font-size', '11px')
        .style('font-family', "'JetBrains Mono', monospace")
        .text('暂无反应数据');
      return;
    }

    const data = reactionResult.path.map((p) => ({ x: p.coordinate, y: p.energy, label: p.label }));
    const xMin = d3.min(data, (d) => d.x) ?? 0;
    const xMax = d3.max(data, (d) => d.x) ?? 1;
    const yMin = d3.min(data, (d) => d.y) ?? 0;
    const yMax = d3.max(data, (d) => d.y) ?? 1;
    const yPad = (yMax - yMin) * 0.15;

    const xScale = scaleLinear().domain([xMin, xMax]).range([0, innerW]);
    const yScale = scaleLinear().domain([yMin - yPad, yMax + yPad]).range([innerH, 0]);

    for (let i = 0; i <= 4; i++) {
      const y = (innerH / 4) * i;
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', 'rgba(255,255,255,0.08)')
        .attr('stroke-dasharray', '2 3');
    }

    const xAxis = g.append('g').attr('transform', `translate(0, ${innerH})`);
    xAxis
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('stroke', 'rgba(255,255,255,0.2)');

    const yAxis = g.append('g');
    yAxis
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', 'rgba(255,255,255,0.2)');

    xAxis
      .selectAll('.x-label')
      .data([0, 0.5, 1])
      .enter()
      .append('text')
      .attr('x', (d) => xScale(d))
      .attr('y', 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8b949e')
      .style('font-size', '9px')
      .style('font-family', "'JetBrains Mono', monospace")
      .text((d) => d.toFixed(1));

    yAxis
      .selectAll('.y-label')
      .data([0, 1].map((i) => (i === 0 ? yMin : yMax)))
      .enter()
      .append('text')
      .attr('x', -6)
      .attr('y', (d) => yScale(d))
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#8b949e')
      .style('font-size', '9px')
      .style('font-family', "'JetBrains Mono', monospace")
      .text((d) => Math.round(d));

    const lineGen = d3
      .line<{ x: number; y: number }>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveCardinal.tension(0.5));

    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 1])
      .range(['#3b9dff', '#ff3b6b']);

    const pathData = lineGen(data) || '';

    const defs = d3svg.append('defs');
    const grad = defs
      .append('linearGradient')
      .attr('id', 'energy-grad')
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#3b9dff');
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#ff3b6b');

    g.append('path')
      .attr('d', pathData)
      .attr('fill', 'none')
      .attr('stroke', 'url(#energy-grad)')
      .attr('stroke-width', 2.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round');

    const labelColors: Record<string, string> = {
      reactant: '#39ff14',
      transition: '#ffd93b',
      intermediate: '#bf00ff',
      product: '#ff3b6b',
    };

    data.forEach((d) => {
      if (d.label) {
        g.append('circle')
          .attr('cx', xScale(d.x))
          .attr('cy', yScale(d.y))
          .attr('r', 4)
          .attr('fill', labelColors[d.label])
          .attr('stroke', '#0d1117')
          .attr('stroke-width', 1.5);
      }
    });

    const progX = xScale(xMin + (xMax - xMin) * animationProgress);
    g.append('line')
      .attr('x1', progX)
      .attr('x2', progX)
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', '#00ffff')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .attr('opacity', 0.7);

    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8b949e')
      .style('font-size', '9px')
      .style('font-family', "'JetBrains Mono', monospace")
      .text('能量 (kJ/mol)  vs  反应坐标');
  }, [reactionResult, animationProgress]);

  return (
    <svg ref={svgRef} width="100%" height="180" className="energy-chart" viewBox="0 0 248 180" preserveAspectRatio="xMidYMid meet" />
  );
};

export const ControlPanel: React.FC = () => {
  const editMode = useMoleculeStore((s) => s.editMode);
  const currentElement = useMoleculeStore((s) => s.currentElement);
  const currentBondOrder = useMoleculeStore((s) => s.currentBondOrder);
  const reactantAId = useMoleculeStore((s) => s.reactantAId);
  const reactantBId = useMoleculeStore((s) => s.reactantBId);
  const reactionResult = useMoleculeStore((s) => s.reactionResult);

  const setEditMode = useMoleculeStore((s) => s.setEditMode);
  const setCurrentElement = useMoleculeStore((s) => s.setCurrentElement);
  const setCurrentBondOrder = useMoleculeStore((s) => s.setCurrentBondOrder);
  const loadPreset = useMoleculeStore((s) => s.loadPreset);
  const loadPresetAsReactant = useMoleculeStore((s) => s.loadPresetAsReactant);
  const simulateReaction = useMoleculeStore((s) => s.simulateReaction);
  const showToast = useMoleculeStore((s) => s.showToast);

  return (
    <div className="left-panel">
      <div className="panel-section">
        <div className="panel-title">原子工具栏</div>
        <div className="atom-toolbar">
          {ELEMENTS.map((el) => (
            <button
              key={el}
              className={`atom-btn ${currentElement === el && editMode === 'atom' ? 'active' : ''}`}
              onClick={() => {
                setCurrentElement(el);
                showToast(`已选择 ${ELEMENT_INFO[el].name} (${el})，点击场景添加原子`);
              }}
              title={`${ELEMENT_INFO[el].name} (${el})`}
            >
              <span className="atom-dot" style={{ background: ELEMENT_INFO[el].color }} />
              <span>{el}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">化学键</div>
        <div className="bond-selector">
          {BOND_ORDERS.map((b) => (
            <button
              key={b.value}
              className={`bond-btn ${currentBondOrder === b.value && editMode === 'bond' ? 'active' : ''}`}
              onClick={() => {
                setCurrentBondOrder(b.value);
                showToast(`已选择 ${b.label}，依次点击两个原子创建`);
              }}
            >
              <span className="bond-lines">
                {Array.from({ length: b.count }).map((_, i) => (
                  <span key={i} className="bond-line" />
                ))}
              </span>
              <span>{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">预设分子</div>
        <div className="form-group">
          <label className="form-label">快速加载</label>
          <select
            className="form-select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                loadPreset(e.target.value);
              }
            }}
          >
            <option value="">-- 选择预设 --</option>
            {PRESET_MOLECULES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">反应模拟</div>
        <div className="form-group">
          <label className="form-label">反应物 A</label>
          <select
            className="form-select"
            value={reactantAId}
            onChange={(e) => loadPresetAsReactant(e.target.value, 'A')}
          >
            {PRESET_MOLECULES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">反应物 B</label>
          <select
            className="form-select"
            value={reactantBId}
            onChange={(e) => loadPresetAsReactant(e.target.value, 'B')}
          >
            {PRESET_MOLECULES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button className="primary-btn" onClick={simulateReaction}>
          ⚗ 模拟反应
        </button>
      </div>

      <div className="panel-section">
        <div className="panel-title">能量曲线</div>
        <EnergyChart />
        {reactionResult && (
          <div style={{ marginTop: 8, fontSize: 10, color: '#8b949e', textAlign: 'center' }}>
            <span style={{ color: '#39ff14' }}>●</span> 反应物{' '}
            <span style={{ color: '#ffd93b' }}>●</span> 过渡态{' '}
            <span style={{ color: '#bf00ff' }}>●</span> 中间体{' '}
            <span style={{ color: '#ff3b6b' }}>●</span> 产物
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
