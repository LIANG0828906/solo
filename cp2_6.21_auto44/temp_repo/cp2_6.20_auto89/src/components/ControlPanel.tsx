import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { scaleLinear, zoom as d3zoom, zoomIdentity, ZoomBehavior, D3ZoomEvent } from 'd3';
import { useMoleculeStore, PRESET_MOLECULES } from '../store/useMoleculeStore';
import { ELEMENT_INFO, ElementType, BondOrder, ELEMENT_INFO as EI } from '../modules/MoleculeEngine';

const ELEMENTS: ElementType[] = ['C', 'N', 'O', 'H', 'S', 'P', 'Cl', 'Br', 'I'];
const BOND_ORDERS: { value: BondOrder; label: string; count: number }[] = [
  { value: 1, label: '单键', count: 1 },
  { value: 2, label: '双键', count: 2 },
  { value: 3, label: '三键', count: 3 },
];

interface ChartDataPoint {
  x: number;
  y: number;
  label?: string;
}

const EnergyChart: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const reactionResult = useMoleculeStore((s) => s.reactionResult);
  const animationProgress = useMoleculeStore((s) => s.animationProgress);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const d3svg = d3.select(svg);
    d3svg.selectAll('*').remove();

    const width = 248;
    const height = 200;
    const margin = { top: 20, right: 18, bottom: 44, left: 52 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const rootG = d3svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
    const chartG = rootG.append('g').attr('clip-path', 'url(#chart-clip)');

    d3svg.append('defs')
      .append('clipPath')
      .attr('id', 'chart-clip')
      .append('rect')
      .attr('width', innerW)
      .attr('height', innerH);

    if (!reactionResult || reactionResult.energyProfile.length === 0) {
      rootG.append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6e7681')
        .style('font-size', '11px')
        .style('font-family', "'JetBrains Mono', monospace")
        .text('暂无反应数据');
      rootG.append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH / 2 + 18)
        .attr('text-anchor', 'middle')
        .attr('fill', '#4a4a4a')
        .style('font-size', '9px')
        .style('font-family', "'JetBrains Mono', monospace")
        .text('选择反应物并点击"模拟反应"');
      return;
    }

    const data: ChartDataPoint[] = reactionResult.energyProfile.map((p) => ({
      x: p.step,
      y: p.energy,
      label: p.type === 'normal' ? undefined : p.type,
    }));
    const xMin = d3.min(data, (d) => d.x) ?? 0;
    const xMax = d3.max(data, (d) => d.x) ?? 1;
    const yMin = d3.min(data, (d) => d.y) ?? 0;
    const yMax = d3.max(data, (d) => d.y) ?? 1;
    const yPad = (yMax - yMin) * 0.2;
    const xPad = (xMax - xMin) * 0.05;

    const baseXScale = scaleLinear().domain([xMin - xPad, xMax + xPad]).range([0, innerW]);
    const baseYScale = scaleLinear().domain([yMin - yPad, yMax + yPad]).range([innerH, 0]);

    let xScale = baseXScale.copy();
    let yScale = baseYScale.copy();

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

    const gridG = chartG.append('g').attr('class', 'grid');
    const hGridG = gridG.append('g').attr('class', 'h-grid');
    const vGridG = gridG.append('g').attr('class', 'v-grid');

    const drawGrids = () => {
      const yTicks = yScale.ticks(5);
      hGridG.selectAll('line').remove();
      hGridG.selectAll('line')
        .data(yTicks)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', (d) => yScale(d))
        .attr('y2', (d) => yScale(d))
        .attr('stroke', 'rgba(200,200,200,0.12)')
        .attr('stroke-dasharray', '3 4');

      const xTicks = xScale.ticks(6);
      vGridG.selectAll('line').remove();
      vGridG.selectAll('line')
        .data(xTicks)
        .enter()
        .append('line')
        .attr('x1', (d) => xScale(d))
        .attr('x2', (d) => xScale(d))
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', 'rgba(200,200,200,0.1)')
        .attr('stroke-dasharray', '3 4');
    };
    drawGrids();

    const xAxisG = rootG.append('g').attr('class', 'x-axis').attr('transform', `translate(0, ${innerH})`);
    const yAxisG = rootG.append('g').attr('class', 'y-axis');

    const drawAxes = () => {
      xAxisG.selectAll('*').remove();
      xAxisG
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('stroke', 'rgba(255,255,255,0.25)');
      const xTicks = xScale.ticks(5);
      xAxisG
        .selectAll('.x-tick')
        .data(xTicks)
        .enter()
        .append('text')
        .attr('class', 'x-tick')
        .attr('x', (d) => xScale(d))
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#8b949e')
        .style('font-size', '9px')
        .style('font-family', "'JetBrains Mono', monospace")
        .text((d) => d.toString());

      xAxisG
        .append('text')
        .attr('x', innerW / 2)
        .attr('y', 34)
        .attr('text-anchor', 'middle')
        .attr('fill', '#00ffff')
        .style('font-size', '10px')
        .style('font-family', "'JetBrains Mono', monospace")
        .style('letter-spacing', '1px')
        .text('反应坐标');

      yAxisG.selectAll('*').remove();
      yAxisG
        .append('line')
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', 'rgba(255,255,255,0.25)');
      const yTicks = yScale.ticks(5);
      yAxisG
        .selectAll('.y-tick')
        .data(yTicks)
        .enter()
        .append('text')
        .attr('class', 'y-tick')
        .attr('x', -6)
        .attr('y', (d) => yScale(d))
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#8b949e')
        .style('font-size', '9px')
        .style('font-family', "'JetBrains Mono', monospace")
        .text((d) => Math.round(d).toString());

      yAxisG
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .attr('fill', '#39ff14')
        .style('font-size', '10px')
        .style('font-family', "'JetBrains Mono', monospace")
        .style('letter-spacing', '1px')
        .text('能量 (kcal/mol)');
    };
    drawAxes();

    const lineGen = d3
      .line<ChartDataPoint>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveCardinal.tension(0.5));

    const pathG = chartG.append('g').attr('class', 'paths');
    const pathData = lineGen(data) || '';
    const pathEl = pathG
      .append('path')
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
    const labelNames: Record<string, string> = {
      reactant: '反应物',
      transition: '过渡态',
      intermediate: '中间体',
      product: '产物',
    };

    const dotsG = chartG.append('g').attr('class', 'dots');
    data.forEach((d) => {
      if (d.label && d.label !== 'normal') {
        const cx = xScale(d.x);
        const cy = yScale(d.y);
        dotsG
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 4.5)
          .attr('fill', labelColors[d.label] || '#fff')
          .attr('stroke', '#0d1117')
          .attr('stroke-width', 1.5);
        dotsG
          .append('text')
          .attr('x', cx)
          .attr('y', cy - 8)
          .attr('text-anchor', 'middle')
          .attr('fill', labelColors[d.label] || '#fff')
          .style('font-size', '8px')
          .style('font-family', "'JetBrains Mono', monospace")
          .style('font-weight', '600')
          .text(labelNames[d.label] || d.label);
      }
    });

    const progG = chartG.append('g').attr('class', 'progress');
    const progLine = progG
      .append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', '#00ffff')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .attr('opacity', 0.85);

    const updateProgress = () => {
      const x = xScale(xMin + (xMax - xMin) * animationProgress);
      progLine.attr('x1', x).attr('x2', x);
    };
    updateProgress();

    const zoom = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .translateExtent([
        [-innerW * 0.5, -innerH * 0.5],
        [innerW * 1.5, innerH * 1.5],
      ])
      .extent([
        [0, 0],
        [innerW, innerH],
      ])
      .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        const newXScale = event.transform.rescaleX(baseXScale);
        const newYScale = event.transform.rescaleY(baseYScale);
        xScale = newXScale;
        yScale = newYScale;
        drawGrids();
        drawAxes();
        pathEl.attr('d', lineGen.x((d) => xScale(d.x)).y((d) => yScale(d.y))(data) || '');
        dotsG.selectAll('circle').remove();
        dotsG.selectAll('text').remove();
        data.forEach((d) => {
          if (d.label && d.label !== 'normal') {
            const cx = xScale(d.x);
            const cy = yScale(d.y);
            dotsG
              .append('circle')
              .attr('cx', cx)
              .attr('cy', cy)
              .attr('r', 4.5)
              .attr('fill', labelColors[d.label] || '#fff')
              .attr('stroke', '#0d1117')
              .attr('stroke-width', 1.5);
            dotsG
              .append('text')
              .attr('x', cx)
              .attr('y', cy - 8)
              .attr('text-anchor', 'middle')
              .attr('fill', labelColors[d.label] || '#fff')
              .style('font-size', '8px')
              .style('font-family', "'JetBrains Mono', monospace")
              .style('font-weight', '600')
              .text(labelNames[d.label] || d.label);
          }
        });
        updateProgress();
      });

    zoomRef.current = zoom;
    d3svg.call(zoom);

    d3svg.on('dblclick.zoom', () => {
      d3svg.transition().duration(300).call(zoom.transform, zoomIdentity);
    });
  }, [reactionResult]);

  useEffect(() => {
    if (!svgRef.current || !reactionResult) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('.progress line').attr('x1', () => {
      const data = reactionResult.energyProfile;
      if (data.length === 0) return 0;
      const xMin = 0;
      const xMax = data.length - 1;
      const margin = { left: 52, right: 18 };
      const innerW = 248 - margin.left - margin.right;
      const xScale = scaleLinear()
        .domain([xMin - (xMax - xMin) * 0.05, xMax + (xMax - xMin) * 0.05])
        .range([0, innerW]);
      return xScale(xMin + (xMax - xMin) * animationProgress);
    }).attr('x2', function() { return d3.select(this).attr('x1'); });
  }, [animationProgress, reactionResult]);

  return (
    <div>
      <svg
        ref={svgRef}
        width="100%"
        height="200"
        className="energy-chart"
        viewBox="0 0 248 200"
        preserveAspectRatio="xMidYMid meet"
        style={{ cursor: 'grab' }}
      />
      <div style={{ marginTop: 6, fontSize: 10, color: '#6e7681', textAlign: 'center' }}>
        <span style={{ color: '#00ffff' }}>⟲</span> 滚轮缩放 · 拖拽平移 · 双击重置
      </div>
    </div>
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
