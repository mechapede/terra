precision mediump float;
uniform mat3 u_normal_matrix;
uniform vec3 u_light_pos;
uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
varying vec4 v_position;
varying vec3 v_model_normal;
varying vec4 v_model_position;
 
void main() {
    //hardcoded lighting constants for material
    float c_specular;
    float c_specular_pow;
    float c_ambient;
    float c_diffuse;
    vec3 u_camera_pos = vec3(0,0,0); //lighting in camera space
  
    //determine which enrty in texture sheet
    float index = 0.0;
    if ( v_model_position.y < 0.1 ) {
        if( v_model_normal.y + v_model_position.y > 0.9 ) {
          index = 1.0;
          c_specular = 0.2;
          c_specular_pow = 1.0;
          c_ambient = 0.4;
          c_diffuse = 0.8;
        } else {
          index = 0.0;
          c_specular = 0.2;
          c_specular_pow = 1.0;
          c_ambient = 0.4;
          c_diffuse = 0.8;
        }
    } else {
        if( v_model_normal.y - v_model_position.y*0.25 > 0.2 ) {
          index = 2.0;
          c_specular = 0.2;
          c_specular_pow = 2.0;
          c_ambient = 0.4;
          c_diffuse = 0.7;
        } else {
          index = 3.0;
          c_specular = 0.2;
          c_specular_pow = 1.0;
          c_ambient = 0.4;
          c_diffuse = 0.9;
        } 
    }

    //tri-planer texturing
    vec3 blending = abs(v_model_normal).xyz; 
    blending = normalize(max(blending, 0.00001));
    float b = blending.x + blending.y + blending.z;
    blending /= vec3(b,b,b);
    float scale = 1.0;

    vec2 xuv = abs(mod(v_model_position.yz * scale,1.0));
    xuv.x = (index + xuv.x)/4.0;
    vec2 yuv = abs(mod(v_model_position.xz * scale,1.0));
    yuv.x = (index + yuv.x)/4.0;
    vec2 zuv = abs(mod(v_model_position.xy * scale,1.0));
    zuv.x = (index + zuv.x)/4.0;
    vec4 xaxis_color = texture2D(u_tex0,xuv);
    vec4 yaxis_color = texture2D(u_tex0,yuv);
    vec4 zaxis_color = texture2D(u_tex0,zuv);
    vec3 xaxis_normal = texture2D(u_tex1,xuv).xzy * 0.5 + 0.5; //model y,z flipped
    vec3 yaxis_normal = texture2D(u_tex1,yuv).xzy * 0.5 + 0.5;
    vec3 zaxis_normal = texture2D(u_tex1,zuv).xzy * 0.5 + 0.5;  
    
    // swizzle tangemt normals, takem from `GPU Gens 3' procedural terrain
    vec3 normalX = vec3(0.0, xaxis_normal.y,xaxis_normal.x);
    vec3 normalY = vec3(yaxis_normal.x, 0.0, yaxis_normal.y);
    vec3 normalZ = vec3(zaxis_normal.x, zaxis_normal.y, 0.0);
    vec3 worldNormal = normalX * blending.x + normalY * blending.y + normalZ * blending.z + v_model_normal;

    vec4 texcord = xaxis_color * blending.x + yaxis_color * blending.y + zaxis_color * blending.z;
    
    vec3 albedo = texcord.xyz;

    vec3 light_color = vec3(1,1,1); //ambient
    vec3 color = c_ambient * albedo;

    vec3 L = normalize(u_light_pos - v_position.xyz); //diffuse
    
    vec3 normal = u_normal_matrix * worldNormal;
    vec3 N = normalize(normal);
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
