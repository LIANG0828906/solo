import type { Species, EnvParams, RenderableSpecies, MonthForecast } from './types';
import { speciesToRenderable, loadSpeciesData } from './dataLoader';

function gaussianFit(value: number, min: number, max: number): number {
  const mid = (min + max) / 2;
  const sigma = (max - min) / 2;
  const diff = value - mid;
  return Math.exp(-(diff * diff) / (2 * sigma * sigma));
}

function depthOffset(species: Species, temperature: number): number {
  const mid = (species.preferredTemp[0] + species.preferredTemp[1]) / 2;
  const isWarmSpecies = mid >= 20;
  const delta = (temperature - mid) * 2;
  if (isWarmSpecies) {
    return -delta * 0.5;
  }
  return delta * 0.5;
}

export function recalculate(
  species: Species[],
  envParams: EnvParams
): RenderableSpecies[] {
  return speciesToRenderable(species, envParams);
}

export function generate12MonthForecast(
  species: Species[],
  baseParams: EnvParams
): MonthForecast[] {
  const forecasts: MonthForecast[] = [];
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月',
  ];
  for (let m = 1; m <= 12; m++) {
    const seasonalTempShift = Math.sin(((m - 3) / 12) * Math.PI * 2) * 4;
    const seasonalSalinityShift = Math.sin(((m - 1) / 12) * Math.PI * 2) * 1.5;
    const monthParams: EnvParams = {
      temperature: baseParams.temperature + seasonalTempShift,
      salinity: baseParams.salinity + seasonalSalinityShift,
      lightPenetration: baseParams.lightPenetration + seasonalTempShift * 3,
    };
    const renderable = speciesToRenderableWithOffset(species, monthParams);
    let summary = `${monthNames[m - 1]}：`;
    const warmCount = renderable.filter(
      (r) => r.category === 'shallow' && r.abundance > 0.5
    ).length;
    const coldCount = renderable.filter(
      (r) => r.category === 'deep' && r.abundance > 0.5
    ).length;
    if (seasonalTempShift > 2) {
      summary += `暖季效应显著，浅海物种活跃度提升（${warmCount}种高丰度），冷水物种向深层收缩`;
    } else if (seasonalTempShift < -2) {
      summary += `冷季效应增强，深海物种扩散（${coldCount}种高丰度），暖水物种收缩至浅层`;
    } else {
      summary += `过渡季节，物种分布相对稳定，浅海${warmCount}种、深海${coldCount}种维持高丰度`;
    }
    forecasts.push({ month: m, speciesData: renderable, summary });
  }
  return forecasts;
}

function speciesToRenderableWithOffset(
  species: Species[],
  envParams: EnvParams
): RenderableSpecies[] {
  const results: RenderableSpecies[] = [];
  for (const sp of species) {
    const dOffset = depthOffset(sp, envParams.temperature);
    for (const pt of sp.samplePoints) {
      const adjustedDepth = Math.max(0, pt.depth + dOffset);
      const x = (pt.lng - 110) * 40;
      const z = (pt.lat - 18.5) * 40;
      const y = -adjustedDepth * 0.5;
      const tempFit = gaussianFit(
        envParams.temperature,
        sp.preferredTemp[0],
        sp.preferredTemp[1]
      );
      const salFit = gaussianFit(
        envParams.salinity,
        sp.preferredSalinity[0],
        sp.preferredSalinity[1]
      );
      const lightFactor =
        adjustedDepth < envParams.lightPenetration
          ? 1.0
          : Math.max(0.3, 1.0 - (adjustedDepth - envParams.lightPenetration) / 200);
      const fitness = tempFit * salFit * lightFactor;
      const depthOpacity = Math.max(
        0.15,
        1.0 - (adjustedDepth / 3000) * 0.85
      );
      results.push({
        speciesId: sp.id,
        position: [x, y, z],
        scale: 0.3 + pt.abundance * fitness * 0.7,
        opacity: depthOpacity * (0.4 + fitness * 0.6),
        color: sp.color,
        name: sp.name,
        latinName: sp.latinName,
        depth: adjustedDepth,
        abundance: pt.abundance * fitness,
        category: sp.category,
        preferredTemp: sp.preferredTemp,
      });
    }
  }
  return results;
}

export function getEcoRegionDescription(params: EnvParams): {
  label: string;
  description: string;
} {
  const { temperature, salinity, lightPenetration } = params;
  if (temperature >= 25 && lightPenetration >= 100) {
    return {
      label: '温暖浅海区',
      description: '高温高光照环境，珊瑚礁和热带鱼类繁盛区域',
    };
  }
  if (temperature >= 20 && temperature < 25) {
    return {
      label: '温带浅海区',
      description: '温和水温，适宜多数中上层物种生存',
    };
  }
  if (temperature >= 15 && temperature < 20) {
    return {
      label: '温带中层区',
      description: '过渡温度带，物种多样性较高，混合温水与冷水物种',
    };
  }
  if (temperature >= 10 && temperature < 15) {
    return {
      label: '冷温中层区',
      description: '较低水温，冷水物种开始占优势',
    };
  }
  if (temperature < 10) {
    return {
      label: '深海冷水区',
      description: '极低温环境，深海适应性物种为主',
    };
  }
  return {
    label: '混合海域',
    description: '多物种共存区域',
  };
}
