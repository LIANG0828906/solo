import { io, Socket } from 'socket.io-client';
import { useEffect, useState, useCallback, useRef } from 'react';

// Socket.IO单例实例
let socketInstance: Socket | null = null;

// 创建Socket连接函数，确保单例模式
const createSocket = (): Socket => {
  if (socketInstance) {
    return socketInstance;
  }

  socketInstance = io({
    // 自动重连配置
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // 超时时间
    timeout: 20000,
    // 传输方式
    transports: ['websocket', 'polling'],
  });

  return socketInstance;
};

// useSocket Hook返回类型
interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Socket.IO客户端钩子
 * - 创建单例socket连接
 * - 返回socket实例和连接状态
 * - 自动重连逻辑
 */
export function useSocket(): UseSocketReturn {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  // 初始化socket连接
  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    // 监听连接事件
    const handleConnect = () => {
      console.log('[Socket] 已连接');
      setIsConnected(true);
    };

    // 监听断开连接事件
    const handleDisconnect = () => {
      console.log('[Socket] 已断开连接');
      setIsConnected(false);
    };

    // 监听连接错误事件
    const handleConnectError = (error: Error) => {
      console.error('[Socket] 连接错误:', error.message);
      setIsConnected(false);
    };

    // 监听重连尝试事件
    const handleReconnectAttempt = (attemptNumber: number) => {
      console.log(`[Socket] 尝试重连中... 第${attemptNumber}次`);
    };

    // 监听重连成功事件
    const handleReconnect = () => {
      console.log('[Socket] 重连成功');
      setIsConnected(true);
    };

    // 监听重连失败事件
    const handleReconnectFailed = () => {
      console.error('[Socket] 重连失败');
    };

    // 注册事件监听器
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_failed', handleReconnectFailed);

    // 如果socket已经连接，直接设置状态
    if (socket.connected) {
      setIsConnected(true);
    }

    // 组件卸载时移除事件监听器
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_failed', handleReconnectFailed);
    };
  }, []);

  // 手动连接方法
  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  // 手动断开连接方法
  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
  };
}
