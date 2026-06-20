export interface SortStep {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  comparisons: number;
  swaps: number;
}

export type SortGenerator = Generator<SortStep, void, unknown>;
export type SortFunction = (arr: number[]) => SortGenerator;

function cloneArray(arr: number[]): number[] {
  return [...arr];
}

export function* bubbleSort(arr: number[]): SortGenerator {
  const array = cloneArray(arr);
  const n = array.length;
  let comparisons = 0;
  let swaps = 0;
  const sorted: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      yield {
        array: cloneArray(array),
        comparing: [j, j + 1],
        swapping: [],
        sorted: [...sorted],
        comparisons,
        swaps,
      };

      if (array[j] > array[j + 1]) {
        swaps++;
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        swapped = true;
        yield {
          array: cloneArray(array),
          comparing: [],
          swapping: [j, j + 1],
          sorted: [...sorted],
          comparisons,
          swaps,
        };
      }
    }
    sorted.unshift(n - i - 1);
    if (!swapped) {
      for (let k = 0; k < n - i - 1; k++) {
        if (!sorted.includes(k)) {
          sorted.push(k);
        }
      }
      break;
    }
  }
  if (!sorted.includes(0)) {
    sorted.unshift(0);
  }

  yield {
    array: cloneArray(array),
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    comparisons,
    swaps,
  };
}

export function* selectionSort(arr: number[]): SortGenerator {
  const array = cloneArray(arr);
  const n = array.length;
  let comparisons = 0;
  let swaps = 0;
  const sorted: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      yield {
        array: cloneArray(array),
        comparing: [minIdx, j],
        swapping: [],
        sorted: [...sorted],
        comparisons,
        swaps,
      };

      if (array[j] < array[minIdx]) {
        minIdx = j;
      }
    }

    if (minIdx !== i) {
      swaps++;
      [array[i], array[minIdx]] = [array[minIdx], array[i]];
      yield {
        array: cloneArray(array),
        comparing: [],
        swapping: [i, minIdx],
        sorted: [...sorted],
        comparisons,
        swaps,
      };
    }
    sorted.push(i);
  }
  sorted.push(n - 1);

  yield {
    array: cloneArray(array),
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    comparisons,
    swaps,
  };
}

export function* insertionSort(arr: number[]): SortGenerator {
  const array = cloneArray(arr);
  const n = array.length;
  let comparisons = 0;
  let swaps = 0;
  const sorted: number[] = [0];

  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      comparisons++;
      yield {
        array: cloneArray(array),
        comparing: [j - 1, j],
        swapping: [],
        sorted: [...sorted],
        comparisons,
        swaps,
      };

      if (array[j - 1] > array[j]) {
        swaps++;
        [array[j - 1], array[j]] = [array[j], array[j - 1]];
        yield {
          array: cloneArray(array),
          comparing: [],
          swapping: [j - 1, j],
          sorted: [...sorted],
          comparisons,
          swaps,
        };
        j--;
      } else {
        break;
      }
    }
    sorted.push(i);
  }

  yield {
    array: cloneArray(array),
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    comparisons,
    swaps,
  };
}

function* quickSortHelper(
  arr: number[],
  low: number,
  high: number,
  comparisonsRef: { value: number },
  swapsRef: { value: number },
  sortedRef: Set<number>
): Generator<SortStep, void, unknown> {
  if (low >= high) {
    if (low === high) {
      sortedRef.add(low);
    }
    return;
  }

  const mid = Math.floor((low + high) / 2);
  const pivotIdx = mid;
  const pivotVal = arr[pivotIdx];

  [arr[pivotIdx], arr[high]] = [arr[high], arr[pivotIdx]];
  swapsRef.value++;
  yield {
    array: [...arr],
    comparing: [],
    swapping: [pivotIdx, high],
    sorted: [...sortedRef],
    comparisons: comparisonsRef.value,
    swaps: swapsRef.value,
  };

  let i = low;
  for (let j = low; j < high; j++) {
    comparisonsRef.value++;
    yield {
      array: [...arr],
      comparing: [j, high],
      swapping: [],
      sorted: [...sortedRef],
      comparisons: comparisonsRef.value,
      swaps: swapsRef.value,
    };

    if (arr[j] < pivotVal) {
      if (i !== j) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        swapsRef.value++;
        yield {
          array: [...arr],
          comparing: [],
          swapping: [i, j],
          sorted: [...sortedRef],
          comparisons: comparisonsRef.value,
          swaps: swapsRef.value,
        };
      }
      i++;
    }
  }

  [arr[i], arr[high]] = [arr[high], arr[i]];
  swapsRef.value++;
  yield {
    array: [...arr],
    comparing: [],
    swapping: [i, high],
    sorted: [...sortedRef],
    comparisons: comparisonsRef.value,
    swaps: swapsRef.value,
  };

  sortedRef.add(i);

  yield* quickSortHelper(arr, low, i - 1, comparisonsRef, swapsRef, sortedRef);
  yield* quickSortHelper(arr, i + 1, high, comparisonsRef, swapsRef, sortedRef);
}

