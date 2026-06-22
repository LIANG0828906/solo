import React, { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings, MoreVertical, Calendar as CalendarIcon } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { Timeline } from './Timeline';
import { cn } from '@/lib/utils';

interface KanbanProps {
  className?: string;
}

export const Kanban = memo(function Kanban({ className }: KanbanProps) {
  const {
    projects,
    selectedProjectId,
    selectedVersionId,
    selectProject,
    selectVersion,
    addVersion,
  } = useProjectStore();

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const handleSelectProject = useCallback((id: string) => {
    selectProject(id);
  }, [selectProject]);

  const handleSelectVersion = useCallback((id: string | null) => {
    selectVersion(id);
  }, [selectVersion]);

  const handleAddVersion = useCallback(() => {
    if (!selectedProjectId) return;
    
    const name = prompt('输入版本号 (如 v1.0.0)：');
    if (!name) return;

    const date = prompt('输入发布日期 (YYYY-MM-DD)：', new Date().toISOString().split('T')[0]);
    if (!date) return;

    const description = prompt('输入版本描述：') || '';

    addVersion(selectedProjectId, {
      name,
      description,
      releaseDate: date,
      status: 'planning',
      features: [],
      knownIssues: 0,
    });
  }, [selectedProjectId, addVersion]);

  if (!selectedProject) {
    return (
      <div className={cn('flex-1 flex items-center justify-center bg-surface', className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-2xl shadow-sm border-2 border-gray-200 
                          flex items-center justify-center">
            <CalendarIcon className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-600 mb-2">选择一个项目</h3>
          <p className="text-gray-400">从左侧列表中选择项目以查看详情</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-y-auto bg-surface', className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: selectedProject.color }}
            >
              {selectedProject.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{selectedProject.name}</h1>
              <p className="text-sm text-gray-500">
                负责人：{selectedProject.owner} · {selectedProject.versions.length} 个版本
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddVersion}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg
                         hover:bg-primary-light active:scale-[0.98] transition-all duration-300 ease-elastic"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">新建版本</span>
            </button>
            <button className="p-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {selectedProject.description && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 mb-6"
          >
            {selectedProject.description}
          </motion.p>
        )}

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">版本时间线</h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-version-planning" />
                <span className="text-gray-500">规划中</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-version-developing" />
                <span className="text-gray-500">开发中</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-version-testing" />
                <span className="text-gray-500">测试中</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-version-released" />
                <span className="text-gray-500">已发布</span>
              </div>
            </div>
          </div>

          <Timeline
            projectId={selectedProject.id}
            versions={selectedProject.versions}
            selectedVersionId={selectedVersionId}
            onSelectVersion={handleSelectVersion}
          />
        </div>
      </motion.div>
    </div>
  );
});
