/**
 * a basic raytracer implementation
 */
precision mediump float;


// input from vertex shader
varying vec3 v_position;
varying vec3 v_viewPos;
varying vec3 v_lightPos;

//texture related variables
// uniform sampler2D u_diffuseTex;
// uniform bool u_diffuseTexEnabled;


// CONSTANTS/DEFINE
#define INFINITY 100000.0
#define RAY_OFFSET 0.0001
#define MAX_DEPTH 3


// PLANE -----------------------------------------------------------------------
float rayPlaneIntersection(vec3 rayStart, vec3 rayDir, vec4 plane, out vec3 hitColor)
{
	vec3 planeNormal = plane.xyz;
	float planeD = plane.w;
	float t = -(dot(rayStart, planeNormal) - planeD) / dot(rayDir, planeNormal);
	if (t > 0.0) {
		// checkerboard
    vec3 hitPos = rayStart + rayDir * t;
		float f = mod( floor(1.0*hitPos.z) + floor(1.0*hitPos.x), 2.0);
		hitColor = (f+0.3)*vec3(0.5, 0.5, 0.5);
		return t;
	} else {
		return INFINITY;
	}
}

void addPlane( vec3 ro, vec3 rd, vec4 plane,
		inout float hitDist, inout vec3 hitColor, inout vec3 hitNormal ){
	vec3 planeColor = vec3(0.0);
	float dist = rayPlaneIntersection(ro, rd, plane, planeColor);
	if( dist < hitDist && dot(rd,-normalize( plane.xyz )) >= 0.0 ){
		hitDist = dist;
		hitColor = planeColor;
		hitNormal = normalize( plane.xyz );
	}
}


// SPHERE ----------------------------------------------------------------------
//The intersection function for a sphere looks like this:
float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius) {
	vec3 toSphere = origin - sphereCenter;
	float a = dot(ray, ray);
	float b = 2.0 * dot(toSphere, ray);
	float c = dot(toSphere, toSphere) - sphereRadius*sphereRadius;
	float discriminant = b*b - 4.0*a*c;
	if(discriminant > 0.0) {
		float t = (-b - sqrt(discriminant)) / (2.0 * a);
		if(t > 0.0) { return t; }
	}
	return INFINITY ;
}

vec3 normalForSphere(vec3 hit, vec3 sphereCenter, float sphereRadius) {
	return (hit - sphereCenter) / sphereRadius;
}

void addSphere( vec3 ro, vec3 rd,
		vec3 center, float radius, vec3 color,
		inout float hitDist, inout vec3 hitColor, inout vec3 hitNormal ){

		float dist = intersectSphere(ro, rd, center, radius);

		if (dist < hitDist) {
				vec3 hit = ro + dist * rd;
				hitNormal = normalForSphere(hit, center, radius);
				hitColor = color;
				hitDist = dist;
			}
}


// CUBE ------------------------------------------------------------------------
vec3 normalForCube(vec3 hit, vec3 cubeMin, vec3 cubeMax)
{
	if(hit.x < cubeMin.x + RAY_OFFSET) return vec3(-1.0, 0.0, 0.0);
	else if(hit.x > cubeMax.x - RAY_OFFSET ) return vec3(1.0, 0.0, 0.0);
	else if(hit.y < cubeMin.y + RAY_OFFSET ) return vec3(0.0, -1.0, 0.0);
	else if(hit.y > cubeMax.y - RAY_OFFSET ) return vec3(0.0, 1.0, 0.0);
	else if(hit.z < cubeMin.z + RAY_OFFSET ) return vec3(0.0, 0.0, -1.0);
	else return vec3(0.0, 0.0, 1.0);
}

vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
	vec3 tMin = (cubeMin - origin) / ray;
	vec3 tMax = (cubeMax - origin) / ray;
	vec3 t1 = min(tMin, tMax);
	vec3 t2 = max(tMin, tMax);
	float tNear = max(max(t1.x, t1.y), t1.z);
	float tFar = min(min(t2.x, t2.y), t2.z);
	return vec2(tNear, tFar);
}

void addCube( vec3 ro, vec3 rd,
		vec3 cubeMin, vec3 cubeMax,	vec3 color,
		inout float hitDist, inout vec3 hitColor, inout vec3 hitNormal ){

	vec2 tdist = intersectCube(ro, rd, cubeMax, cubeMin);
	float dist = tdist.x <= tdist.y ? tdist.x : INFINITY;
	dist = dist > 0.0 ? dist : INFINITY;
	if (dist < hitDist) {
		vec3 hit = ro + dist * rd;
		hitNormal = normalForCube(hit, cubeMin, cubeMax);
		hitColor = color;
		hitDist = dist;
	}
}

