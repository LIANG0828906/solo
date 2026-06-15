import React from 'react';
import Navbar from '@/components/Navbar';
import UserPanel from '@/components/UserPanel';
import DocumentRenderer from '@/components/DocumentRenderer';
import SyncPanel from '@/components/SyncPanel';
import AnnotationLayer from '@/components/AnnotationLayer';
import AnnotationToolbar from '@/components/AnnotationToolbar';
import CommentModal from '@/components/CommentModal';
import HistoryPanel from '@/components/HistoryPanel';

/**
 * 主页 - 协作文档同步阅读与标注应用
 *
 * 布局结构：
 *   - 顶部导航栏 (Navbar, 高度 60px)
 *   - 主体区域 (flex 布局)：
 *       - 左侧用户面板 (UserPanel, 宽度 280px)
 *       - 主文档区域 (DocumentRenderer, flex:1)
 *         - SyncPanel 叠加在右侧（用户位置指示器）
 *         - AnnotationLayer 叠加在文档上方（Canvas 标注层）
 *   - 底部浮动：标注工具栏 (AnnotationToolbar)
 *   - 侧边：历史面板 (HistoryPanel)
 *   - 弹窗：批注输入 (CommentModal)
 *
 * 数据流向：
 *   - 所有组件通过 Zustand store (useDocStore) 共享状态
 *   - DocumentRenderer 翻页/滚动 -> store 更新位置 -> SyncPanel 广播
 *   - 用户选中文本 -> store.setSelectedRange -> AnnotationToolbar 显示
 *   - 点击高亮/批注 -> store.addHighlight/addComment -> AnnotationLayer 重绘
 *   - 邀请用户 -> store.addUser -> UserPanel 列表更新 + 滑入动画
 *   - 翻页 -> store.addHistoryRecord -> HistoryPanel 记录
 */
const Home: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        backgroundColor: '#eff6ff',
        overflow: 'hidden',
      }}
    >
      <Navbar />

      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <UserPanel />

        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
            <DocumentRenderer />
            <SyncPanel />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <AnnotationLayer />
            </div>
          </div>
        </div>
      </div>

      <AnnotationToolbar />
      <HistoryPanel />
      <CommentModal />
    </div>
  );
};

export default Home;
