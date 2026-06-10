export const starVertexShader = `
  attribute float size;
  attribute float magnitude;
  attribute float twinkleOffset;
  attribute vec3 color;
  
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vMagnitude;
  
  uniform float time;
  uniform float pixelRatio;
  
  void main() {
    vColor = color;
    vMagnitude = magnitude;
    
    float twinkle = sin(time * 1.5 + twinkleOffset) * 0.15 + 0.85;
    vTwinkle = twinkle;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float baseSize = size * pixelRatio;
    float distanceFactor = 300.0 / -mvPosition.z;
    gl_PointSize = baseSize * twinkle * distanceFactor;
  }
`;

export const starFragmentShader = `
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vMagnitude;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha = pow(alpha, 1.5);
    
    vec3 finalColor = vColor * vTwinkle;
    float brightness = 1.0 - vMagnitude / 6.0;
    finalColor *= (0.6 + brightness * 0.8);
    
    float glow = exp(-dist * 6.0) * 0.6;
    finalColor += glow * vColor;
    
    gl_FragColor = vec4(finalColor, alpha * (0.7 + vTwinkle * 0.3));
  }
`;

export const starVertexShaderSelected = `
  attribute float size;
  attribute float magnitude;
  attribute float twinkleOffset;
  attribute vec3 color;
  
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vMagnitude;
  
  uniform float time;
  uniform float pixelRatio;
  uniform float selectedIndex;
  attribute float starIndex;
  
  void main() {
    float isSelected = step(starIndex, selectedIndex + 0.1) * step(selectedIndex - 0.1, starIndex);
    float pulse = sin(time * 3.0) * 0.3 + 1.3;
    float sizeMultiplier = 1.0 + isSelected * pulse;
    
    vColor = mix(vColor, vColor * 1.5, isSelected);
    vColor = color;
    vMagnitude = magnitude;
    
    float twinkle = sin(time * 1.5 + twinkleOffset) * 0.15 + 0.85;
    vTwinkle = twinkle;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float baseSize = size * pixelRatio * sizeMultiplier;
    float distanceFactor = 300.0 / -mvPosition.z;
    gl_PointSize = baseSize * twinkle * distanceFactor;
  }
`;
