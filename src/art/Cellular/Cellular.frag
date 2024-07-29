precision highp float;

uniform float scaledTime;
uniform vec2 renderSize;
varying vec2 vUv;

#pragma glslify: simplexNoise = require(glsl-noise/simplex/3d)

uniform float  spaceScale; // 5, 0.5 to 20
uniform float noiseScale; // 0.1, 0.1 to 5
uniform float textureScale; // 2.5, 0 to 20
uniform float textureDepth; // 0.2, 0.0 to 1.0
uniform float edgeDepth; // 0.25, 0.0 to 1.0
uniform float contrast; // 4, 0.01 to 5
uniform vec3 color1; // #ffd440
uniform vec3 color2; // #184e20


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
    vUv *= spaceScale;
    vUv.y -= scaledTime;

    // Tile the space
    vec2 tileIdx = floor(vUv);
    vec2 tileUv = fract(vUv);
    float finalDist = 1.0;
    float secondDist = 1.0;

    for (int y= -1; y <= 1; y++) {
        for (int x= -1; x <= 1; x++) {
            // Neighbor place in the grid
            vec2 neighbor = vec2(float(x),float(y));

            // Calculate point position
            float pointX = simplexNoise(vec3((tileIdx + neighbor) / noiseScale, scaledTime)) / 2.0 + 0.5;
            float pointY = simplexNoise(vec3((tileIdx + neighbor) / noiseScale, scaledTime + 1000.0)) / 2.0 + 0.5;
            vec2 point = vec2(pointX, pointY);

			// Vector between the pixel and the point
            vec2 diff = neighbor + point - tileUv;

            // Distance to the point
            float dist = length(diff);

            // Track two closest distances to the point (for relative calculations)
            if (dist < finalDist) {
                secondDist = finalDist;
                finalDist = dist;
            } else if (dist < secondDist) {
                secondDist = dist;
            }
        }
    }

    // Calculate relative distance and normalize
    float relativeDist = 1.0 - ((secondDist - finalDist) / (secondDist + finalDist)) * 1.0;
    float dScaled = mix(finalDist, relativeDist, edgeDepth);

    // Draw the distance field: eased, scaled & textured
    float textureValue = (1.0 - textureDepth / 2.0) + simplexNoise(vec3(vUv.x * textureScale, vUv.y * textureScale, relativeDist * textureScale)) * textureDepth / 2.0;
    float texturedValue = dScaled * textureValue;
    float easedValue = sigmoidEasing(texturedValue, contrast);

    // Render final color
    vec3 color = mix(color1, color2, easedValue);
    gl_FragColor = vec4(color,1.0);
}