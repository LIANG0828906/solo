import { useEffect } from 'react';
import Card from '@/components/Card';
import { useAudioStore } from '@/store';
import { getAudios, AudioItem } from '@/api';
import { v4 as uuidv4 } from 'uuid';

const MOCK_AUDIOS: AudioItem[] = [
  {
    id: uuidv4(),
    title: '清晨的口哨',
    emotion: 'happy',
    duration: 15,
    likes: 128,
    filePath: '',
    createdAt: new Date().toISOString(),
    audioData: [0.8, 0.6, 0.9, 0.5, 0.7, 0.85, 0.6, 0.95, 0.7, 0.55