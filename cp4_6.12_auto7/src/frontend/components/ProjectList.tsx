import { useState, useEffect } from 'react';
import {
  getProjects,
  updateProjectStatus,
  createProject,
  statusLabels,
  statusColors,
  statusOrder,
  type Project,
  type ProjectStatus
} from '../api/projects';

const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    project_type: '桌子',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    wood_type: '黑胡桃木',
    surface_finish: '清漆',
    expected_date: '',
    description: ''
  });

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError('加载项目列表失败，请稍后重试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleStatusUpdate = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      await updateProjectStatus(projectId, newStatus);
      setSuccessMessage('项目状态更新成功，通知邮件已发送');