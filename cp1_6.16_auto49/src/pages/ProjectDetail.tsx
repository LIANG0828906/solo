import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ArrowLeft, Plus, X, MessageSquare, BarChart3, GripVertical } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import ChatPanel from '@/components/ChatPanel';
import MemberStats from '@/components/MemberStats';
import TaskCard from '@/components/TaskCard';
import { formatDate } from '@/utils/helpers';

type TaskStatus = 'todo' | 'in-progress' | 'done';
type TabType = 'tasks' | 'stats' | 'chat';

const statusColumns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: '待处理', color: 'bg-gray-500' },
  { id: 'in-progress', title: '进行中', color: 'bg-blue-500' },
  { id: 'done', title: '已完成', color: 'bg-green-500' },
];

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useProjectStore();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskHours, setTaskHours] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const currentUser = state.users.find(u => u.id === state.currentUserId);
  const project = state.projects.find(p => p.id === projectId);
  const projectTasks = state.tasks.filter(t => t.projectId === projectId);
  const projectCheckins = state.checkins.filter(c => c.projectId === projectId);
  const projectMessages = state.messages.filter(m => m.projectId === projectId);
  const projectMembers = state.users.filter(u => project?.members.includes(u.id));

  const tasksByAssignee = useMemo(() => {
    const grouped: Record<string, typeof projectTasks> = {};
    projectMembers.forEach(member => {
      grouped[member.id] = projectTasks.filter(t => t.assignee === member.id);
    });
    return grouped;
  }, [projectTasks, projectMembers]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, typeof projectTasks> = {
      todo: [],
      'in-progress': [],
      done: [],
    };
    projectTasks.forEach(task => {
      grouped[task.status as TaskStatus].push(task);
    });
    return grouped;
  }, [projectTasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedUserId || !currentUser || !project) return;

    dispatch({
      type: 'ADD_TASK',
      payload: {
        projectId: project.id,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        status: 'todo',
        assignee: selectedUserId,
        estimatedHours: taskHours,
      },
    });

    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskHours(1);
    setSelectedUserId('');
    setShowTaskModal(false);
  };

  const handleCheckin = (taskId: string) => {
    if (!currentUser) return;
    dispatch({
      type: 'ADD_CHECKIN',
      payload: {
        userId: currentUser.id,
        projectId: projectId!,
        taskId,
        content: '打卡',
      },
    });
  };

  const handleSendMessage = (content: string) => {
    if (!currentUser || !project) return;
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        userId: currentUser.id,
        projectId: project.id,
        content,
      },
    });
  };

  const handlePinMessage = (messageId: string) => {
    const message = state.messages.find(m => m.id === message