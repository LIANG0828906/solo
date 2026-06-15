import type { Algorithm } from '../../../shared/types';

export const algorithms: Algorithm[] = [
  {
    name: '冒泡排序',
    category: 'sorting',
    description: '重复遍历数组，比较相邻元素并交换顺序错误的元素，直到没有需要交换的元素。',
    code: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // @compare
      if (arr[j] > arr[j + 1]) {
        // @swap
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`
  },
  {
    name: '选择排序',
    category: 'sorting',
    description: '每次从未排序部分找到最小元素，放到已排序部分的末尾。',
    code: `function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      // @compare
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      // @swap
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
  }
  return arr;
}`
  },
  {
    name: '插入排序',
    category: 'sorting',
    description: '将未排序元素逐个插入到已排序部分的正确位置。',
    code: `function insertionSort(arr) {
  const n = arr.length;
  for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0) {
      // @compare
      if (arr[j] > key) {
        // @swap
        arr[j + 1] = arr[j];
        j--;
      } else {
        break;
      }
    }
    arr[j + 1] = key;
  }
  return arr;
}`
  },
  {
    name: '快速排序',
    category: 'sorting',
    description: '选择基准元素，将数组分为小于和大于基准的两部分，递归排序。',
    code: `function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      // @compare
      if (arr[j] < pivot) {
        i++;
        // @swap
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    // @swap
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    const pi = i + 1;
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
  return arr;
}`
  },
  {
    name: '归并排序',
    category: 'sorting',
    description: '将数组分成两半，分别排序后再合并成有序数组。',
    code: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    // @compare
    if (left[i] <= right[j]) {
      // @swap
      result.push(left[i]);
      i++;
    } else {
      // @swap
      result.push(right[j]);
      j++;
    }
  }
  while (i < left.length) {
    result.push(left[i]);
    i++;
  }
  while (j < right.length) {
    result.push(right[j]);
    j++;
  }
  return result;
}`
  },
  {
    name: '线性搜索',
    category: 'searching',
    description: '从头到尾逐个检查数组元素，直到找到目标或遍历完数组。',
    code: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    // @compare
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}`
  },
  {
    name: '二分搜索',
    category: 'searching',
    description: '在有序数组中，每次将搜索范围缩小一半，直到找到目标。',
    code: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    // @compare
    if (arr[mid] === target) {
      return mid;
    }
    // @compare
    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
}`
  }
];

export default algorithms;
