const NARRATIVES = [
  {
    phase: 0,
    title: '第一章：月之沉睡',
    content: '当第一颗星辰点亮宇宙，月球便已在此守望。亿万年来，它见证了无数文明的兴衰，守护着宇宙间最古老的秘密。月相计时器，这个月球文明最伟大的造物，记录着时间流转的奥秘。',
    hologramText: '「时间始于月相的第一次呼吸」'
  },
  {
    phase: 1,
    title: '第二章：光玉诞生',
    content: '月球的核心孕育着神奇的能量结晶——光玉。每一颗光玉都蕴含着月相的力量，它们是时间的化身，是连接过去与未来的桥梁。古代月人相信，收集光玉就能掌握时间的奥秘。',
    hologramText: '「光玉是时间的眼泪，凝结着星辰的记忆」'
  },
  {
    phase: 2,
    title: '第三章：齿轮之谜',
    content: '月相计时器由精密的齿轮组构成，每一个齿轮都代表着宇宙的一种韵律。当光玉嵌入齿轮，时间的旋律便会奏响，月相的轮回得以延续。这是月人留给后人的智慧遗产。',
    hologramText: '「齿轮转动，命运的轨迹随之改变」'
  },
  {
    phase: 3,
    title: '第四章：文明陨落',
    content: '然而，一场突如其来的灾难让月球文明陷入沉睡。月相计时器停止了运转，光玉散落各处，古老的叙事被尘封。月人们消失在时间的长河中，只留下这个神秘的装置等待着新的守护者。',
    hologramText: '「文明或许会消逝，但记忆永不磨灭」'
  },
  {
    phase: 4,
    title: '第五章：守护者觉醒',
    content: '你，被选中的时间管理员，继承了修复月相计时器的使命。当你触碰第一颗光玉时，古老的记忆开始苏醒。月球在等待，宇宙在等待，等待着时间之轮再次转动。',
    hologramText: '「当守护者觉醒，时间的河流将重新流淌」'
  },
  {
    phase: 5,
    title: '第六章：月相流转',
    content: '每一次月相的修复，都是对过去的致敬，对未来的承诺。新月代表希望，满月象征圆满，残月预示新生。在这永恒的轮回中，你逐渐理解了时间的真谛——它不是线性的，而是一首循环往复的诗篇。',
    hologramText: '「月有阴晴圆缺，此事古难全。但愿人长久，千里共婵娟。」'
  },
  {
    phase: 6,
    title: '第七章：时间回廊',
    content: '随着月相的逐渐完整，你开始看到月球文明的真实面貌。他们曾是宇宙的守望者，记录着无数星球的故事。月相计时器不仅是一个装置，更是一座横跨时空的桥梁，连接着所有存在过的文明。',
    hologramText: '「在时间的回廊里，每一个瞬间都是永恒」'
  },
  {
    phase: 7,
    title: '终章：蚀月重生',
    content: '当月相完全修复，蚀月降临。这不是结束，而是新的开始。月球文明的记忆将与你融为一体，你将成为新的时间守护者，带着这份古老的智慧，继续守护宇宙的秩序。故事永不落幕。',
    hologramText: '「蚀月之后，便是新生。时间永恒，而你，即是永恒的一部分。」'
  }
]

class NarrativeSystem {
  constructor() {
    this.stories = NARRATIVES
    this.unlockedStories = []
    this.currentStory = null
    this.onUnlockCallback = null
    this.initUI()
  }

  initUI() {
    this.overlay = document.createElement('div')
    this.overlay.className = 'hologram-overlay'
    this.overlay.innerHTML = `
      <div class="hologram-card">
        <h2 id="hologram-title"></h2>
        <div class="hologram-text" id="hologram-text"></div>
        <div class="hologram-content" id="hologram-content"></div>
        <button class="hologram-close" id="hologram-close">继续</button>
      </div>
    `
    document.body.appendChild(this.overlay)

    document.getElementById('hologram-close').addEventListener('click', () => {
      this.hideHologram()
    })
  }

  showHologram(storyId) {
    const story = this.stories.find(s => s.phase === storyId)
    if (!story) return

    this.currentStory = story
    document.getElementById('hologram-title').textContent = story.title
    document.getElementById('hologram-text').textContent = story.hologramText
    document.getElementById('hologram-content').textContent = story.content

    this.overlay.classList.add('active')
  }

  hideHologram() {
    this.overlay.classList.remove('active')
    this.currentStory = null
  }

  unlockStory(phase) {
    if (!this.unlockedStories.includes(phase)) {
      this.unlockedStories.push(phase)
      this.updateLogPanel()

      if (this.onUnlockCallback) {
        this.onUnlockCallback(phase)
      }

      return true
    }
    return false
  }

  updateLogPanel() {
    const panel = document.querySelector('.narrative-panel .panel-title')
    if (!panel) return

    let logContainer = panel.nextElementSibling
    if (!logContainer || !logContainer.classList.contains('narrative-log')) {
      logContainer = document.createElement('div')
      logContainer.className = 'narrative-log'
      panel.parentNode.insertBefore(logContainer, panel.nextSibling)
    }

    logContainer.innerHTML = ''

    this.stories.forEach(story => {
      const isUnlocked = this.unlockedStories.includes(story.phase)
      const card = document.createElement('div')
      card.className = `narrative-card ${isUnlocked ? '' : 'locked'}`
      card.innerHTML = `
        <h4>${isUnlocked ? story.title : '??? 未解锁'}</h4>
        <p>${isUnlocked ? story.hologramText : '完成月相修复以解锁此章节'}</p>
      `

      if (isUnlocked) {
        card.addEventListener('click', () => {
          this.showHologram(story.phase)
        })
      }

      logContainer.appendChild(card)
    })
  }

  onUnlock(callback) {
    this.onUnlockCallback = callback
  }

  dispose() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay)
    }
  }
}

export default NarrativeSystem
