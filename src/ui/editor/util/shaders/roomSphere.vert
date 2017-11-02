uniform sampler2D texture;
uniform float time; // 0 to 1, seconds
varying vec2 vUv;

void main() {
  vec3 p = position;
  vec3 newPosition = p + normal * - texture2D( texture, uv ).y * 100.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
  vUv = uv;
}
