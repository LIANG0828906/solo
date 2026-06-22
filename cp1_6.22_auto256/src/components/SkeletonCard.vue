<template>
  <div class="skeleton-card">
    <div class="skeleton-line skeleton-header"></div>
    <div class="skeleton-line skeleton-short"></div>
    <div class="skeleton-line skeleton-medium"></div>
    <div class="skeleton-line skeleton-short"></div>
    <div class="skeleton-progress"></div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.skeleton-card {
  height: 200px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.skeleton-line {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-header {
  height: 24px;
  width: 70%;
}

.skeleton-short {
  height: 16px;
  width: 40%;
}

.skeleton-medium {
  height: 16px;
  width: 60%;
}

.skeleton-progress {
  height: 8px;
  width: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-top: 20px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
