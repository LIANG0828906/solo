<template>
  <div class="game-container" ref="gameContainerRef">
    <!-- 星空背景 -->
    <div class="starfield">
      <div class="stars stars-1"></div>
      <div class="stars stars-2"></div>
      <div class="stars stars-3"></div>
    </div>

    <!-- 星云粒子层 -->
    <div class="nebula">
      <div class="nebula-core"></div>
      <div class="nebula-ring ring-1"></div>
      <div class="nebula-ring ring-2"></div>
    </div>

    <!-- 顶部状态栏 -->
    <div class="top-bar">
      <!-- 敌方信息 -->
      <div class="player-info enemy-info">
        <div class="avatar enemy-avatar">
          <span class="avatar-icon">👿</span>
          <div class="avatar-ring"></div>
        </div>
        <div class="info-panel">
          <div class="player-name">暗影领主</div>
          <div class="health-bar" :class="{ damaged: store.enemyHealthDamaged }">
            <div class="health-fill enemy-fill" :style="{ width: enemyHealthPercent + '%' }"></div>
            <span class="health-text">{{ store.enemyHealth }} / {{ store.enemyMaxHealth }}</span>
          </div>
          <div class="mana-row">
            <div class="mana-crystals">
              <div
                v-for="i in store.enemyMaxMana"
                :key="'em-' + i"
                class="mana-crystal"
                :class="{ active: i <= store.enemyMana }"
              >
                <svg viewBox="0 0 24 32" class="crystal-svg">
                  <polygon points="12,0 24,10 12,32 0,10" />
                </svg>
              </div>
            </div>
            <span class="mana-text">{{ store.enemyMana }}/{{ store.enemyMaxMana }}</span>
          </div>
        </div>
        <div class="hand-count">
          <span class="hand-icon">🂠</span>
          <span>{{ store.enemyHand.length }}</span>
        </div>
      </div>

      <!-- 回合信息 -->
      <div class="turn-info">
        <div class="turn-number">第 {{ store.turn }} 回合</div>
        <div class="phase-badge" :class="store.phase">
          {{ phaseText }}
        </div>
      </div>

      <!-- 玩家信息 -->
      <div class="player-info player-info-right">
        <div class="hand-count">
          <span class="hand-icon">🂠</span>
          <span>{{ store.playerHand.length }}</span>
        </div>
        <div class="info-panel">
          <div class="player-name">星辰勇士</div>
          <div class="health-bar" :class="{ damaged: store.playerHealthDamaged }">
            <div class="health-fill player-fill" :style="{ width: playerHealthPercent + '%' }"></div>
            <span class="health-text">{{ store.playerHealth }} / {{ store.playerMaxHealth }}</span>
          </div>
          <div class="mana-row">
            <div class="mana-crystals">
              <div
                v-for="i in store.playerMaxMana"
                :key="'pm-' + i"
                class="mana-crystal"
                :class="{ active: i <= store.playerMana }"
              >
                <svg viewBox="0 0 24 32" class="crystal-svg">
                  <polygon points="12,0 24,10 12,32 0,10" />
                </svg>
              </div>
            </div>
            <span class="mana-text">{{ store.playerMana }}/{{ store.playerMaxMana }}</span>
          </div>
        </div>
        <div class="avatar player-avatar">
          <span class="avatar-icon">⚔️</span>
          <div class="avatar-ring"></div>
        </div>
      </div>
    </div>

    <!-- 战场区域 -->
    <div class="battlefield" ref="battlefieldRef">
      <div class="grid-row" v-for="(row, rIdx) in store.grid" :key="'row-' + rIdx">
        <div
          v-for="cell in row"
          :key="'cell-' + cell.row + '-' + cell.col"
          class="grid-cell"
          :class="{
            'zone-enemy': cell.zone === 'enemy',
            'zone-neutral': cell.zone === 'neutral',
            'zone-player': cell.zone === 'player',
            highlighted: cell.isHighlighted,
            'valid-target': cell.isValidTarget,
            'valid-place': isValidPlaceCell(cell.row, cell.col) && isDragging,
            'drop-hover': dropHoverCell?.row === cell.row && dropHoverCell?.col === cell.col
          }"
          @dragover.prevent="onCellDragOver(cell)"
          @dragleave="onCellDragLeave(cell)"
          @drop="onCellDrop(cell)"
          @click="onCellClick(cell)"
        >
          <div class="cell-inner">
            <div class="grid-lines"></div>
            <transition name="card-appear">
              <div
                v-if="cell.card"
                class="field-card"
                :class="[
                  cell.card.rarity,
                  cell.card.owner,
                  {
                    'can-attack': cell.card.canAttack && cell.card.owner === 'player' && store.phase === 'player',
                    'just-placed': cell.card.justPlaced,
                    'selected': selectedAttackerId === cell.card.id
                  }
                ]"
                :data-card-id="cell.card.id"
                @click.stop="onFieldCardClick(cell.card)"
              >
                <div class="card-frame">
                  <div class="card-glow" v-if="cell.card.rarity === 'legendary' || cell.card.rarity === 'epic'"></div>
                  <div class="card-shine" v-if="cell.card.rarity === 'legendary' || cell.card.rarity === 'epic'"></div>
                  <div class="card-cost">
                    <span>{{ cell.card.cost }}</span>
                  </div>
                  <div class="card-art">
                    <span class="card-emoji">{{ getCardEmoji(cell.card) }}</span>
                  </div>
                  <div class="card-name">{{ cell.card.name }}</div>
                  <div class="card-type" v-if="cell.card.skill">
                    <span class="skill-badge" :class="cell.card.skill">
                      {{ getSkillName(cell.card.skill) }}
                      <span v-if="cell.card.skillValue" class="skill-val">{{ cell.card.skillValue }}</span>
                    </span>
                  </div>
                  <div class="card-stats">
                    <div class="stat atk">
                      <span class="stat-icon">⚔</span>
                      <span class="stat-value">{{ cell.card.attack }}</span>
                    </div>
                    <div class="stat hp" :class="{ low: cell.card.health < cell.card.maxHealth / 2 }">
                      <span class="stat-icon">❤</span>
                      <span class="stat-value">{{ cell.card.health }}</span>
                    </div>
                  </div>
                </div>
                <div class="taunt-shield" v-if="cell.card.skill === 'taunt'"></div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- 飘字伤害容器 -->
      <div class="floating-texts">
        <div
          v-for="ft in floatingTexts"
          :key="ft.id"
          class="floating-text"
          :style="{ left: ft.x + 'px', top: ft.y + 'px', color: ft.color }"
        >
          {{ ft.text }}
        </div>
      </div>

      <!-- 粒子效果画布 -->
      <canvas ref="particleCanvas" class="particle-canvas"></canvas>
    </div>

    <!-- 手牌区域 -->
    <div class="hand-area">
      <div class="hand-cards">
        <div
          v-for="(card, idx) in store.playerHand"
          :key="card.id"
          class="hand-card-wrapper"
          :style="getHandCardStyle(idx)"
        >
          <div
            class="hand-card"
            :class="[
              card.rarity,
              {
                'disabled': !store.canPlayCard(card.cost),
                'dragging': dragCardId === card.id
              }
            ]"
            :draggable="store.canPlayCard(card.cost) && store.phase === 'player'"
            @dragstart="onDragStart($event, card)"
            @dragend="onDragEnd"
          >
            <div class="card-frame">
              <div class="card-glow" v-if="card.rarity === 'legendary' || card.rarity === 'epic'"></div>
              <div class="card-shine" v-if="card.rarity === 'legendary' || card.rarity === 'epic'"></div>
              <div class="card-cost">
                <span>{{ card.cost }}</span>
              </div>
              <div class="card-art">
                <span class="card-emoji">{{ getCardEmoji(card) }}</span>
              </div>
              <div class="card-name">{{ card.name }}</div>
              <div class="card-type" v-if="card.skill">
                <span class="skill-badge" :class="card.skill">
                  {{ getSkillName(card.skill) }}
                  <span v-if="card.skillValue" class="skill-val">{{ card.skillValue }}</span>
                </span>
              </div>
              <div class="card-stats">
                <div class="stat atk">
                  <span class="stat-icon">⚔</span>
                  <span class="stat-value">{{ card.attack }}</span>
                </div>
                <div class="stat hp">
                  <span class="stat-icon">❤</span>
                  <span class="stat-value">{{ card.health }}</span>
                </div>
              </div>
            </div>
            <div class="mana-tooltip" v-if="!store.canPlayCard(card.cost) && store.phase === 'player'">
              法力不足
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 结束回合按钮 -->
    <button
      class="end-turn-btn"
      :class="{ active: store.phase === 'player' }"
      :disabled="store.phase !== 'player'"
      @click="onEndTurn"
    >
      <span class="btn-text">{{ store.phase === 'player' ? '结束回合' : '思考中...' }}</span>
      <span class="btn-glow"></span>
    </button>

    <!-- 开始游戏覆盖层 -->
    <transition name="fade">
      <div v-if="!gameStarted" class="start-overlay">
        <div class="start-content">
          <h1 class="game-title">星空战记</h1>
          <p class="game-subtitle">策略卡牌对战</p>
          <button class="start-btn" @click="startGame">
            <span>开始战斗</span>
            <span class="btn-shimmer"></span>
          </button>
          <div class="game-hints">
            <p>💡 拖拽卡牌到战场召唤随从</p>
            <p>⚔ 点击己方卡牌选中，再点击敌方目标攻击</p>
            <p>🛡 嘲讽随从必须优先被攻击</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- 战斗统计面板 -->
    <transition name="drawer">
      <div v-if="showStatsDrawer" class="stats-drawer" @click.stop>
        <div class="drawer-handle"></div>
        <div class="stats-content">
          <h2 class="stats-title">
            <span v-if="store.winner === 'player'">🏆 胜利！</span>
            <span v-else>💀 失败</span>
          </h2>
          <div class="stats-grid">
            <div class="stats-row header">
              <span></span>
              <span class="col-player">玩家</span>
              <span class="col-enemy">敌方</span>
            </div>
            <div class="stats-row">
              <span class="stat-label">⏱ 回合数</span>
              <span class="col-player">{{ store.turn }}</span>
              <span class="col-enemy">{{ store.turn }}</span>
            </div>
            <div class="stats-row">
              <span class="stat-label">⚔ 总伤害</span>
              <span class="col-player dmg">{{ store.stats.playerDamage }}</span>
              <span class="col-enemy dmg">{{ store.stats.enemyDamage }}</span>
            </div>
            <div class="stats-row">
              <span class="stat-label">💀 击杀数</span>
              <span class="col-player kill">{{ store.stats.playerKills }}</span>
              <span class="col-enemy kill">{{ store.stats.enemyKills }}</span>
            </div>
            <div class="stats-row">
              <span class="stat-label">💚 治疗量</span>
              <span class="col-player heal">{{ store.stats.playerHeal }}</span>
              <span class="col-enemy heal">{{ store.stats.enemyHeal }}</span>
            </div>
          </div>
          <button class="play-again-btn" @click="restartGame">
            <span>再来一局</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- 胜利/失败遮罩 -->
    <transition name="result-overlay">
      <div v-if="store.winner" class="result-overlay" :class="store.winner">
        <div v-if="store.winner === 'player'" class="victory-particles">
          <div v-for="i in 60" :key="'vp-' + i" class="gold-particle" :style="getGoldParticleStyle(i)"></div>
        </div>
        <div v-else class="defeat-vignette"></div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useCardStore } from './cardStore'
