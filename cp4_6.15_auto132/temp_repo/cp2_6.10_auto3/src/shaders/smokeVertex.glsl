attribute float aLife;
attribute float aSize;
attribute float aAlpha;

varying float vLife;
varying float vAlpha;

void main() {
  vLife = aLife;
  vAlpha = aAlpha;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
