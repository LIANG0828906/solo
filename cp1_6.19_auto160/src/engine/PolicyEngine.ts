import { eventBus, EVENTS } from '../eventBus';
import { setState, getState, MetricData, PolicyContribution } from '../store';
import { policyTags, synergyEffects, BASELINE } from './policyData';

const SIMULATION_PERIODS = 6;

export class PolicyEngine {
  constructor() {
    eventBus.on(EVENTS.START_SIMULATION, this.runSimulation.bind(this));
    eventBus.on(EVENTS.POLICY_TOGGLE, this.togglePolicy.bind(this));
  }

  private togglePolicy(policyId: string): void {
    const { selectedPolicies } = getState();
    const isSelected = selectedPolicies.includes(policyId);
    let newPolicies: string[];

    if (isSelected) {
      newPolicies = selectedPolicies.filter((id) => id !== policyId);
    } else {
      if (selectedPolicies.length >= 5) {
        return;
      }
      newPolicies = [...selectedPolicies, policyId];
    }

    setState({ selectedPolicies: newPolicies });
  }

  private calculateSynergyEffects(selectedIds: string[]): {
    satisfaction: number;
    carbon: number;
    economy: number;
  } {
    let synergySatisfaction = 0;
    let synergyCarbon = 0;
    let synergyEconomy = 0;

    for (const synergy of synergyEffects) {
      const [p1, p2] = synergy.policies;
      if (selectedIds.includes(p1) && selectedIds.includes(p2)) {
        synergySatisfaction += synergy.effects.satisfaction;
        synergyCarbon += synergy.effects.carbon;
        synergyEconomy += synergy.effects.economy;
      }
    }

    return {
      satisfaction: synergySatisfaction,
      carbon: synergyCarbon,
      economy: synergyEconomy,
    };
  }

  private calculatePolicyContributions(
    selectedIds: string[],
    period: number
  ): Record<string, number> {
    const contributions: Record<string, number> = {};

    for (const policyId of selectedIds) {
      const policy = policyTags.find((p) => p.id === policyId);
      if (policy) {
        const growthFactor = 1 + policy.growthRate.carbon * period;
        const carbonEffect = policy.effects.carbon * growthFactor;
        contributions[policyId] = Math.abs(carbonEffect);
      }
    }

    return contributions;
  }

  private runSimulation(): void {
    const { selectedPolicies } = getState();

    if (selectedPolicies.length < 2) {
      return;
    }

    const startTime = Date.now();
    const minLoadTime = 300;

    const simulationData: MetricData[] = [];
    const policyContributions: PolicyContribution[] = [];

    const synergyEffectsTotal = this.calculateSynergyEffects(selectedPolicies);

    for (let period = 0; period < SIMULATION_PERIODS; period++) {
      let satisfaction = BASELINE.satisfaction;
      let carbon = BASELINE.carbon;
      let economy = BASELINE.economy;

      for (const policyId of selectedPolicies) {
        const policy = policyTags.find((p) => p.id === policyId);
        if (policy) {
          const growthFactor = 1 + policy.growthRate.satisfaction * period;
          satisfaction += policy.effects.satisfaction * growthFactor;

          const carbonGrowth = 1 + policy.growthRate.carbon * period;
          carbon += policy.effects.carbon * carbonGrowth;

          const economyGrowth = 1 + policy.growthRate.economy * period;
          economy += policy.effects.economy * economyGrowth;
        }
      }

      const synergyGrowth = 1 + 0.02 * period;
      satisfaction += synergyEffectsTotal.satisfaction * synergyGrowth;
      carbon += synergyEffectsTotal.carbon * synergyGrowth;
      economy += synergyEffectsTotal.economy * synergyGrowth;

      satisfaction = Math.max(0, Math.min(100, satisfaction));
      carbon = Math.max(0, Math.min(200, carbon));
      economy = Math.max(0, Math.min(100, economy));

      simulationData.push({
        month: period + 1,
        satisfaction: Math.round(satisfaction * 10) / 10,
        carbon: Math.round(carbon * 10) / 10,
        economy: Math.round(economy * 10) / 10,
      });

      const contributions = this.calculatePolicyContributions(selectedPolicies, period);
      policyContributions.push({
        month: period + 1,
        ...contributions,
      });
    }

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minLoadTime - elapsed);

    setTimeout(() => {
      eventBus.emit(EVENTS.SIMULATION_COMPLETE, {
        simulationData,
        policyContributions,
      });
    }, remaining);
  }
}

export const policyEngine = new PolicyEngine();
