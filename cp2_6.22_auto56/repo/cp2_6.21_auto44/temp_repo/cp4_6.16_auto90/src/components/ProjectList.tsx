import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Folder, ChevronRight } from 'lucide-react';
import { useProjectStore, Project } from '@/store/projectStore';
import { cn } from '@/lib/utils';

interface ProjectListProps {
  className?: string;
}

const ProjectItem = memo(({ 
  project, 
  isSelected, 
  index,
  onClick 
}: { 
  project: Project; 
  isSelected: boolean; 
  index: number;
  onClick: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={cn(
        'relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-300',
        'hover:bg-surface group',
        isSelected && 'bg-surface'
      )}
      onClick={onClick}
    >
      {isSelected && (
        <motion.div
          layoutId="selectedIndicator"
          className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      
      <div 
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: project.color }}
      />
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-gray-800 truncate">
          {project.name}
        </h3>
        <p className="text-xs text-gray-500 truncate">
          {project.versions.length} 个版本
        </p>
      </div>
      
      <ChevronRight 
        className={cn(
          'w-4 h-4 text-gray-400 transition-opacity duration-300',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
        )} 
      />
    </motion.div>
  );
});

ProjectItem.displayName = 'ProjectItem';

export const ProjectList = memo(function ProjectList({ className }: ProjectListProps) {
  const { projects, selectedProjectId, selectProject, addProject } = useProjectStore();

  const handleAddProject = useCallback(() => {
    const name = prompt('输入项目名称：');
    if (name) {
      addProject({
        name,
        owner: '我',
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        description: '',
      });
    }
  }, [addProject]);

  const handleSelectProject = useCallback((id: string) => {
    selectProject(id);
  }, [selectProject]);

  return (
    <div className={cn('w-60 bg-white border-r border-gray-200 flex flex-col h-full', className)}>
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <Folder className="w-5 h-5" />
          项目列表
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {projects.map((project, index) => (
          <ProjectItem
            key={project.id}
            project={project}
            isSelected={selectedProjectId === project.id}
            index={index}
            onClick={() => handleSelectProject(project.id)}
          />
        ))}
        
        {projects.length === 0 && (
          <div className="p-4 text-center text-gray-400 text-sm">
            暂无项目
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleAddProject}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 
                     bg-primary text-white rounded-lg text-sm font-medium
                     hover:bg-primary-light active:scale-[0.98]
                     transition-all duration-300 ease-elastic"
        >
          <Plus className="w-4 h-4" />
          新建项目
        </button>
      </div>
    </div>
  );
});
