precision mediump float;
uniform vec3 u_light_pos;
//uniform vec3 u_light_color;
uniform sampler2D u_tex0;
varying vec4 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

void main() {
    float c_specular = 0.2; //hardcoded lighting constants, TODO: as uniforms
    float c_specular_pow = 6.0;
    float c_ambient = 0.4;
    float c_diffuse = 0.8;
    
    vec3 u_camera_pos = vec3(0,0,0); //lighting in camera space
    
    vec2 fixed_uv = vec2(v_uv.x, 1.0 - v_uv.y );
    
    vec4 texcord = texture2D(u_tex0,fixed_uv);
    if( texcord.w < 0.5 ) discard;
    
    vec3 albedo = texcord.xyz;
    
    vec3 light_color = vec3(1,1,1); //ambient, TODO: uniform
    vec3 color = c_ambient * albedo;

    vec3 L = normalize(u_light_pos - v_position.xyz); //diffuse
    vec3 N = normalize(v_normal);
    color += c_diffuse * max(dot(L,N),0.0) * light_color * albedo;

    vec3 Vn = normalize(u_camera_pos - v_position.xyz); //specular
    vec3 H = (Vn + L) / 2.0;
    float d = dot(H, N);
    if (d > 0.0) { //TODO: remove branch
        float specular = pow(d, c_specular_pow) * c_specular;
        color+= light_color * specular;
    }
    
    gl_FragColor.xyz = color;
    gl_FragColor.w = texcord.w;

}
