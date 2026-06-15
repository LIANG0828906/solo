import type { Story, ChartConfig } from '../types';
import { createChart } from './chartRenderer';

const STORY_STORAGE_KEY = 'datastory_stories';

export function serializeStory(story: Story): string {
  return JSON.stringify(story, null, 2);
}

export function deserializeStory(json: string): Story {
  try {
    return JSON.parse(json) as Story;
  } catch (e) {
    throw new Error('Invalid story JSON format');
  }
}

export function exportHTML(story: Story): string {
  const serializedData = serializeStory(story);
  const chartRendererCode = createChart.toString();

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${story.title}</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #fff;
      overflow: hidden;
      height: 100vh;
    }
    .play-container {
      width: 100vw;
      height: 100vh;
      position: relative;
      overflow: hidden;
    }
    .slide {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 40px 60px;
      opacity: 0;
      transition: opacity 0.5s ease, transform 0.5s ease;
      transform: translateX(100%);
    }
    .slide.active {
      opacity: 1;
      transform: translateX(0);
    }
    .slide.prev {
      transform: translateX(-100%);
    }
    .slide-title {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #fff;
    }
    .chart-container {
      flex: 1;
      min-height: 400px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(10px);
    }
    .notes-container {
      margin-top: 20px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      max-height: 150px;
      overflow-y: auto;
    }
    .notes-container h1, .notes-container h2, .notes-container h3 {
      margin-bottom: 10px;
      color: #FF6B35;
    }
    .notes-container p {
      line-height: 1.6;
      color: #ccc;
    }
    .controls {
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 15px;
      align-items: center;
      z-index: 100;
    }
    .btn {
      padding: 12px 24px;
      background: #1A659E;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    .btn:hover {
      background: #004E89;
      transform: translateY(-2px);
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    .progress-container {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #FF6B35, #F7C59F);
      transition: width 0.3s ease;
    }
    .slide-counter {
      font-size: 14px;
      color: #888;
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-overlay.active {
      display: flex;
    }
    .modal {
      background: #2a2a4a;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }
    .modal h3 {
      color: #FF6B35;
      margin-bottom: 15px;
      font-size: 24px;
    }
    .modal p {
      color: #ccc;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .modal img {
      width: 100%;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="play-container" id="playContainer"></div>
  <div class="controls">
    <button class="btn" id="prevBtn">上一页</button>
    <span class="slide-counter" id="slideCounter">1 / ${story.slides.length}</span>
    <button class="btn" id="nextBtn">下一页</button>
    <button class="btn" id="exitBtn">退出</button>
  </div>
  <div class="progress-container">
    <div class="progress-bar" id="progressBar"></div>
  </div>
  <div class="modal-overlay" id="modalOverlay">
    <button class="close-btn" id="closeModal">&times;</button>
    <div class="modal" id="modalContent"></div>
  </div>

  <script>
    const storyData = ${serializedData};
    let currentSlideIndex = 0;
    let cleanupChart = null;

    const ${chartRendererCode}

    function renderSlide(index) {
      const container = document.getElementById('playContainer');
      const slide = storyData.slides[index];
      if (!slide) return;

      if (cleanupChart) {
        cleanupChart();
      }

      container.innerHTML = '';
      
      const slideEl = document.createElement('div');
      slideEl.className = 'slide active';
      slideEl.innerHTML = \`
        <h1 class="slide-title">\${slide.chartConfig.title}</h1>
        <div class="chart-container" id="chart-\${slide.id}"></div>
        <div class="notes-container" id="notes-\${slide.id}"></div>
      \`;
      container.appendChild(slideEl);

      const chartContainer = document.getElementById('chart-' + slide.id);
      setTimeout(() => {
        cleanupChart = createChart(chartContainer, slide.chartConfig, (dataIndex) => {
          const interaction = slide.interactions.find(i => i.dataIndex === dataIndex);
          if (interaction) {
            showModal(interaction);
          }
        });
      }, 100);

      const notesContainer = document.getElementById('notes-' + slide.id);
      if (slide.notes) {
        notesContainer.innerHTML = slide.notes
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
          .replace(/\*(.*)\*/gim, '<em>$1</em>')
          .replace(/\n/g, '<br>');
      }

      updateControls();
    }

    function updateControls() {
      document.getElementById('prevBtn').disabled = currentSlideIndex === 0;
      document.getElementById('nextBtn').disabled = currentSlideIndex === storyData.slides.length - 1;
      document.getElementById('slideCounter').textContent = 
        \`\${currentSlideIndex + 1} / \${storyData.slides.length}\`;
      
      const progress = ((currentSlideIndex + 1) / storyData.slides.length) * 100;
      document.getElementById('progressBar').style.width = progress + '%';
    }

    function showModal(interaction) {
      const overlay = document.getElementById('modalOverlay');
      const content = document.getElementById('modalContent');
      
      content.innerHTML = \`
        <h3>\${interaction.eventName}</h3>
        \${interaction.imageUrl ? '<img src="' + interaction.imageUrl + '" alt="Event Image">' : ''}
        <p>\${interaction.description}</p>
      \`;
      overlay.classList.add('active');
    }

    function closeModal() {
      document.getElementById('modalOverlay').classList.remove('active');
    }

    document.getElementById('prevBtn').addEventListener('click', () => {
      if (currentSlideIndex > 0) {
        currentSlideIndex--;
        renderSlide(currentSlideIndex);
      }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
      if (currentSlideIndex < storyData.slides.length - 1) {
        currentSlideIndex++;
        renderSlide(currentSlideIndex);
      }
    });

    document.getElementById('exitBtn').addEventListener('click', () => {
      window.close();
    });

    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'modalOverlay') closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && currentSlideIndex > 0) {
        currentSlideIndex--;
        renderSlide(currentSlideIndex);
      } else if (e.key === 'ArrowRight' && currentSlideIndex < storyData.slides.length - 1) {
        currentSlideIndex++;
        renderSlide(currentSlideIndex);
      } else if (e.key === 'Escape') {
        closeModal();
      }
    });

    renderSlide(0);
  </script>
</body>
</html>`;
}

export function generateShareLink(story: Story): string {
  try {
    const stories = getAllStoredStories();
    stories[story.id] = story;
    localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(stories));
    
    const baseUrl = window.location.origin + window.location.pathname;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}storyId=${story.id}`;
  } catch (e) {
    console.error('Failed to save story to localStorage:', e);
    throw new Error('Failed to generate share link');
  }
}

export function loadFromShareLink(storyId: string): Story | null {
  try {
    const stories = getAllStoredStories();
    const story = stories[storyId];
    return story || null;
  } catch (e) {
    console.error('Failed to load story from localStorage:', e);
    return null;
  }
}

function getAllStoredStories(): Record<string, Story> {
  try {
    const stored = localStorage.getItem(STORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
}
