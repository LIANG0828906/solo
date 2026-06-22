import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Task } from '../types';
import { getSubjectColor, formatTime } from '../utils/planner';
import { format, parseISO, addDays, differenceInDays, startOfDay } from 'date-fns';

interface PlannerProps {
  tasks: Task[];
  onTaskStatusChange: (taskId: string, status: Task['status']) => void;
  onTaskReorder: (date: string, startIndex: number, endIndex: number) => void;
}

const ganttContainerStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(74, 144, 217, 0.1)',
  overflow: 'hidden',
};

const ganttHeaderStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid #E0E8F0',
  backgroundColor: '#F0F4F8',
};

const timelineContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
  overflowY: 'hidden',
  position: 'sticky',
  top: 0,
  backgroundColor: '#fff',
  zIndex: 10,
  borderBottom: '1px solid #E0E8F0',
};

const ganttBodyStyle: React.CSSProperties = {
  overflowX: 'auto',
  overflowY: 'auto',
  maxHeight: 'calc(100vh - 300px)',
};

const taskCardStyle: React.CSSProperties = {
  padding: '8px 12px',
  margin: '4px 0',
  borderRadius: '6px',
  cursor: 'grab',
  transition: 'all 0.2s ease',
  fontSize: '13px',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  userSelect: 'none',
};

const statusBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  padding: '2px 6px',
  borderRadius: '4px',
  marginLeft: '6px',
  display: 'inline-block',
};

const dayColumnStyle: React.CSSProperties = {
  minWidth: '200px',
  padding: '8px',
  verticalAlign: 'top',
  borderRight: '1px solid #F0F4F8',
};

