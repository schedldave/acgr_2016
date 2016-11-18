/**
 * simple environment mapping shader
 *
 */

//need to specify how "precise" float should be
precision mediump float;

varying vec3 v_normalVec;
varying vec3 v_cameraRayVec;

uniform bool u_useReflection;
uniform bool u_useRefraction;
uniform bool u_useFresnel;
uniform float u_refractionEta;
uniform float u_fresnelR0;

uniform samplerCube u_texCube;

float fresnel(vec3 direction, vec3 normal) {
    vec3 nDirection = normalize( direction );
    vec3 nNormal = normalize( normal );

    float cosine = dot( nNormal, nDirection );
    float product = max( cosine, 0.0 );
    float factor = pow( 1.0-product, 5.0 );

    factor = u_fresnelR0 + (1.0-u_fresnelR0)*factor;

    return factor;
}

//entry point again
void main() {
  vec3 normalVec = normalize(v_normalVec);
	vec3 cameraRayVec = normalize(v_cameraRayVec);

  vec3 texCoords = cameraRayVec;
  gl_FragColor = textureCube(u_texCube, texCoords);

  vec4 reflectColor = vec4(0.0,0.0,0.0,1.0);
  vec4 refractColor = vec4(0.0,0.0,0.0,1.0);
  if(u_useReflection)
  {
      //compute reflected camera ray (assign to texCoords)
  		texCoords  = reflect(cameraRayVec, normalVec);
      reflectColor = textureCube(u_texCube, texCoords);
      gl_FragColor = reflectColor;
  }
  if(u_useRefraction)
  {
      //compute reflected camera ray (assign to texCoords)
      texCoords  = refract(cameraRayVec, normalVec, u_refractionEta);
      refractColor = textureCube(u_texCube, texCoords);
      gl_FragColor = refractColor;
  }

  if(u_useFresnel)
  {
     float fresnelTerm = fresnel(cameraRayVec, -normalVec);
     gl_FragColor = fresnelTerm*reflectColor + (1.0-fresnelTerm)*refractColor;
  }
}