export function* quickSort(arr: number[]): SortGenerator {
  const array = cloneArray(arr);
  const n = array.length;
  const comparisonsRef = { value: 0 };
  const swapsRef = { value: 0 };
  const sortedRef = new Set<number>();

  yield* quickSortHelper(array, 0, n - 1, comparisonsRef, swapsRef, sortedRef);

  yield {
    array: [...array],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    comparisons: comparisonsRef.value,
    swaps: swapsRef.value,
  };
}

function* mergeSortHelper(
  arr: number[],
  temp: number[],
  left: number,
  right: number,
  comparisonsRef: { value: number },
  swapsRef: { value: number },
  sortedRef: Set<number>
): Generator<SortStep, void, unknown> {
  if (left >= right) {
    return;
  }

  const mid = Math.floor((left + right) / 2);

  yield* mergeSortHelper(arr, temp, left, mid, comparisonsRef, swapsRef, sortedRef);
  yield* mergeSortHelper(arr, temp, mid + 1, right, comparisonsRef, swapsRef, sortedRef);

  let i = left;
  let j = mid + 1;
  let k = left;

  while (i <= mid && j <= right) {
    comparisonsRef.value++;
    yield {
      array: [...arr],
      comparing: [i, j],
      swapping: [],
      sorted: [...sortedRef],
      comparisons: comparisonsRef.value,
      swaps: swapsRef.value,
    };

    if (arr[i] <= arr[j]) {
      temp[k] = arr[i];
      i++;
    } else {
      temp[k] = arr[j];
      j++;
    }
    k++;
  }

  while (i <= mid) {
    temp[k] = arr[i];
    i++;
    k++;
  }

  while (j <= right) {
    temp[k] = arr[j];
    j++;
    k++;
  }

  for (let m = left; m <= right; m++) {
    if (arr[m] !== temp[m]) {
      swapsRef.value++;
    }
    arr[m] = temp[m];
  }

  yield {
    array: [...arr],
    comparing: [],
    swapping: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
    sorted: [...sortedRef],
    comparisons: comparisonsRef.value,
    swaps: swapsRef.value,
  };

  if (left === 0 && right === arr.length - 1) {
    for (let idx = 0; idx < arr.length; idx++) {
      sortedRef.add(idx);
    }
  }
}

export function* mergeSort(arr: number[]): SortGenerator {
  const array = cloneArray(arr);
  const n = array.length;
  const temp = new Array(n);
  const comparisonsRef = { value: 0 };
  const swapsRef = { value: 0 };
  const sortedRef = new Set<number>();

  yield* mergeSortHelper(array, temp, 0, n - 1, comparisonsRef, swapsRef, sortedRef);

  yield {
    array: [...array],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    comparisons: comparisonsRef.value,
    swaps: swapsRef.value,
  };
}

export interface AlgorithmInfo {
  id: string;
  name: string;
  fn: SortFunction;
}

export const algorithms: AlgorithmInfo[] = [
  { id: 'bubble', name: '冒泡排序', fn: bubbleSort },
  { id: 'selection', name: '选择排序', fn: selectionSort },
  { id: 'insertion', name: '插入排序', fn: insertionSort },
  { id: 'quick', name: '快速排序', fn: quickSort },
  { id: 'merge', name: '归并排序', fn: mergeSort },
];

export function getAlgorithmById(id: string): AlgorithmInfo | undefined {
  return algorithms.find((a) => a.id === id);
}
