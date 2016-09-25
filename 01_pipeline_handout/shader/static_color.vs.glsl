/**
 * a simple vertex shader setting the 2D position of a vertex without any transformations and forwarding the color
 */

// the position of the point
attribute vec3 a_position;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

//like a C program main is the main function
void main() {

  gl_Position = u_projection * u_modelView
    * vec4(a_position, 1);
}
