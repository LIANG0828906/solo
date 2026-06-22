<template>
  <div class="team-panel">
    <h3 class="panel-title">小组动态</h3>

    <div class="join-section">
      <n-input
        v-model:value="inviteCodeInput"
        placeholder="输入邀请码加入小组"
        maxlength="6"
        style="margin-bottom: 8px"
      />
      <n-button
        type="primary"
        block
        size="small"
        :disabled="!inviteCodeInput || inviteCodeInput.length < 6"
        :loading="joining"
        @click="joinTeam"
      >
        加入小组
      </n-button>
    </div>

    <div v-if="currentTeam" class="team-info">
      <div class="team-header">
        <span class="team-label">邀请码</span>
        <div class="invite-code-display">
          <span class="code-text">{{ currentTeam.inviteCode }}</span>
          <n-button size="tiny" text @click="copyInviteCode">复制</n-button>
        </div>
      </div>

      <div class="members-section">
        <span class="team-label">成员 ({{ currentTeam.members.length }}/{{ currentTeam.maxMembers }})</span>
        <div class="members-list">
          <div
            v-for="member in currentTeam.members"
            :key="member.userId"
            class="member-avatar"
            :style="{ backgroundColor: member.avatarColor }"
            :title="member.userName"
          >
            {{ member.userName.charAt(0) }}
          </div>
        </div>
      </div>

      <div class="team-status">
        <n-tag :type="getStatusType(currentTeam.status)" size="small">
          {{ getStatusText(currentTeam.status) }}
        </n-tag>
      </div>

      <div v-if="isLeader && currentTeam.status === 'recruiting'" class="team-actions">
        <n-button
          type="primary"
          block
          size="small"
          :disabled="currentTeam.members.length < 2"
          @click="$emit('startVote')"
        >
          发起投票
        </n-button>
      </div>

      <div v-if="currentTeam.vote && !currentTeam.vote.result" class="vote-section">
        <div class="vote-header">
          <span class="vote-title">投票进行中</span>
          <span class="vote-countdown">{{ formatCountdown(currentTeam.vote.endTime) }}</span>
        </div>
        <div class="vote-options">
          <n-space vertical size="small" style="width: 100%">
            <n-button
              v-for="option in currentTeam.vote.options"
              :key="option.id"
              :type="hasVotedFor(option.id) ? 'primary' : 'default'"
              block
              size="small"
              :disabled="hasVoted"
              @click="submitVote(option.id)"
            >
              {{ option.label }}
              <span class="vote-count">({{ getVoteCount(option.id) }}票)</span>
            </n-button>
          </n-space>
        </div>
      </div>

      <div v-if="currentTeam.vote?.result" class="vote-result">
        <n-alert type="success" title="投票结果">
          <template #icon>🎉</template>
          {{ currentTeam.vote.result.label }}
        </n-alert>
      </div>
    </div>

    <div v-else class="empty-state">
      <p class="empty-text">暂无小组</p>
      <p class="empty-desc">在推荐计划中点击"发起组队"</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Team, User, Vote } from '@/types'

const props = defineProps<{
  currentTeam: Team | null
  currentUser: User | null
}>()

const emit = defineEmits<{
  (e: 'startVote'): void
  (e: 'submitVote', optionId: string): void
  (e: 'joinTeam', code: string): void
}>()

const inviteCodeInput = ref('')
const joining = ref(false)

const isLeader = computed(() => {
  return props.currentUser && props.currentTeam?.leaderId === props.currentUser.id
})

const hasVoted = computed(() => {
  if (!props.currentTeam?.vote || !props.currentUser) return false
  return Object.values(props.currentTeam.vote.votes).some(voters =>
    voters.includes(props.currentUser!.id)
  )
})

function hasVotedFor(optionId: string): boolean {
  if (!props.currentTeam?.vote || !props.currentUser) return false
  return props.currentTeam.vote.votes[optionId]?.includes(props.currentUser.id) || false
}

function getVoteCount(optionId: string): number {
  return props.currentTeam?.vote?.votes[optionId]?.length || 0
}

function getStatusType(status: string): 'default' | 'success' | 'warning' | 'info' | 'error' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'info' | 'error'> = {
    recruiting: 'info',
    voting: 'warning',
    confirmed: 'success',
    cancelled: 'error'
  }
  return map[status] || 'default'
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    recruiting: '招募中',
    voting: '投票中',
    confirmed: '已确认',
    cancelled: '已取消'
  }
  return map[status] || status
}

function formatCountdown(endTime: number): string {
  const remaining = endTime - Date.now()
  if (remaining <= 0) return '已结束'
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function copyInviteCode() {
  if (props.currentTeam) {
    navigator.clipboard.writeText(props.currentTeam.inviteCode)
  }
}

function submitVote(optionId: string) {
  emit('submitVote', optionId)
}

async function joinTeam() {
  if (!inviteCodeInput.value) return
  joining.value = true
  emit('joinTeam', inviteCodeInput.value.toUpperCase())
  setTimeout(() => {
    joining.value = false
    inviteCodeInput.value = ''
  }, 500)
}
</script>

<style scoped>
.team-panel {
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  height: calc(100vh - 56px - 32px);
  overflow-y: auto;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #2d3436;
  margin: 0 0 16px 0;
}

.join-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ecf0f1;
}

.team-info {
  margin-bottom: 16px;
}

.team-header {
  margin-bottom: 16px;
}

.team-label {
  display: block;
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 6px;
}

.invite-code-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 8px;
}

.code-text {
  font-family: 'Courier New', monospace;
  font-size: 20px;
  font-weight: 600;
  color: #2d3436;
  letter-spacing: 2px;
}

.members-section {
  margin-bottom: 16px;
}

.members-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.member-avatar:hover {
  transform: scale(1.1);
}

.team-status {
  margin-bottom: 16px;
}

.team-actions {
  margin-bottom: 16px;
}

.vote-section {
  padding: 12px;
  background: #f8fff8;
  border-radius: 8px;
  margin-bottom: 16px;
}

.vote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.vote-title {
  font-size: 14px;
  font-weight: 600;
  color: #2e7d32;
}

.vote-countdown {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #e74c3c;
  font-weight: 600;
}

.vote-options {
  width: 100%;
}

.vote-count {
  color: #95a5a6;
  font-size: 12px;
  margin-left: 4px;
}

.vote-result {
  margin-bottom: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.empty-text {
  font-size: 14px;
  color: #95a5a6;
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 12px;
  color: #bdc3c7;
  margin: 0;
}
</style>
