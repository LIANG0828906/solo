<template>
  <div class="app-container">
    <header class="top-nav">
      <div class="nav-left">
        <span class="logo">🏕️ WeekendPlan</span>
      </div>
      <div class="nav-right">
        <n-button text @click="showHistory = true" style="color: #fff; margin-right: 16px">
          📋 我的记录
        </n-button>
        <div class="user-info-nav">
          <div class="nav-avatar" :style="{ backgroundColor: currentUser?.avatarColor }">
            {{ currentUser?.name?.charAt(0) || 'U' }}
          </div>
          <span class="nav-username">{{ currentUser?.name || '加载中...' }}</span>
        </div>
      </div>
    </header>

    <div class="main-layout">
      <aside class="left-panel">
        <UserPanel
          :user="currentUser"
          @update="handleUserUpdate"
        />
      </aside>

      <main class="main-content">
        <div class="content-header">
          <h2 class="content-title">本周末推荐计划</h2>
          <n-button size="small" @click="refreshRecommendations">
            🔄 刷新推荐
          </n-button>
        </div>

        <div v-if="loading" class="plans-grid">
          <SkeletonCard v-for="i in 5" :key="i" />
        </div>

        <div v-else-if="recommendations.length === 0" class="empty-plans">
          <p class="empty-icon">☹️</p>
          <p class="empty-text">暂无符合条件的运动推荐</p>
          <p class="empty-desc">请调整您的运动偏好或体能等级</p>
        </div>

        <div v-else class="plans-grid">
          <PlanCard
            v-for="plan in recommendations"
            :key="plan.id"
            :plan="plan"
            @team="handleCreateTeam(plan)"
          />
        </div>
      </main>

      <aside class="right-panel">
        <TeamPanel
          :current-team="currentTeam"
          :current-user="currentUser"
          @start-vote="handleStartVote"
          @submit-vote="handleSubmitVote"
          @join-team="handleJoinTeam"
        />
      </aside>
    </div>

    <InviteModal
      v-model:show="showInviteModal"
      :invite-code="currentTeam?.inviteCode || ''"
      @copied="handleInviteCopied"
    />

    <VoteModal
      v-model:show="showVoteModal"
      v-model:result-show="showVoteResult"
      :result="voteResult"
      @confirm="handleVoteConfirm"
    />

    <HistoryPanel
      v-model:show="showHistory"
      :user-id="currentUser?.id || null"
    />

    <n-message-provider>
      <div id="message-container"></div>
    </n-message-provider>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useMessage } from 'naive-ui'
import type { User, RecommendedPlan, Team, VoteOption, Vote } from '@/types'
import { getCurrentUser } from '@/api'
import { planGenerator } from '@/PlanGenerator'
import { teamManager } from '@/TeamManager'
import { generateWeatherData } from '@/utils/weather'
import UserPanel from '@/components/UserPanel.vue'
import TeamPanel from '@/components/TeamPanel.vue'
import PlanCard from '@/components/PlanCard.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import InviteModal from '@/components/InviteModal.vue'
import VoteModal from '@/components/VoteModal.vue'
import HistoryPanel from '@/components/HistoryPanel.vue'

const message = useMessage()

const currentUser = ref<User | null>(null)
const recommendations = ref<RecommendedPlan[]>([])
const loading = ref(false)
const currentTeam = ref<Team | null>(null)
const showInviteModal = ref(false)
const showVoteModal = ref(false)
const showVoteResult = ref(false)
const showHistory = ref(false)
const voteResult = ref<VoteOption | null>(null)

let votePollTimer: number | null = null

onMounted(async () => {
  await initUser()
  await loadRecommendations()
  startVotePolling()
})

onUnmounted(() => {
  if (votePollTimer) {
    clearInterval(votePollTimer)
  }
})

async function initUser() {
  try {
    let savedUserId = localStorage.getItem('weekendplan_userId')
    const res = await getCurrentUser()
    currentUser.value = res.user
    if (!savedUserId) {
      localStorage.setItem('weekendplan_userId', res.user.id)
    }
  } catch (e) {
    console.error('Init user failed:', e)
    message.error('加载用户信息失败')
  }
}

