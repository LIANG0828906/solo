import React, { memo, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Bug, List, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Version, Milestone, VersionStatus, useProjectStore } from '@/store/projectStore';
import { MilestoneCard } from './MilestoneCard';
import { cn } from '@/lib/utils';

interface TimelineProps {
  projectId: string;
  versions: Version[];
  selectedVersionId: string | null;
  onSelectVersion: (id: string | null) => void;
}

const statusConfig: Record<VersionStatus, { color: string; label: string }> = {
  planning: { color: '#9e9e9e', label: '规划中' },
  developing: { color: '#2196f3', label: '开发中' },
  testing: { color: '#ff9800', label: '测试中' },
  released: { color: '#4caf50', label: '已发布' },
};

const VersionNode = memo(function VersionNode({
  version,
  index,
  isSelected,
  isFirst,
  isLast,
  onClick,
}: {
  version: Version;
  index: number;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
}) {
  const config = statusConfig[version.status];

  return (
    <motion.div
      className="relative flex flex-col items-center cursor-pointer group"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        {!isFirst && (
          <div className="absolute right-full top-1/2 w-full h-0.5 bg-gray-300 -translate-y-1/2 mr-2" />
        )}
        {!isLast && (
          <div className="absolute left-full top-1/2 w-full h-0.5 bg-gray-300 -translate-y-1/2 ml-2" />
        )}

        <motion.div
          className={cn(
            'relative z-10 w-12 h-12 rounded-full border-4 bg-white flex items-center justify-center',
            'transition-all duration-300 ease-elastic',
            'hover:scale-110 hover:shadow-lg',
            isSelected && 'scale-125 shadow-xl'
          )}
          style={{ borderColor: config.color }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-xs font-bold" style={{ color: config.color }}>
            {version.name}
          </span>

          {isSelected && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ borderColor: config.color }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs font-medium text-gray-700 whitespace-nowrap">
          {version.name}
        </p>
        <p 
          className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block"
          style={{ backgroundColor: `${config.color}20`, color: config.color }}
        >
          {config.label}
        </p>
      </div>
    </motion.div>
  );
});

const VersionDetailPanel = memo(function VersionDetailPanel({
  version,
  projectId,
  isOpen,
}: {
  version: Version;
  projectId: string;
  isOpen: boolean;
}) {
  const { updateMilestone, deleteMilestone, addMilestone, addDependency, removeDependency } = useProjectStore();
  const [draggedMilestone, setDraggedMilestone] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const sortedMilestones = useMemo(() => {
    return [...version.milestones].sort((a, b) => a.order - b.order);
  }, [version.milestones]);

  const isMilestoneBlocked = useCallback((milestone: Milestone) => {
    return milestone.dependencies.some((depId) => {
      const dep = version.milestones.find((m) => m.id === depId);
      return dep && dep.status !== 'completed';
    });
  }, [version.milestones]);

  const handleAddMilestone = useCallback(() => {
    const name = prompt('输入里程碑名称：');
    if (name) {
      addMilestone(projectId, version.id, {
        name,
        status: 'pending',
        order: version.milestones.length,
        description: '',
        createdAt: new Date().toISOString(),
      });
    }
  }, [addMilestone, projectId, version.id, version.milestones.length]);

  const handleStatusChange = useCallback((milestoneId: string, status: 'pending' | 'in-progress' | 'completed') => {
    updateMilestone(projectId, version.id, milestoneId, { status });
  }, [updateMilestone, projectId, version.id]);

  const handleRename = useCallback((milestoneId: string, name: string) => {
    updateMilestone(projectId, version.id, milestoneId, { name });
  }, [updateMilestone, projectId, version.id]);

  const handleDelete = useCallback((milestoneId: string) => {
    if (confirm('确定删除此里程碑？')) {
      deleteMilestone(projectId, version.id, milestoneId);
    }
  }, [deleteMilestone, projectId, version.id]);

  const completedCount = version.milestones.filter((m) => m.status === 'completed').length;
  const progress = version.milestones.length > 0 ? (completedCount / version.milestones.length) * 100 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="overflow-hidden"
        >
          <div className="mt-6 p-5 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-500">发布日期</p>
                  <p className="font-medium text-gray-800">{version.releaseDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <List className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">功能数量</p>
                  <p className="font-medium text-gray-800">{version.features.length} 项</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Bug className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500">已知问题</p>
                  <p className="font-medium text-gray-800">{version.knownIssues} 个</p>
                </div>
              </div>
            </div>

            {version.features.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-2">功能清单</h4>
                <div className="flex flex-wrap gap-2">
                  {version.features.map((feature, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-700">
                  里程碑 ({completedCount}/{version.milestones.length})
                </h4>
                <button
                  onClick={handleAddMilestone}
                  className="flex items-center gap-1 px-3 py-1 bg-primary text-white text-xs rounded-lg
                             hover:bg-primary-light transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  添加
                </button>
              </div>

              <div className="h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>

              {sortedMilestones.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortedMilestones.map((milestone, index) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      isBlocked={isMilestoneBlocked(milestone)}
                      isDragging={draggedMilestone === milestone.id}
                      isConnecting={connectingFrom === milestone.id}
                      index={index}
                      onStatusChange={(status) => handleStatusChange(milestone.id, status)}
                      onRename={(name) => handleRename(milestone.id, name)}
                      onDelete={() => handleDelete(milestone.id)}
                      onDragStart={() => setDraggedMilestone(milestone.id)}
                      onDragEnd={() => setDraggedMilestone(null)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  暂无里程碑，点击上方按钮添加
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export const Timeline = memo(function Timeline({
  projectId,
  versions,
  selectedVersionId,
  onSelectVersion,
}: TimelineProps) {
  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => 
      new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
    );
  }, [versions]);

  const selectedVersion = useMemo(() => {
    return versions.find((v) => v.id === selectedVersionId) || null;
  }, [versions, selectedVersionId]);

  const handleVersionClick = useCallback((versionId: string) => {
    onSelectVersion(selectedVersionId === versionId ? null : versionId);
  }, [selectedVersionId, onSelectVersion]);

  return (
    <div className="w-full">
      {sortedVersions.length > 0 ? (
        <>
          <div className="relative py-8 overflow-x-auto">
            <div className="flex items-end justify-around min-w-max gap-8 px-8">
              {sortedVersions.map((version, index) => (
                <VersionNode
                  key={version.id}
                  version={version}
                  index={index}
                  isSelected={selectedVersionId === version.id}
                  isFirst={index === 0}
                  isLast={index === sortedVersions.length - 1}
                  onClick={() => handleVersionClick(version.id)}
                />
              ))}
            </div>
          </div>

          {selectedVersion && (
            <VersionDetailPanel
              version={selectedVersion}
              projectId={projectId}
              isOpen={selectedVersionId === selectedVersion.id}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Calendar className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">暂无版本</p>
          <p className="text-sm mt-1">创建第一个版本开始管理项目进度</p>
        </div>
      )}
    </div>
  );
});
