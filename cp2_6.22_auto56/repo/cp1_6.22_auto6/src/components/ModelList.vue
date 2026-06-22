<template>
  <div class="model-list">
    <h3 class="list-title">展品库</h3>
    <div class="thumbnail-grid">
      <div
        v-for="item in exhibits"
        :key="item.id"
        class="thumbnail-card"
        :class="{ active: selectedId === item.id }"
        @click="handleClick(item.id)"
      >
        <div class="thumbnail-preview">
          <svg viewBox="0 0 100 100" class="thumbnail-icon">
            <use :href="`#icon-${item.thumbnail}`" />
          </svg>
          <div class="thumbnail-glow"></div>
        </div>
        <div class="thumbnail-info">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-category">{{ item.category }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { exhibits } from '@/data/exhibits'

interface Props {
  selectedId?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: ''
})

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const isLoading = ref(false)

const handleClick = (id: string) => {
  if (isLoading.value || id === props.selectedId) return
  isLoading.value = true
  emit('select', id)
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}
</script>

<style scoped>
.model-list {
  padding: 16px;
}

.list-title {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 16px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.thumbnail-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.thumbnail-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.thumbnail-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 210, 255, 0.1),
    transparent
  );
  transition: left 0.6s ease;
}

.thumbnail-card:hover::before {
  left: 100%;
}

.thumbnail-card:hover {
  transform: translateX(4px);
  border-color: rgba(0, 210, 255, 0.5);
  box-shadow: 0 4px 20px rgba(0, 210, 255, 0.2);
  background: rgba(0, 210, 255, 0.05);
}

.thumbnail-card.active {
  border-color: #00d2ff;
  background: rgba(0, 210, 255, 0.1);
  box-shadow: 0 0 20px rgba(0, 210, 255, 0.3);
}

.thumbnail-preview {
  position: relative;
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
}

.thumbnail-icon {
  width: 50px;
  height: 50px;
  fill: #00d2ff;
  filter: drop-shadow(0 0 8px rgba(0, 210, 255, 0.5));
}

.thumbnail-glow {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 20px;
  background: radial-gradient(ellipse at center, rgba(0, 210, 255, 0.3) 0%, transparent 70%);
  pointer-events: none;
}

.thumbnail-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.item-category {
  font-size: 11px;
  color: #888899;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.thumbnail-card.active .item-name {
  color: #00d2ff;
}

@media (max-width: 768px) {
  .model-list {
    padding: 12px;
  }

  .list-title {
    display: none;
  }

  .thumbnail-grid {
    flex-direction: row;
    gap: 8px;
  }

  .thumbnail-card {
    flex: 1;
    padding: 8px;
    min-width: 0;
  }

  .thumbnail-card:hover {
    transform: translateY(-2px);
  }

  .thumbnail-preview {
    height: 50px;
    margin-bottom: 6px;
  }

  .thumbnail-icon {
    width: 32px;
    height: 32px;
  }

  .thumbnail-info {
    text-align: center;
  }

  .item-name {
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-category {
    display: none;
  }
}
</style>
