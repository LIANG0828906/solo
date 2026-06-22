import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Download, UserPlus, Upload, X, ChevronDown } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import Timeline from '@/components/Timeline';
import WaveformCompare from '@/components/WaveformCompare';
import CommentSection from '@/components/CommentSection';
import AudioPlayer from '@/components/AudioPlayer';
import Waveform from '@/components/Waveform';
import AudioExportDialog from '@/modules/audioExport/AudioExportDialog';
import { cn } from '@/lib/utils';
import type { TrackStatus, Collaborator, Version } from '@/types';

const STATUS_LABELS: Record<TrackStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待录制', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  recorded: { label: '已录制', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  mixing: { label: '混音中', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
  finalized: { label: '已定稿', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const projects = useProjectStore((state) => state.projects);
  const selectProject = useProjectStore((state) => state.selectProject);
  const selectedTrackId = useProjectStore((state) => state.selectedTrackId);
  const selectedVersionIds = useProjectStore((state) => state.selectedVersionIds);
  const selectTrack = useProjectStore((state) => state.selectTrack);
  const selectVersionForCompare = useProjectStore((state) => state.selectVersionForCompare);
  const getProjectTracks = useProjectStore((state) => state.getProjectTracks);
  const getTrackVersions = useProjectStore((state) => state.getTrackVersions);
  const addTrack = useProjectStore((state) => state.addTrack);
  const addVersion = useProjectStore((state) => state.addVersion);
  const addCollaborator = useProjectStore((state) => state.addCollaborator);
  const assignCollaborator = useProjectStore((state) => state.assignCollaborator);
  const markTrackComplete = useProjectStore((state) => state.markTrackComplete);
  const currentUser = useProjectStore((state