import { executeAITurn } from './aiService'
import type { Card, GridCell, FloatingText } from './types'

const store = useCardStore()

const gameContainerRef = ref<HTMLDivElement | null>(null)
const battlefieldRef = ref<HTMLDivElement | null>(null)
const particleCanvas = ref<HTMLCanvasElement | null>(null)

const gameStarted = ref(false)
const dragCardId = ref<string | null>(null)
const isDragging = ref(false)
const dropHoverCell = ref<{ row: number; col: number } | null>(null)
const selectedAttackerId = ref<string | null>(null)
const floatingTexts = ref<FloatingText[]>([])
const showStatsDrawer = ref(false)
const aiTurnRunning = ref(false)

const enemyHealthPercent = computed(() => Math.max(0, (store.enemyHealth / store.enemyMaxHealth) * 100))
const playerHealthPercent = computed(() => Math.max(0, (store.playerHealth / store.playerMaxHealth) * 100))

const phaseText = computed(() => {
  if (store.phase === 'player') return '你的回合'
  if (store.phase === 'enemy') return '敌方回合'
  return store.winner === 'player' ? '胜利！' : '失败'
})

function getCardEmoji(card: Card): string {
  const emojiMap: Record<string, string[]> = {
    common: ['🛡', '🏹', '🗡', '⚔', '🔰'],
    rare: ['🐉', '🔮', '⚡', '💫', '🌟'],
    epic: ['👑', '💎', '🔥', '❄️', '🌙'],
    legendary: ['🏆', '⭐', '🌠', '💫', '🌟']
  }
  const emojis = emojiMap[card.rarity] || ['⭐']
  const hash = card.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return emojis[hash % emojis.length]
}

