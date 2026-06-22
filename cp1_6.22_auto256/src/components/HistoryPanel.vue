<template>
  <n-drawer v-model:show="drawerShow" placement="right" :width="400">
    <n-drawer-content title="我的历史记录" :native-scrollbar="false">
      <div v-if="loading" class="history-loading">
        <n-spin size="large" />
      </div>
      <div v-else-if="history.length === 0" class="history-empty">
        <p class="empty-icon">📝</p>
        <p class="empty-text">暂无运动记录</p>
      </div>
      <div v-else class="history-list">
        <div
          v-for="item in history"
          :key="item.id"
          class="history-item"
          @click="toggleExpand(item.id)"
        >
          <div class="history-header">
            <div class="history-info">
              <span class="sport-icon">{{ getSportIcon(item.plan.sport.type) }}</span>
              <div class="history-text">
                <h4 class="history-title">{{ item.plan.sport.name }}</h4>
                <p class="history-date">{{ formatDate(item.completedAt) }}</p>
              </div>
            </div>
            <div class="member-avatars">
              <div
                v-for="(member, idx) in item.team.members.slice(0, 4)"
                :key="member.userId"
                class="mini-avatar"
                :style="{
                  backgroundColor: member.avatarColor,
                  marginLeft: idx > 0 ? '-8px' : '0',
                  zIndex: 4 - idx
                }"
                :title="member.userName"
              >
                {{ member.userName.charAt(0) }}
              </div>
              <div v-if="item.team.members.length > 4" class="more-avatar">
                +{{ item.team.members.length - 4 }}
              </div>
            </div>
          </div>

          <div v-if="expandedId === item.id" class="history-detail">
            <div class="detail-row">
              <span class="detail-label">最终时间</span>
              <span class="detail-value">{{ item.finalTime || '待定' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">路线</span>
              <span class="detail-value">{{ item.finalRoute || '待确定' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">参与成员</span>
              <span class="detail-value">{{ item.team.members.map(m => m.userName).join('、') }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">小组状态</span>
              <n-tag :type="item.team.status === 'confirmed' ? 'success' : 'default'" size="small">
                {{ item.team.status === 'confirmed' ? '已完成' : '已取消' }}
              </n-tag>
            </div>
          </div>

          <div class="expand-icon">
            {{ expandedId === item.id ? '▲' : '▼' }}
          </div>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PlanHistory } from '@/types'
import { getUserHistory } from '@/api'

const props = defineProps<{
  show: boolean
  userId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const drawerShow = computed({
  get: () => props.show,
  set: (val: boolean) => emit('update:show', val)
})

const history = ref<PlanHistory[]>([])
const loading = ref(false)
const expandedId = ref<string | null>(null)

watch(() => props.show, async (val) => {
  if (val && props.userId) {
    await loadHistory()
  }
})

async function loadHistory() {
  loading.value = true
  try {
    const res = await getUserHistory()
    history.value = res.history.sort((a, b) => b.completedAt - a.completedAt)
  } catch (e) {
    console.error('Load history failed:', e)
  } finally {
    loading.value = false
  }
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function getSportIcon(type: string): string {
  const icons: Record<string, string> = {
    cycling: '🚴',
    hiking: '🥾',
    running: '🏃',
    climbing: '🧗'
  }
  return icons[type] || '🏃'
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.history-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.history-empty {
  text-align: center;
  padding: 60px 0;
}

.empty-icon {
  font-size: 48px;
  margin: 0 0 16px 0;
}

.empty-text {
  font-size: 14px;
  color: #95a5a6;
  margin: 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.history-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sport-icon {
  font-size: 28px;
}

.history-text {
  flex: 1;
}

.history-title {
  font-size: 15px;
  font-weight: 600;
  color: #2d3436;
  margin: 0 0 4px 0;
}

.history-date {
  font-size: 13px;
  color: #95a5a6;
  margin: 0;
}

.member-avatars {
  display: flex;
  align-items: center;
}

.mini-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border: 2px solid #fff;
  position: relative;
}

.more-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ecf0f1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7f8c8d;
  font-size: 10px;
  font-weight: 600;
  margin-left: -8px;
  border: 2px solid #fff;
  z-index: 0;
}

.history-detail {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ecf0f1;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
}

.detail-label {
  color: #95a5a6;
}

.detail-value {
  color: #2d3436;
  font-weight: 500;
  text-align: right;
  max-width: 60%;
}

.expand-icon {
  position: absolute;
  bottom: 8px;
  right: 16px;
  font-size: 10px;
  color: #bdc3c7;
}
</style>
