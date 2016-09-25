/**
 * a simple vertex shader setting the 2D position of a vertex without any transformations and forwarding the color
 */

// the position of the point
attribute vec3 a_position;

//the color of the point
attribute vec3 a_color;

varying vec3 v_color;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

//like a C program main is the main function
void main() {

  gl_Position = u_projection * u_modelView
    * vec4(a_position, 1);

  //setting a static color (yellow) to the output varying color
  v_color = vec3(1,1,0);
}
