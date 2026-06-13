<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', date: string): void
}>()

const currentMonth = ref(new Date())

const selectedDate = computed(() => props.modelValue)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const monthDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const daysInMonth = lastDay.getDate()
  const startingDay = firstDay.getDay()
  
  const days: { date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[] = []
  
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startingDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({
      date,
      dateStr: formatDate(date),
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: isSelectedDate(date)
    })
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    days.push({
      date,
      dateStr: formatDate(date),
      isCurrentMonth: true,
      isToday: isToday(date),
      isSelected: isSelectedDate(date)
    })
  }
  
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date,
      dateStr: formatDate(date),
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: isSelectedDate(date)
    })
  }
  
  return days
})

const monthYearText = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth() + 1
  return `${year}年${month}月`
})

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function isSelectedDate(date: Date): boolean {
  return formatDate(date) === selectedDate.value
}

function prevMonth() {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1
  )
}

function nextMonth() {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1
  )
}

function selectDate(dateStr: string) {
  emit('update:modelValue', dateStr)
}

function goToToday() {
  const today = new Date()
  currentMonth.value = today
  emit('update:modelValue', formatDate(today))
}

watch(selectedDate, (newVal) => {
  const date = new Date(newVal)
  if (
    date.getMonth() !== currentMonth.value.getMonth() ||
    date.getFullYear() !== currentMonth.value.getFullYear()
  ) {
    currentMonth.value = new Date(date.getFullYear(), date.getMonth(), 1)
  }
})
</script>

<template>
  <div class="calendar">
    <div class="calendar-header">
      <button class="nav-btn" @click="prevMonth">
        <span>‹</span>
      </button>
      <span class="month-text">{{ monthYearText }}</span>
      <button class="nav-btn" @click="nextMonth">
        <span>›</span>
      </button>
    </div>

    <div class="calendar-weekdays">
      <div
        v-for="day in weekDays"
        :key="day"
        class="weekday"
        :class="{ weekend: day === '日' || day === '六' }"
      >
        {{ day }}
      </div>
    </div>

    <div class="calendar-days">
      <div
        v-for="day in monthDays"
        :key="day.dateStr + Math.random()"
        class="day"
        :class="{
          'other-month': !day.isCurrentMonth,
          'today': day.isToday,
          'selected': day.isSelected
        }"
        @click="selectDate(day.dateStr)"
      >
        {{ day.date.getDate() }}
      </div>
    </div>

    <div class="calendar-footer">
      <button class="today-btn" @click="goToToday">今天</button>
    </div>
  </div>
</template>

<style scoped>
.calendar {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f3f4f6;
  font-size: 18px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: #e5e7eb;
  color: #333;
}

.month-text {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 8px 0;
  font-weight: 500;
}

.weekday.weekend {
  color: #f56c6c;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
}

.day:hover {
  background: #f0f4ff;
}

.day.other-month {
  color: #d1d5db;
}

.day.today {
  position: relative;
  color: #667eea;
  font-weight: 600;
}

.day.today::after {
  content: '';
  position: absolute;
  bottom: 4px;
  width: 4px;
  height: 4px;
  background: #667eea;
  border-radius: 50%;
}

.day.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.day.selected:hover {
  transform: scale(1.05);
}

.day.selected.today::after {
  background: white;
}

.calendar-footer {
  margin-top: 12px;
  text-align: center;
}

.today-btn {
  padding: 6px 16px;
  font-size: 12px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.today-btn:hover {
  background: rgba(102, 126, 234, 0.15);
}
</style>
