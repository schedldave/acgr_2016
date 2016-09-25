/**
 * a phong shader implementation
 * Created by Samuel Gratzl on 29.02.2016.
 */
precision mediump float;

// in from vertex shader
varying vec3 v_color;

void main() {
	gl_FragColor = vec4(v_color,1);
}
