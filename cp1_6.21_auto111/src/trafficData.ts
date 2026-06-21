export interface Intersection {
  id: number;
  name: string;
  x: number;
  z: number;
  baseFlow: number;
  history: number[];
}

const intersectionNames = [
  '人民广场', '南京路', '淮海路', '静安寺', '徐家汇',
  '陆家嘴', '外滩', '豫园', '中山公园', '虹桥',
  '五角场', '四川北路', '大宁', '张江', '金桥',
  '莘庄', '七宝', '松江新城', '嘉定新城', '青浦',
  '奉贤', '临港', '迪士尼', '世博', '前滩',
  '徐汇滨江', '北外滩', '东外滩', '真如', '万里'
];

function generateIntersections(): Intersection[] {
  const intersections: Intersection[] = [];
  const gridSize = 6;
  const spacing = 2.5;
  const offset = (gridSize - 1) * spacing / 2;

  let idx = 0;
  for (let row = 0; row < gridSize && idx < 30; row++) {
    for (let col = 0; col < gridSize && idx < 30; col++) {
      const jitterX = (Math.random() - 0.5) * 1.2;
      const jitterZ = (Math.random() - 0.5) * 1.2;
      intersections.push({
        id: idx,
        name: intersectionNames[idx],
        x: col * spacing - offset + jitterX,
        z: row * spacing - offset + jitterZ,
        baseFlow: 30 + Math.random() * 40,
        history: []
      });
      idx++;
    }
  }

  return intersections;
}

export const intersections: Intersection[] = generateIntersections();

export function getFlowAtTime(intersection: Intersection, hour: number): number {
  const morningPeak = Math.exp(-Math.pow(hour - 8.5, 2) / 2) * 50;
  const eveningPeak = Math.exp(-Math.pow(hour - 18, 2) / 2.5) * 55;
  const midday = Math.exp(-Math.pow(hour - 12.5, 2) / 6) * 15;
  const nightFactor = hour < 6 ? 0.3 + (hour / 6) * 0.7 : (hour > 22 ? 0.3 + ((24 - hour) / 2) * 0.7 : 1);

  let flow = intersection.baseFlow + morningPeak + eveningPeak + midday;
  flow *= nightFactor;
  flow += (Math.sin(hour * 3.7 + intersection.id * 0.5) + Math.cos(hour * 2.3 + intersection.id * 0.3)) * 5;

  return Math.max(0, Math.min(100, flow));
}

export function getHistoryFlows(intersection: Intersection, currentHour: number, count: number = 24): number[] {
  const history: number[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const h = currentHour - i * 0.5;
    const hour = h < 0 ? h + 24 : h;
    history.push(getFlowAtTime(intersection, hour));
  }
  return history;
}

export function predictTrend(intersection: Intersection, currentHour: number): '上升' | '下降' | '平稳' {
  const current = getFlowAtTime(intersection, currentHour);
  const future = getFlowAtTime(intersection, currentHour + 0.5);
  const diff = future - current;

  if (diff > 3) return '上升';
  if (diff < -3) return '下降';
  return '平稳';
}

export function getAverageFlow(hour: number): number {
  const total = intersections.reduce((sum, int) => sum + getFlowAtTime(int, hour), 0);
  return total / intersections.length;
}

export function getMaxFlowIntersection(hour: number): { name: string; flow: number } {
  let max = -1;
  let name = '';
  for (const int of intersections) {
    const flow = getFlowAtTime(int, hour);
    if (flow > max) {
      max = flow;
      name = int.name;
    }
  }
  return { name, flow: max };
}

export function getHighFlowIntersections(hour: number, threshold: number = 60): Intersection[] {
  return intersections.filter(int => getFlowAtTime(int, hour) > threshold);
}

export default {
  intersections,
  getFlowAtTime,
  getHistoryFlows,
  predictTrend,
  getAverageFlow,
  getMaxFlowIntersection,
  getHighFlowIntersections
};
