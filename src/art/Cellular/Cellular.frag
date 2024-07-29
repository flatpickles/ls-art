precision highp float;

uniform float scaledTime;
uniform vec2 renderSize;

uniform float  spaceScale; // 4, 0.5 to 20
uniform float noiseScale; // 0.1, 0.1 to 5
uniform float cellScale; // 1, 0.5 to 1
uniform float textureScale; // 3, 0 to 20
uniform float contrast; // 2, 0.01 to 4
uniform vec3 color1; // #ffe999
uniform vec3 color2; // #194d20

varying vec2 vUv;

#pragma glslify: simplexNoise = require(glsl-noise/simplex/3d)

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

float sigmoidBase(float t, float k) {
	return (1.0 / (1.0 + exp(-k * t))) - 0.5;
}

float sigmoidEasing(float t, float k) {
	float correction = 0.5 / sigmoidBase(1.0, k);
	return correction * sigmoidBase(2.0 * t - 1.0, k) + 0.5;
}

void main()	{
	float aspectRatio = float(renderSize.x) / float(renderSize.y);
	vec2 vUv = vUv;
	vUv = vUv * 2.0 - 1.;
	vUv.x *= aspectRatio;
    vUv *=  spaceScale;

    // Tile the space
    vec2 i_st = floor(vUv);
    vec2 f_st = fract(vUv);

    float finalDist = 1.0;

    for (int y= -1; y <= 1; y++) {
        for (int x= -1; x <= 1; x++) {
            // Neighbor place in the grid
            vec2 neighbor = vec2(float(x),float(y));

            // Random position from current + neighbor place in the grid
            float pointX = simplexNoise(vec3((i_st + neighbor) / noiseScale, scaledTime)) / 2.0 + 0.5;
            float pointY = simplexNoise(vec3((i_st + neighbor) / noiseScale, scaledTime + 1000.0)) / 2.0 + 0.5;
            vec2 point = vec2(pointX, pointY);

			// Vector between the pixel and the point
            vec2 diff = neighbor + point - f_st;

            // Distance to the point
            float dist = length(diff) + (1.0 - cellScale);

            // Keep the closer distance (eased by contrast)
            float eased = sigmoidEasing(dist, contrast);
            finalDist = min(eased, finalDist);
        }
    }

    // Draw the distance field: scaled, tetured, eased
    float spaceScale = finalDist;
    spaceScale += (simplexNoise(vec3(vUv.x * textureScale, vUv.y * textureScale, finalDist * textureScale)) / 2.0 + 1.0) * 0.1;
    
    // Render final color
    vec3 color = mix(color1, color2, spaceScale);
    gl_FragColor = vec4(color,1.0);
}