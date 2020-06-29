precision mediump float;
attribute vec4 a_position;
attribute vec3 a_normal;
uniform mat4 u_matrix;
varying vec4 v_position;
varying vec3 v_model_normal;
varying vec4 v_model_position;

void main() {
    v_model_position = a_position;
    v_model_normal = a_normal;
    gl_Position = u_matrix * a_position;
    v_position = u_matrix * a_position;
}
