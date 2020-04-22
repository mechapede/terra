precision mediump float;
uniform mat4 u_matrix_inverse;
uniform samplerCube u_tex0;
varying vec4 v_position;
 
void main() {
    vec4 t = u_matrix_inverse * v_position;
    gl_FragColor = textureCube(u_tex0, normalize(t.xyz/t.w));
}

