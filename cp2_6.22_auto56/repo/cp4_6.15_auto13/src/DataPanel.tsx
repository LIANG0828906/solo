import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Search, PieChart, BarChart3, List, ChevronRight } from 'lucide-react';
import { useStore } from './store';
import { StorageUnit, StorageType, STORAGE_TYPE_LABELS, STORAGE_TYPE_COLORS } from './types';
import { calculateUtilization, calculateUnitVolume } from './utils';

const DataPanel: React.FC = () => {
  const { units, searchQuery, setSearchQuery, highlightedUnitId, setHighlightedUnitId } = useStore();
  const pieRef = useRef<SVGSVGElement | null>(null);
  const barRef = useRef<SVGSVGElement | null>(null);

  const pieData = useMemo(() => {
    const volumes: Record<StorageType, number> = { cabinet: 0, drawer: 0, box: 0 };
    units.forEach((unit) => {
      volumes[unit.type] += calculateUnitVolume(unit);
    });
    return Object.entries(volumes).map(([type, value]) => ({
      type: type as StorageType,
      value,
    }));
  }, [units]);

  const barData = useMemo(() => {
    const buckets = [
      { label: '0-40%', count: 0, color: '#4CAF50' },
      { label: '41-70%', count: 0, color: '#FFC107' },
      { label: '71-100%', count: 0, color: '#F44336' },
    ];
    units.forEach((unit) => {
      const util = calculateUtilization(unit);
      if (util <= 40) buckets[0].count++;
      else if (util <= 70) buckets[1].count++;
      else buckets[2].count++;
    });
    return buckets;
  }, [units]);

  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return units;
    const q = searchQuery.toLowerCase();
    return units.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.items.some((item) => item.name.toLowerCase().includes(q))
    );
  }, [units, searchQuery]);

  const matchesSearch = (unit: StorageUnit) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      unit.name.toLowerCase().includes(q) ||
      unit.items.some((item) => item.name.toLowerCase().includes(q))
    );
  };

  useEffect(() => {
    if (!pieRef.current) return;
    const svg = d3.select(pieRef.current);
    svg.selectAll('*').remove();

    const width = 280;
    const height = 240;
    const radius = Math.min(width, height) / 2 - 20;
    const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie<{ type: StorageType; value: number }>().value((d) => d.value);
    const arc = d3.arc<d3.PieArcDatum<{ type: StorageType; value: number }>>().innerRadius(0).outerRadius(radius);

    const total = pieData.reduce((sum, d) => sum + d.value, 0);

    const arcs = g.selectAll('path').data(pie(pieData)).enter().append('g');

    arcs
      .append('path')
      .attr('fill', (d) => STORAGE_TYPE_COLORS[d.data.type])
      .attr('d', arc)
      .each(function (d) {
        (this as unknown as { _current: d3.PieArcDatum<{ type: StorageType; value: number }> })._current = d;
      })
      .transition()
      .duration(200)
      .attrTween('d', function (d) {
        const interpolate = d3.interpolate((this as unknown as { _current: d3.PieArcDatum<{ type: StorageType; value: number }> })._current, d);
        return (t) => arc(interpolate(t)) || '';
      });

    arcs
      .append('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#fff')
      .attr('font-weight', 'bold')
      .text((d) => (total > 0 ? `${((d.data.value / total) * 100).toFixed(0)}%` : ''));
  }, [pieData]);

  useEffect(() => {
    if (!barRef.current) return;
    const svg = d3.select(barRef.current);
    svg.selectAll('*').remove();

    const width = 320;
    const height = 240;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand<string>().domain(barData.map((d) => d.label)).range([0, innerW]).padding(0.3);
    const yMax = Math.max(d3.max(barData, (d) => d.count) || 1, 1);
    const y = d3.scaleLinear<number, number>().domain([0, yMax]).nice().range([innerH, 0]);

    g.append('g')
      .attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('font-size', '11px');

    g.append('g')
      .call(d3.axisLeft(y).ticks(Math.min(yMax, 5)).tickFormat(d3.format('d')))
      .selectAll('text')
      .attr('font-size', '11px');

    g.selectAll('.bar')
      .data(barData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.label) || 0)
      .attr('width', x.bandwidth())
      .attr('y', innerH)
      .attr('height', 0)
      .attr('fill', (d) => d.color)
      .attr('rx', 4)
      .transition()
      .duration(200)
      .attr('y', (d) => y(d.count))
      .attr('height', (d) => innerH - y(d.count));
  }, [barData]);

  return (
    <div className="p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索储物单元或物品名称..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-800">空间分布</h3>
          </div>
          <div className="flex flex-col items-center">
            <svg ref={pieRef} width={280} height={240} />
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {pieData.map((d) => (
                <div key={d.type} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: STORAGE_TYPE_COLORS[d.type] }} />
                  <span className="text-xs text-gray-600">{STORAGE_TYPE_LABELS[d.type]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-800">利用率分布</h3>
          </div>
          <div className="flex justify-center">
            <svg ref={barRef} width={320} height={240} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <List className="w-5 h-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-800">储物单元</h3>
          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
            {filteredUnits.length} / {units.length}
          </span>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {(searchQuery.trim() ? filteredUnits : units).map((unit) => {
            const util = calculateUtilization(unit);
            const isMatch = matchesSearch(unit);
            const isHighlighted = highlightedUnitId === unit.id;
            return (
              <button
                key={unit.id}
                onClick={() => setHighlightedUnitId(isHighlighted ? null : unit.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${
                  isHighlighted
                    ? 'border-blue-500 bg-blue-50'
                    : isMatch
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: unit.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-800 text-sm truncate">{unit.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {STORAGE_TYPE_LABELS[unit.type]} · {unit.items.length} 件物品
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: util > 70 ? '#F44336' : util > 40 ? '#FFC107' : '#4CAF50' }}>
                      {util.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-400">利用率</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isHighlighted ? 'text-blue-500 rotate-90' : 'text-gray-300'}`} />
                </div>
              </button>
            );
          })}
          {searchQuery.trim() && filteredUnits.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">没有找到匹配的储物单元</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataPanel;
