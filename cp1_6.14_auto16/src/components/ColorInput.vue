<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import chroma from 'chroma-js'
import { isValidColor, colorToHex } from '@/utils/contrastCalculator'

const props = defineProps<{
  modelValue: string
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputValue = ref(props.modelValue)
const isValid = ref(true)
const errorMessage = ref('')
const isFocused = ref(false)

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== inputValue.value) {
      inputValue.value = newVal
      validateAndEmit(newVal, false)
    }
  }
)

const pickerValue = computed(() => {
  try {
    return colorToHex(inputValue.value)
  } catch {
    return '#000000'
  }
})

function validateAndEmit(value: string, shouldEmit: boolean = true) {
  if (!value || value.trim() === '') {
    isValid.value = true
    errorMessage.value = ''
    return
  }

  const valid = isValidColor(value)
  isValid.value = valid

  if (!valid) {
    errorMessage.value = '无效的颜色值'
  } else {
    errorMessage.value = ''
    if (shouldEmit) {
      const hex = colorToHex(value)
      emit('update:modelValue', hex)
    }
  }
}

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  inputValue.value = target.value
  validateAndEmit(target.value)
}

function onPickerChange(e: Event) {
  const target = e.target as HTMLInputElement
  inputValue.value = target.value
  isValid.value = true
  errorMessage.value = ''
  emit('update:modelValue', target.value)
}

const borderColorClass = computed(() => {
  if (!inputValue.value || inputValue.value.trim() === '') return 'border-gray-300'
  return isValid.value ? 'border-valid' : 'border-invalid'
})
</script>

<template>
  <div class="color-input-wrapper">
    <label class="input-label">{{ label }}</label>
    <div class="input-row">
      <div
        class="text-input-container"
        :class="[borderColorClass, { focused: isFocused }]"
      >
        <input
          type="text"
          :value="inputValue"
          @input="onInput"
          @focus="isFocused = true"
          @blur="isFocused = false"
          class="text-input"
          placeholder="#000000 或 rgba(0,0,0,1)"
        />
        <div class="color-swatch" :style="{ backgroundColor: isValid && inputValue ? inputValue : 'transparent' }"></div>
      </div>
      <label class="picker-wrapper">
        <input
          type="color"
          :value="pickerValue"
          @input="onPickerChange"
          class="color-picker"
        />
        <span class="picker-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        </span>
      </label>
    </div>
    <transition name="error-fade">
      <span v-if="errorMessage" class="error-msg">{{ errorMessage }}</span>
    </transition>
  </div>
</template>

<style scoped>
.color-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #1E3A5F;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.text-input-container {
  flex: 1;
  display: flex;
  align-items: center;
  border: 2px solid;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background: white;
}

.text-input-container.border-valid {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.text-input-container.border-invalid {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.text-input-container.focused.border-valid {
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15);
}

.text-input-container.focused.border-invalid {
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
}

.text-input {
  flex: 1;
  padding: 10px 12px;
  border: none;
  outline: none;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: #1E3A5F;
  background: transparent;
  min-width: 0;
}

.text-input::placeholder {
  color: #94a3b8;
  font-size: 12px;
}

.color-swatch {
  width: 28px;
  height: 28px;
  margin-right: 6px;
  border-radius: 8px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.picker-wrapper {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: white;
  border: 2px solid #e2e8f0;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.picker-wrapper:hover {
  border-color: #1E3A5F;
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.15);
}

.color-picker {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.picker-icon {
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.picker-wrapper:hover .picker-icon {
  color: #1E3A5F;
}

.error-msg {
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  color: #ef4444;
  padding-left: 2px;
}

.error-fade-enter-active,
.error-fade-leave-active {
  transition: opacity 0.2s ease;
}

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
}
</style>
