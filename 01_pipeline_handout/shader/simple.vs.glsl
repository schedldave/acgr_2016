/**
 * a simple shader
 */

 // position of vertex
attribute vec3 a_position;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;


void main() {
	// compute position in eye space
	vec4 eyePosition = u_modelView * vec4(a_position,1);

  // projection with projectionMatrix
	gl_Position = u_projection * eyePosition;

}
