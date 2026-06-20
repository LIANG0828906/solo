import * as d3 from 'd3';
import { dataManager, MetricType, WeatherDataPoint, CityInfo } from './dataManager';

export interface ChartPoint {
  cityIndex: number;
  cityName: string;
  temperature: number;
  humidity: number;
  precipitation: number;
}

export class AnalysisPanel {
  private containerId: string = '#chart-container';
  private svg: d3.Selection<SVGGElement, unknown, HTMLElement, any> | null = null;
  private width: number = 0;
  private height: number = 0;
  private margin = { top: 10, right: 15, bottom: 30, left: 40 };
  private xScale: d3.ScaleBand<string> | null = null;
  private yScaleTemp: d3.ScaleLinear<number, number> | null = null;
  private yScaleHum: d3.ScaleLinear<number, number> | null = null;
  private yScalePrec: d3.ScaleLinear<number, number> | null = null;
  private activeCityIndices: Set<number> = new Set();
  private currentDayIndex: number = 0;
  private onCityClickCallback: ((cityIndex: number) => void) | null = null;
  private cities: CityInfo[];
  private chartData: ChartPoint[] = [];

  constructor() {
    this.cities = dataManager.getCities();
    this.cities.forEach((c) => this.activeCityIndices.add(c.index));
    this.init();
  }

  private init(): void {
    const container = document.querySelector(this.containerId);
    if (!container) return;

    const rect = container.getBoundingClientRect();
    this.width = rect.width - this.margin.left - this.margin.right;
    this.height = rect.height - this.margin.top - this.margin.bottom;

    this.svg = d3
      .select(this.containerId)
      .append('svg')
      .attr('width', rect.width)
      .attr('height', rect.height)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    this.setupScales();
    this.drawAxes();
    this.updateChart();

    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    const container = document.querySelector(this.containerId);
    if (!container || !this.svg) return;

    const rect = container.getBoundingClientRect();
    const parentSvg = this.svg.node()?.parentNode as SVGSVGElement | null;
    if (!parentSvg) return;

    d3.select(parentSvg).attr('width', rect.width).attr('height', rect.height);

    this.width = rect.width - this.margin.left - this.margin.right;
    this.height = rect.height - this.margin.top - this.margin.bottom;

    this.setupScales();
    this.drawAxes();
    this.updateChart();
  }

  private setupScales(): void {
    const activeCities = this.cities.filter((c) => this.activeCityIndices.has(c.index));
    const cityNames = activeCities.map((c) => c.name);

    this.xScale = d3
      .scaleBand()
      .domain(cityNames)
      .range([0, this.width])
      .padding(0.3);

    const tempRange = dataManager.getMetricRange('temperature');
    this.yScaleTemp = d3.scaleLinear().domain([tempRange.min, tempRange.max]).range([this.height, 0]).nice();

    const humRange = dataManager.getMetricRange('humidity');
    this.yScaleHum = d3.scaleLinear().domain([humRange.min, humRange.max]).range([this.height, 0]).nice();

    const precRange = dataManager.getMetricRange('precipitation');
    this.yScalePrec = d3.scaleLinear().domain([precRange.min, precRange.max]).range([this.height, 0]).nice();
  }