function getSkillName(skill: string): string {
  const map: Record<string, string> = {
    combo: '连击',
    taunt: '嘲讽',
    heal: '治疗'
  }
  return map[skill] || skill
}

function getHandCardStyle(idx: number) {
  const total = store.playerHand.length
  const centerOffset = idx - (total - 1) / 2
  const rotate = centerOffset * 3
  const translateY = Math.abs(centerOffset) * 8
  const zIndex = 10 + idx
  return {
    transform: `rotate(${rotate}deg) translateY(${translateY}px)`,
    zIndex: zIndex.toString()
  }
}

function isValidPlaceCell(row: number, col: number): boolean {
  if (store.phase !== 'player') return false
  if (!dragCardId.value) return false
  const cell = store.grid[row][col]
  if (cell.card) return false
  return cell.zone === 'player' || cell.zone === 'neutral'
}

function onDragStart(e: DragEvent, card: Card) {
  if (!store.canPlayCard(card.cost)) {
    e.preventDefault()
    return
  }
  dragCardId.value = card.id
  isDragging.value = true
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', card.id)
    e.dataTransfer.effectAllowed = 'move'
    if (e.target instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.target, 55, 80)
    }
  }
  store.clearHighlights()
}

function onDragEnd() {
  dragCardId.value = null
  isDragging.value = false
  dropHoverCell.value = null
  store.clearHighlights()
}

function onCellDragOver(cell: GridCell) {
  if (!dragCardId.value) return
  if (!isValidPlaceCell(cell.row, cell.col)) return
  dropHoverCell.value = { row: cell.row, col: cell.col }
  store.setCellHighlight(cell.row, cell.col, true)
}

function onCellDragLeave(cell: GridCell) {
  store.setCellHighlight(cell.row, cell.col, false)
  if (dropHoverCell.value?.row === cell.row && dropHoverCell.value?.col === cell.col) {
    dropHoverCell.value = null
  }
}

function onCellDrop(cell: GridCell) {
  if (!dragCardId.value) return
  if (!isValidPlaceCell(cell.row, cell.col)) return

  const card = store.playerHand.find(c => c.id === dragCardId.value)
  if (!card) return

  const result = store.playCard(dragCardId.value, cell.row, cell.col)
  if (result) {
    spawnSummonParticles(cell.row, cell.col)
  }

  dragCardId.value = null
  isDragging.value = false
  dropHoverCell.value = null
  store.clearHighlights()
}

function onCellClick(cell: GridCell) {
  if (store.phase !== 'player') return

  if (selectedAttackerId.value && cell.card && cell.card.owner === 'enemy') {
    if (cell.isValidTarget) {
      executeAttack(selectedAttackerId.value, cell.card.id)
      selectedAttackerId.value = null
      store.clearHighlights()
    }
    return
  }

  if (selectedAttackerId.value) {
    selectedAttackerId.value = null
    store.clearHighlights()
  }
}

