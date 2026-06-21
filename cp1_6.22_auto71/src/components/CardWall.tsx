import React, { useState, useMemo, useCallback } from 'react';
import { InspirationCard, FilterState, DragState, TagColor } from '@/types';
import { createNewCard, balanceColumns, reorderCards } from '@/utils';
import Card from './Card';
import FilterBar from './FilterBar';
import EditorModal from './EditorModal';
import styles from '@/styles/CardWall.module.css';

const createInitialCards = (): InspirationCard[] => {
  const samples: Array<Omit<InspirationCard, 'id' | 'createdAt' | 'updatedAt' | 'column' | 'order'>> = [
    {
      title: '晨间灵感',
      content: '早晨醒来时的思维最清晰，应该记录下梦境中的创意元素。可以尝试建立一个"梦境日记"的习惯，每天早上花5分钟记录。',
      color: 'dustyBlue',
      emoji: '🌙',
      isFavorite: true,
    },
    {
      title: '极简设计原则',
      content: '少即是多。在UI设计中，每个元素都应该有其存在的理由。去除不必要的装饰，让内容自己说话。',
      color: 'dustyPurple',
      emoji: '✨',
      isFavorite: false,
    },
    {
      title: '用户体验细节',
      content: '微交互是提升体验的关键：按钮的反馈、加载的动画、错误的提示，这些细节决定了产品的品质感。',
      color: 'matchaGreen',
      emoji: '🎯',
      isFavorite: false,
    },
    {
      title: '色彩搭配灵感',
      content: '莫兰迪色系的精髓在于低饱和度，让色彩变得柔和而有质感。可以从自然中汲取配色灵感。',
      color: 'warmOrange',
      emoji: '🎨',
      isFavorite: true,
    },
    {
      title: '写作的节奏感',