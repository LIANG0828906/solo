export interface DataPoint {
  id: string
  x: number
  y: number
  color: string
}

export interface FitResult {
  coefficients: number[]
  equation: string
  rSquared: number
  mse: number
}

function matrixMultiply(A: number[][], B: number[][]): number[][] {
  const result: number[][] = []
  const rowsA = A.length
  const colsA = A[0].length
  const colsB = B[0].length

  for (let i = 0; i < rowsA; i++) {
    result[i] = []
    for (let j = 0; j < colsB; j++) {
      result[i][j] = 0
      for (let k = 0; k < colsA; k++) {
        result[i][j] += A[i][k] * B[k][j]
      }
    }
  }
  return result
}

function matrixTranspose(A: number[][]): number[][] {
  const result: number[][] = []
  const rows = A.length
  const cols = A[0].length

  for (let j = 0; j < cols; j++) {
    result[j] = []
    for (let i = 0; i < rows; i++) {
      result[j][i] = A[i][j]
    }
  }
  return result
}

function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length
  const augmented: number[][] = A.map((row, i) => [...row, b[i]])

  for (let col = 0; col < n; col++) {
    let maxRow = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
        maxRow = row
      }
    }
    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]]

    const pivot = augmented[col][col]
    if (Math.abs(pivot) < 1e-10) continue

    for (let row = col + 1; row < n; row++) {
      const factor = augmented[row][col] / pivot
      for (let j = col; j <= n; j++) {
        augmented[row][j] -= factor * augmented[col][j]
      }
    }
  }

  const result: number[] = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    result[i] = augmented[i][n]
    for (let j = i + 1; j < n; j++) {
      result[i] -= augmented[i][j] * result[j]
    }
    result[i] /= augmented[i][i]
  }
  return result
}

export function polynomialFit(points: DataPoint[], degree: number): FitResult {
  const n = points.length
  const coeffCount = degree + 1

  if (n < coeffCount) {
    return {
      coefficients: new Array(coeffCount).fill(0),
      equation: '数据不足',
      rSquared: 0,
      mse: 0
    }
  }

  const X: number[][] = []
  const y: number[] = []

  for (const point of points) {
    const row: number[] = []
    for (let i = 0; i <= degree; i++) {
      row.push(Math.pow(point.x, i))
    }
    X.push(row)
    y.push(point.y)
  }

  const Xt = matrixTranspose(X)
  const XtX = matrixMultiply(Xt, X)
  const Xty = matrixMultiply(Xt, y.map(v => [v])).map(row => row[0])

  const coefficients = gaussianElimination(XtX, Xty)

  let ssTot = 0
  let ssRes = 0
  let sumY = 0
  for (const point of points) {
    sumY += point.y
  }
  const meanY = sumY / n

  let mseSum = 0
  for (const point of points) {
    let predicted = 0
    for (let i = 0; i < coefficients.length; i++) {
      predicted += coefficients[i] * Math.pow(point.x, i)
    }
    ssRes += Math.pow(point.y - predicted, 2)
    ssTot += Math.pow(point.y - meanY, 2)
    mseSum += Math.pow(point.y - predicted, 2)
  }

  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0
  const mse = mseSum / n

  const equation = buildEquation(coefficients)

  return { coefficients, equation, rSquared, mse }
}

function buildEquation(coefficients: number[]): string {
  const terms: string[] = []
  const degree = coefficients.length - 1

  for (let i = degree; i >= 0; i--) {
    const coeff = coefficients[i]
    if (Math.abs(coeff) < 1e-6) continue

    const absCoeff = Math.abs(coeff)
    const sign = coeff >= 0 ? (terms.length > 0 ? ' + ' : '') : (terms.length > 0 ? ' - ' : '-')
    const coeffStr = absCoeff === 1 && i > 0 ? '' : absCoeff.toFixed(3)

    let term = ''
    if (i === 0) {
      term = coeffStr
    } else if (i === 1) {
      term = `${coeffStr}x`
    } else {
      term = `${coeffStr}x^${i}`
    }

    terms.push(`${sign}${term}`)
  }

  return terms.length > 0 ? `y = ${terms.join('')}` : 'y = 0'
}

export function evaluatePolynomial(coefficients: number[], x: number): number {
  let result = 0
  for (let i = 0; i < coefficients.length; i++) {
    result += coefficients[i] * Math.pow(x, i)
  }
  return result
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}
