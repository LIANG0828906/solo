<template>
  <div class="user-panel">
    <div class="user-info">
      <div class="avatar" :style="{ backgroundColor: user?.avatarColor }">
        {{ user?.name?.charAt(0) || 'U' }}
      </div>
      <h3 class="user-name">{{ user?.name || '加载中...' }}</h3>
    </div>

    <div class="preferences-section">
      <h4 class="section-title">体能等级</h4>
      <n-radio-group v-model:value="localPreferences.fitnessLevel">
        <n-space vertical>
          <n-radio value="beginner">初级</n-radio>
          <n-radio value="intermediate">中级</n-radio>
          <n-radio value="advanced">高级</n-radio>
        </n-space>
      </n-radio-group>
    </div>

    <div class="preferences-section">
      <h4 class="section-title">运动偏好</h4>
      <n-checkbox-group v-model:value="localPreferences.preferences">
        <n-space vertical>
          <n-checkbox value="cycling">🚴 骑行</n-checkbox>
          <n-checkbox value="hiking">🥾 徒步</n-checkbox>
          <n-checkbox value="running">🏃 跑步</n-checkbox>
          <n-checkbox value="climbing">🧗 登山</n-checkbox>
        </n-space>
      </n-checkbox-group>
    </div>

    <div class="preferences-section">
      <h4 class="section-title">位置范围</h4>
      <div class="radius-input">
        <n-input-number
          v-model:value="localPreferences.locationRadius"
          :min="1"
          :max="50"
          style="width: 100%"
        />
        <span class="radius-unit">km</span>
      </div>
    </div>

    <n-button
      type="primary"
      block
      :loading="saving"
      @click="savePreferences"
    >
      保存设置
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { User, FitnessLevel, SportType } from '@/types'
import { updateUserPreferences } from '@/api'

const props = defineProps<{
  user: User | null
}>()

const emit = defineEmits<{
  (e: 'update', user: User): void
}>()

const saving = ref(false)

const localPreferences = ref({
  fitnessLevel: 'intermediate' as FitnessLevel,
  preferences: ['hiking', 'cycling'] as SportType[],
  locationRadius: 10
})

watch(() => props.user, (user) => {
  if (user) {
    localPreferences.value.fitnessLevel = user.fitnessLevel
    localPreferences.value.preferences = [...user.preferences]
    localPreferences.value.locationRadius = user.locationRadius
  }
}, { immediate: true })

const savedPrefs = localStorage.getItem('weekendplan_preferences')
if (savedPrefs) {
  try {
    const parsed = JSON.parse(savedPrefs)
    localPreferences.value = { ...localPreferences.value, ...parsed }
  } catch (e) {
    console.warn('Failed to load saved preferences')
  }
}

async function savePreferences() {
  if (!props.user) return
  saving.value = true

  localStorage.setItem('weekendplan_preferences', JSON.stringify(localPreferences.value))

  try {
    const res = await updateUserPreferences(
      localPreferences.value.fitnessLevel,
      localPreferences.value.preferences,
      localPreferences.value.locationRadius
    )
    emit('update', res.user)
  } catch (e) {
    console.error('Save failed:', e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.user-panel {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.user-info {
  text-align: center;
  margin-bottom: 24px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  margin: 0 auto 12px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #2d3436;
  margin: 0;
}

.preferences-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 12px;
}

.radius-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.radius-unit {
  font-size: 14px;
  color: #95a5a6;
  white-space: nowrap;
}
</style>
