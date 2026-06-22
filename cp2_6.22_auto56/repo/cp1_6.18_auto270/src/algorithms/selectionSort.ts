import { SortStep } from './types';

export function generateSelectionSortSteps(initialArray: number[]): SortStep[] {
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

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    steps.push({
      type: 'compare',
      indices: [i],
      arraySnapshot: [...arr],
      comparisons,
      swaps,
      pseudocodeLine: 2,
      sortedIndices: [...sortedIndices],
    });

    steps.push({
      type: 'pivot',
      indices: [minIdx],
      arraySnapshot: [...arr],
      comparisons,
      swaps,
      pseudocodeLine: 3,
      sortedIndices: [...sortedIndices],
    });

    for (let j = i + 1; j < n; j++) {
      comparisons++;
      steps.push({
        type: 'compare',
        indices: [minIdx, j],
        arraySnapshot: [...arr],
        comparisons,
        swaps,
        pseudocodeLine: 5,
        sortedIndices: [...sortedIndices],
      });

      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        steps.push({
          type: 'pivot',
          indices: [minIdx],
          arraySnapshot: [...arr],
          comparisons,
          swaps,
          pseudocodeLine: 6,
          sortedIndices: [...sortedIndices],
        });
      }
    }

    if (minIdx !== i) {
      steps.push({
        type: 'swap',
        indices: [i, minIdx],
        arraySnapshot: [...arr],
        comparisons,
        swaps,
        pseudocodeLine: 8,
        sortedIndices: [...sortedIndices],
      });

      const temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;
      swaps++;

      steps.push({
        type: 'swap',
        indices: [i, minIdx],
        arraySnapshot: [...arr],
        comparisons,
        swaps,
        pseudocodeLine: 8,
        sortedIndices: [...sortedIndices],
      });
    }

    sortedIndices.push(i);
    steps.push({
      type: 'sorted',
      indices: [i],
      arraySnapshot: [...arr],
      comparisons,
      swaps,
      pseudocodeLine: 8,
      sortedIndices: [...sortedIndices],
    });
  }

  if (n > 0) {
    sortedIndices.push(n - 1);
  }

  steps.push({
    type: 'sorted',
    indices: [],
    arraySnapshot: [...arr],
    comparisons,
    swaps,
    pseudocodeLine: 9,
    sortedIndices: Array.from({ length: n }, (_, i) => i),
  });

  return steps;
}
