import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from './types';

interface CardComponentProps {
  card: Card;
  isSelected: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onDoubleClick: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  onResize