  private drawAxes(): void {
    if (!this.svg || !this.xScale) return;

    this.svg.selectAll('.axis').remove();
    this.svg.selectAll('.grid').remove();

    const xAxis = d3.axisBottom(this.xScale);
    this.svg
      .append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0,${this.height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('transform', 'rotate(-20)')
      .style('text-anchor', 'end');

    this.svg.selectAll('.axis-x path, .axis-x line').attr('stroke', '#475569').attr('stroke-opacity', 0.6);

    const yAxis = d3.axisLeft(this.yScaleTemp!).ticks(5);
    this.svg
      .append('g')
      .attr('class', 'axis axis-y')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px');

    this.svg.selectAll('.axis-y path, .axis-y line').attr('stroke', '#475569').attr('stroke-opacity', 0.6);

    this.svg
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(this.yScaleTemp!)
          .ticks(5)
          .tickSize(-this.width)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-dasharray', '2,2');

    this.svg.select('.grid path').remove();
  }

  private prepareData(dayIndex: number): ChartPoint[] {
    const rawData = dataManager.query({
      dayIndex,
      cityIndices: Array.from(this.activeCityIndices),
    });

    const activeCities = this.cities.filter((c) => this.activeCityIndices.has(c.index));
    const dataMap = new Map<number, WeatherDataPoint>();
    rawData.forEach((d) => dataMap.set(d.cityIndex, d));

    return activeCities.map((city) => {
      const d = dataMap.get(city.index);
      return {
        cityIndex: city.index,
        cityName: city.name,
        temperature: d?.temperature ?? 0,
        humidity: d?.humidity ?? 0,
        precipitation: d?.precipitation ?? 0,
      };
    });
  }

  public updateChart(): void {
    if (!this.svg || !this.xScale || !this.yScaleTemp || !this.yScaleHum || !this.yScalePrec) return;

    this.chartData = this.prepareData(this.currentDayIndex);
    const data = this.chartData;

    if (data.length === 0) {
      this.svg.selectAll('.chart-line').remove();
      this.svg.selectAll('.chart-dot').remove();
      return;
    }

    const colorTemp = '#ef4444';
    const colorHum = '#3b82f6';
    const colorPrec = '#22c55e';

    const lineTemp = d3
      .line<ChartPoint>()
      .x((d) => (this.xScale ? (this.xScale(d.cityName) ?? 0) + this.xScale.bandwidth() / 2 : 0))
      .y((d) => (this.yScaleTemp ? this.yScaleTemp(d.temperature) : 0))
      .curve(d3.curveMonotoneX);

    const lineHum = d3
      .line<ChartPoint>()
      .x((d) => (this.xScale ? (this.xScale(d.cityName) ?? 0) + this.xScale.bandwidth() / 2 : 0))
      .y((d) => (this.yScaleHum ? this.yScaleHum(d.humidity) : 0))
      .curve(d3.curveMonotoneX);

    const linePrec = d3
      .line<ChartPoint>()
      .x((d) => (this.xScale ? (this.xScale(d.cityName) ?? 0) + this.xScale.bandwidth() / 2 : 0))
      .y((d) => (this.yScalePrec ? this.yScalePrec(d.precipitation) : 0))
      .curve(d3.curveMonotoneX);

    const transition = d3.transition().duration(300).ease(d3.easeCubicInOut);

    const lines = [
      { key: 'temp', color: colorTemp, path: lineTemp(data), width: 2 },
      { key: 'hum', color: colorHum, path: lineHum(data), width: 2 },
      { key: 'prec', color: colorPrec, path: linePrec(data), width: 2 },
    ];

    lines.forEach(({ key, color, path, width }) => {
      const sel = this.svg!.selectAll<SVGPathElement, unknown>(`.chart-line-${key}`);
      if (sel.empty()) {
        this.svg!
          .append('path')
          .attr('class', `chart-line chart-line-${key}`)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', width)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('opacity', 0.9)
          .attr('d', path);
      } else {
        sel.transition(transition as any).attr('d', path);
      }
    });

    const dotTypes = [
      { key: 'temp', color: colorTemp, metric: 'temperature' as MetricType, scale: this.yScaleTemp },
      { key: 'hum', color: colorHum, metric: 'humidity' as MetricType, scale: this.yScaleHum },
      { key: 'prec', color: colorPrec, metric: 'precipitation' as MetricType, scale: this.yScalePrec },
    ];

    dotTypes.forEach(({ key, color, metric, scale }) => {
      const dotSel = this.svg!.selectAll<SVGCircleElement, ChartPoint>(`.chart-dot-${key}`).data(data, (d) => `${d.cityIndex}-${key}`);

      dotSel.exit().transition(transition as any).attr('r', 0).remove();

      const enterSel = dotSel
        .enter()
        .append('circle')
        .attr('class', `chart-dot chart-dot-${key}`)
        .attr('cx', (d) => (this.xScale ? (this.xScale(d.cityName) ?? 0) + this.xScale.bandwidth() / 2 : 0))
        .attr('cy', (d) => scale(d[metric]))
        .attr('r', 0)
        .attr('fill', color)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('r', 7)
            .attr('stroke-width', 2.5);
        })
        .on('mouseleave', function (event, d) {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('r', 4.5)
            .attr('stroke-width', 1.5);
        })
        .on('click', (event, d) => {
          if (this.onCityClickCallback) {
            this.onCityClickCallback(d.cityIndex);
          }
        });

      enterSel
        .merge(dotSel)
        .transition(transition as any)
        .attr('cx', (d) => (this.xScale ? (this.xScale(d.cityName) ?? 0) + this.xScale.bandwidth() / 2 : 0))
        .attr('cy', (d) => scale(d[metric]))
        .attr('r', 4.5);
    });
  }

  public onDateChange(dayIndex: number, _date: string): void {
    this.currentDayIndex = dayIndex;
    this.updateChart();
  }

  public onCityClick(callback: (cityIndex: number) => void): void {
    this.onCityClickCallback = callback;
  }

  public setActiveCities(cityIndices: number[]): void {
    this.activeCityIndices = new Set(cityIndices);
    this.setupScales();
    this.drawAxes();
    this.updateChart();
  }

  public getChartData(): ChartPoint[] {
    return this.chartData;
  }

  public dispose(): void {
    if (this.svg) {
      const parent = this.svg.node()?.parentNode as Element | null;
      if (parent) {
        d3.select(parent as Element).remove();
      }
    }
  }
}
