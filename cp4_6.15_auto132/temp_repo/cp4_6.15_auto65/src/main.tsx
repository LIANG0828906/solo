// 应用挂载入口
// 数据流向：main.tsx -> App.tsx -> 所有子组件
// 被调用方：index.html

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
