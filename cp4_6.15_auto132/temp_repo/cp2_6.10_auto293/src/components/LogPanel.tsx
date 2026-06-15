import { MessageSquare, Zap, Link, Sparkles } from 'lucide-react'
import { useNodeStore } from '@/hooks/useNodeStore'
import { formatTime, getNodeShortId } from '@/utils/nodeUtils'

const getTypeIcon = (type: 'create' | 'connect' | 'pulse') => {
  switch (type) {
    case 'create':
      return <Sparkles className="w-4 h-4 text-cyan-400" />
    case 'connect':
      return <Link className="w-4 h-4 text-purple-400" />
    case 'pulse':
      return <Zap className="w-4 h-4 text-yellow-400" />
  }
}

const getTypeLabel = (type: 'create' | 'connect' | 'pulse') => {
  switch (type) {
    case 'create':
      return '节点创建'
    case 'connect':
      return '连线建立'
    case 'pulse':
      return '脉冲触发'
  }
}

const getTypeColor = (type: 'create' | 'connect' | 'pulse') => {
  switch (type) {
    case 'create':
      return 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30'
    case 'connect':
      return 'from-purple-500/20 to-purple-500/5 border-purple-500/30'
    case 'pulse':
      return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30'
  }
}

export const LogPanel = () => {
  const logs = useNodeStore(state => state.logs)
  const nodes = useNodeStore(state => state.nodes)

  const getNodeColor = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    return node?.color || '#00d4ff'
  }

  return (
    <div className="fixed right-6 bottom-6 z-10">
      <div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-2xl p-5 shadow-2xl shadow-purple-500/10 min-w-[320px] max-w-[380px]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <h2 className="text-purple-400 font-bold text-sm tracking-widest uppercase">
            通信日志
          </h2>
          <MessageSquare className="w-4 h-4 text-purple-400 ml-auto" />
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-800/50 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">暂无交互记录</p>
            <p className="text-gray-600 text-xs mt-1">点击场景开始创建光讯节点</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
            {logs.map((log, index) => (
              <div
                key={log.id}
                className={`bg-gradient-to-r ${getTypeColor(log.type)} border rounded-xl p-3 transition-all duration-300 hover:scale-[1.02] ${
                  index === 0 ? 'animate-in slide-in-from-right duration-300' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getTypeIcon(log.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-medium">
                        {getTypeLabel(log.type)}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getNodeColor(log.nodeId) }}
                      />
                      <span className="text-gray-400 text-xs font-mono">
                        #{getNodeShortId(log.nodeId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">
                        信号: <span className="text-cyan-400 font-mono">{log.signalStrength}%</span>
                      </span>
                      {log.distance > 0 && (
                        <span className="text-gray-500">
                          距离: <span className="text-purple-400 font-mono">{log.distance.toFixed(2)}</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-gray-600 text-xs font-mono">
                      {formatTime(log.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-600">
          <span>最近 {logs.length} 条记录</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            实时同步
          </span>
        </div>
      </div>
    </div>
  )
}
