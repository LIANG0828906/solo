import React, { forwardRef, useState, useCallback, useRef, DragEvent, TouchEvent } from 'react';
import { ResumeData, ModuleType, THEME_CONFIG } from '@/data/resumeModel';
import { cn } from '@/lib/utils';

interface ResumePreviewProps {
  data: ResumeData;
  theme: string;
  moduleOrder: ModuleType[];
  onModuleReorder?: (newOrder: ModuleType[]) => void;
}

const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ data, theme, moduleOrder, onModuleReorder }, ref) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // ========== 触摸拖拽状态 ==========
    // 是否正在触摸拖拽
    const [touchDragging, setTouchDragging] = useState<boolean>(false);
    // 开始拖拽的模块索引
    const [touchStartIndex, setTouchStartIndex] = useState<number | null>(null);
    // 当前手指所在的模块索引
    const [touchMoveIndex, setTouchMoveIndex] = useState<number | null>(null);
    // 触摸点相对模块左上角的偏移量，用于计算拖拽时的位置
    const [touchDragOffset, setTouchDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    // 当前手指的屏幕坐标
    const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);
    // 模块卡片的 refs 数组，用于触摸移动时查找当前手指所在的模块
    const moduleRefs = useRef<(HTMLDivElement | null)[]>([]);
    // ================================

    const themeConfig = THEME_CONFIG[theme] || THEME_CONFIG['简洁灰'];

    const cssVars = {
      '--resume-width': '210mm',
      '--resume-height': '297mm',
      '--resume-primary': themeConfig.primary,
      '--resume-background': themeConfig.background,
      '--resume-text': themeConfig.text,
      '--resume-accent': themeConfig.accent,
      '--resume-shadow': themeConfig.shadow,
      '--resume-font-family': themeConfig.fontFamily,
    } as React.CSSProperties;

    const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }, []);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverIndex !== index) {
        setDragOverIndex(index);
      }
    }, [dragOverIndex]);

    const handleDragLeave = useCallback(() => {
      setDragOverIndex(null);
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      const newOrder = [...moduleOrder];
      const removed = newOrder[draggedIndex];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(dropIndex, 0, removed);

      onModuleReorder?.(newOrder);
      setDraggedIndex(null);
      setDragOverIndex(null);
    }, [draggedIndex, moduleOrder, onModuleReorder]);

    const handleDragEnd = useCallback(() => {
      setDraggedIndex(null);
      setDragOverIndex(null);
    }, []);

    // ========== 触摸拖拽事件处理 ==========

    /**
     * 触摸开始处理
     * 只在拖拽手柄区域（drag-handle 或其内部 svg）触发拖拽
     * 记录触摸起始位置和相对模块的偏移量
     */
    const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>, index: number) => {
      const touch = e.touches[0];
      const target = e.target as HTMLElement;

      // 检查触摸目标是否是拖拽手柄（drag-handle 类或其内部的 svg 子元素）
      const isDragHandle = target.closest('.drag-handle');
      if (!isDragHandle) {
        return;
      }

      // 获取当前模块卡片的 DOM 元素
      const moduleEl = moduleRefs.current[index];
      if (!moduleEl) return;

      // 计算模块在视口中的位置
      const rect = moduleEl.getBoundingClientRect();
      // 计算触摸点相对模块左上角的偏移，保证拖拽时手指始终按在同一个位置
      const offsetX = touch.clientX - rect.left;
      const offsetY = touch.clientY - rect.top;

      setTouchDragOffset({ x: offsetX, y: offsetY });
      setTouchPosition({ x: touch.clientX, y: touch.clientY });
      setTouchDragging(true);
      setTouchStartIndex(index);
      setTouchMoveIndex(index);
    }, []);

    /**
     * 触摸移动处理（绑定到最外层容器）
     * 阻止页面滚动，更新手指坐标，查找当前所在模块
     */
    const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
      // 如果没有在拖拽，不处理
      if (!touchDragging) return;

      const touch = e.touches[0];
      // 阻止页面滚动，避免拖拽时页面跟着动
      e.preventDefault();

      const x = touch.clientX;
      const y = touch.clientY;
      // 更新当前手指屏幕坐标
      setTouchPosition({ x, y });

      // 通过坐标查找当前手指所在的 DOM 元素
      const elementAtPoint = document.elementFromPoint(x, y);
      if (!elementAtPoint) return;

      // 向上查找最近的 module-card 元素
      const moduleCard = elementAtPoint.closest('.module-card');
      if (!moduleCard) return;

      // 通过 module-card 在 refs 数组中的索引确定 touchMoveIndex
      const moveIndex = moduleRefs.current.findIndex((ref) => ref === moduleCard);
      if (moveIndex !== -1) {
        setTouchMoveIndex(moveIndex);
      }
    }, [touchDragging]);

    /**
     * 触摸结束处理
     * 如果起始位置和结束位置不同，执行模块重排
     * 最后重置所有触摸状态
     */
    const handleTouchEnd = useCallback(() => {
      // 如果有有效的拖拽操作（起始索引和移动索引不同且都不为空）
      if (
        touchStartIndex !== null &&
        touchMoveIndex !== null &&
        touchStartIndex !== touchMoveIndex
      ) {
        // 执行与 onDrop 相同的模块重排逻辑
        const newOrder = [...moduleOrder];
        const removed = newOrder[touchStartIndex];
        newOrder.splice(touchStartIndex, 1);
        newOrder.splice(touchMoveIndex, 0, removed);
        onModuleReorder?.(newOrder);
      }

      // 重置所有触摸状态
      setTouchDragging(false);
      setTouchStartIndex(null);
      setTouchMoveIndex(null);
      setTouchPosition(null);
      setTouchDragOffset({ x: 0, y: 0 });
    }, [touchStartIndex, touchMoveIndex, moduleOrder, onModuleReorder]);

    // ====================================

    const renderModule = (moduleType: ModuleType, index: number) => {
      const isDragging = draggedIndex === index;
      const isDragOver = dragOverIndex === index && draggedIndex !== index;

      // ========== 触摸拖拽的视觉状态 ==========
      // 触摸拖拽时，起始模块显示拖拽状态（放大半透明）
      const isTouchDragging = touchDragging && touchStartIndex === index;
      // 触摸拖拽时，当前手指所在模块显示 drop 目标（上边距增加）
      const isTouchDragOver = touchDragging && touchMoveIndex === index && touchStartIndex !== index;
      // ====================================

      const moduleContent = () => {
        switch (moduleType) {
          case 'personal':
            return renderPersonalModule();
          case 'work':
            return renderWorkModule();
          case 'education':
            return renderEducationModule();
          case 'skills':
            return renderSkillsModule();
          case 'projects':
            return renderProjectsModule();
          default:
            return null;
        }
      };

      return (
        <div
          key={moduleType}
          // 保存模块的 ref，用于触摸查找
          ref={(el) => {
            moduleRefs.current[index] = el;
          }}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          // 触摸事件处理
          onTouchStart={(e) => handleTouchStart(e, index)}
          className={cn(
            'module-card relative rounded-lg p-4 mb-4 transition-all duration-200',
            // 触摸拖拽时，被拖拽的模块需要提高层级
            isTouchDragging && 'z-10'
          )}
          style={{
            backgroundColor: 'var(--resume-background)',
            // 将 transform、opacity、boxShadow、margin 都放在 style 中，确保 CSS transition 生效
            // 鼠标拖拽 或 触摸拖拽 都应用相同的视觉效果
            transform: (isDragging || isTouchDragging) ? 'scale(1.02)' : 'scale(1)',
            opacity: (isDragging || isTouchDragging) ? 0.5 : 1,
            boxShadow: (isDragging || isTouchDragging)
              ? '0 8px 25px rgba(0, 0, 0, 0.2)'
              : 'var(--resume-shadow)',
            // 鼠标拖拽 hover 或 触摸拖拽 hover 时增加上边距
            margin: (isDragOver || isTouchDragOver) ? '2rem 0 0 0' : '0 0 1rem 0',
            // 统一使用 transition 控制所有动画属性，200ms ease 过渡
            transition: 'transform 200ms ease, box-shadow 200ms ease, margin 200ms ease, opacity 200ms ease',
            // 触摸拖拽时，使用 fixed 定位让卡片跟随手指移动
            ...(isTouchDragging && touchPosition
              ? {
                  position: 'fixed' as const,
                  left: touchPosition.x - touchDragOffset.x,
                  top: touchPosition.y - touchDragOffset.y,
                  width: 'calc(210mm - 30mm)', // 等于 resume 宽度减去左右 padding
                  pointerEvents: 'none' as const, // 避免跟随的卡片挡住 elementFromPoint 检测
                }
              : {}),
          }}
        >
          {/* 拖拽手柄：扩大触摸区域至 min-w-8 min-h-8（32x32px），使用 flex 居中 */}
          <div className="drag-handle absolute top-2 right-2 cursor-grab active:cursor-grabbing select-none text-xs opacity-40 hover:opacity-70 min-w-8 min-h-8 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="2" />
              <circle cx="15" cy="6" r="2" />
              <circle cx="9" cy="12" r="2" />
              <circle cx="15" cy="12" r="2" />
              <circle cx="9" cy="18" r="2" />
              <circle cx="15" cy="18" r="2" />
            </svg>
          </div>
          {moduleContent()}
        </div>
      );
    };

    const renderPersonalModule = () => (
      <div className="personal-module">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--resume-primary)' }}
            >
              {data.personal.name || '姓名'}
            </h1>
            <p
              className="text-base"
              style={{ color: 'var(--resume-accent)' }}
            >
              {data.personal.title || '职位'}
            </p>
          </div>
          {data.personal.avatar && (
            <img
              src={data.personal.avatar}
              alt="avatar"
              className="w-16 h-16 rounded-full object-cover"
              style={{ border: '2px solid var(--resume-primary)' }}
            />
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-sm mb-4" style={{ color: 'var(--resume-text)' }}>
          {data.personal.email && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {data.personal.email}
            </span>
          )}
          {data.personal.phone && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {data.personal.phone}
            </span>
          )}
          {data.personal.location && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {data.personal.location}
            </span>
          )}
        </div>
        {data.personal.summary && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--resume-text)' }}>
            {data.personal.summary}
          </p>
        )}
      </div>
    );

    const renderWorkModule = () => (
      <div className="work-module">
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b" style={{
          color: 'var(--resume-primary)',
          borderColor: 'var(--resume-accent)',
        }}>
          工作经历
        </h2>
        <div className="space-y-4">
          {data.work.length === 0 ? (
            <p className="text-sm opacity-50">暂无工作经历</p>
          ) : (
            data.work.map((item) => (
              <div key={item.id} className="work-item">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--resume-text)' }}>
                      {item.position}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--resume-accent)' }}>
                      {item.company}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--resume-accent)' }}>
                    {item.startDate} - {item.endDate}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm mt-2" style={{ color: 'var(--resume-text)' }}>
                    {item.description}
                  </p>
                )}
                {item.achievements.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {item.achievements.map((achievement, idx) => (
                      <li
                        key={idx}
                        className="text-sm flex items-start gap-2"
                        style={{ color: 'var(--resume-text)' }}
                      >
                        <span
                          className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                          style={{ backgroundColor: 'var(--resume-primary)' }}
                        />
                        {achievement}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );

    const renderEducationModule = () => (
      <div className="education-module">
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b" style={{
          color: 'var(--resume-primary)',
          borderColor: 'var(--resume-accent)',
        }}>
          教育背景
        </h2>
        <div className="space-y-3">
          {data.education.length === 0 ? (
            <p className="text-sm opacity-50">暂无教育背景</p>
          ) : (
            data.education.map((item) => (
              <div key={item.id} className="education-item">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--resume-text)' }}>
                      {item.school}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--resume-accent)' }}>
                      {item.degree} · {item.major}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--resume-accent)' }}>
                    {item.startDate} - {item.endDate}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm mt-2" style={{ color: 'var(--resume-text)' }}>
                    {item.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );

    const renderSkillsModule = () => (
      <div className="skills-module">
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b" style={{
          color: 'var(--resume-primary)',
          borderColor: 'var(--resume-accent)',
        }}>
          技能特长
        </h2>
        {data.skills.length === 0 ? (
          <p className="text-sm opacity-50">暂无技能</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span
                key={skill.id}
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: 'var(--resume-primary)',
                  color: 'var(--resume-background)',
                  opacity: 0.85 + (skill.level / 100) * 0.15,
                }}
              >
                {skill.name}
              </span>
            ))}
          </div>
        )}
      </div>
    );

    const renderProjectsModule = () => (
      <div className="projects-module">
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b" style={{
          color: 'var(--resume-primary)',
          borderColor: 'var(--resume-accent)',
        }}>
          项目经历
        </h2>
        <div className="space-y-4">
          {data.projects.length === 0 ? (
            <p className="text-sm opacity-50">暂无项目经历</p>
          ) : (
            data.projects.map((item) => (
              <div key={item.id} className="project-item">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--resume-text)' }}>
                      {item.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--resume-accent)' }}>
                      {item.role}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--resume-accent)' }}>
                    {item.startDate} - {item.endDate}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm mt-2" style={{ color: 'var(--resume-text)' }}>
                    {item.description}
                  </p>
                )}
                {item.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: 'var(--resume-accent)',
                          color: 'var(--resume-background)',
                          opacity: 0.7,
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {item.highlights.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {item.highlights.map((highlight, idx) => (
                      <li
                        key={idx}
                        className="text-sm flex items-start gap-2"
                        style={{ color: 'var(--resume-text)' }}
                      >
                        <span
                          className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                          style={{ backgroundColor: 'var(--resume-primary)' }}
                        />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );

    return (
      <div
        ref={ref}
        className="resume-container relative overflow-hidden"
        style={{
          ...cssVars,
          width: 'var(--resume-width)',
          height: 'var(--resume-height)',
          minHeight: 'var(--resume-height)',
          backgroundColor: '#FFF',
          backgroundImage: `
            linear-gradient(#EEE 1px, transparent 1px),
            linear-gradient(90deg, #EEE 1px, transparent 1px)
          `,
          backgroundSize: '10mm 10mm',
          fontFamily: 'var(--resume-font-family)',
          color: 'var(--resume-text)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderRadius: '4px',
        }}
        // 在最外层容器绑定触摸移动和结束事件，便于全局处理拖拽
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="resume-content h-full"
          style={{
            padding: '15mm',
            overflowY: 'auto',
          }}
        >
          {moduleOrder.map((moduleType, index) => renderModule(moduleType, index))}
        </div>
      </div>
    );
  }
);

ResumePreview.displayName = 'ResumePreview';

export default ResumePreview;
