import { SceneController } from './sceneController';
import { EmotionResult } from './emotionAnalyzer';

const SHAPE_LABELS = ['圆形', '星形(5角)', '菱形', '不规则多面体', '不规则多面体'];

function animateScore(target: number, display: HTMLElement): void {
  const start = parseFloat(display.textContent || '0');
  const duration = 600;
  const startTime = performance.now();

  function tick(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;
    display.textContent = (current >= 0 ? '+' : '') + current.toFixed(2);

    display.classList.remove('score-positive', 'score-neutral', 'score-negative');
    if (target > 0.3) display.classList.add('score-positive');
    else if (target < -0.3) display.classList.add('score-negative');
    else display.classList.add('score-neutral');

    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function updateKeywords(keywords: string[], container: HTMLElement): void {
  container.innerHTML = '';
  keywords.forEach((kw, i) => {
    const tag = document.createElement('span');
    tag.className = 'keyword-tag';
    tag.textContent = kw;
    container.appendChild(tag);
  });
}

function updateShapeLegend(keywords: string[], container: HTMLElement): void {
  container.innerHTML = '';
  const count = Math.max(3, keywords.length);
  for (let i = 0; i < count && i < 5; i++) {
    const span = document.createElement('span');
    const label = i < keywords.length ? `${keywords[i]}: ${SHAPE_LABELS[i]}` : SHAPE_LABELS[i];
    span.textContent = label;
    container.appendChild(span);
  }
}

function main(): void {
  const container = document.getElementById('canvasContainer')!;
  const controller = new SceneController(container);

  const textInput = document.getElementById('textInput') as HTMLTextAreaElement;
  const visualizeBtn = document.getElementById('visualizeBtn') as HTMLButtonElement;
  const errorMsg = document.getElementById('errorMsg') as HTMLDivElement;
  const scoreDisplay = document.getElementById('scoreDisplay') as HTMLDivElement;
  const keywordList = document.getElementById('keywordList') as HTMLDivElement;
  const shapeLegend = document.getElementById('shapeLegend') as HTMLDivElement;
  const charCount = document.getElementById('charCount') as HTMLSpanElement;
  const mobileToggle = document.getElementById('mobileToggle') as HTMLButtonElement;
  const panel = document.getElementById('panel') as HTMLDivElement;

  textInput.addEventListener('input', () => {
    charCount.textContent = textInput.value.length.toString();
  });

  mobileToggle.addEventListener('click', () => {
    panel.classList.toggle('open');
  });

  controller.setOnResult((result: EmotionResult) => {
    animateScore(result.score, scoreDisplay);
    updateKeywords(result.keywords, keywordList);
    updateShapeLegend(result.keywords, shapeLegend);
  });

  function doVisualize(): void {
    const text = textInput.value;
    if (!text.trim()) {
      errorMsg.textContent = '请输入文本内容';
      errorMsg.classList.remove('shake');
      void errorMsg.offsetWidth;
      errorMsg.classList.add('shake');
      setTimeout(() => {
        errorMsg.textContent = '';
        errorMsg.classList.remove('shake');
      }, 300);
      return;
    }
    errorMsg.textContent = '';
    controller.processText(text);
  }

  visualizeBtn.addEventListener('click', doVisualize);
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doVisualize();
    }
  });

  controller.start();
}

main();
