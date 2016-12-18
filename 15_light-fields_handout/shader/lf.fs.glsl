/**
 * a Light Field shader with textures
 */
precision mediump float;

#ifndef LF_SIZE_U
#define LF_SIZE_U 9
#define LF_SIZE_V 9
#endif

varying vec3 v_position;

//texture related variables
varying vec2 v_texCoord;
uniform sampler2D u_diffuseTex;
uniform bool u_diffuseTexEnabled;

uniform vec4 u_lf_size;
uniform vec2 u_tex_size;
uniform float u_lf_disparity;
uniform vec2 u_lf_center;
uniform float u_aperture[LF_SIZE_U*LF_SIZE_V];


void main (void) {

	vec4 diffuseTexColor = vec4(0.0);
	float weight_sum = 0.0;

	if (u_diffuseTexEnabled) {

		diffuseTexColor = texture2D(u_diffuseTex, v_texCoord);

	}

	gl_FragColor = vec4( diffuseTexColor.rgb, 1.0 );

}
