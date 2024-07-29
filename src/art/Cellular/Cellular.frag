precision highp float;

uniform float scaledTime;
uniform vec2 renderSize;

uniform float scale; // 1, 0 to 20
uniform float noiseScale; // 1, 0 to 20
uniform vec3 color1;
uniform vec3 color2; // #ffffff

varying vec2 vUv;

#pragma glslify: simplexNoise = require(glsl-noise/simplex/3d)

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

void main()	{
	float aspectRatio = float(renderSize.x) / float(renderSize.y);
	vec2 vUv = vUv;
	vUv = vUv * 2.0 - 1.;
	vUv.x *= aspectRatio;
    vUv *= scale;

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
            float dist = length(diff);

            // Keep the closer distance
            finalDist = min(dist, finalDist);
        }
    }

    // Draw the min distance (distance field)
    float scale = simplexNoise(vec3(vUv.x, vUv.y, finalDist)) / 2.0 + 1.0;
    scale *= finalDist;

    vec3 color = mix(color1, color2, scale);

    gl_FragColor = vec4(color,1.0);
}