uniform float uTime;
uniform float uWaveHeight;
uniform float uWaveFrequency;
uniform float uWindLevel;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;

vec3 gerstnerWave(vec2 direction, float steepness, float wavelength, vec3 position) {
  float k = 2.0 * 3.14159 / wavelength;
  float c = sqrt(9.8 / k);
  vec2 d = normalize(direction);
  float f = k * (dot(d, position.xz) - c * uTime * uWaveFrequency);
  float a = steepness / k;

  return vec3(
    d.x * (a * cos(f)),
    a * sin(f) * uWaveHeight,
    d.y * (a * cos(f))
  );
}

void main() {
  vUv = uv;
  vec3 pos = position;

  pos += gerstnerWave(vec2(1.0, 0.0), 0.25, 8.0, position);
  pos += gerstnerWave(vec2(0.0, 1.0), 0.15, 5.0, position);
  pos += gerstnerWave(vec2(1.0, 1.0), 0.10, 3.0, position);
  pos += gerstnerWave(vec2(-1.0, 0.5), 0.08, 2.0, position);

  vElevation = pos.y;

  float eps = 0.01;
  vec3 posX = position + vec3(eps, 0.0, 0.0);
  vec3 posZ = position + vec3(0.0, 0.0, eps);
  
  posX += gerstnerWave(vec2(1.0, 0.0), 0.25, 8.0, posX);
  posX += gerstnerWave(vec2(0.0, 1.0), 0.15, 5.0, posX);
  posX += gerstnerWave(vec2(1.0, 1.0), 0.10, 3.0, posX);
  posX += gerstnerWave(vec2(-1.0, 0.5), 0.08, 2.0, posX);
  
  posZ += gerstnerWave(vec2(1.0, 0.0), 0.25, 8.0, posZ);
  posZ += gerstnerWave(vec2(0.0, 1.0), 0.15, 5.0, posZ);
  posZ += gerstnerWave(vec2(1.0, 1.0), 0.10, 3.0, posZ);
  posZ += gerstnerWave(vec2(-1.0, 0.5), 0.08, 2.0, posZ);

  vec3 tangent = normalize(posX - pos);
  vec3 bitangent = normalize(posZ - pos);
  vNormal = normalize(cross(bitangent, tangent));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