function Planner({ tasks, onTaskStatusChange, onTaskReorder }: PlannerProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const dates = useMemo(() => {
    if (tasks.length === 0) return [];
    const dateSet = new Set(tasks.map((t) => t.date));
    return Array.from(dateSet).sort();
  }, [tasks]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    dates.forEach((date) => {
      map[date] = tasks.filter((t) => t.date === date);
    });
    return map;
  }, [tasks, dates]);

  useEffect(() => {
    if (!svgRef.current || dates.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dates.length * 200;
    const height = 60;
    svg.attr('width', width).attr('height', height);

    const startDate = parseISO(dates[0]);
    const endDate = parseISO(dates[dates.length - 1]);
    const totalDays = differenceInDays(endDate, startDate) + 1;

    const xScale = d3
      .scaleTime()
      .domain([startDate, addDays(endDate, 1)])
      .range([0, width]);

    const xAxis = d3
      .axisTop(xScale)
      .ticks(totalDays)
      .tickFormat((d) => format(d as Date, 'MM/dd'))
      .tickSize(0);

    const g = svg.append('g').attr('transform', 'translate(0, 35)');

    xAxis(g);

    g.selectAll('.tick text')
      .attr('font-size', '12px')
      .attr('fill', '#666');

    g.selectAll('.tick line').remove();
    g.select('.domain').remove();

    g.selectAll('.tick')
      .filter((d) => {
        const day = (d as Date).getDay();
        return day === 0 || day === 6;
      })
      .select('text')
      .attr('fill', '#FF6B6B');
  }, [dates]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const date = result.source.droppableId;
    onTaskReorder(date, result.source.index, result.destination.index);
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return '#3CB371';
      case 'in-progress':
        return '#FFA500';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in-progress':
        return '进行中';
      default:
        return '未开始';
    }
  };

  const isToday = (dateStr: string) => {
    return format(startOfDay(new Date()), 'yyyy-MM-dd') === dateStr;
  };

  return (
    <div style={ganttContainerStyle}>
      <div style={ganttHeaderStyle}>
        <h3 style={{ fontSize: '16px', color: '#333', marginBottom: '4px' }}>
          学习计划甘特图
        </h3>
        <p style={{ fontSize: '13px', color: '#666' }}>
          共 {dates.length} 天，{tasks.length} 个任务
        </p>
      </div>

      <div style={timelineContainerStyle}>
        <svg ref={svgRef} style={{ display: 'block' }} />
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={ganttBodyStyle}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: dates.length * 200 }}>
            <tbody>
              <tr>
                {dates.map((date) => (
                  <td
                    key={date}
                    style={{
                      ...dayColumnStyle,
                      backgroundColor: isToday(date) ? '#FFF8E1' : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '13px',
                        color: isToday(date) ? '#FF6B00' : '#333',
                        marginBottom: '8px',
                        paddingBottom: '4px',
                        borderBottom: '2px solid #4A90D9',
                      }}
                    >
                      {format(parseISO(date), 'MM月dd日')}
                      {isToday(date) && (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '11px',
                            backgroundColor: '#FF6B00',
                            color: '#fff',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          今天
                        </span>
                      )}
                    </div>

                    <Droppable droppableId={date}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            minHeight: '100px',
                            backgroundColor: snapshot.isDraggingOver
                              ? '#E8F0FE'
                              : 'transparent',
                            borderRadius: '6px',
                            transition: 'background-color 0.2s ease',
                          }}
                        >
                          {tasksByDate[date]?.map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...taskCardStyle,
                                    backgroundColor: snapshot.isDragging
                                      ? '#fff'
                                      : getSubjectColor(task.subjectId) + '15',
                                    borderLeft: `4px solid ${getSubjectColor(task.subjectId)}`,
                                    transform: snapshot.isDragging
                                      ? 'scale(1.02)'
                                      : 'scale(1)',
                                    boxShadow: snapshot.isDragging
                                      ? '0 8px 25px rgba(74, 144, 217, 0.2)'
                                      : '0 2px 4px rgba(0, 0, 0, 0.05)',
                                    ...provided.draggableProps.style,
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!snapshot.isDragging) {
                                      e.currentTarget.style.transform = 'scale(1.02)';
                                      e.currentTarget.style.boxShadow =
                                        '0 4px 12px rgba(74, 144, 217, 0.15)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!snapshot.isDragging) {
                                      e.currentTarget.style.transform = 'scale(1)';
                                      e.currentTarget.style.boxShadow =
                                        '0 2px 4px rgba(0, 0, 0, 0.05)';
                                    }
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 500,
                                      color: '#333',
                                      marginBottom: '4px',
                                    }}
                                  >
                                    {task.title}
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: '12px',
                                        color: '#666',
                                      }}
                                    >
                                      {formatTime(task.duration)}
                                    </span>
                                    <span
                                      style={{
                                        ...statusBadgeStyle,
                                        backgroundColor: getStatusColor(task.status) + '20',
                                        color: getStatusColor(task.status),
                                      }}
                                    >
                                      {getStatusText(task.status)}
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: '4px',
                                      marginTop: '8px',
                                    }}
                                  >
                                    <button
                                      onClick={() =>
                                        onTaskStatusChange(task.id, 'todo')
                                      }
                                      style={{
                                        flex: 1,
                                        padding: '4px',
                                        fontSize: '11px',
                                        borderRadius: '4px',
                                        backgroundColor:
                                          task.status === 'todo'
                                            ? '#999'
                                            : '#f0f0f0',
                                        color:
                                          task.status === 'todo'
                                            ? '#fff'
                                            : '#666',
                                      }}
                                    >
                                      未开始
                                    </button>
                                    <button
                                      onClick={() =>
                                        onTaskStatusChange(task.id, 'in-progress')
                                      }
                                      style={{
                                        flex: 1,
                                        padding: '4px',
                                        fontSize: '11px',
                                        borderRadius: '4px',
                                        backgroundColor:
                                          task.status === 'in-progress'
                                            ? '#FFA500'
                                            : '#f0f0f0',
                                        color:
                                          task.status === 'in-progress'
                                            ? '#fff'
                                            : '#666',
                                      }}
                                    >
                                      进行中
                                    </button>
                                    <button
                                      onClick={() =>
                                        onTaskStatusChange(task.id, 'completed')
                                      }
                                      style={{
                                        flex: 1,
                                        padding: '4px',
                                        fontSize: '11px',
                                        borderRadius: '4px',
                                        backgroundColor:
                                          task.status === 'completed'
                                            ? '#3CB371'
                                            : '#f0f0f0',
                                        color:
                                          task.status === 'completed'
                                            ? '#fff'
                                            : '#666',
                                      }}
                                    >
                                      完成
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </DragDropContext>
    </div>
  );
}

export default Planner;
