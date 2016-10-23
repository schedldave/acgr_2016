// Phong Vertex Shader

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_tangent;
attribute vec2 a_texCoord;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;
uniform mat4 u_invView;

uniform vec3 u_lightPos;

//output of this shader
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying mat3 v_TBN; // Tangent Binormal Normal Matrix

//TASK 1: define output variable for texture coordinates
varying vec2 v_texCoord;

void main() {
	vec4 eyePosition = u_modelView * vec4(a_position,1);

	vec3 bitangent = cross( a_tangent, a_normal );

  v_normalVec = u_normalMatrix * a_normal;

	v_TBN = mat3( u_normalMatrix * a_tangent, u_normalMatrix * bitangent, v_normalVec );

  v_eyeVec = -eyePosition.xyz;
	v_lightVec = u_lightPos - eyePosition.xyz;

	//TASK 1: pass on texture coordinates to fragment shader
	v_texCoord = a_texCoord;

	gl_Position = u_projection * eyePosition;
}