// SCENE ------------------------------------------------------------------------
// scene descriptions
float rayTraceScene(vec3 ro /*rayStart*/, vec3 rd /*rayDirection*/, out vec3 hitNormal, out vec3 hitColor)
{
 float hitDist = INFINITY;
 hitNormal = vec3(0.0,0.0,0.0);


  // ground plane
	addPlane( ro, rd, vec4(0.0, 1.0, 0.0, 0.0), hitDist, hitColor, hitNormal );


  // spheres
	addSphere( ro, rd, vec3(1.0, 2.0, 5.0), 2.0, vec3(1.0, 0.0, 0.0), hitDist, hitColor, hitNormal  );
	addSphere( ro, rd, vec3(5.0, 1.0, 2.0), 1.0, vec3(0.0, 1.0, 0.0), hitDist, hitColor, hitNormal  );
	addSphere( ro, rd, vec3(5.0, 2.8, 1.0), 0.6, vec3(1.0, 0.0, 1.0), hitDist, hitColor, hitNormal );

  // display light by white spheres
	//addSphere( ro, rd, v_lightPos, 0.1, vec3(1.0, 1.0, 1.0), hitDist, hitColor, hitNormal  );


  // add floating cube
	addCube( ro, rd, vec3(0.0, 3.0, 0.0), vec3(1.0, 4.0, 1.0), vec3(1.0, 1.0, 0.0), hitDist, hitColor, hitNormal  );

	// table top
	addCube(ro, rd, vec3(-2, 1.65, -2), vec3(2, 1.8, 2), vec3(0.0, 0.0, 1.0), hitDist, hitColor, hitNormal  );
	// table legs
	addCube(ro, rd, vec3(-1.9, 0, -1.9), vec3(-1.6, 1.65, -1.6), vec3(0.0, 0.0, 1.0), hitDist, hitColor, hitNormal  );
	addCube(ro, rd, vec3(-1.9, 0, 1.6), vec3(-1.6, 1.65, 1.9), vec3(0.0, 0.0, 1.0), hitDist, hitColor, hitNormal  );
	addCube(ro, rd, vec3(1.6, 0, 1.6), vec3(1.9, 1.65, 1.9), vec3(0.0, 0.0, 1.0), hitDist, hitColor, hitNormal  );
	addCube(ro, rd, vec3(1.6, 0, -1.9), vec3(1.9, 1.65, -1.6), vec3(0.0, 0.0, 1.0), hitDist, hitColor, hitNormal  );

	return hitDist;
}

// LIGHTING --------------------------------------------------------------------
float calcFresnel(vec3 normal, vec3 inRay) {
	float bias = 0.1;
	float scale = 1.0;
	float power = 2.0;
	float res = max(min(1.0, bias + scale * (pow(dot(inRay, normal), power) )),0.0);
	return 1.0 - res;
}

vec3 calcLighting(vec3 hitPoint, vec3 normal, vec3 inRay, vec3 color) {
	vec3 ambient = vec3(0.3, 0.3, 0.3);
	vec3 lightVec = v_lightPos - hitPoint;
	vec3 lightDir = normalize(lightVec);
	float lightDist = length(lightVec);
	vec3 hitNormal, hitColor;
	float shadowRayDist = rayTraceScene(hitPoint + lightDir*RAY_OFFSET, lightDir, hitNormal, hitColor );
	if(shadowRayDist < lightDist) {
		return ambient * color;
	} else {
		float diff = max(dot(normal, lightDir),0.0);
		vec3 h = normalize(-inRay + lightDir);
		float ndoth = max(dot(normal, h),0.0);
		float spec = max(pow(ndoth, 50.0),0.0);
		return min((ambient + vec3(diff)) * color + vec3(spec), 1.0);//diff*color * vec3(spec);
	}
}


// shoot our ray into the scene:
void main() {
	gl_FragColor.rgba = vec4(0.0, 0.0, 0.0, 1.0); // background color
	vec3 rayStart = v_viewPos;
	vec3 rayDirection = normalize(v_position);

	vec3 hitColor;
	vec3 hitNormal;
	float dist = rayTraceScene(rayStart, rayDirection, hitNormal, hitColor);
	float hits = 0.0;

  if (dist < INFINITY) {
		for (int i = 0; i < MAX_DEPTH; i++)
		{

			vec3 nearestHit = rayStart + dist*rayDirection;
			float fresnel = calcFresnel(hitNormal, rayDirection);
			float weight = (1.0-fresnel)*(1.0-hits);
			vec3 tempCol = calcLighting(nearestHit, hitNormal, rayDirection, hitColor);
			gl_FragColor.rgb += tempCol * weight;
			hits += weight;
			rayDirection = reflect(rayDirection, hitNormal);
			rayStart = nearestHit + hitNormal * RAY_OFFSET;
			dist = rayTraceScene(rayStart, rayDirection, hitNormal, hitColor);
			if (dist >= INFINITY){
				return;
			}
		}
	}

	// // if we hit something, color it
	// if (dist < INFINITY) {
	// 	vec3 hitpoint = rayStart + dist * rayDirection;
	// 	// add shading here ...
	// 	gl_FragColor.rgb = calcLighting(hitpoint, hitNormal, rayDirection, hitColor);
	// }
}
