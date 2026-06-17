varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if (dist > 0.5) {
    discard;
  }

  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  alpha = pow(alpha, 1.5) * vAlpha;

  float glow = exp(-dist * 4.0) * 0.5;
  vec3 finalColor = vColor * (1.0 + glow);

  gl_FragColor = vec4(finalColor, alpha);
}
