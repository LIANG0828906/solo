<template>
  <div class="game-container" ref="gameContainerRef">
    <div class="starfield">
      <div class="stars stars-1"></div>
      <div class="stars stars-2"></div>
      <div class="stars stars-3"></div>
    </div>

    <div class="nebula">
      <div class="nebula-core"></div>
      <div class="nebula-ring ring-1"></div>
      <div class="nebula-ring ring-2"></div>
    </div>

    <div class="top-bar">
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

      <div class="turn-info">
        <div class="turn-number">第 {{ store.turn }} 回合</div>
        <div class="phase-badge" :class="store.phase">
          {{ phaseText }}
        </div>
      </div>

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
                      <span v-if="cell.card.skillValue" class="skill-val">{{ cell.card.s