import React, { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from '../utils';

type CoinCounterProps = {
  coins: number;
};

export const CoinCounter: React.FC<CoinCounterProps> = ({ coins }) => {
  const [displayCoins, setDisplayCoins] = useState(coins);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [isDecreasing, setIsDecreasing] = useState(false);
  const animationRef = useRef<number | null>(null);
  const targetRef = useRef(coins);
  const pendingTargetRef = useRef<number | null>(null);

  const animateTo = useCallback((target: number) => {
