import { v4 as uuidv4 } from 'uuid';
import type { Material, ElementEffect, SynthesisResult } from './types';
import type { RecipeDefinition } from './data/initialRecipes';

export class AlchemyEngine {
  private recipeMap: Map<string, RecipeDefinition> = new Map();
  private elementColors: Record<string, string> = {
    fire: '#ff6b35',
    water: '#4fc3f7',
    earth: '#a1887f',
    air: '#b3e5fc',
    chaos: '#ba68c8',
    spirit: '#fff176',
    metal: '#90a4ae',
    nature: '#81c784',
  };

  constructor(private allDefinitions: RecipeDefinition[]) {
    this.buildRecipeMap();
  }

  private buildRecipeMap(): void {
    for (const def of this.allDefinitions) {
      const [a, b] = def.input;
      this.recipeMap.set(`${a}|${b}`, def);
      this.recipeMap.set(`${b}|${a}`, def);
    }
  }

  private buildEffects(materials: [Material, Material]): ElementEffect[] {
    return [
      {
        type: 'spark',
        color: this.elementColors[materials[0].elementType] || '#ffffff',
        duration: 400,
        intensity: 0.8,
      },
      {
        type: 'glow',
        color: this.elementColors[materials[1].elementType] || '#ffffff',
        duration: 600,
        intensity: 0.6,
      },
    ];
  }

  synthesize(
    materials: [Material, Material],
    materialsDict: Record<string, Material>,
    failureRate: number
  ): SynthesisResult {
    const startTime = performance.now();
    const [m1, m2] = materials;

    const roll = Math.random();
    if (roll < failureRate) {
      const elapsed = performance.now() - startTime;
      if (elapsed > 5) {
        console.warn(`[AlchemyEngine] Synthesis check exceeded 5ms: ${elapsed.toFixed(2)}ms`);
      }
      return {
        success: false,
        effects: [
          { type: 'flash', color: '#e74c3c', duration: 200, intensity: 1 },
        ],
        failReason: '混合失败：元素无法稳定结合',
      };
    }

    const key = `${m1.id}|${m2.id}`;
    const recipeDef = this.recipeMap.get(key);

    if (!recipeDef) {
      const elapsed = performance.now() - startTime;
      if (elapsed > 5) {
        console.warn(`[AlchemyEngine] Synthesis check exceeded 5ms: ${elapsed.toFixed(2)}ms`);
      }
      return {
        success: false,
        effects: [
          { type: 'smoke', color: '#666666', duration: 300, intensity: 0.5 },
        ],
        failReason: '混合失败：未知配方',
      };
    }

    const outputTemplate = materialsDict[recipeDef.output];
    if (!outputTemplate) {
      return {
        success: false,
        effects: [],
        failReason: '配方产物数据缺失',
      };
    }

    const isNewMaterial = !outputTemplate.discovered;
    const outputMaterial: Material = {
      ...outputTemplate,
      id: isNewMaterial ? outputTemplate.id : uuidv4(),
      discovered: true,
      discoveredAt: Date.now(),
      synthesisCount: outputTemplate.synthesisCount + 1,
    };

    const elapsed = performance.now() - startTime;
    if (elapsed > 5) {
      console.warn(`[AlchemyEngine] Synthesis calculation exceeded 5ms: ${elapsed.toFixed(2)}ms`);
    }

    return {
      success: true,
      outputMaterial,
      recipeId: recipeDef.output + '_' + Date.now(),
      effects: this.buildEffects(materials),
      isNewMaterial,
    };
  }

  findRecipeDefinition(
    m1Id: string,
    m2Id: string
  ): RecipeDefinition | undefined {
    return this.recipeMap.get(`${m1Id}|${m2Id}`);
  }
}
