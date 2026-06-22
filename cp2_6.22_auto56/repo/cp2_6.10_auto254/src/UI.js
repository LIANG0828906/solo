const POEMS = [
  '星河滚烫，你是人间理想',
  '星光不问赶路人',
  '愿你眼里有星辰大海',
  '月亮不睡我不睡，星星不亮我不亮',
  '携满天星辰以赠你',
  '所念皆星河，所愿皆成真',
  '你是我藏在星云里的浪漫',
  '宇宙山河浪漫，人间点滴温暖',
  '星辰非昨夜，山河共从容',
  '醉后不知天在水，满船清梦压星河',
  '愿我如星君如月，夜夜流光相皎洁',
  '迟迟钟鼓初长夜，耿耿星河欲曙天',
  '五更鼓角声悲壮，三峡星河影动摇',
  '身无彩凤双飞翼，心有灵犀一点通',
  '春蚕到死丝方尽，蜡炬成灰泪始干',
  '身似浮云，心如飞絮，气若游丝',
  '春宵一刻值千金，花有清香月有阴',
  '满目山河空念远，落花风雨更伤春',
  '时光只解催人老，不信多情',
  '人世几回伤往事，山形依旧枕寒流'
]

export class UI {
  constructor(bubbleManager, scene) {
    this.bubbleManager = bubbleManager
    this.scene = scene
    this.logPanel = document.getElementById('log-list')
    this.speedSlider = document.getElementById('speed-slider')
    this.speedValue = document.getElementById('speed-value')
    this.btnBubble = document.getElementById('btn-bubble')
    this.btnReset = document.getElementById('btn-reset')
    this.logs = []
    this.maxLogs = 5
    this.init()
  }

  init() {
    this.btnBubble.addEventListener('click', () => {
      this.bubbleManager.createBubble()
    })

    this.speedSlider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value)
      this.bubbleManager.setGrowthSpeed(speed)
      this.speedValue.textContent = `${speed.toFixed(1)}x`
    })

    this.btnReset.addEventListener('click', () => {
      this.bubbleManager.reset()
      this.clearLogs()
    })
  }

  addLog(poem) {
    this.logs.unshift(poem)
    if (this.logs.length > this.maxLogs) {
      this.logs.pop()
    }
    this.renderLogs()
  }

  renderLogs() {
    this.logPanel.innerHTML = this.logs
      .map((log, index) => `<div class="log-item">${this.logs.length - index}. ${log}</div>`)
      .join('')
  }

  clearLogs() {
    this.logs = []
    this.renderLogs()
  }

  showPoem(x, y, poem) {
    const text = document.createElement('div')
    text.className = 'bubble-text'
    text.textContent = poem
    text.style.left = `${x}px`
    text.style.top = `${y}px`
    document.body.appendChild(text)
    
    setTimeout(() => {
      text.remove()
    }, 3000)
  }

  getRandomPoem() {
    return POEMS[Math.floor(Math.random() * POEMS.length)]
  }

  handleBubbleClick(screenX, screenY) {
    const poem = this.getRandomPoem()
    this.showPoem(screenX, screenY, poem)
    this.addLog(poem)
    return poem
  }
}
