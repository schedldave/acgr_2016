// Phong Vertex Shader

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_tangent;
attribute vec2 a_texCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat4 u_invView;
uniform mat3 u_modelNormalMatrix;

uniform vec3 u_lightPos;

//output of this shader
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
//output variable for texture coordinates
varying vec2 v_texCoord;

// there is no transpose in WebGL so use our own implementation:
mat3 transpose(mat3 m) {
    return mat3(m[0][0], m[1][0], m[2][0],
                m[0][1], m[1][1], m[2][1],
                m[0][2], m[1][2], m[2][2]);
}

void main() {

  // forward texture coordinates
  v_texCoord = a_texCoord;


	mat3 normalMatrix = u_modelNormalMatrix;
	vec3 N = normalize(normalMatrix * a_normal);
	vec3 T = normalize(normalMatrix * a_tangent);
	vec3 B = normalize(cross(N,T));

  // Tangent Binormal Normal Matrix
	mat3 TBN = transpose(mat3(T, B, N));

  // normal Vector in Tangent Space:
  v_normalVec = vec3(0.0,0.0,1.0);

  // positions in tangent space:
  vec3 eyePosition = TBN * vec3( u_model * vec4(a_position,1) );
	vec3 viewPos = TBN * u_invView[3].xyz; //(viewPosModel.xyz/viewPosModel.w);
	vec3 lightPos = TBN * vec3( u_invView * vec4(u_lightPos,1) );

  // eye and light vector in tangent space:
  v_eyeVec = normalize( viewPos.xyz - eyePosition.xyz );
	v_lightVec = normalize(lightPos - eyePosition.xyz);

	gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);

}
