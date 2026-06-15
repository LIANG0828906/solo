import { useState, useCallback, useRef, useEffect } from 'react';
import type { CanvasElement, HistoryState } from '@/types';

interface UseHistoryReturn {
  elements: CanvasElement[];
  past: HistoryState[];
  future: HistoryState[];
  pushHistory: (newElements: CanvasElement[], action?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyIndex: number;
}

/**
 * useHistory Hook —— 撤销/重做历史栈管理器
 *
 * ==================== 核心设计说明 ====================
 *
 * 1. 状态快照策略（何时触发快照入栈）：
 *    - 【添加元素】：骰子抽取随机素材时 pushHistory('add')
 *    - 【更新元素】：拖拽释放/缩放改变/旋转改变/颜色改变时 pushHistory('update')
 *    - 【删除元素】：变换工具栏点删除时 pushHistory('delete')
 *    - 重要：拖拽过程中(pointermove)不记录快照，仅在 pointerup 提交时才入栈，
 *           否则一次拖拽会产生数百条历史记录导致栈溢出
 *
 * 2. 深拷贝策略（为什么用 structuredClone）：
 *    - CanvasElement 是单层嵌套对象 + 原始类型字段，
 *      理论上 [...arr].map(e => ({...e})) 也够用，
 *      但使用 structuredClone 更安全：
 *      a) 未来添加嵌套字段(如path动画关键帧)时无需修改
 *      b) 避免意外引用导致"撤销后元素还被原地修改"的bug
 *      c) 一次拖拽仅 clone 一次(<50个元素量级<1ms)，性能可接受
 *
 * 3. 边界条件：
 *    - 撤销后进行新操作：清空 future 栈，防止分支冲突
 *      （从 past 顶部新分支时，旧的"未来"不再可达）
 *    - isUndoRedoRef 标记：undo()/redo() 内部会 setState(elements)，
 *      这会触发子组件再次调用 pushHistory，用此 ref 拦截避免循环入栈
 *    - 撤销到最底部：past 为空时 undo 按钮 disabled，快捷键无效
 *    - 重做到最顶部：future 为空时 redo 按钮 disabled，快捷键无效
 *
 * 4. 内存占用估算：
 *    - 每条 HistoryState ≈ 元素数 × 150 字节
 *    - 50元素 × 200条历史 ≈ 1.5MB，完全在浏览器内存预算内
 */
export function useHistory(initialElements: CanvasElement[] = []): UseHistoryReturn {
  // ==================== 状态定义 ====================
  // 当前画布上的元素（深拷贝后的快照值）
  const [elements, setElements] = useState<CanvasElement[]>(() =>
    initialElements.length > 0
      ? structuredClone(initialElements)
      : []
  );
  // 历史栈：past[n] 是倒数第 n+1 次操作前的状态
  const [past, setPast] = useState<HistoryState[]>([]);
  // 未来栈：撤销后可重做的状态队列
  const [future, setFuture] = useState<HistoryState[]>([]);
  // 历史步数索引（仅用于UI动画key触发翻转动画）
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // 标记：当前 setState 是否由撤销/重做内部触发，用于拦截子组件回调
  const isUndoRedoRef = useRef(false);

  // ==================== 入栈：所有写操作统一出口 ====================
  /**
   * 推入一条新历史记录
   * - 使用 structuredClone 深拷贝，确保快照与后续状态变更隔离
   * - 新操作会清空 future 栈（分支语义：从旧状态分叉时丢弃原未来）
   */
  const pushHistory = useCallback(
    (newElements: CanvasElement[], action: string = 'update') => {
      // --- 边界拦截：撤销/重做内部的 setState 不能再次入栈 ---
      if (isUndoRedoRef.current) {
        isUndoRedoRef.current = false;
        setElements(newElements);
        return;
      }

      // --- 深拷贝两个快照：入栈的和当前显示的必须互相独立 ---
      const elementsSnapshot = structuredClone(elements);
      const newElementsSnapshot = structuredClone(newElements);

      // 1. 当前状态入栈（成为"过去"）
      setPast((prev) => [
        ...prev,
        {
          elements: elementsSnapshot,
          action: action as never,
          timestamp: Date.now(),
        },
      ]);
      // 2. 清空"未来"——从分支点出发的新操作不再能回到旧未来
      setFuture([]);
      // 3. 切换显示到新快照
      setElements(newElementsSnapshot);
      // 4. 步数+1（用于UI badge显示和翻转key）
      setHistoryIndex((prev) => prev + 1);
    },
    [elements]
  );

  // ==================== 撤销：回到 past 顶部 ====================
  /**
   * 撤销一次操作
   * 数据流动：current → future 顶部，past 顶部 → current
   * 注：不使用 useCallback 的 deps 依赖 elements 是故意的——
   *     每次从 state 读取最新值快照，防止闭包陈旧
   */
  const undo = useCallback(() => {
    if (past.length === 0) return;

    // 取出最靠近现在的那条过去记录
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    // 标记：下面的 setElements 不触发 pushHistory 入栈
    isUndoRedoRef.current = true;

    // 1. 当前状态前进到"未来"队列（允许重做回来）
    setFuture((prev) => [
      {
        elements: structuredClone(elements),
        action: 'update',
        timestamp: Date.now(),
      },
      ...prev,
    ]);
    // 2. 过去栈切掉顶部
    setPast(newPast);
    // 3. 显示切换到过去的快照（深拷贝保证与历史栈中引用隔离）
    setElements(structuredClone(previous.elements));
    // 4. 步数-1
    setHistoryIndex((prev) => prev - 1);
  }, [past, elements]);

  // ==================== 重做：回到 future 顶部 ====================
  /**
   * 重做一次操作
   * 数据流动：future 顶部 → current，current → past 顶部
   * 与 undo 对称执行
   */
  const redo = useCallback(() => {
    if (future.length === 0) return;

    // 取出最近撤销的那条未来记录
    const next = future[0];
    const newFuture = future.slice(1);

    // 标记：内部 setState 不入栈
    isUndoRedoRef.current = true;

    // 1. 当前状态回退到"过去"栈顶
    setPast((prev) => [
      ...prev,
      {
        elements: structuredClone(elements),
        action: 'update',
        timestamp: Date.now(),
      },
    ]);
    // 2. 未来栈切掉顶部
    setFuture(newFuture);
    // 3. 显示切换到未来快照
    setElements(structuredClone(next.elements));
    // 4. 步数+1
    setHistoryIndex((prev) => prev + 1);
  }, [future, elements]);

  // ==================== 全局快捷键监听 ====================
  /**
   * Ctrl/Cmd + Z 撤销
   * Ctrl/Cmd + Shift + Z 重做
   * 使用 window 级监听，避免焦点必须在画布上
   * 每次 undo/redo 变化时重新绑定（保证闭包中拿到最新函数引用）
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    elements,
    past,
    future,
    pushHistory,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    historyIndex,
  };
}
