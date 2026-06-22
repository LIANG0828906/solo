import { GeoPoint, City } from '@/types';
import { cities } from '@/data/cityData';

const haversineDistance = (p1: GeoPoint, p2: GeoPoint): number => {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface GraphNode {
  id: string;
  point: GeoPoint;
  neighbors: { nodeId: string; distance: number }[];
}

const buildCityGraph = (): Map<string, GraphNode> => {
  const graph = new Map<string, GraphNode>();
  
  cities.forEach(city => {
    graph.set(city.id, {
      id: city.id,
      point: { lat: city.lat, lng: city.lng, name: city.name },
      neighbors: []
    });
  });
  
  cities.forEach(city => {
    const node = graph.get(city.id)!;
    const otherCities = cities.filter(c => c.id !== city.id);
    otherCities.sort((a, b) => 
      haversineDistance(
        { lat: city.lat, lng: city.lng },
        { lat: a.lat, lng: a.lng }
      ) - haversineDistance(
        { lat: city.lat, lng: city.lng },
        { lat: b.lat, lng: b.lng }
      )
    );
    const nearestCities = otherCities.slice(0, 5);
    nearestCities.forEach(other => {
      const distance = haversineDistance(
        { lat: city.lat, lng: city.lng },
        { lat: other.lat, lng: other.lng }
      );
      node.neighbors.push({ nodeId: other.id, distance });
    });
  });
  
  return graph;
};

const dijkstra = (
  graph: Map<string, GraphNode>,
  startId: string,
  endId: string
): { path: string[]; distance: number } | null => {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();
  
  graph.forEach((_, id) => {
    distances.set(id, Infinity);
    previous.set(id, null);
    unvisited.add(id);
  });
  
  distances.set(startId, 0);
  
  while (unvisited.size > 0) {
    let minId: string | null = null;
    let minDist = Infinity;
    
    unvisited.forEach(id => {
      const dist = distances.get(id)!;
      if (dist < minDist) {
        minDist = dist;
        minId = id;
      }
    });
    
    if (minId === null || minId === endId) break;
    unvisited.delete(minId);
    
    const currentNode = graph.get(minId)!;
    currentNode.neighbors.forEach(({ nodeId, distance }) => {
      if (unvisited.has(nodeId)) {
        const alt = distances.get(minId!)! + distance;
        if (alt < distances.get(nodeId)!) {
          distances.set(nodeId, alt);
          previous.set(nodeId, minId);
        }
      }
    });
  }
  
  if (distances.get(endId) === Infinity) return null;
  
  const path: string[] = [];
  let current: string | null = endId;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current)!;
  }
  
  return { path, distance: distances.get(endId)! };
};

const generatePathPoints = (citiesInPath: City[]): GeoPoint[] => {
  const points: GeoPoint[] = [];
  
  for (let i = 0; i < citiesInPath.length - 1; i++) {
    const start = citiesInPath[i];
    const end = citiesInPath[i + 1];
    const steps = 20;
    
    points.push({ lat: start.lat, lng: start.lng, name: start.name });
    
    for (let j = 1; j < steps; j++) {
      const t = j / steps;
      const lat = start.lat + (end.lat - start.lat) * t;
      const lng = start.lng + (end.lng - start.lng) * t;
      
      const offset = Math.sin(t * Math.PI) * 0.02;
      const perpLat = (end.lng - start.lng) * offset;
      const perpLng = -(end.lat - start.lat) * offset;
      
      points.push({
        lat: lat + perpLat,
        lng: lng + perpLng
      });
    }
  }
  
  const lastCity = citiesInPath[citiesInPath.length - 1];
  points.push({ lat: lastCity.lat, lng: lastCity.lng, name: lastCity.name });
  
  return points;
};

const findNearestCity = (point: GeoPoint): City => {
  let nearest = cities[0];
  let minDist = Infinity;
  
  cities.forEach(city => {
    const dist = haversineDistance(point, { lat: city.lat, lng: city.lng });
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  });
  
  return nearest;
};

export interface RouteResult {
  path: GeoPoint[];
  distance: number;
  cities: City[];
}

export const calculateRoute = (origin: GeoPoint, destination: GeoPoint): RouteResult => {
  const graph = buildCityGraph();
  
  const startCity = findNearestCity(origin);
  const endCity = findNearestCity(destination);
  
  const result = dijkstra(graph, startCity.id, endCity.id);
  
  if (!result) {
    const directDistance = haversineDistance(origin, destination);
    const directPath: GeoPoint[] = [];
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      directPath.push({
        lat: origin.lat + (destination.lat - origin.lat) * t,
        lng: origin.lng + (destination.lng - origin.lng) * t,
        name: i === 0 ? startCity.name : i === steps ? endCity.name : undefined
      });
    }
    
    return {
      path: directPath,
      distance: directDistance,
      cities: [startCity, endCity]
    };
  }
  
  const citiesInPath = result.path.map(id => cities.find(c => c.id === id)!).filter(Boolean);
  const pathPoints = generatePathPoints(citiesInPath);
  
  const originAdjusted: GeoPoint = { ...origin, name: startCity.name };
  const destAdjusted: GeoPoint = { ...destination, name: endCity.name };
  
  pathPoints[0] = originAdjusted;
  pathPoints[pathPoints.length - 1] = destAdjusted;
  
  return {
    path: pathPoints,
    distance: result.distance,
    cities: citiesInPath
  };
};

export const getCitiesAlongPath = (path: GeoPoint[]): City[] => {
  const cityNames = new Set<string>();
  const result: City[] = [];
  
  path.forEach(point => {
    if (point.name) {
      const city = cities.find(c => c.name === point.name);
      if (city && !cityNames.has(city.id)) {
        cityNames.add(city.id);
        result.push(city);
      }
    }
  });
  
  return result;
};

export const validateDijkstra = (): { valid: boolean; details: string } => {
  const graph = buildCityGraph();
  
  if (graph.size < 2) {
    return { valid: false, details: '图中节点数量不足' };
  }

  const startCity = cities[0];
  const endCity = cities[cities.length - 1];
  
  const result = dijkstra(graph, startCity.id, endCity.id);
  
  if (!result) {
    return { valid: false, details: '未找到路径' };
  }

  if (result.path.length < 2) {
    return { valid: false, details: '路径节点数不足' };
  }

  if (result.path[0] !== startCity.id) {
    return { valid: false, details: '路径起点不正确' };
  }

  if (result.path[result.path.length - 1] !== endCity.id) {
    return { valid: false, details: '路径终点不正确' };
  }

  let totalDist = 0;
  for (let i = 0; i < result.path.length - 1; i++) {
    const node1 = graph.get(result.path[i]);
    const node2 = graph.get(result.path[i + 1]);
    if (!node1 || !node2) {
      return { valid: false, details: `路径中包含不存在的节点: ${result.path[i]} 或 ${result.path[i + 1]}` };
    }
    const directDist = haversineDistance(node1.point, node2.point);
    totalDist += directDist;
  }

  const tolerance = 0.01;
  if (Math.abs(totalDist - result.distance) / result.distance > tolerance) {
    return { 
      valid: false, 
      details: `路径距离不匹配: 计算值 ${result.distance.toFixed(2)}km, 累加值 ${totalDist.toFixed(2)}km` 
    };
  }

  return { 
    valid: true, 
    details: `Dijkstra算法验证通过: ${startCity.name} -> ${endCity.name}, 距离 ${result.distance.toFixed(2)}km, 途经 ${result.path.length} 个城市` 
  };
};
