uniform float uTime;
uniform float uWindLevel;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;

void main() {
  vec3 deepColor = vec3(0.039, 0.165, 0.227);
  vec3 shallowColor = vec3(0.102, 0.290, 0.165);
  
  float depthFactor = smoothstep(-1.0, 1.0, vElevation);
  vec3 baseColor = mix(deepColor, shallowColor, depthFactor);

  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
  float diffuse = max(dot(vNormal, lightDir), 0.0);
  
  vec3 viewDir = normalize(vec3(0.0, 1.0, 1.0));
  vec3 reflectDir = reflect(-lightDir, vNormal);
  float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
  vec3 specularColor = vec3(0.8, 0.9, 1.0) * specular * 0.5;

  float foam = smoothstep(0.3, 0.6, vElevation);
  vec3 foamColor = vec3(0.9, 0.95, 1.0) * foam * 0.3;

  float stormDarkness = 1.0 - uWindLevel * 0.15;
  vec3 finalColor = (baseColor * (0.3 + diffuse * 0.7) + specularColor + foamColor) * stormDarkness;

  float fogFactor = smoothstep(0.0, 1.0, vUv.y);
  vec3 fogColor = vec3(0.05, 0.1, 0.15) * stormDarkness;
  finalColor = mix(finalColor, fogColor, fogFactor * 0.5);

  gl_FragColor = vec4(finalColor, 1.0);
}
