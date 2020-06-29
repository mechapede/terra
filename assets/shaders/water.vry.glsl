precision mediump float;
uniform mat3 u_normal_matrix;
uniform vec3 u_light_pos;
//uniform vec3 u_light_color;
uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
varying vec4 v_position;
varying vec2 v_uv;
 
void main() {
    float c_specular = 0.2; //hardcoded lighting constants, TODO: as uniforms
    float c_specular_pow = 6.0;
    float c_ambient = 0.6;
    float c_diffuse = 0.8;
    
    vec3 u_camera_pos = vec3(0,0,0); //lighting in camera space
    
    vec4 texcord = texture2D(u_tex0,v_uv);
    vec3 normal = u_normal_matrix * (texture2D(u_tex1, v_uv).xyz * 0.5 + 0.5);
    
    vec3 albedo = texcord.xyz;
    
    vec3 light_color = vec3(1,1,1); //ambient, TODO: uniform
    vec3 color = c_ambient * albedo;

    vec3 L = normalize(u_light_pos - v_position.xyz); //diffuse
    vec3 N = normalize(normal);
    
    color += c_diffuse * max(dot(L,N),0.0) * light_color * albedo;

    vec3 Vn = normalize(u_camera_pos - v_position.xyz); //specular
    vec3 H = (Vn + L) / 2.0;
    float d = dot(H, N);
    if (d > 0.0) { //TODO: remove branch
        float specular = pow(d, c_specular_pow) * c_specular;
        color+= light_color * specular;
    }
    
    gl_FragColor.xyz = color;
    gl_FragColor.w = 0.9;
}
