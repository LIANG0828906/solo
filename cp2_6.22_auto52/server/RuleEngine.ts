export interface ConditionGroup {
  sensorType: 'temperature' | 'humidity' | 'light';
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number;
  roomId: string;
}

export interface Action {
  deviceId: string;
  action: 'on' | 'off' | 'set';
  value?: number;
}

export interface Rule {
  id: string;
  name: string;
  conditions: ConditionGroup[];
  logic: 'AND' | 'OR';
  actions: Action[];
  enabled: boolean;
}

interface EvaluateResult {
  rule: Rule;
  actions: Action[];
}

import type { SensorData } from './SensorSimulator.js';

function evaluateCondition(
  condition: ConditionGroup,
  sensors: SensorData
): boolean {
  const sensorValue = sensors[condition.sensorType];
  switch (condition.operator) {
    case '>':
      return sensorValue > condition.value;
    case '<':
      return sensorValue < condition.value;
    case '=':
      return sensorValue === condition.value;
    case '>=':
      return sensorValue >= condition.value;
    case '<=':
      return sensorValue <= condition.value;
    default:
      return false;
  }
}

export class RuleEngine {
  private rules: Map<string, Rule> = new Map();

  addRule(rule: Rule): Rule {
    this.rules.set(rule.id, rule);
    return rule;
  }

  updateRule(id: string, update: Partial<Rule>): Rule | null {
    const existing = this.rules.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...update, id: existing.id };
    this.rules.set(id, updated);
    return updated;
  }

  deleteRule(id: string): boolean {
    return this.rules.delete(id);
  }

  getRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  getRule(id: string): Rule | undefined {
    return this.rules.get(id);
  }

  evaluate(roomId: string, sensors: SensorData): EvaluateResult[] {
    const results: EvaluateResult[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const relevantConditions = rule.conditions.filter(
        (c) => c.roomId === roomId
      );
      if (relevantConditions.length === 0) continue;

      const conditionResults = relevantConditions.map((c) =>
        evaluateCondition(c, sensors)
      );

      const triggered =
        rule.logic === 'AND'
          ? conditionResults.every(Boolean)
          : conditionResults.some(Boolean);

      if (triggered) {
        results.push({ rule, actions: rule.actions });
      }
    }

    return results;
  }
}
