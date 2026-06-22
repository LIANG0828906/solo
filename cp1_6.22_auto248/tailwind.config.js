/** @type {import('tailwindcss').Config} */

// Tailwind CSS 配置文件
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      // 自定义颜色配置
      colors: {
        // 背景色：米白色背景
        'bg-main': '#F5F0E8',
        // 卡片色：浅米色卡片
        'card': '#FAF5EE',
        // 边框色：浅棕色边框
        'border': '#E0D5C6',
        // 审批橙：用于审批状态标识
        'approve': '#F59E0B',
        // 创作蓝：用于创作状态标识
        'create': '#3B82F6',
        // 完成绿：用于完成状态标识
        'complete': '#10B981',
        // 批注背景色：浅黄色批注背景
        'annotation-bg': '#FEF3C7',
        // 批注边框色：深橙色批注边框
        'annotation-border': '#D97706',
        // 高亮蓝：用于高亮显示
        'highlight': '#E0F2FE',
        // 排班绿：用于排班状态
        'schedule': '#6EE7B7',
        // 混凝土灰：用于次要文字和边框
        'concrete': '#78716C'
      }
    },
  },
  plugins: [],
};
