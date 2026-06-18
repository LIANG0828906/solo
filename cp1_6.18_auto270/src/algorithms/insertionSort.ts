import { SortStep } from './types';

export function generateInsertionSortSteps(initialArray: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const arr = [...initialArray];
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  const sortedIndices: number[] = [0];

  steps.push({
    type: 'compare',
    indices: [],
    arraySnapshot: [...arr],
    comparisons: 0,
    swaps: 0,
    pseudocodeLine: 0,
    sortedIndices: [],
  });

  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;

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
      indices: [i],
      arraySnapshot: [...arr],
      comparisons,
      swaps,
      pseudocodeLine: 3,
      sortedIndices: [...sortedIndices],
    });

    while (j >= 0) {
      comparisons++;
      steps.push({
        type: 'compare',
        indices: [j, i],
        arraySnapshot: [...arr],
        comparisons,
        swaps,
        pseudocodeLine: 5,
        sortedIndices: [...sortedIndices],
      });

      if (arr[j] > key) {
        steps.push({
          type: 'overwrite',
          indices: [j, j + 1],
          arraySnapshot: [...arr],
          comparisons,
          swaps,
          pseudocodeLine: 6,
          sortedIndices: [...sortedIndices],
        });

        arr[j + 1] = arr[j];
        swaps++;

        steps.push({
          type: 'overwrite',
          indices: [j, j + 1],
          arraySnapshot: [...arr],
          comparisons,
          swaps,
          pseudocodeLine: 6,
          sortedIndices: [...sortedIndices],
        });

        j--;
      } else {
        break;
      }
    }

    if (j + 1 !== i) {
      steps.push({
        type: 'insert',
        indices: [j + 1],
        arraySnapshot: [...arr],
        comparisons,
        swaps,
        pseudocodeLine: 8,
        sortedIndices: [...sortedIndices],
      });
    }

    arr[j + 1] = key;

    if (j + 1 !== i) {
      steps.push({
        type: 'insert',
        indices: [j + 1],
        arraySnapshot: [...arr],
        comparisons,
        swaps,
        pseudocodeLine: 8,
        sortedIndices: [...sortedIndices],
      });
    }

    sortedIndices.push(i);
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
