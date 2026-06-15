uniform float uDensity;
uniform float uTime;
uniform float uHovered;
uniform vec3 uBaseColor;
uniform vec3 uEmissiveColor;
uniform float uMetalness;
uniform float uRoughness;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying vec3 vViewPosition;

vec3 getHeatmapColor(float density) {
  density = clamp(density, 0.0, 1.0);
  
  vec3 color1 = vec3(0.1, 0.3, 0.9);
  vec3 color2 = vec3(0.1, 0.7, 0.9);
  vec3 color3 = vec3(0.2, 0.9, 0.5);
  vec3 color4 = vec3(0.95, 0.85, 0.2);
  vec3 color5 = vec3(0.95, 0.3, 0.15);
  vec3 color6 = vec3(0.9, 0.05, 0.05);
  
  float t1 = smoothstep(0.0, 0.2, density);
  float t2 = smoothstep(0.2, 0.4, density);
  float t3 = smoothstep(0.4, 0.6, density);
  float t4 = smoothstep(0.6, 0.8, density);
  float t5 = smoothstep(0.8, 1.0, density);
  
  vec3 color = mix(color1, color2, t1);
  color = mix(color, color3, t2);
  color = mix(color, color4, t3);
  color = mix(color, color5, t4);
  color = mix(color, color6, t5);
  
  return color;
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
  
  vec3 heatColor = getHeatmapColor(uDensity);
  
  float noise = sin(vWorldPosition.x * 2.0 + uTime * 0.5) * 
                sin(vWorldPosition.y * 3.0 + uTime * 0.3) * 
                sin(vWorldPosition.z * 2.0 + uTime * 0.4) * 0.5 + 0.5;
  noise = noise * 0.08 + 0.92;
  
  vec3 baseColor = mix(heatColor * 0.3, heatColor, noise);
  
  float specular = pow(max(dot(reflect(-viewDir, normal), vec3(0.0, 1.0, 0.0)), 0.0), 32.0);
  vec3 specularColor = vec3(0.8) * specular * uMetalness;
  
  vec3 ambient = baseColor * 0.3;
  vec3 diffuse = baseColor * max(dot(normal, vec3(0.5, 1.0, 0.3)), 0.0) * 0.5;
  
  vec3 finalColor = ambient + diffuse + specularColor;
  
  finalColor += fresnel * vec3(0.15, 0.2, 0.35) * 0.5;
  
  if (uHovered > 0.5) {
    float rimLight = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
    finalColor += heatColor * rimLight * 0.8;
    finalColor += heatColor * 0.15;
  }
  
  float scanLine = sin(vWorldPosition.y * 8.0 - uTime * 0.8) * 0.5 + 0.5;
  scanLine = scanLine * 0.03;
  finalColor += vec3(scanLine) * heatColor;
  
  float edgeFactor = smoothstep(0.0, 0.15, 1.0 - abs(dot(normal, viewDir)));
  finalColor += heatColor * edgeFactor * 0.08;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
