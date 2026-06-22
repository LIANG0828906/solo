import {
  Ingredient,
  CookingMethod,
  Topology,
  TopologyNode,
  TopologyEdge,
  IMPORTANCE_COLORS,
  METHOD_COLORS,
} from '../shared/types';

export function buildTopology(ingredients: Ingredient[], methods: CookingMethod[]): Topology {
  const nodes: TopologyNode[] = [];
  const edges: TopologyEdge[] = [];

  const centerX = 400;
  const centerY = 300;

  const importance3 = ingredients.filter((i) => i.importance === 3);
  const importance2 = ingredients.filter((i) => i.importance === 2);
  const importance1 = ingredients.filter((i) => i.importance === 1);

  const placeOnCircle = (
    items: Ingredient[],
    radius: number,
    startAngle: number = 0,
    angleStep?: number
  ) => {
    const count = items.length;
    if (count === 0) return;
    const step = angleStep !== undefined ? angleStep : (Math.PI * 2) / count;
    items.forEach((item, idx) => {
      const angle = startAngle + idx * step;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodes.push({
        id: item.id,
        x,
        y,
        radius: 20 + item.importance * 7,
        color: IMPORTANCE_COLORS[item.importance],
        label: item.name,
        emoji: item.emoji,
        origin: item.origin,
        seasonMonths: item.seasonMonths,
        importance: item.importance,
        rating: item.rating,
      });
    });
  };

  importance3.forEach((item) => {
    nodes.push({
      id: item.id,
      x: centerX,
      y: centerY,
      radius: 20 + item.importance * 7,
      color: IMPORTANCE_COLORS[item.importance],
      label: item.name,
      emoji: item.emoji,
      origin: item.origin,
      seasonMonths: item.seasonMonths,
      importance: item.importance,
      rating: item.rating,
    });
  });

  placeOnCircle(importance2, 160, -Math.PI / 2, (60 * Math.PI) / 180);
  placeOnCircle(importance1, 280, -Math.PI / 2);

  const defaultMethod: CookingMethod = methods.length > 0 ? methods[0] : '炖';
  const secondMethod: CookingMethod = methods.length > 1 ? methods[1] : '炖';

  importance3.forEach((center, cIdx) => {
    [...importance2, ...importance1].forEach((other, idx) => {
      const methodIdx = (cIdx + idx) % Math.max(methods.length, 1);
      const method = methods.length > 0 ? methods[methodIdx] : defaultMethod;
      edges.push({
        id: `${center.id}-${other.id}`,
        source: center.id,
        target: other.id,
        method,
        color: METHOD_COLORS[method],
      });
    });
  });

  for (let i = 0; i < importance2.length; i++) {
    for (let j = i + 1; j < importance2.length; j++) {
      edges.push({
        id: `${importance2[i].id}-${importance2[j].id}`,
        source: importance2[i].id,
        target: importance2[j].id,
        method: secondMethod,
        color: METHOD_COLORS[secondMethod],
      });
    }
  }

  return { nodes, edges };
}
