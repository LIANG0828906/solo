import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { usePaletteStore } from './palette/store';
import { useProjectStore } from './project/store';

function initDemoData() {
  const { createProject } = useProjectStore.getState();
  const { addColor } = usePaletteStore.getState();

  const demoProject = createProject('品牌设计系统');

  const demoColors = [
    { hex: '#E94560', role: 'accent' as const, percentage: 15 },
    { hex: '#16213E', role: 'primary' as const, percentage: 40 },
    { hex: '#0F3460', role: 'secondary' as const, percentage: 25 },
    { hex: '#533483', role: 'secondary' as const, percentage: 10 },
    { hex: '#F1F5F9', role: 'accent' as const, percentage: 8 },
    { hex: '#94A3B8', role: 'secondary' as const, percentage: 2 }
  ];

  const colorIds: string[] = [];
  for (const demo of demoColors) {
    const color = addColor(demo.hex);
    if (color) {
      color.role = demo.role;
      color.percentage = demo.percentage;
      colorIds.push(color.id);
    }
  }

  const state = useProjectStore.getState();
  if (demoProject && colorIds.length > 0) {
    state.projects = state.projects.map(p => {
      if (p.id !== demoProject.id) return p;
      return {
        ...p,
        colorIds,
        rules: {
          background: colorIds[1] || null,
          cardBackground: colorIds[2] || null,
          button: colorIds[0] || null,
          textPrimary: colorIds[4] || null,
          textSecondary: colorIds[5] || null,
          accent: colorIds[0] || null
        }
      };
    });
  }

  const secondProject = createProject('移动端App');
  const secondColors = [
    { hex: '#2563EB', role: 'primary' as const, percentage: 35 },
    { hex: '#1E40AF', role: 'secondary' as const, percentage: 25 },
    { hex: '#FBBF24', role: 'accent' as const, percentage: 12 },
    { hex: '#F8FAFC', role: 'secondary' as const, percentage: 20 },
    { hex: '#64748B', role: 'secondary' as const, percentage: 8 }
  ];

  const secondColorIds: string[] = [];
  for (const demo of secondColors) {
    const color = addColor(demo.hex);
    if (color) {
      color.role = demo.role;
      color.percentage = demo.percentage;
      secondColorIds.push(color.id);
    }
  }

  const state2 = useProjectStore.getState();
  state2.projects = state2.projects.map(p => {
    if (p.id !== secondProject.id) return p;
    return {
      ...p,
      colorIds: secondColorIds,
      rules: {
        background: secondColorIds[3] || null,
        cardBackground: secondColorIds[0] || null,
        button: secondColorIds[2] || null,
        textPrimary: secondColorIds[3] || null,
        textSecondary: secondColorIds[4] || null,
        accent: secondColorIds[2] || null
      }
    };
  });

  useProjectStore.setState({
    currentProjectId: demoProject.id
  });
}

initDemoData();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
