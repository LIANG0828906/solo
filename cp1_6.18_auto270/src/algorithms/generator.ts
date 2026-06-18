import { AlgorithmType, SortStep } from './types';
import { generateBubbleSortSteps } from './bubbleSort';
import { generateInsertionSortSteps } from './insertionSort';
import { generateSelectionSortSteps } from './selectionSort';
import { generateQuickSortSteps } from './quickSort';

export function generateSortSteps(
  algorithm: AlgorithmType,
  array: number[]
): SortStep[] {
  switch (algorithm) {
    case 'bubble':
      return generateBubbleSortSteps(array);
    case 'insertion':
      return generateInsertionSortSteps(array);
    case 'selection':
      return generateSelectionSortSteps(array);
    case 'quick':
      return generateQuickSortSteps(array);
    default:
      return generateBubbleSortSteps(array);
  }
}

export function generateRandomArray(): number[] {
  const length = Math.floor(Math.random() * 16) + 15;
  const arr: number[] = [];
  for (let i = 0; i < length; i++) {
    arr.push(Math.floor(Math.random() * 191) + 10);
  }
  return arr;
}
