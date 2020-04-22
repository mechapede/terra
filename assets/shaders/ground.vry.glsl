precision mediump float;
uniform vec3 u_light_pos;
uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
uniform sampler2D u_tex2;
uniform sampler2D u_tex3;
varying vec4 v_position;
varying vec3 v_normal;
varying vec3 v_model_normal;
varying vec4 v_model_position;
 
void main() {
    float c_specular = 0.2; //hardcoded lighting constants
    float c_specular_pow = 2.0;
    float c_ambient = 0.2;
    float c_diffuse = 0.8;
    vec3 u_camera_pos = vec3(0,0,0); //lighting in camera space

    //use tri-planer texturing to get the uv coordinate
    vec3 blending = abs(v_model_normal).xyz; 
    blending = normalize(max(blending, 0.00001));
    float b = blending.x + blending.y + blending.z;
    blending /= vec3(b,b,b);
    vec4 xaxis = vec4(0,0,0,0);
    vec4 yaxis = vec4(0,0,0,0);
    vec4 zaxis = vec4(0,0,0,0);
    float scale = 1.0;
    vec2 xuv = abs(mod(v_model_position.yz * scale,1.0));
    vec2 yuv = abs(mod(v_model_position.xz * scale,1.0));
    vec2 zuv = abs(mod(v_model_position.xy * scale,1.0)); //TODO: pack textures more efficiently, to reduce sampling
    if ( v_model_position.y < 0.0 ){
        xaxis =  texture2D(u_tex0,xuv);
        yaxis =  texture2D(u_tex0,yuv);
        zaxis =  texture2D(u_tex0,zuv);
    } else if ( v_model_position.y < 0.1 ) {
        xaxis = mix(texture2D(u_tex0,xuv),texture2D(u_tex1,xuv),v_model_position.y*10.0);
        yaxis = mix(texture2D(u_tex0,yuv),texture2D(u_tex1,yuv),v_model_position.y*10.0);
        zaxis = mix(texture2D(u_tex0,zuv),texture2D(u_tex1,zuv),v_model_position.y*10.0);
    } else if ( v_model_position.y < 0.5 ){
        xaxis =  texture2D(u_tex1,xuv);
        yaxis =  texture2D(u_tex1,yuv);
        zaxis =  texture2D(u_tex1,zuv);
    } else if ( v_model_position.y < 0.6 ) {
        xaxis = mix(texture2D(u_tex1,xuv),texture2D(u_tex2,xuv),(v_model_position.y-0.5)*10.0);
        yaxis = mix(texture2D(u_tex1,yuv),texture2D(u_tex2,yuv),(v_model_position.y-0.5)*10.0);
        zaxis = mix(texture2D(u_tex1,zuv),texture2D(u_tex2,zuv),(v_model_position.y-0.5)*10.0);
    } else if ( v_model_position.y < 3.0 ) {
        xaxis =  texture2D(u_tex2,xuv);
        yaxis =  texture2D(u_tex2,yuv);
        zaxis =  texture2D(u_tex2,zuv);
    } else if ( v_model_position.y < 3.1 ) {
        xaxis = mix(texture2D(u_tex2,xuv),texture2D(u_tex3,xuv),(v_model_position.y-3.0)*10.0);
        yaxis = mix(texture2D(u_tex2,yuv),texture2D(u_tex3,yuv),(v_model_position.y-3.0)*10.0);
        zaxis = mix(texture2D(u_tex2,zuv),texture2D(u_tex3,zuv),(v_model_position.y-3.0)*10.0);
    } else  {
        xaxis =  texture2D(u_tex3,xuv);
        yaxis =  texture2D(u_tex3,yuv);
        zaxis =  texture2D(u_tex3,zuv);
    }
    
    vec4 texcord = xaxis * blending.x + yaxis * blending.y + zaxis * blending.z;
    
    vec3 albedo = texcord.xyz;

    vec3 light_color = vec3(1,1,1); //ambient
    vec3 color = c_ambient * albedo;

    vec3 L = normalize(u_light_pos - v_position.xyz); //diffuse
    vec3 N = normalize(v_normal);
    color += c_diffuse * max(dot(L,N),0.0) * light_color * albedo;

    vec3 Vn = normalize(u_camera_pos - v_position.xyz); //specular
    vec3 H = (Vn + L) / 2.0;
    float d = dot(H, N);
    if (d > 0.0) {
        float specular = pow(d, c_specular_pow) * c_specular;
        color+= light_color * specular;
    }
    
    gl_FragColor.xyz = color;
    gl_FragColor.w = texcord.w;
}