function onFieldCardClick(card: Card) {
  if (store.phase !== 'player') return

  if (card.owner === 'player' && card.canAttack) {
    if (selectedAttackerId.value === card.id) {
      selectedAttackerId.value = null
      store.clearHighlights()
    } else {
      selectedAttackerId.value = card.id
      store.markAttackTargets(card.id)
    }
    return
  }

  if (card.owner === 'enemy' && selectedAttackerId.value) {
    const cell = card.position
    if (cell && store.grid[cell.row][cell.col].isValidTarget) {
      executeAttack(selectedAttackerId.value, card.id)
      selectedAttackerId.value = null
      store.clearHighlights()
    }
  }
}

function executeAttack(attackerId: string, targetId: string) {
  const result = store.attack(attackerId, targetId)
  if (!result) return

  const attacker = store.findCardById(attackerId)
  const target = store.findCardById(targetId)

  if (attacker && attacker.position) {
    const cardEl = getFieldCardElement(attackerId)
    if (cardEl) {
      cardEl.classList.add('attack-anim')
      setTimeout(() => cardEl.classList.remove('attack-anim'), 400)
    }
  }

  if (target && target.position) {
    spawnDamageFloatingText(target.position.row, target.position.col, `-${result.targetDmg}`)
    const cardEl = getFieldCardElement(targetId)
    if (cardEl) {
      cardEl.classList.add('hit-anim')
      setTimeout(() => cardEl.classList.remove('hit-anim'), 300)
    }
  }

  if (attacker && result.attackerDmg > 0 && attacker.position) {
    spawnDamageFloatingText(attacker.position.row, attacker.position.col, `-${result.attackerDmg}`)
  }
}

function getFieldCardElement(cardId: string): HTMLElement | null {
  const el = document.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement
  return el
}

function spawnDamageFloatingText(row: number, col: number, text: string) {
  if (!battlefieldRef.value) return
  const cellSize = battlefieldRef.value.offsetWidth / 5
  const rowHeight = battlefieldRef.value.offsetHeight / 3

  const x = col * cellSize + cellSize / 2
  const y = row * rowHeight + rowHeight / 2

  const ft: FloatingText = {
    id: 'ft_' + Date.now() + '_' + Math.random().toString(36).slice(2),
    text,
    x,
    y,
    color: '#ff4757',
    createdAt: Date.now()
  }

  floatingTexts.value.push(ft)
  setTimeout(() => {
    const idx = floatingTexts.value.findIndex(f => f.id === ft.id)
    if (idx > -1) floatingTexts.value.splice(idx, 1)
  }, 1200)
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
  decay: number
}

const particles: Particle[] = []
let animFrameId = 0

function spawnSummonParticles(row: number, col: number) {
  if (!particleCanvas.value || !battlefieldRef.value) return

  const cellSize = battlefieldRef.value.offsetWidth / 5
  const rowHeight = battlefieldRef.value.offsetHeight / 3
  const cx = col * cellSize + cellSize / 2
  const cy = row * rowHeight + rowHeight / 2

  for (let i = 0; i < 24; i++) {
    const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.3
    const speed = 2 + Math.random() * 5
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      color: '#ffd700',
      size: 3 + Math.random() * 5,
      life: 1,
      decay: 0.015 + Math.random() * 0.02
    })
  }
}

function animateParticles() {
  if (!particleCanvas.value || !battlefieldRef.value) {
    animFrameId = requestAnimationFrame(animateParticles)
    return
  }
  const canvas = particleCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = battlefieldRef.value.getBoundingClientRect()
  if (canvas.width !== rect.width || canvas.height !== rect.height) {
    canvas.width = rect.width
    canvas.height = rect.height
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.12
    p.life -= p.decay

    if (p.life <= 0) {
      particles.splice(i, 1)
      continue
    }

    ctx.save()
    ctx.globalAlpha = p.life
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  animFrameId = requestAnimationFrame(animateParticles)
}

function onEndTurn() {
  if (store.phase !== 'player' || aiTurnRunning.value) return
  selectedAttackerId.value = null
  store.clearHighlights()
  store.endTurn()
  runAITurn()
}

async function runAITurn() {
  aiTurnRunning.value = true
  await executeAITurn(
    store,
    (card, row, col) => {
      spawnSummonParticles(row, col)
    },
    (attackerId, targetCardId) => {
      if (targetCardId) {
        const target = store.findCardById(targetCardId)
        if (target && target.position) {
          const attacker = store.findCardById(attackerId)
          if (attacker) {
            const hits = attacker.skill === 'combo' ? (attacker.skillValue ?? 2) : 1
            spawnDamageFloatingText(target.position.row, target.position.col, `-${attacker.attack * hits}`)
          }
        }
      }
    },
    900
  )

  if (!store.winner) {
    store.endTurn()
  }
  aiTurnRunning.value = false
}

function startGame() {
  gameStarted.value = true
  store.initGame()
  nextTick(() => {
    resizeCanvas()
  })
}

function restartGame() {
  showStatsDrawer.value = false
  setTimeout(() => {
    store.initGame()
    gameStarted.value = true
  }, 400)
}

function getGoldParticleStyle(i: number) {
  const left = Math.random() * 100
  const delay = Math.random() * 2
  const duration = 2 + Math.random() * 2.5
  const size = 4 + Math.random() * 10
  return {
    left: left + '%',
    bottom: '-30px',
    width: size + 'px',
    height: size + 'px',
    animationDelay: delay + 's',
    animationDuration: duration + 's'
  }
}

function resizeCanvas() {
  if (!particleCanvas.value || !battlefieldRef.value) return
  const rect = battlefieldRef.value.getBoundingClientRect()
  particleCanvas.value.width = rect.width
  particleCanvas.value.height = rect.height
}

watch(() => store.winner, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      showStatsDrawer.value = true
    }, 1800)
  }
})

