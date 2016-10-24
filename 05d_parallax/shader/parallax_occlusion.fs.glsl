/**
 * a phong shader implementation with texture support
 */
precision mediump float;

/**
 * definition of a material structure containing common properties
 */
struct Material {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	vec4 emission;
	float shininess;
};

/**
 * definition of the light properties related to material properties
 */
struct Light {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
};

//illumination related variables
uniform Material u_material;
uniform Light u_light;
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;

//texture related variables
varying vec2 v_texCoord;
uniform sampler2D u_diffuseTex;
uniform bool u_diffuseTexEnabled;
uniform sampler2D u_normalTex;
uniform bool u_normalTexEnabled;
// for parallax mapping
uniform sampler2D u_heightTex;
uniform bool u_heightTexEnabled;

//uniform float height_scale;
const float height_scale = 0.05;


vec4 calculateSimplePointLight(Light light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec, vec4 textureColor) {
	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	eyeVec = normalize(eyeVec);

	//compute diffuse term
	float diffuse = clamp(dot(normalVec,lightVec), 0.0, 1.0);

	//compute specular term
	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow( max( dot(reflectVec, eyeVec), 0.0) , material.shininess);

  if(u_diffuseTexEnabled)
  {
    material.diffuse = textureColor;
    material.ambient = textureColor;
		//Note: an alternative to replacing the material color is to multiply it with the texture color
  }

	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 c_diff = clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
	vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);
	vec4 c_em   = material.emission;

  return c_amb + c_diff + c_spec + c_em;
}

// simples version of parallax mapping
vec2 ParallaxMapping(vec2 texCoords, vec3 viewDir)
{
    float height =  texture2D(u_heightTex, texCoords).r;
    vec2 p = viewDir.xy / viewDir.z * (height * height_scale);
    return texCoords - p;
}

vec2 ParallaxOcclusionMapping(vec2 texCoords, vec3 viewDir)
{
    // number of depth layers
		const int numLayers = 64;

		// calculate the size of each layer
    float layerDepth = 1.0 / float(numLayers);
    // depth of current layer
    float currentLayerDepth = 0.0;
    // the amount to shift the texture coordinates per layer (from vector P)
    vec2 P = viewDir.xy / viewDir.z * height_scale;
    vec2 deltaTexCoords = P / float(numLayers);

    // get initial values
    vec2  currentTexCoords     = texCoords;
    float currentDepthMapValue = texture2D(u_heightTex, currentTexCoords).r;

    for (int i = 0 ; i < numLayers; i ++)
    {
				if( currentLayerDepth >= currentDepthMapValue )
					break;

        // shift texture coordinates along direction of P
        currentTexCoords -= deltaTexCoords;
        // get depthmap value at current texture coordinates
        currentDepthMapValue = texture2D(u_heightTex, currentTexCoords).r;
        // get depth of next layer
        currentLayerDepth += layerDepth;
    }

    // -- parallax occlusion mapping interpolation from here on
    // get texture coordinates before collision (reverse operations)
    vec2 prevTexCoords = currentTexCoords + deltaTexCoords;

    // get depth after and before collision for linear interpolation
    float afterDepth  = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = texture2D(u_heightTex, prevTexCoords).r - currentLayerDepth + layerDepth;

    // interpolation of texture coordinates
    float weight = afterDepth / (afterDepth - beforeDepth);
    vec2 finalTexCoords = prevTexCoords * weight + currentTexCoords * (1.0 - weight);

    return finalTexCoords;
}

void main (void) {

  vec4 textureColor = vec4(0,0,0,1);
	vec3 normal = v_normalVec;
	vec2 texCoords = v_texCoord;

	if(u_heightTexEnabled)
	{
		// alter texture coordinates with parallax mapping
		texCoords = ParallaxOcclusionMapping(v_texCoord, normalize(v_eyeVec));
	}

  if(u_diffuseTexEnabled)
  {
		// integrate texture color into phong shader
    textureColor = texture2D(u_diffuseTex,texCoords);
	}

	if(u_normalTexEnabled)
	{
		// Obtain normal from normal map in range [0,1]
    normal = texture2D(u_normalTex, texCoords).rgb;
    // Transform normal vector to range [-1,1]
    normal = normalize(normal * 2.0 - 1.0);  // this normal is in tangent space

  }

	gl_FragColor = calculateSimplePointLight(u_light, u_material, v_lightVec, normal, v_eyeVec, textureColor);

}
