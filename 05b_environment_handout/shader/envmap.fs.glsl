/**
 * simple environment mapping shader
 *
 */

//need to specify how "precise" float should be
precision mediump float;

varying vec3 v_normalVec;
varying vec3 v_cameraRayVec;

// uniforms controlling reflection refraction and fresnel
uniform bool u_useReflection;
uniform bool u_useRefraction;
uniform bool u_useFresnel;
uniform float u_refractionEta;
uniform float u_fresnelR0;

uniform samplerCube u_texCube;

//entry point again
void main() {
  vec3 normalVec = normalize(v_normalVec);
	vec3 cameraRayVec = normalize(v_cameraRayVec);

  vec3 texCoords = cameraRayVec;
  gl_FragColor = textureCube(u_texCube, texCoords);
}