async function loadRecommendations() {
  if (!currentUser.value) return

  loading.value = true
  try {
    const startTime = performance.now()
    const weather = generateWeatherData()
    const plans = planGenerator.generate(currentUser.value, weather)
    recommendations.value = plans
    const endTime = performance.now()
    console.log(`Recommendations generated in ${endTime - startTime}ms`)
  } catch (e) {
    console.error('Load recommendations failed:', e)
    message.error('加载推荐计划失败')
  } finally {
    setTimeout(() => {
      loading.value = false
    }, 1000)
  }
}

function refreshRecommendations() {
  loadRecommendations()
  message.success('已刷新推荐')
}

function handleUserUpdate(user: User) {
  currentUser.value = user
  loadRecommendations()
  message.success('设置已保存')
}

async function handleCreateTeam(plan: RecommendedPlan) {
  if (!currentUser.value) return

  const existingTeam = teamManager.findTeamByPlanId(plan.id)
  if (existingTeam) {
    currentTeam.value = existingTeam
    showInviteModal.value = true
    return
  }

  try {
    const team = await teamManager.createTeam(currentUser.value, plan.id)
    currentTeam.value = team
    showInviteModal.value = true
    message.success('组队成功！')
  } catch (e) {
    console.error('Create team failed:', e)
    message.error('创建小组失败')
  }
}

async function handleJoinTeam(code: string) {
  if (!currentUser.value) return

  const team = await teamManager.joinTeam(currentUser.value, code)
  if (team) {
    currentTeam.value = team
    message.success('成功加入小组！')
  } else {
    message.error('邀请码无效或小组已满')
  }
}

function handleStartVote() {
  showVoteModal.value = true
}

async function handleVoteConfirm(options: VoteOption[]) {
  if (!currentTeam.value || !currentUser.value) return

  const vote = await teamManager.startVote(
    currentTeam.value.id,
    currentUser.value.id,
    options
  )

  if (vote) {
    currentTeam.value = { ...currentTeam.value, vote, status: 'voting' }
    message.success('投票已发起')
  }
}

async function handleSubmitVote(optionId: string) {
  if (!currentTeam.value || !currentUser.value) return

  const vote = await teamManager.submitVote(
    currentTeam.value.id,
    currentUser.value.id,
    optionId
  )

  if (vote) {
    currentTeam.value = { ...currentTeam.value, vote }
    message.success('投票成功')

    if (vote.result) {
      voteResult.value = vote.result
      showVoteResult.value = true
      currentTeam.value.status = 'confirmed'
    }
  }
}

function startVotePolling() {
  votePollTimer = window.setInterval(async () => {
    if (currentTeam.value?.vote && !currentTeam.value.vote.result) {
      const result = teamManager.checkVoteResult(currentTeam.value.vote)
      if (result) {
        currentTeam.value.vote.result = result
        currentTeam.value.status = 'confirmed'
        voteResult.value = result
        showVoteResult.value = true
      }
    }
  }, 200)
}

function handleInviteCopied() {
  message.success('邀请码已复制到剪贴板')
}

watch(currentUser, (user) => {
  if (user) {
    loadRecommendations()
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: #F0FFF0;
  color: #2d3436;
}

#app {
  min-height: 100vh;
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-nav {
  height: 56px;
  background: #2E7D32;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
}

.nav-right {
  display: flex;
  align-items: center;
}

.user-info-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.nav-username {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.main-layout {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.left-panel {
  width: 280px;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.right-panel {
  width: 260px;
  flex-shrink: 0;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.content-title {
  font-size: 20px;
  font-weight: 600;
  color: #2d3436;
  margin: 0;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.empty-plans {
  text-align: center;
  padding: 80px 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.empty-icon {
  font-size: 48px;
  margin: 0 0 16px 0;
}

.empty-text {
  font-size: 16px;
  color: #2d3436;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.empty-desc {
  font-size: 14px;
  color: #95a5a6;
  margin: 0;
}

#message-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

@media (max-width: 1200px) {
  .right-panel {
    position: fixed;
    right: 0;
    top: 56px;
    bottom: 0;
    background: #F0FFF0;
    z-index: 90;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }

  .right-panel.open {
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
    padding: 8px;
  }

  .left-panel,
  .right-panel {
    width: 100%;
  }

  .left-panel {
    order: 1;
  }

  .main-content {
    order: 2;
  }

  .right-panel {
    order: 3;
    position: static;
    transform: none;
    height: auto;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }

  .top-nav {
    padding: 0 16px;
  }

  .logo {
    font-size: 16px;
  }

  .nav-username {
    display: none;
  }
}
</style>
