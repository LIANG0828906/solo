import { CharacterProvider } from '@/contexts/CharacterContext'
import { RhythmProvider } from '@/contexts/RhythmContext'
import CharacterController from '@/modules/character/CharacterController'
import RhythmAnalyzer from '@/modules/rhythm/RhythmAnalyzer'
import GameScene from '@/scenes/GameScene'
import BattleUI from '@/components/BattleUI'

export default function App() {
  return (
    <CharacterProvider>
      <RhythmProvider>
        <div className="game-container">
          <div className="game-header">
            <h1 className="game-title">节奏裂隙</h1>
            <span className="game-subtitle">RHYTHM RIFT</span>
          </div>
          <div className="game-viewport">
            <GameScene />
            <BattleUI />
          </div>
          <CharacterController />
          <RhythmAnalyzer />
          <div className="controls-hint">
            <span>A/D 移动 | 空格 跳跃 | Q/W/E 技能 | 1/2/3 切换角色 | Tab 轮换</span>
          </div>
        </div>
      </RhythmProvider>
    </CharacterProvider>
  )
}
