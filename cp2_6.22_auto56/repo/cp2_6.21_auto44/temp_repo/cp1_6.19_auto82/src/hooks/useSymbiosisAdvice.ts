import { useMemo } from 'react';
import type { Plant, AdviceItem } from '@types/index';
import { PLANT_SPECIES, getSymbiosisRelation, getSpeciesById } from '@data/plants';

export function useSymbiosisAdvice(plants: Plant[]): AdviceItem[] {
  return useMemo(() => {
    const existingSpeciesSet = new Set(plants.map((p) => p.speciesId));
    const existingSpecies = Array.from(existingSpeciesSet);
    const advices: AdviceItem[] = [];

    existingSpecies.forEach((speciesId) => {
      PLANT_SPECIES.forEach((candidate) => {
        if (candidate.id === speciesId) return;
        const relation = getSymbiosisRelation(speciesId, candidate.id);
        if (relation && relation.type === 'beneficial') {
          const speciesA = getSpeciesById(speciesId);
          if (!speciesA) return;
          if (!existingSpeciesSet.has(candidate.id)) {
            advices.push({
              id: `${speciesId}-${candidate.id}`,
              speciesA: speciesA.name,
              speciesB: candidate.name,
              reason: relation.reason,
            });
          }
        }
      });
    });

    const seen = new Set<string>();
    return advices.filter((a) => {
      const key = [a.speciesA, a.speciesB].sort().join('-');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [plants]);
}
