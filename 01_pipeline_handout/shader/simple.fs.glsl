/**
 * a simple shader
 */
precision mediump float;

// input from vertex shader
varying vec3 v_color;



void main() {
	gl_FragColor = vec4(v_color,1);
}
