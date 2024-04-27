precision highp float;
varying vec2 uv;

uniform float time;
uniform float scaledTime;
uniform vec2 renderSize;

uniform float scale1; // "Base Scale", 1.0, 0 to 20
uniform float scale2; // "Offset Scale", 1.0, 20 to 200
uniform float intensity1; // "Base Intensity", 1.0, 0 to 1
uniform float intensity2; // "Offset Intensity", 1.0, 0 to 1
uniform vec3 color1; // "Color 1", #000000
uniform vec3 color2; // "Color 2", #ffffff

// #pragma glslify: classicNoise = require(glsl-noise/classic/3d)
#pragma glslify: simplexNoise = require(glsl-noise/simplex/3d)

void main()	{
    // Coordinate system adjustment
	float aspectRatio = float(renderSize.x) / float(renderSize.y);
	vec2 uv = uv;
	uv = uv * 2.0 - 1.;
	uv.x *= aspectRatio;

    float noiseTexture1 = 0.5 + 0.5 * simplexNoise(vec3(uv * scale1, scaledTime + 100.0));
    float noiseTexture2 = 0.5 + 0.5 * simplexNoise(vec3(uv * scale2, scaledTime));

	float base = noiseTexture1 * intensity1;
	float offset = mix(0.0, base, noiseTexture2) * intensity2;
	float finalMask = base - offset;

    vec3 finalColor = mix(color1, color2, finalMask);
	gl_FragColor = vec4(finalColor, 1.0);
}