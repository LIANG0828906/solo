const INTERPOLATION_THRESHOLD = 200;

export function interpolatePositions(
  localPositions: Map<string, number>,
  remotePositions: Map<string, number>,
  timestampDelta: number
): Map<string, number> {
  const result = new Map<string, number>();

  if (timestampDelta >= INTERPOLATION_THRESHOLD) {
    for (const [id, position] of remotePositions) {
      result.set(id, position);
    }
    return result;
  }

  const t = timestampDelta / INTERPOLATION_THRESHOLD;

  for (const [id, remotePos] of remotePositions) {
    const localPos = localPositions.get(id);
    if (localPos !== undefined && localPos !== remotePos) {
      result.set(id, localPos + (remotePos - localPos) * t);
    } else {
      result.set(id, remotePos);
    }
  }

  return result;
}

export function shouldInterpolate(timestampDelta: number): boolean {
  return timestampDelta < INTERPOLATION_THRESHOLD;
}
