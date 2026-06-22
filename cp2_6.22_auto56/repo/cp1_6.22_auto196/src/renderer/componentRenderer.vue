<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/store/useThemeStore'

const store = useThemeStore()
const { palette } = storeToRefs(store)

const styleVars = computed(() => {
  if (!palette.value) return {} as Record<string, string>
  return {
    '--c-primary': palette.value.primary,
    '--c-primary-light': palette.value.primaryLight,
    '--c-primary-dark': palette.value.primaryDark,
    '--c-primary-soft': palette.value.primarySoft,
    '--c-secondary': palette.value.secondary,
    '--c-secondary-light': palette.value.secondaryLight,
    '--c-secondary-dark': palette.value.secondaryDark,
    '--c-secondary-soft': palette.value.secondarySoft,
    '--c-accent': palette.value.accent,
    '--c-accent-light': palette.value.accentLight,
    '--c-accent-dark': palette.value.accentDark,
    '--c-contrast': palette.value.contrast,
  }
})
</script>

<template>
  <div class="renderer" :style="styleVars">
    <div class="component-block">
      <span class="component-label">按钮 Button</span>
      <button class="demo-button">主按钮</button>
    </div>

    <div class="component-block">
      <span class="component-label">卡片 Card</span>
      <div class="demo-card">
        <h3 class="card-title">组件信息卡片</h3>
        <p class="card-text">
          这是一个示例信息卡片，展示了配色方案在卡片组件上的实际效果。标题使用辅色，正文使用浅色文本，确保良好的可读性。
        </p>
        <div class="card-footer">
          <span class="card-tag">标签</span>
          <span class="card-meta">2024-01-15</span>
        </div>
      </div>
    </div>

    <div class="component-block">
      <span class="component-label">输入框 Input</span>
      <input class="demo-input" type="text" placeholder="请输入内容..." />
    </div>

    <div class="component-block full-width">
      <span class="component-label">导航栏 Navbar</span>
      <nav class="demo-nav">
        <div class="nav-logo">Brand</div>
        <div class="nav-links">
          <a class="nav-link active">首页</a>
          <a class="nav-link">产品</a>
          <a class="nav-link">文档</a>
          <a class="nav-link">关于</a>
        </div>
      </nav>
    </div>

    <div class="component-block full-width">
      <span class="component-label">标签页 Tabs</span>
      <div class="demo-tabs">
        <div class="tab-item active">概览</div>
        <div class="tab-item">详情</div>
        <div class="tab-item">设置</div>
        <div class="tab-item">历史</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.renderer {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px;
}

.component-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s ease;
}

.component-block.full-width {
  width: 100%;
}

.component-label {
  font-size: 14px;
  color: #94a3b8;
  font-weight: 500;
}

.demo-button {
  align-self: flex-start;
  padding: 10px 28px;
  background-color: var(--c-primary);
  color: #ffffff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.demo-button:hover {
  background-color: var(--c-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.demo-card {
  align-self: flex-start;
  max-width: 420px;
  background-color: #25273d;
  border: 1px solid #3c3f5e;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--c-secondary);
  margin-bottom: 10px;
  transition: color 0.3s ease;
}

.card-text {
  font-size: 14px;
  color: #e2e8f0;
  line-height: 1.6;
  margin-bottom: 16px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #3c3f5e;
}

.card-tag {
  display: inline-block;
  padding: 4px 12px;
  background-color: var(--c-primary-soft);
  color: var(--c-primary);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.card-meta {
  font-size: 12px;
  color: #94a3b8;
}

.demo-input {
  align-self: flex-start;
  width: 320px;
  padding: 10px 14px;
  background-color: #1a1b2e;
  border: 1.5px solid var(--c-secondary-light);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  transition: all 0.3s ease;
}

.demo-input::placeholder {
  color: #64748b;
}

.demo-input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.demo-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--c-primary-dark);
  padding: 0 24px;
  height: 56px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.nav-logo {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 8px 16px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #ffffff;
}

.nav-link.active {
  color: #ffffff;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 2px;
  background-color: var(--c-accent);
  border-radius: 1px;
  transition: background-color 0.3s ease;
}

.demo-tabs {
  display: flex;
  gap: 4px;
  background-color: #25273d;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid #3c3f5e;
}

.tab-item {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-item:hover {
  color: #e2e8f0;
  background-color: rgba(255, 255, 255, 0.05);
}

.tab-item.active {
  background-color: var(--c-primary-soft);
  color: var(--c-primary);
  font-weight: 600;
}
</style>
