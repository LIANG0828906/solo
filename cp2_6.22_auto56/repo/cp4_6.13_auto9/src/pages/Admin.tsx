import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  LayoutGrid,
  Edit3,
  X,
  GripVertical,
  Save,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import Toast from '../components/Toast';
import type { User, Board, SwimLane } from '../types';

export default function Admin() {
  const navigate = useNavigate();
  const { user, setUser, addToast } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'boards'>('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editBoardName, setEditBoardName] = useState('');
  const [editLanes, setEditLanes] = useState<{ id?: string; name: string }[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!user && savedUser) {
      setUser(JSON.parse(savedUser));
    } else if (!user) {
      navigate('/login');
      return;
    } else if (user.role !== 'admin') {
      navigate('/boards');
      return;
    }

    loadData();
  }, [user, navigate, setUser]);

  const loadData = async () => {
    try {
      const [usersRes, boardsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/boards'),
      ]);
      const usersData = await usersRes.json();
      const boardsData = await boardsRes.json();
      if (usersData.success) setUsers(usersData.users);
      if (boardsData.success) setBoards(boardsData.boards);
    } catch {
      addToast({ message: '加载数据失败', type: 'error' });
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newMemberName, role: 'member' }),
      });
      const data = await response.json();
      if (data.success) {
        setUsers([...users, data.user]);
        setNewMemberName('');
        setShowAddMember(false);
        addToast({ message: '成员添加成功', type: 'success' });
      }
    } catch {
      addToast({ message: '添加失败，请重试', type: 'error' });
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm('确定要移除该成员吗？')) return;
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setUsers(users.filter((u) => u.id !== id));
        addToast({ message: '成员已移除', type: 'success' });
      }
    } catch {
      addToast({ message: '移除失败，请重试', type: 'error' });
    }
  };

  const startEditBoard = (board: Board) => {
    setEditingBoard(board);
    setEditBoardName(board.name);
    setEditLanes(board.swimLanes.map((l) => ({ id: l.id, name: l.name })));
  };

  const handleSaveBoard = async () => {
    if (!editingBoard || !editBoardName.trim()) return;
    try {
      const response = await fetch