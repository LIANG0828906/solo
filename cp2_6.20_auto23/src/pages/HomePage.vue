<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { SceneManager, type HallId } from '../museum/core/SceneManager'
import type { ExhibitData } from '../museum/exhibits/ExhibitFactory'
import NavigationBar from '../museum/ui/NavigationBar.vue'
import ExhibitCard from '../museum/ui/ExhibitCard.vue'

const sceneContainer = ref<HTMLDivElement | null>(null)
const sceneManager = ref<SceneManager | null>(null)
const currentHall = ref<HallId>('lobby')
const selectedExhibit = ref<ExhibitData | null>(null)
const cardVisible = ref(false)
const cursorStyle = ref('default')
const loading = ref(true)
const loadProgress = ref(0)

const updateLoadingBar = (percent: number) => {
  loadProgress.value = percent
  const bar = document.getElementById('loading-progress-bar')
  const pct = document.getElementById('loading-percent')
  if (bar) {
    bar.style.width = `${percent}%`
  }
  if (pct) {
    pct.textContent = `${Math.round(percent)}%`
  }
}

const transitionToScene = () => {
  const loadingScreen = document.getElementById('loading-screen')
  const transitionOverlay = document.getElementById('scene-transition-overlay')

  if (loadingScreen) {
    loadingScreen.classList.add('fade-out')
  }

  if (transitionOverlay) {
    transitionOverlay.classList.add('active')
    transitionOverlay.classList.remove('fade-in')
  }

  setTimeout(() => {
    loading.value = false

    if (transitionOverlay) {
      transitionOverlay.classList.add('fade-in')
      transitionOverlay.classList.remove('active')
    }

    if (loadingScreen) {
      loadingScreen.remove()
    }
  }, 1000)
}

onMounted(async () => {
  if (!sceneContainer.value) return

  const sm = new SceneManager(sceneContainer.value)
  sceneManager.value = sm

  sm.on('hallChange', (hall: HallId) => {
    currentHall.value = hall
  })
  sm.on('exhibitClick', (exhibit: ExhibitData) => {
    selectedExhibit.value = exhibit
    cardVisible.value = true
  })
  sm.on('cursorChange', (style: string) => {
    cursorStyle.value = style === 'zoom' ? 'zoom-in' : 'default'
  })
  sm.on('loadProgress', ({ loaded, total }: { loaded: number; total: number }) => {
    const percent = Math.round((loaded / total) * 100)
    updateLoadingBar(percent)
  })

  try {
    const { data } = await axios.get<ExhibitData[]>('/api/exhibits')
    await sm.loadExhibits(data)
  } catch (e) {
    console.warn('Falling back to mock exhibit data')
    const mockData: ExhibitData[] = getMockExhibits()
    await sm.loadExhibits(mockData)
  }

  sm.start()
  transitionToScene()
})

onUnmounted(() => {
  sceneManager.value?.destroy()
})

const handleNavigate = (hall: HallId) => {
  sceneManager.value?.switchHall(hall)
}

const handleCloseCard = () => {
  cardVisible.value = false
  if (selectedExhibit.value) {
    sceneManager.value?.setExhibitPulsing(selectedExhibit.value.id, false)
  }
}

const handleAudioPlay = (id: string) => {
  sceneManager.value?.setExhibitPulsing(id, true)
}

const handleAudioPause = (id: string) => {
  sceneManager.value?.setExhibitPulsing(id, false)
}

const handleAudioStop = (id: string) => {
  sceneManager.value?.setExhibitPulsing(id, false)
}

