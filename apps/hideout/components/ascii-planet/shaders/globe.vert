varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  // Toward the camera, which sits at the origin in view space.
  vView = -viewPosition.xyz;

  gl_Position = projectionMatrix * viewPosition;
}
