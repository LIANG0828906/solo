export type AlgorithmType = 'bubble' | 'insertion' | 'selection' | 'quick';

export type StepType = 'compare' | 'swap' | 'insert' | 'pivot' | 'sorted' | 'partition' | 'overwrite';

export interface SortStep {
  type: StepType;
  indices: number[];
  arraySnapshot: number[];
  comparisons: number;
  swaps: number;
  pseudocodeLine: number;
  sortedIndices?: number[];
  description?: string;
}

export interface PseudocodeMap {
  [key: string]: string[];
}

export const ALGORITHM_NAMES: Record<AlgorithmType, string> = {
  bubble: '冒泡排序',
  insertion: '插入排序',
  selection: '选择排序',
  quick: '快速排序',
};

export const PSEUDOCODE: PseudocodeMap = {
  bubble: [
    'procedure bubbleSort(arr):',
    '  n = length(arr)',
    '  for i from 0 to n-1:',
    '    for j from 0 to n-i-2:',
    '      if arr[j] > arr[j+1]:',
    '        swap arr[j] and arr[j+1]',
    '    mark arr[n-i-1] as sorted',
    'end procedure',
  ],
  insertion: [
    'procedure insertionSort(arr):',
    '  n = length(arr)',
    '  for i from 1 to n-1:',
    '    key = arr[i]',
    '    j = i - 1',
    '    while j >= 0 and arr[j] > key:',
    '      arr[j+1] = arr[j]',
    '      j = j - 1',
    '    arr[j+1] = key',
    'end procedure',
  ],
  selection: [
    'procedure selectionSort(arr):',
    '  n = length(arr)',
    '  for i from 0 to n-1:',
    '    minIdx = i',
    '    for j from i+1 to n-1:',
    '      if arr[j] < arr[minIdx]:',
    '        minIdx = j',
    '    if minIdx != i:',
    '      swap arr[i] and arr[minIdx]',
    'end procedure',
  ],
  quick: [
    'procedure quickSort(arr, low, high):',
    '  if low < high:',
    '    pivotIndex = partition(arr, low, high)',
    '    quickSort(arr, low, pivotIndex-1)',
    '    quickSort(arr, pivotIndex+1, high)',
    '',
    'procedure partition(arr, low, high):',
    '  pivot = arr[high]',
    '  i = low - 1',
    '  for j from low to high-1:',
    '    if arr[j] <= pivot:',
    '      i = i + 1',
    '      swap arr[i] and arr[j]',
    '  swap arr[i+1] and arr[high]',
    '  return i + 1',
    'end procedure',
  ],
};