function getMockExhibits(): ExhibitData[] {
  return [
    {
      id: 'p1',
      name: '星夜',
      author: '文森特·梵高',
      year: '1889',
      material: '布面油画',
      dimensions: '73.7 × 92.1 cm',
      description: '这幅画描绘了一个充满运动感的夜空，漩涡般的云彩和明亮的星星在深蓝的天幕上闪烁。画面下方是宁静的小镇，柏树如火焰般向上伸展，连接着大地与天空。',
      hallId: 'painting',
      position: { x: -4, y: 2.2, z: -6 },
      rotation: { x: 0, y: 0, z: 0 },
      imageUrl: '',
      type: 'painting',
      audioDuration: 15,
    },
    {
      id: 'p2',
      name: '蒙娜丽莎',
      author: '列奥纳多·达·芬奇',
      year: '1503-1519',
      material: '木板油画',
      dimensions: '77 × 53 cm',
      description: '这幅文艺复兴时期的杰作以其神秘的微笑和精湛的晕涂法闻名于世。画中女子目光温和，仿佛始终注视着观者，背景山水朦胧，营造出梦幻般的氛围。',
      hallId: 'painting',
      position: { x: 0, y: 2.2, z: -6.5 },
      imageUrl: '',
      type: 'painting',
      audioDuration: 18,
    },
    {
      id: 'p3',
      name: '睡莲',
      author: '克劳德·莫奈',
      year: '1906',
      material: '布面油画',
      dimensions: '89.9 × 94.1 cm',
      description: '印象派大师莫奈晚年的系列作品，描绘了吉维尼花园池塘中的睡莲。画面打破了传统透视，色彩与光影在水面上交融，呈现出诗意的宁静。',
      hallId: 'painting',
      position: { x: 4, y: 2.2, z: -6 },
      rotation: { x: 0, y: 0, z: 0 },
      imageUrl: '',
      type: 'painting',
      audioDuration: 14,
    },
    {
      id: 's1',
      name: '大卫',
      author: '米开朗基罗',
      year: '1501-1504',
      material: '大理石',
      dimensions: '高 5.17 m',
      description: '文艺复兴时期雕塑的巅峰之作，展现了青年大卫准备与巨人歌利亚战斗的瞬间。人体比例完美，肌肉张力与内在力量的刻画令人惊叹。',
      hallId: 'sculpture',
      position: { x: -4, y: 1.5, z: -5 },
      imageUrl: '',
      type: 'sculpture',
      audioDuration: 20,
    },
    {
      id: 's2',
      name: '思想者',
      author: '奥古斯特·罗丹',
      year: '1904',
      material: '青铜雕塑',
      dimensions: '186 × 98 × 142 cm',
      description: '罗丹最著名的作品之一，原是《地狱之门》的一部分。深沉冥想的姿态象征着人类对生命、存在和死亡的思考，展现了肉体与精神的张力。',
      hallId: 'sculpture',
      position: { x: 0, y: 1.5, z: -6 },
      imageUrl: '',
      type: 'sculpture',
      audioDuration: 16,
    },
    {
      id: 's3',
      name: '胜利女神像',
      author: '古希腊佚名',
      year: '约公元前190年',
      material: '帕里安大理石',
      dimensions: '高 2.44 m',
      description: '希腊化时期雕塑的代表作，展现了胜利女神降临船头的英姿。衣褶灵动飘逸，即使失去头部与手臂，仍传递出昂扬向上的力量。',
      hallId: 'sculpture',
      position: { x: 4, y: 1.5, z: -5 },
      imageUrl: '',
      type: 'sculpture',
      audioDuration: 17,
    },
    {
      id: 'm1',
      name: '构成VIII',
      author: '瓦西里·康定斯基',
      year: '1923',
      material: '布面油画',
      dimensions: '140 × 140 cm',
      description: '抽象艺术先驱康定斯基的包豪斯时期作品。几何形状与鲜艳色彩在画面上构成音乐般的节奏，体现了艺术家"艺术如同音乐"的美学理念。',
      hallId: 'modern',
      position: { x: -4, y: 1.5, z: -6 },
      imageUrl: '',
      type: 'installation',
      audioDuration: 15,
    },
    {
      id: 'm2',
      name: '记忆的永恒',
      author: '萨尔瓦多·达利',
      year: '1931',
      material: '布面油画',
      dimensions: '24.1 × 33 cm',
      description: '超现实主义的标志性作品。软化的时钟像融化的奶酪般搭在树枝、桌面和怪异生物上，表达了达利对时间相对性的独特思考。',
      hallId: 'modern',
      position: { x: 0, y: 2.2, z: -6.5 },
      imageUrl: '',
      type: 'painting',
      audioDuration: 16,
    },
    {
      id: 'm3',
      name: '金宝汤罐头',
      author: '安迪·沃霍尔',
      year: '1962',
      material: '丝网印刷',
      dimensions: '51 × 41 cm',
      description: '波普艺术的代表作，将日常消费品提升为艺术主题。重复的图案与机械复制的手法反映了消费主义时代大众文化与商业美学的特征。',
      hallId: 'modern',
      position: { x: 4, y: 1.5, z: -6 },
      imageUrl: '',
      type: 'installation',
      audioDuration: 14,
    },
  ]
}
</script>

<template>
  <div class="museum-root" :style="{ cursor: cursorStyle }">
    <div ref="sceneContainer" class="scene-container" />

    <NavigationBar
      :current-hall="currentHall"
      @navigate="handleNavigate"
    />

    <ExhibitCard
      :exhibit="selectedExhibit"
      :visible="cardVisible"
      @close="handleCloseCard"
      @audio-play="handleAudioPlay"
      @audio-pause="handleAudioPause"
      @audio-stop="handleAudioStop"
    />
  </div>
</template>

<style scoped>
.museum-root {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 40%, #1e2030 0%, #141520 50%, #0e0e14 100%);
}

.scene-container {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}
</style>
