uniform float uTime;
uniform float uBeat;
uniform float uLowBand;
uniform float uMidBand;
uniform float uHighBand;

attribute float aBaseSize;

varying vec3 vColor;
varying float vSize;

void main() {
  vec3 base = position;

  float bandMix = base.x * 0.5 + 0.5;
  float bandWeightLow = clamp(1.0 - bandMix * 2.0, 0.0, 1.0);
  float bandWeightHigh = clamp(bandMix * 2.0 - 1.0, 0.0, 1.0);
  float bandWeightMid = 1.0 - bandWeightLow - bandWeightHigh;

  float amplitude =
    uLowBand * bandWeightLow +
    uMidBand * bandWeightMid +
    uHighBand * bandWeightHigh;

  vec3 lowColor = vec3(1.0, 0.2, 0.4);
  vec3 midColor = vec3(0.0, 0.9, 1.0);
  vec3 highColor = vec3(0.7, 0.53, 1.0);

  vColor =
    lowColor * bandWeightLow +
    midColor * bandWeightMid +
    highColor * bandWeightHigh;
  vColor *= (0.5 + amplitude * 0.8);

  float wave = sin(uTime * 1.5 + base.x * 3.0 + base.y * 2.0);
  float expansion = 1.0 + amplitude * 1.2 + uBeat * 0.4;

  vec3 pos = base * expansion;
  pos.y += wave * 0.4 * amplitude;
  pos.x += cos(uTime * 0.8 + base.z * 4.0) * 0.3 * amplitude;
  pos.z += sin(uTime * 0.6 + base.y * 5.0) * 0.3 * amplitude;

  vSize = aBaseSize * (1.0 + amplitude * 2.0);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = vSize * (300.0 / -mvPosition.z);
}
