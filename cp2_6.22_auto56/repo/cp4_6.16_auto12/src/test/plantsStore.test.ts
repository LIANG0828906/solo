import { computeDaysSince, isCareOverdue, enrichPlantsWithStats, sortPlantsByCareUrgency, CARE_THRESHOLDS, Plant, CareType } from '../modules/plants/plantsStore';

describe('computeDaysSince', () => {
  it('returns null when timestamp is 0 (never watered)', () => {
    expect(computeDaysSince(0)).toBeNull();
  });

  it('returns 0 when timestamp is now', () => {
    const now = Date.now();
    expect(computeDaysSince(now, now)).toBe(0);
  });

  it('returns correct days for past timestamp', () => {
    const now = Date.now();
    const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000;
    expect(computeDaysSince(fiveDaysAgo, now)).toBe(5);
  });

  it('returns correct days for 7 days ago', () => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    expect(computeDaysSince(sevenDaysAgo, now)).toBe(7);
  });
});

describe('isCareOverdue', () => {
  it('returns false when daysSince is null (never watered)', () => {
    expect(isCareOverdue(null, 7)).toBe(false);
  });

  it('returns false when within threshold', () => {
    expect(isCareOverdue(5, 7)).toBe(false);
  });

  it('returns false when exactly at threshold', () => {
    expect(isCareOverdue(7, 7)).toBe(false);
  });

  it('returns true when over threshold', () => {
    expect(isCareOverdue(8, 7)).toBe(true);
  });

  it('returns true when well over threshold', () => {
    expect(isCareOverdue(30, 7)).toBe(true);
  });
});

describe('enrichPlantsWithStats', () => {
  const basePlant: Plant = {
    id: 'test-1',
    name: '小绿',
    species: '绿萝',
    purchaseDate: Date.now(),
    photo: '',
    createdAt: Date.now(),
    lastWaterAt: 0,
    lastFertilizeAt: 0,
    lastRepotAt: 0,
  };

  it('marks plant as needing water warning when over threshold', () => {
    const now = Date.now();
    const plant = {
      ...basePlant,
      lastWaterAt: now - 8 * 24 * 60 * 60 * 1000,
    };
    const result = enrichPlantsWithStats([plant], now);
    expect(result[0].needsWaterWarning).toBe(true);
    expect(result[0].daysSinceLastWater).toBe(8);
  });

  it('does not mark plant as warning when within threshold', () => {
    const now = Date.now();
    const plant = {
      ...basePlant,
      lastWaterAt: now - 3 * 24 * 60 * 60 * 1000,
    };
    const result = enrichPlantsWithStats([plant], now);
    expect(result[0].needsWaterWarning).toBe(false);
    expect(result[0].daysSinceLastWater).toBe(3);
  });

  it('handles never-watered plant (lastWaterAt = 0)', () => {
    const result = enrichPlantsWithStats([basePlant], Date.now());
    expect(result[0].daysSinceLastWater).toBeNull();
    expect(result[0].needsWaterWarning).toBe(false);
  });

  it('computes daysSinceLastFertilize and daysSinceLastRepot', () => {
    const now = Date.now();
    const plant = {
      ...basePlant,
      lastFertilizeAt: now - 15 * 24 * 60 * 60 * 1000,
      lastRepotAt: now - 200 * 24 * 60 * 60 * 1000,
    };
    const result = enrichPlantsWithStats([plant], now);
    expect(result[0].daysSinceLastFertilize).toBe(15);
    expect(result[0].daysSinceLastRepot).toBe(200);
  });
});

describe('sortPlantsByCareUrgency', () => {
  const now = Date.now();

  function makePlant(id: string, lastWaterAt: number, createdAt?: number): Plant {
    return {
      id,
      name: `Plant ${id}`,
      species: 'Test',
      purchaseDate: now,
      photo: '',
      createdAt: createdAt ?? now,
      lastWaterAt,
      lastFertilizeAt: 0,
      lastRepotAt: 0,
    };
  }

  it('sorts never-watered plants first', () => {
    const plants = [
      enrichPlantsWithStats([makePlant('a', now - 3 * 86400000)], now)[0],
      enrichPlantsWithStats([makePlant('b', 0)], now)[0],
    ];
    const sorted = sortPlantsByCareUrgency(plants);
    expect(sorted[0].id).toBe('b');
  });

  it('sorts by days since last water (most urgent first)', () => {
    const plants = [
      enrichPlantsWithStats([makePlant('a', now - 3 * 86400000)], now)[0],
      enrichPlantsWithStats([makePlant('b', now - 10 * 86400000)], now)[0],
      enrichPlantsWithStats([makePlant('c', now - 5 * 86400000)], now)[0],
    ];
    const sorted = sortPlantsByCareUrgency(plants);
    expect(sorted[0].id).toBe('b');
    expect(sorted[1].id).toBe('c');
    expect(sorted[2].id).toBe('a');
  });

  it('sorts never-watered plants by createdAt when both never watered', () => {
    const plants = [
      enrichPlantsWithStats([makePlant('a', 0, now - 1000)], now)[0],
      enrichPlantsWithStats([makePlant('b', 0, now)], now)[0],
    ];
    const sorted = sortPlantsByCareUrgency(plants);
    expect(sorted[0].id).toBe('b');
  });
});

describe('CARE_THRESHOLDS', () => {
  it('has correct threshold values', () => {
    expect(CARE_THRESHOLDS.water).toBe(7);
    expect(CARE_THRESHOLDS.fertilize).toBe(30);
    expect(CARE_THRESHOLDS.repot).toBe(365);
  });
});
