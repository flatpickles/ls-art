precision highp float;

uniform vec2 renderSize;
varying vec2 vUv;

// Motion
uniform float scaledTime;
uniform float scaledTime1;
uniform float scaledTime2;

// Shape
uniform float spaceScale; // "Magnification", 0.5
uniform float textureDepth; // "Endomorphosis", 0.2
uniform float textureScale; // "Microtexture", 0.1
uniform float warpDepth; // "Liquefaction", 0.25
uniform float warpScale; // "Turbulence", 0.5

// Color
uniform vec3 color1; // "Cytoplasm", #ffd440
uniform vec3 color2; // "Ectoplasm", #184e20
uniform float edgeDepth; // "Delimitation", 0.25
uniform float easing; // "Polarity", 0.25
uniform float infold; // "Endocycling", 0.0

// Constants
const float EPSILON = 1e-6;

// SIMPLEX NOISE

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //  x0 = x0 - 0. + 0.0 * C 
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    // Permutations
    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( 
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    // Gradients
    float n_ = 1.0/7.0; // N=7
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3)));
}

vec2 noise3Dto2D(vec3 p) {
    float n1 = snoise(p);
    float n2 = snoise(p + vec3(31.416, 27.183, 23.145));
    return vec2(n1, n2) * 0.5 + 0.5; // Map from [-1, 1] to [0, 1]
}

// EASING

float sigmoidBase(float t, float k) {
	return (1.0 / (1.0 + exp(-k * t))) - 0.5;
}

float sigmoidEasing(float t, float k) {
	float correction = 0.5 / sigmoidBase(1.0, k);
	return correction * sigmoidBase(2.0 * t - 1.0, k) + 0.5;
}

float triangleWave(float x, float frequency) {
    float t = fract(x * frequency);
    return 1.0 - abs(2.0 * t - 1.0);
}

// CELL POSITION

vec2 random2(vec2 p) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

vec2 getCellPoint(vec2 cell, float time) {
    // getCellPoint runs 9x for each fragment; this approach is cheaper than snoise, and looks fine
    vec2 randValues = random2(cell);
    return 0.5 + 0.25 * sin(time * 4.0 + 6.2831 * randValues);
}

// MAIN

void main()	{
    float cellMotion = scaledTime / 2.0;
    float aspectRatio = float(renderSize.x) / float(renderSize.y);

    // Adjust and warp the coordinate system
    vec2 adjustedUv = vUv;
    adjustedUv = adjustedUv * 2.0 - 1.;
    adjustedUv.x *= aspectRatio;
    adjustedUv *= 10.0 * (1.0 - spaceScale) + 0.5;
    adjustedUv += vec2(-scaledTime1, scaledTime2) * 0.25;
    adjustedUv += noise3Dto2D(vec3(adjustedUv * warpScale, cellMotion)) * warpDepth;

    // Tile the space
    vec2 tileIdx = floor(adjustedUv);
    vec2 tileUv = fract(adjustedUv);
    float finalDistSq = 1.0;
    float secondDistSq = 1.0;

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            // Calculate point position for this neighbor
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = getCellPoint(tileIdx + neighbor, cellMotion);
            
			// Vector between the pixel and the point, w squared difference
            vec2 diff = neighbor + point - tileUv;
            float distSq = dot(diff, diff);

            // Track two closest distances to the point (for relative calculations)
            // Use epsilon for more stable comparisons
            if (distSq < finalDistSq - EPSILON) {
                secondDistSq = finalDistSq;
                finalDistSq = distSq;
            } else if (distSq < secondDistSq - EPSILON) {
                secondDistSq = distSq;
            }
        }
    }

    // Calculate relative distance using squared distances
    float relativeDist = 1.0 - ((sqrt(secondDistSq) - sqrt(finalDistSq)) / (sqrt(secondDistSq) + sqrt(finalDistSq)));
    float dScaled = mix(sqrt(finalDistSq), relativeDist, edgeDepth);

    // Draw the distance field: eased, scaled & textured
    float dVal = (1.0 - textureDepth / 2.0) + snoise(vec3(adjustedUv.x * textureScale, adjustedUv.y * textureScale, relativeDist * textureScale) * 20.0) * textureDepth / 2.0;
    dVal = dScaled * dVal;
    dVal = sigmoidEasing(dVal, easing * 4.0 + 1.0);

    dVal = triangleWave(dVal, (infold * 10.0 + 1.0) / 2.0);

    // Render final color
    vec3 color = mix(color1, color2, dVal);
    gl_FragColor = vec4(color, 1.0);
}