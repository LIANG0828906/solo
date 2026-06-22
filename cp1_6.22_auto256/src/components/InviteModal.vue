<template>
  <n-modal
    v-model:show="modalShow"
    preset="dialog"
    :title="'组队邀请码'"
    :mask-closable="false"
    :close-on-esc="true"
    style="width: 360px"
  >
    <div class="invite-content">
      <p class="invite-desc">分享以下邀请码给好友，让他们加入你的运动小组</p>
      <div class="invite-code-box">
        <span class="invite-code">{{ inviteCode }}</span>
      </div>
      <div class="invite-actions">
        <n-button type="primary" block @click="copyAndClose">
          复制邀请码
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

const props = defineProps<{
  show: boolean
  inviteCode: string
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'copied'): void
}>()

const modalShow = computed({
  get: () => props.show,
  set: (val: boolean) => emit('update:show', val)
})

function copyAndClose() {
  navigator.clipboard.writeText(props.inviteCode)
  emit('copied')
  emit('update:show', false)
}
</script>

<style scoped>
.invite-content {
  text-align: center;
}

.invite-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.invite-code-box {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.invite-code {
  font-family: 'Courier New', monospace;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 8px;
  color: #2d3436;
}

.invite-actions {
  display: flex;
  justify-content: center;
}
</style>
