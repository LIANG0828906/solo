import {
  MaterialType,
  PropertyType,
  PropertyValue,
  Ratio,
  BASE_PROPERTIES,
} from '../types';

export function computeProperties(ratios: Ratio[]): PropertyValue[] {
  const total = ratios.reduce((sum, r) => sum + r.value, 0);
  if (total === 0) {
    return Object.values(PropertyType).map((type) => ({
      type,
      value: 0,
      label:
        type === PropertyType.Strength
          ? '强度'
          : type === PropertyType.Density
          ? '密度'
          : type === PropertyType.ThermalConductivity
          ? '导热性'
          : type === PropertyType.Flexibility
          ? '柔韧性'
          : '成本',
    }));
  }

  const normalizedRatios = ratios.map((r) => ({
    material: r.material,
    weight: r.value / total,
  }));

  const result: PropertyValue[] = Object.values(PropertyType).map((type) => {
    let weightedSum = 0;
    for (const nr of normalizedRatios) {
      weightedSum += nr.weight * BASE_PROPERTIES[nr.material][type];
    }
    const fluctuation = 1 + (Math.random() * 0.1 - 0.05);
    const rawValue = weightedSum * fluctuation;
    const value = Math.round(Math.min(100, Math.max(0, rawValue)) * 10) / 10;

    return {
      type,
      value,
      label:
        type === PropertyType.Strength
          ? '强度'
          : type === PropertyType.Density
          ? '密度'
          : type === PropertyType.ThermalConductivity
          ? '导热性'
          : type === PropertyType.Flexibility
          ? '柔韧性'
          : '成本',
    };
  });

  return result;
}
