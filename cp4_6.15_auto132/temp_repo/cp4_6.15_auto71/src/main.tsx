import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 注意：由于 react-beautiful-dnd 库与 React 18 的 StrictMode 存在兼容性问题，
// 会导致 "Unable to find draggable with id" 错误，使得拖拽功能完全失效。
// 该库已不再积极维护，官方建议使用 @dnd-kit 作为替代。
// 为了保证看板核心拖拽功能正常运行，暂时移除 StrictMode。
// 相关问题：https://github.com/atlassian/react-beautiful-dnd/issues/2406
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />,
);
