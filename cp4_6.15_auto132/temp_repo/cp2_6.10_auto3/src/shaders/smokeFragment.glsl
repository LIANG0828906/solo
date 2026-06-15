uniform vec3 uColor;

varying float vLife;
varying float vAlpha;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  if (dist > 0.5) discard;

  float alpha = (1.0 - dist * 2.0) * vAlpha * 0.6;

  vec3 gray = vec3(0.3 + vLife * 0.2);
  vec3 baseColor = mix(uColor, gray, vLife * 0.7);
  vec3 finalColor = mix(baseColor, vec3(1.0), 0.3);

  gl_FragColor = vec4(finalColor, alpha);
}
