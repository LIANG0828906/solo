<template>
  <n-modal
    v-model:show="modalShow"
    preset="dialog"
    :title="'投票确认'"
    :mask-closable="false"
    :close-on-esc="false"
    style="width: 400px"
  >
    <div class="vote-content">
      <p class="vote-desc">请选择投票选项（3个方案）</p>
      <n-space vertical size="medium" style="width: 100%">
        <div v-for="option in options" :key="option.id" class="vote-option-item">
          <n-radio :value="option.id" :label="option.label" />
        </div>
      </n-space>
    </div>
    <template #action>
      <n-button type="primary" :disabled="!selectedOption" @click="confirm">
        发起投票
      </n-button>
    </template>
  </n-modal>

  <n-modal v-model:show="resultModalShow" preset="card" :mask-closable="false" :close-on-esc="false">
    <div class="result-modal">
      <div class="result-icon">🎉</div>
      <h3 class="result-title">投票结果</h3>
      <p class="result-label" v-if="result">最终方案：{{ result.label }}</p>
      <p class="result-value" v-if="result">{{ result.value }}</p>
      <n-button type="primary" size="large" style="margin-top: 24px" @click="closeResult">
        确定
      </n-button>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VoteOption } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const props = defineProps<{
  show: boolean
  resultShow: boolean
  result: VoteOption | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'update:resultShow', value: boolean): void
  (e: 'confirm', options: VoteOption[]): void
}>()

const modalShow = computed({
  get: () => props.show,
  set: (val: boolean) => emit('update:show', val)
})

const resultModalShow = computed({
  get: () => props.resultShow,
  set: (val: boolean) => emit('update:resultShow', val)
})

const selectedOption = ref<string | null>(null)

const options = ref<VoteOption[]>([
  { id: uuidv4(), type: 'time', label: '周六上午 8:00 集合', value: '周六上午 8:00' },
  { id: uuidv4(), type: 'time', label: '周六下午 14:00 集合', value: '周六下午 14:00' },
  { id: uuidv4(), type: 'cancel', label: '取消本次活动', value: '取消' }
])

watch(() => props.show, (val) => {
  if (val) {
    selectedOption.value = null
  }
})

function confirm() {
  emit('confirm', options.value)
  emit('update:show', false)
}

function closeResult() {
  emit('update:resultShow', false)
}
</script>

<style scoped>
.vote-content {
  padding: 8px 0;
}

.vote-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.vote-option-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.result-modal {
  background: #2d3436;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  color: #ffffff;
}

.result-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.result-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #ffffff;
}

.result-label {
  font-size: 16px;
  color: #bdc3c7;
  margin: 0 0 8px 0;
}

.result-value {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}
</style>