onMounted(() => {
  animateParticles()
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
/* ========== 容器 ========== */
.game-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ========== 星空背景 ========== */
.starfield {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(180deg, #0a0e27 0%, #1a0a2e 50%, #0d0d1f 100%);
  overflow: hidden;
}

.stars {
  position: absolute;
  inset: 0;
  background-repeat: repeat;
}

.stars-1 {
  background-image:
    radial-gradient(1px 1px at 20px 30px, #fff, transparent),
    radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.8), transparent),
    radial-gradient(1.5px 1.5px at 90px 40px, #fff, transparent),
    radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
    radial-gradient(2px 2px at 160px 120px, #fff, transparent);
  background-size: 200px 200px;
  animation: twinkle 3s ease-in-out infinite alternate;
}

.stars-2 {
  background-image:
    radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.9), transparent),
    radial-gradient(1.5px 1.5px at 110px 20px, #fff, transparent),
    radial-gradient(1px 1px at 170px 150px, rgba(255,255,255,0.7), transparent),
    radial-gradient(2px 2px at 20px 100px, rgba(255,255,255,0.8), transparent);
  background-size: 250px 250px;
  animation: twinkle 4s ease-in-out infinite alternate-reverse;
}

.stars-3 {
  background-image:
    radial-gradient(1.5px 1.5px at 100px 50px, #fff, transparent),
    radial-gradient(1px 1px at 200px 200px, rgba(255,255,255,0.5), transparent),
    radial-gradient(2.5px 2.5px at 300px 100px, #fff, transparent);
  background-size: 350px 350px;
  animation: twinkle 5s ease-in-out infinite alternate;
}

@keyframes twinkle {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* ========== 星云层 ========== */
.nebula {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.nebula-core {
  position: absolute;
  top: 40%;
  left: 50%;
  width: 600px;
  height: 600px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(138, 43, 226, 0.15) 0%, rgba(75, 0, 130, 0.08) 40%, transparent 70%);
  border-radius: 50%;
  animation: nebulaPulse 8s ease-in-out infinite;
}

.nebula-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.1);
  transform-origin: center center;
  transform: translate(-50%, -50%);
}

.ring-1 {
  width: 800px;
  height: 800px;
  animation: nebulaRotate 60s linear infinite;
  border-color: rgba(138, 43, 226, 0.12);
}

.ring-2 {
  width: 1000px;
  height: 1000px;
  animation: nebulaRotate 90s linear infinite reverse;
  border-color: rgba(255, 215, 0, 0.08);
}

@keyframes nebulaPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

@keyframes nebulaRotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* ========== 顶部状态栏 ========== */
.top-bar {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
  backdrop-filter: blur(4px);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-info-right {
  flex-direction: row-reverse;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  background: linear-gradient(145deg, #2a2a4a, #1a1a2e);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.avatar-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid #ffd700;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.4), inset 0 0 10px rgba(255, 215, 0, 0.2);
  animation: ringPulse 3s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.enemy-avatar .avatar-ring {
  border-color: #9c27b0;
  box-shadow: 0 0 15px rgba(156, 39, 176, 0.4), inset 0 0 10px rgba(156, 39, 176, 0.2);
}

.avatar-icon {
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.info-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 200px;
}

.player-name {
  font-family: 'Cinzel', serif;
  font-size: 14px;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.player-info-right .player-name {
  text-align: right;
}

.health-bar {
  position: relative;
  height: 22px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 11px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

.health-bar.damaged {
  animation: healthShake 0.4s ease-out;
}

@keyframes healthShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.health-fill {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 9px;
}

.player-fill {
  background: linear-gradient(90deg, #4caf50 0%, #8bc34a 50%, #4caf50 100%);
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.enemy-fill {
  background: linear-gradient(90deg, #f44336 0%, #ff5722 50%, #f44336 100%);
  box-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
}

.health-bar.damaged .health-fill {
  animation: damageFlash 0.4s ease-out;
}

@keyframes damageFlash {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(2) saturate(2); }
}

.health-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 1;
}

.mana-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-info-right .mana-row {
  flex-direction: row-reverse;
}

.mana-crystals {
  display: flex;
  gap: 3px;
}

.mana-crystal {
  width: 16px;
  height: 20px;
  opacity: 0.25;
  transition: all 0.3s ease;
  filter: grayscale(0.5);
}

.mana-crystal.active {
  opacity: 1;
  filter: none;
}

.crystal-svg {
  width: 100%;
  height: 100%;
}

.mana-crystal polygon {
  fill: #37474f;
  transition: all 0.3s ease;
}

.mana-crystal.active polygon {
  fill: #4fc3f7;
  filter: drop-shadow(0 0 5px #4fc3f7);
}

.mana-text {
  font-size: 12px;
  font-weight: 700;
  color: #4fc3f7;
  text-shadow: 0 0 6px rgba(79, 195, 247, 0.5);
}

.hand-count {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  font-size: 13px;
  font-weight: 600;
  color: #ffd700;
}

.turn-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.turn-number {
  font-family: 'Cinzel', serif;
  font-size: 16px;
  font-weight: 700;
  color: #e8e6ff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.phase-badge {
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.phase-badge.player {
  background: linear-gradient(135deg, #4caf50, #8bc34a);
  color: #fff;
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.5);
}

.phase-badge.enemy {
  background: linear-gradient(135deg, #9c27b0, #e91e63);
  color: #fff;
  box-shadow: 0 0 15px rgba(156, 39, 176, 0.5);
}

.phase-badge.ended {
  background: linear-gradient(135deg, #607d8b, #455a64);
  color: #fff;
}

/* ========== 战场 ========== */
.battlefield {
  flex: 1;
  position: relative;
  z-index: 5;
  padding: 20px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.grid-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.grid-row:last-child {
  margin-bottom: 0;
}

.grid-cell {
  width: 110px;
  height: 150px;
  border-radius: 10px;
  position: relative;
  transition: all 0.2s ease;
}

.cell-inner {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  transition: all 0.2s ease;
}

.grid-cell.zone-enemy .cell-inner {
  background: rgba(156, 39, 176, 0.05);
  border-color: rgba(156, 39, 176, 0.15);
}

.grid-cell.zone-neutral .cell-inner {
  background: rgba(255, 215, 0, 0.03);
  border-color: rgba(255, 215, 0, 0.1);
}

.grid-cell.zone-player .cell-inner {
  background: rgba(76, 175, 80, 0.05);
  border-color: rgba(76, 175, 80, 0.15);
}

.grid-cell.highlighted .cell-inner {
  background: rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.6);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.grid-cell.valid-target .cell-inner {
  background: rgba(244, 67, 54, 0.15);
  border-color: rgba(244, 67, 54, 0.6);
  box-shadow: 0 0 20px rgba(244, 67, 54, 0.3);
  animation: targetPulse 1s ease-in-out infinite;
}

@keyframes targetPulse {
  0%, 100% { box-shadow: 0 0 10px rgba(244, 67, 54, 0.3); }
  50% { box-shadow: 0 0 25px rgba(244, 67, 54, 0.6); }
}

.grid-cell.valid-place .cell-inner {
  background: rgba(76, 175, 80, 0.1);
  border-color: rgba(76, 175, 80, 0.4);
}

.grid-cell.drop-hover .cell-inner {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  transform: scale(1.05);
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* ========== 战场卡牌 ========== */
.field-card {
  position: absolute;
  inset: 4px;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  will-change: transform;
}

.field-card:hover {
  transform: translateY(-6px) scale(1.05);
  z-index: 10;
}

.field-card.can-attack {
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.6);
  animation: canAttackPulse 1.5s ease-in-out infinite;
}

@keyframes canAttackPulse {
  0%, 100% { box-shadow: 0 0 15px rgba(76, 175, 80, 0.5); }
  50% { box-shadow: 0 0 30px rgba(76, 175, 80, 0.8); }
}

.field-card.selected {
  transform: translateY(-12px) scale(1.1);
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
  z-index: 20;
}

.field-card.just-placed {
  animation: cardSummon 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardSummon {
  0% {
    opacity: 0;
    transform: translateY(30px) rotateY(90deg) scale(0.8);
  }
  60% {
    transform: translateY(-5px) rotateY(-10deg) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotateY(0) scale(1);
  }
}

.field-card.attack-anim {
  animation: cardAttack 0.4s ease-out;
}

@keyframes cardAttack {
  0% { transform: translateY(0); }
  30% { transform: translateY(-20px) scale(1.15); }
  60% { transform: translateY(10px) scale(0.95); }
  100% { transform: translateY(0); }
}

.field-card.hit-anim {
  animation: cardHit 0.3s ease-out;
}

@keyframes cardHit {
  0%, 100% { transform: translateX(0); filter: brightness(1); }
  25% { transform: translateX(-8px); filter: brightness(2) hue-rotate(-20deg); }
  75% { transform: translateX(8px); filter: brightness(1.5) hue-rotate(-10deg); }
}

/* 卡牌入场过渡 */
.card-appear-enter-active {
  animation: cardAppearIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-appear-leave-active {
  animation: cardAppearOut 0.3s ease-in;
}

@keyframes cardAppearIn {
  0% {
    opacity: 0;
    transform: translateY(30px) rotateY(90deg) scale(0.6);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotateY(0) scale(1);
  }
}

@keyframes cardAppearOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.6) rotateX(60deg);
  }
}

/* ========== 通用卡牌样式 ========== */
.card-frame {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #2c2c54, #1a1a2e);
  border: 2px solid #b8860b;
  display: flex;
  flex-direction: column;
}

.card-glow {
  position: absolute;
  inset: -2px;
  border-radius: 10px;
  pointer-events: none;
  opacity: 0.6;
  animation: glowPulse 3s ease-in-out infinite;
}

.rare .card-glow {
  box-shadow: 0 0 15px rgba(33, 150, 243, 0.5);
}

.epic .card-glow {
  box-shadow: 0 0 20px rgba(156, 39, 176, 0.6);
}

.legendary .card-glow {
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.7);
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.12) 50%,
    transparent 100%
  );
  animation: shineMove 4s linear infinite;
  pointer-events: none;
}

@keyframes shineMove {
  0% { left: -100%; }
  100% { left: 100%; }
}

.card-cost {
  position: absolute;
  top: -6px;
  left: -6px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(145deg, #4fc3f7, #0288d1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 16px;
  color: #fff;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 10px rgba(79, 195, 247, 0.5);
  z-index: 5;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.card-art {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.1) 0%, transparent 100%);
}

.card-emoji {
  font-size: 42px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
}

.card-name {
  padding: 4px 6px;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  color: #ffd700;
  background: rgba(0, 0, 0, 0.3);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  font-family: 'Noto Sans SC', sans-serif;
}

.card-type {
  padding: 2px 6px;
  display: flex;
  justify-content: center;
}

.skill-badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
}

.skill-badge.combo {
  background: linear-gradient(135deg, #ff5722, #ff9800);
}

.skill-badge.taunt {
  background: linear-gradient(135deg, #795548, #9e9e9e);
}

.skill-badge.heal {
  background: linear-gradient(135deg, #4caf50, #8bc34a);
}

.skill-val {
  margin-left: 3px;
  opacity: 0.9;
}

.card-stats {
  display: flex;
  justify-content: space-between;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.4);
}

.stat {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  font-weight: 800;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.stat.atk {
  color: #ff9800;
}

.stat.hp {
  color: #f44336;
}

.stat.hp.low {
  color: #ff5252;
  animation: hpLowPulse 1s ease-in-out infinite;
}

@keyframes hpLowPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.stat-icon {
  font-size: 12px;
}

.taunt-shield {
  position: absolute;
  inset: -4px;
  border: 3px solid #795548;
  border-radius: 10px;
  pointer-events: none;
  box-shadow: 0 0 10px rgba(121, 85, 72, 0.6), inset 0 0 10px rgba(121, 85, 72, 0.3);
}

/* ========== 飘字伤害 ========== */
.floating-texts {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 100;
}

.floating-text {
  position: absolute;
  font-size: 28px;
  font-weight: 900;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px currentColor;
  transform: translate(-50%, -50%);
  animation: floatUp 1.2s ease-out forwards;
  pointer-events: none;
  z-index: 100;
}

@keyframes floatUp {
  0% {
    opacity: 0;
    transform: translate(-50%, -30%) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -60%) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -120%) scale(1);
  }
}

.particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
}

/* ========== 手牌区域 ========== */
.hand-area {
  position: relative;
  z-index: 10;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 20px;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, transparent 100%);
}

.hand-cards {
  position: relative;
  display: flex;
  justify-content: center;
  min-height: 170px;
}

.hand-card-wrapper {
  position: relative;
  width: 110px;
  height: 160px;
  margin: 0 -5px;
  transition: transform 0.3s ease, margin 0.3s ease;
  transform-origin: bottom center;
}

.hand-card {
  width: 100%;
  height: 100%;
  cursor: grab;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  transform-origin: bottom center;
}

.hand-card:hover {
  transform: translateY(-20px) scale(1.1);
  z-index: 100;
}

.hand-card.dragging {
  opacity: 0.5;
  transform: scale(1.1);
  cursor: grabbing;
}

.hand-card.disabled {
  filter: grayscale(0.8) brightness(0.6);
  cursor: not-allowed;
}

.hand-card.disabled:hover {
  transform: none;
}

.mana-tooltip {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  padding: 5px 12px;
  background: rgba(244, 67, 54, 0.95);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 200;
  box-shadow: 0 2px 10px rgba(244, 67, 54, 0.5);
}

.mana-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(244, 67, 54, 0.95);
}

.hand-card.disabled:hover .mana-tooltip {
  opacity: 1;
}

/* ========== 结束回合按钮 ========== */
.end-turn-btn {
  position: absolute;
  right: 30px;
  bottom: 100px;
  z-index: 20;
  padding: 14px 30px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(145deg, #3d3d5c, #2a2a40);
  color: #666;
  font-size: 15px;
  font-weight: 700;
  cursor: not-allowed;
  overflow: hidden;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.end-turn-btn.active {
  background: linear-gradient(145deg, #ffd700, #b8860b);
  color: #1a1a2e;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);
}

.end-turn-btn.active:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(255, 215, 0, 0.6);
}

.end-turn-btn.active:active {
  transform: translateY(-2px);
}

.btn-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.end-turn-btn.active:hover .btn-glow {
  opacity: 1;
}

.btn-text {
  position: relative;
  z-index: 1;
}

/* ========== 开始游戏覆盖层 ========== */
.start-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(10, 14, 39, 0.96) 0%, rgba(26, 10, 46, 0.96) 100%);
  backdrop-filter: blur(10px);
}

.start-content {
  text-align: center;
}

.game-title {
  font-family: 'Cinzel', serif;
  font-size: 64px;
  font-weight: 900;
  color: #ffd700;
  text-shadow: 0 0 40px rgba(255, 215, 0, 0.6), 0 4px 8px rgba(0, 0, 0, 0.5);
  margin-bottom: 12px;
  letter-spacing: 8px;
  animation: titleGlow 2s ease-in-out infinite alternate;
}

@keyframes titleGlow {
  from { text-shadow: 0 0 30px rgba(255, 215, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.5); }
  to { text-shadow: 0 0 60px rgba(255, 215, 0, 0.8), 0 0 100px rgba(255, 215, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.5); }
}

.game-subtitle {
  font-size: 18px;
  color: #9c27b0;
  margin-bottom: 48px;
  letter-spacing: 4px;
  text-shadow: 0 0 20px rgba(156, 39, 176, 0.5);
}

.start-btn {
  position: relative;
  padding: 18px 54px;
  border: 2px solid #ffd700;
  border-radius: 30px;
  background: linear-gradient(145deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.05));
  color: #ffd700;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  letter-spacing: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.start-btn:hover {
  background: linear-gradient(145deg, #ffd700, #b8860b);
  color: #1a1a2e;
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(255, 215, 0, 0.5);
}

.btn-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: shimmerMove 2s ease-in-out infinite;
}

@keyframes shimmerMove {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.game-hints {
  margin-top: 40px;
  color: #888;
  font-size: 14px;
  line-height: 2;
}

.game-hints p {
  margin: 6px 0;
}

/* ========== 战斗统计面板 ========== */
.stats-drawer {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  max-width: 90vw;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
  border: 2px solid #ffd700;
  border-radius: 20px 20px 0 0;
  border-bottom: none;
  z-index: 500;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.2);
}

.drawer-handle {
  width: 60px;
  height: 6px;
  margin: 12px auto 0;
  background: rgba(255, 215, 0, 0.4);
  border-radius: 3px;
}

.stats-content {
  padding: 20px 30px 30px;
}

.stats-title {
  text-align: center;
  font-family: 'Cinzel', serif;
  font-size: 28px;
  font-weight: 900;
  color: #ffd700;
  margin-bottom: 24px;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.stats-grid {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.stats-row {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stats-row:last-child {
  border-bottom: none;
}

.stats-row.header {
  font-weight: 700;
  color: #888;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-label {
  flex: 1.2;
  color: #aaa;
  font-size: 14px;
  font-weight: 500;
}

.col-player, .col-enemy {
  flex: 1;
  text-align: center;
  font-weight: 700;
  font-size: 16px;
}

.col-player {
  color: #4caf50;
}

.col-enemy {
  color: #f44336;
}

.col-player.dmg, .col-enemy.dmg {
  color: #ff9800;
}

.col-player.kill, .col-enemy.kill {
  color: #e91e63;
}

.col-player.heal, .col-enemy.heal {
  color: #8bc34a;
}

.play-again-btn {
  width: 100%;
  padding: 14px;
  border: 2px solid #ffd700;
  border-radius: 25px;
  background: linear-gradient(145deg, #ffd700, #b8860b);
  color: #1a1a2e;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  letter-spacing: 2px;
  transition: all 0.3s ease;
}

.play-again-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
}

/* ========== 抽屉动画 ========== */
.drawer-enter-active {
  animation: drawerSpring 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.drawer-leave-active {
  animation: drawerOut 0.4s ease-in forwards;
}

@keyframes drawerSpring {
  0% {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
  60% {
    transform: translateX(-50%) translateY(-10px);
  }
  80% {
    transform: translateX(-50%) translateY(5px);
  }
  100% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes drawerOut {
  from {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
}

/* ========== 结果遮罩 ========== */
.result-overlay {
  position: absolute;
  inset: 0;
  z-index: 800;
  pointer-events: none;
  overflow: hidden;
}

.result-overlay.player {
  background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
}

.result-overlay.enemy {
  background: radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.6) 100%);
  animation: defeatShrink 2s ease-out forwards;
}

@keyframes defeatShrink {
  0% {
    background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0) 100%);
  }
  100% {
    background: radial-gradient(ellipse at center, transparent 15%, rgba(30, 30, 50, 0.8) 100%);
  }
}

.defeat-vignette {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 150px 50px rgba(20, 20, 40, 0.8);
  animation: vignetteGrow 2s ease-out forwards;
}

@keyframes vignetteGrow {
  0% {
    box-shadow: inset 0 0 0 0 rgba(20, 20, 40, 0);
  }
  100% {
    box-shadow: inset 0 0 200px 80px rgba(20, 20, 40, 0.9);
  }
}

/* 胜利金色粒子 */
.victory-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.gold-particle {
  position: absolute;
  background: linear-gradient(135deg, #ffd700, #ffeb3b);
  border-radius: 50%;
  box-shadow: 0 0 10px #ffd700, 0 0 20px rgba(255, 215, 0, 0.5);
  animation: goldFloatUp 3s ease-out infinite;
  opacity: 0;
}

@keyframes goldFloatUp {
  0% {
    transform: translateY(0) scale(0.5);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  50% {
    opacity: 0.9;
  }
  100% {
    transform: translateY(-120vh) scale(1) rotate(360deg);
    opacity: 0;
  }
}

/* ========== 过渡动画 ========== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.result-overlay-enter-active {
  transition: opacity 0.8s ease;
}

.result-overlay-leave-active {
  transition: opacity 0.5s ease;
}

.result-overlay-enter-from,
.result-overlay-leave-to {
  opacity: 0;
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .grid-cell {
    width: 90px;
    height: 125px;
  }

  .hand-card-wrapper {
    width: 90px;
    height: 130px;
  }

  .card-emoji {
    font-size: 32px;
  }

  .card-name {
    font-size: 10px;
  }

  .info-panel {
    min-width: 160px;
  }

  .game-title {
    font-size: 48px;
  }
}

@media (max-width: 768px) {
  .grid-cell {
    width: 70px;
    height: 100px;
  }

  .hand-card-wrapper {
    width: 70px;
    height: 105px;
  }

  .battlefield {
    padding: 10px;
  }

  .grid-row {
    gap: 6px;
    margin-bottom: 6px;
  }

  .card-cost {
    width: 24px;
    height: 24px;
    font-size: 12px;
    top: -4px;
    left: -4px;
  }

  .card-emoji {
    font-size: 24px;
  }

  .stat {
    font-size: 11px;
  }

  .top-bar {
    padding: 8px 12px;
  }

  .avatar {
    width: 44px;
    height: 44px;
    font-size: 24px;
  }

  .info-panel {
    min-width: 120px;
    gap: 4px;
  }

  .player-name {
    font-size: 12px;
  }

  .health-bar {
    height: 18px;
  }

  .mana-crystal {
    width: 12px;
    height: 16px;
  }

  .end-turn-btn {
    right: 12px;
    bottom: 80px;
    padding: 10px 18px;
    font-size: 12px;
  }

  .game-title {
    font-size: 36px;
    letter-spacing: 4px;
  }
}
</style>