import { Rune, RuneType, SceneType, PortalActivationCommand } from '../../store/gameStore'

interface CombinationStrategy {
  sequence: RuneType[]
  scene: SceneType
  description: string
}

interface RuneStrategyContext {
  strategies: CombinationStrategy[]
  validate(sequence: Rune[]): PortalActivationCommand
}

const COMBINATION_STRATEGIES: CombinationStrategy[] = [
  {
    sequence: ['fire', 'thunder', 'fire'],
    scene: 'desert',
    description: '炽热沙漠之门'
  },
  {
    sequence: ['life', 'life', 'ice'],
    scene: 'forest',
    description: '生命森林之门'
  },
  {
    sequence: ['shadow', 'shadow', 'thunder'],
    scene: 'starry',
    description: '星空暗影之门'
  },
  {
    sequence: ['ice', 'thunder', 'life'],
    scene: 'forest',
    description: '绿野秘境之门'
  },
  {
    sequence: ['fire', 'shadow', 'ice'],
    scene: 'desert',
    description: '幻影荒漠之门'
  }
]

class RuneEngineImpl implements RuneStrategyContext {
  strategies: CombinationStrategy[] = COMBINATION_STRATEGIES

  validate(sequence: Rune[]): PortalActivationCommand {
    if (sequence.length !== 3) {
      return {
        valid: false,
        message: '需要组合3个符文才能激活传送门'
      }
    }

    const runeTypes = sequence.map((r) => r.type)

    for (const strategy of this.strategies) {
      if (this.sequencesMatch(runeTypes, strategy.sequence)) {
        return {
          valid: true,
          scene: strategy.scene,
          message: `激活${strategy.description}`
        }
      }
    }

    return {
      valid: false,
      message: '符文组合无效，请尝试其他排列'
    }
  }

  private sequencesMatch(a: RuneType[], b: RuneType[]): boolean {
    if (a.length !== b.length) return false
    return a.every((type, index) => type === b[index])
  }

  getHintForFirstRune(): RuneType {
    const randomIndex = Math.floor(Math.random() * this.strategies.length)
    return this.strategies[randomIndex].sequence[0]
  }
}

export const RuneEngine = new RuneEngineImpl()

export const VALID_COMBINATIONS = COMBINATION_STRATEGIES
