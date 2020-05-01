/* Simplest vertex shader test */
attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;
uniform mat4 u_matrix;
uniform mat3 u_normal_matrix;
uniform float u_time;
varying vec4 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

#define M_PI 3.1415926535897932384626433832795

void main() {
  v_normal = u_normal_matrix * a_normal;
  v_uv = a_uv;
  v_position = u_matrix * a_position;

  //animation
  vec4 position = a_position;
  float wlength = (2.0 * M_PI)/ 64.0;
  float grid_sum = a_position.x + a_position.y;
  float sin_v = sin(wlength *(grid_sum + u_time*6.0));
  position.y += sin_v * 0.1;
  gl_Position = u_matrix * position;
}
