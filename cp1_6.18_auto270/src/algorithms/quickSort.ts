import { SortStep } from './types';

export function generateQuickSortSteps(initialArray: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const arr = [...initialArray];
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  const sortedIndices: number[] = [];

  steps.push({
    type: 'compare',
    indices: [],
    arraySnapshot: [...arr],
    comparisons: 0,
    swaps: 0,
    pseudocodeLine: 0,
    sortedIndices: [],
  });

  function quickSort(low: number, high: number) {
    if (low < high) {
      steps.push({
        type: 'compare',
        indices: [low, high],
        arraySnapshot: [...arr],
        comparisons,
        swaps,
        pseudocodeLine: 1,
        sortedIndices: [...sortedIndices],
      });

      const pivotIndex = partition(low, high);

      quickSort(low, pivotIndex - 1);
      quickSort(pivotIndex + 1, high);
    } else if (low === high) {
      if (!sortedIndices.includes(low)) {
        sortedIndices.push(low);
        steps.push({
          type: 'sorted',
          indices: [low],
          arraySnapshot: [...arr],
          comparisons,
          swaps,
          pseudocodeLine: 1,
          sortedIndices: [...sortedIndices],
        });
      }
    }
  }

  function partition(low: number, high: number): number {
    const pivot = arr[high];
    let i = low - 1;

    steps.push({
      type: 'pivot',
      indices: [high],
      arraySnapshot: [...arr],
      comparisons,
      swaps,
      pseudocodeLine: 7,
      sortedIndices: [...sortedIndices],
    });

    steps.push({
      type: 'compare',
      indices: [],
      arraySnapshot: [...arr],
      comparisons,
      swaps,
      pseudocodeLine: 8,
      sortedIndices: [...sortedIndices],
    });

    for (let j = low; j < high; j++) {
      comparisons++;
      steps.push({
        type: 'compare',
        indices: [j, high],
        arraySnapshot: [...arr],
        comparisons,
        swaps,
        pseudocodeLine: 10,
        sortedIndices: [...sortedIndices],
      });

      if (arr[j] <= pivot) {
        i++;

        steps.push({
          type: 'compare',
          indices: [i],
          arraySnapshot: [...arr],
          comparisons,
          swaps,
          pseudocodeLine: 11,
          sortedIndices: [...sortedIndices],
        });

        if (i !== j) {
          steps.push({
            type: 'swap',
            indices: [i, j],
            arraySnapshot: [...arr],
            comparisons,
            swaps,
            pseudocodeLine: 12,
            sortedIndices: [...sortedIndices],
          });

          const temp = arr[i];
          arr[i] = arr[j];
          arr[j] = temp;
          swaps++;

          steps.push({
            type: 'swap',
            indices: [i, j],
            arraySnapshot: [...arr],
            comparisons,
            swaps,
            pseudocodeLine: 12,
            sortedIndices: [...sortedIndices],
          });
        }
      }
    }

    if (i + 1 !== high) {
      steps.push({
        type: 'swap',
        indices: [i + 1, high],
        arraySnapshot: [...arr],
        comparisons,
        swaps,
        pseudocodeLine: 13,
        sortedIndices: [...sortedIndices],
      });

      const temp = arr[i + 1];
      arr[i + 1] = arr[high];
      arr[high] = temp;
      swaps++;

      steps.push({
        type: 'swap',
        indices: [i + 1, high],
        arraySnapshot: [...arr],
        comparisons,
        swaps,
        pseudocodeLine: 13,
        sortedIndices: [...sortedIndices],
      });
    }

    if (!sortedIndices.includes(i + 1)) {
      sortedIndices.push(i + 1);
      steps.push({
        type: 'sorted',
        indices: [i + 1],
        arraySnapshot: [...arr],
        comparisons,
        swaps,
        pseudocodeLine: 14,
        sortedIndices: [...sortedIndices],
      });
    }

    return i + 1;
  }

  quickSort(0, n - 1);

  steps.push({
    type: 'sorted',
    indices: [],
    arraySnapshot: [...arr],
    comparisons,
    swaps,
    pseudocodeLine: 3,
    sortedIndices: Array.from({ length: n }, (_, i) => i),
  });

  return steps;
}
