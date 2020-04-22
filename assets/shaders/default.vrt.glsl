precision mediump float;
attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;
uniform mat4 u_matrix;
uniform mat3 u_normal_matrix;
varying vec4 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

void main() {
    v_normal = u_normal_matrix * a_normal;
    v_uv = a_uv;
    v_position = u_matrix * a_position;
    gl_Position = v_position;
}
