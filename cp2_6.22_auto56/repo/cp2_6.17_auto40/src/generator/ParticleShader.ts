export const particleVertexShader = `
  attribute vec3 targetPosition;
  attribute vec3 startPosition;
  attribute vec3 color;
  attribute float size;
  
  uniform float uProgress;
  uniform float uExplodeRadius;
  uniform float uTime;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vColor = color;
    
    vec3 pos;
    
    if (uProgress < 0.5) {
      float explodeProgress = uProgress * 2.0;
      vec3 explodeDir = normalize(startPosition + vec3(
        sin(startPosition.x * 10.0 + uTime) * 0.5,
        cos(startPosition.y * 10.0 + uTime) * 0.5,
        sin(startPosition.z * 10.0 + uTime) * 0.5
      ));
      vec3 explodedPos = startPosition + explodeDir * uExplodeRadius * explodeProgress;
      pos = mix(startPosition, explodedPos, explodeProgress);
      vAlpha = 1.0 - explodeProgress * 0.5;
    } else {
      float assembleProgress = (uProgress - 0.5) * 2.0;
      vec3 randomOffset = vec3(
        sin(targetPosition.x * 20.0 + uTime) * 5.0,
        cos(targetPosition.y * 20.0 + uTime) * 5.0,
        sin(targetPosition.z * 20.0 + uTime) * 5.0
      );
      vec3 assembleStart = targetPosition + randomOffset * (1.0 - assembleProgress);
      pos = mix(assembleStart, targetPosition, assembleProgress);
      vAlpha = assembleProgress;
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) {
      discard;
    }
    
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`

export const starVertexShader = `
  attribute float size;
  attribute float brightness;
  
  uniform float uRotationY;
  uniform float uTime;
  
  varying float vBrightness;
  
  void main() {
    vBrightness = brightness;
    
    vec3 pos = position;
    float s = sin(uRotationY * 0.3);
    float c = cos(uRotationY * 0.3);
    float x = pos.x * c - pos.z * s;
    float z = pos.x * s + pos.z * c;
    pos.x = x;
    pos.z = z;
    
    float twinkle = sin(uTime * 2.0 + position.x * 10.0) * 0.3 + 0.7;
    vBrightness *= twinkle;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const starFragmentShader = `
  varying float vBrightness;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) {
      discard;
    }
    
    float glow = smoothstep(0.5, 0.0, dist);
    vec3 color = vec3(0.8, 0.9, 1.0) * vBrightness;
    gl_FragColor = vec4(color, glow * vBrightness);
  }
`

export const pulseRingVertexShader = `
  uniform float uTime;
  uniform float uRadius;
  uniform float uZoom;
  
  varying float vAlpha;
  
  void main() {
    vec3 pos = position;
    float currentRadius = uRadius * uZoom;
    float pulse = sin(uTime * 3.14159) * 0.1 + 1.0;
    pos.xz *= currentRadius * pulse;
    
    vAlpha = 0.2 - (uZoom - 1.0) * 0.05;
    vAlpha = clamp(vAlpha, 0.1, 0.2);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const pulseRingFragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;
  
  void main() {
    gl_FragColor = vec4(uColor, vAlpha);
  }
`

export const petalVertexShader = `
  attribute vec3 velocity;
  attribute float life;
  
  uniform float uTime;
  uniform float uDuration;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    float t = uTime / uDuration;
    vec3 pos = position + velocity * uTime;
    pos.y += -9.8 * uTime * uTime * 0.5;
    
    vAlpha = 1.0 - t;
    vColor = color;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 8.0 * (300.0 / -mvPosition.z) * vAlpha;
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const petalFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) {
      discard;
    }
    
    float glow = smoothstep(0.5, 0.0, dist);
    gl_FragColor = vec4(vColor, glow * vAlpha);
  }
`
