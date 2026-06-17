varying vec3 vColor;
varying float vSize;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);
  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.0, dist);
  vec3 glow = vColor * (1.0 + (0.5 - dist) * 1.5);

  gl_FragColor = vec4(glow, alpha);
}
