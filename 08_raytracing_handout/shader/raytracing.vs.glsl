// a basic raytracer implementation

attribute vec3 a_position;
attribute vec2 a_texCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat4 u_invView;
uniform mat3 u_invViewNormalMatrix;
uniform mat4 u_invViewProjMatrix;

uniform vec3 u_lightPos;

//output of this shader
varying vec3 v_position;
varying vec3 v_viewPos;
varying vec3 v_lightPos;

// there is no transpose in WebGL so use our own implementation:
mat3 transpose(mat3 m) {
    return mat3(m[0][0], m[1][0], m[2][0],
                m[0][1], m[1][1], m[2][1],
                m[0][2], m[1][2], m[2][2]);
}

void main() {

  // positions in world space:
  v_viewPos = u_invView[3].xyz; // ray origin
  v_lightPos = vec3( u_invView * vec4(u_lightPos,1) );
  vec4 worldPos = u_invViewProjMatrix * vec4( a_position.xyz, 1.0 );
  v_position = worldPos.xyz/worldPos.w - v_viewPos; // ray direction


	gl_Position = vec4(a_position, 1.0);

}
