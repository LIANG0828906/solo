import { SortStep } from './types';

export function generateBubbleSortSteps(initialArray: number[]): SortStep[] {
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
    steps.push({
      type: 'compare',
      indices: [],
      arraySnapshot: [...arr],
      comparisons,
      swaps,
      pseudocodeLine: 2,
      sortedIndices: [...sortedIndices],
    });

    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        type: 'compare',
        indices: [j, j + 1],
        arraySnapshot: [...arr],
        comparisons,
        swaps,
        pseudocodeLine: 3,
        sortedIndices: [...sortedIndices],
      });

      comparisons++;
      steps.push({
        type: 'compare',
        indices: [j, j + 1],
        arraySnapshot: [...arr],
        comparisons,
        swaps,
        pseudocodeLine: 4,
        sortedIndices: [...sortedIndices],
      });

      if (arr[j] > arr[j + 1]) {
        steps.push({
          type: 'swap',
          indices: [j, j + 1],
          arraySnapshot: [...arr],
          comparisons,
          swaps,
          pseudocodeLine: 5,
          sortedIndices: [...sortedIndices],
        });

        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swaps++;

        steps.push({
          type: 'swap',
          indices: [j, j + 1],
          arraySnapshot: [...arr],
          comparisons,
          swaps,
          pseudocodeLine: 5,
          sortedIndices: [...sortedIndices],
        });
      }
    }

    sortedIndices.push(n - i - 1);
    steps.push({
      type: 'sorted',
      indices: [n - i - 1],
      arraySnapshot: [...arr],
      comparisons,
      swaps,
      pseudocodeLine: 6,
      sortedIndices: [...sortedIndices],
    });
  }

  if (n > 0) {
    sortedIndices.push(0);
  }

  steps.push({
    type: 'sorted',
    indices: [],
    arraySnapshot: [...arr],
    comparisons,
    swaps,
    pseudocodeLine: 7,
    sortedIndices: Array.from({ length: n }, (_, i) => i),
  });

  return steps;
}
