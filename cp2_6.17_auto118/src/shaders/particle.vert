attribute float aSize;
attribute vec3 aColor;

varying vec3 vColor;
varying float vAlpha;

uniform float uPixelRatio;
uniform float uSizeScale;

void main() {
  vColor = aColor;
  vAlpha = 0.8;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float dist = length(mvPosition.xyz);
  float sizeFactor = 1.0 / max(dist, 1.0);
  gl_PointSize = aSize * uPixelRatio * uSizeScale * sizeFactor * 300.0;
}
