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
		vec2 c_view;
		vec2 dc; // delta to center

		for( int u = 0; u < LF_SIZE_U; u += 1 )
		{
			c_view.x = float(u);
			dc.x = c_view.x - u_lf_center.x;
			for( int v = 0; v < LF_SIZE_V; v += 1 )
			{
				float weight = u_aperture[u*LF_SIZE_V+v];
				c_view.y = float(v);
				dc.y = c_view.y - u_lf_center.y;
				vec2 texCoords = v_position.xy; // v_position is in pixel coordinates (s,t)
				// pixel space coordinates to [0 1] range: (2i + 1)/(2N)
				// do nothing: texCoords = 2.0*(texCoords) + vec2( 1.0, 1.0 );
				texCoords.x = 2.0*(texCoords.x + dc.x*u_lf_disparity + u_lf_size.x*c_view.x) + 1.0;
				texCoords.y = 2.0*(texCoords.y + dc.y*u_lf_disparity + u_lf_size.y*c_view.y) + 1.0;
				texCoords.x /= 2.0*u_tex_size.x;
				texCoords.y /= 2.0*u_tex_size.y;

				diffuseTexColor += texture2D(u_diffuseTex, texCoords)*weight;
				weight_sum += weight;
			}
		}

	}

	gl_FragColor = vec4( diffuseTexColor.rgb/weight_sum, 1.0 );

}
