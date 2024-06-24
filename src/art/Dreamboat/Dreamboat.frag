precision highp float;
varying vec2 uv;

uniform float time;
uniform float scaledTime;
uniform float scaledTime2;
uniform vec2 renderSize;
uniform vec2 scale; // "Scale", [1, 1], 0 to 20, step 0.1
uniform float fuzz; // "Fuzz", 0, 0 to 0.01, step 0.0001
uniform float threshold; // 0.5
uniform float offsetLength; // 0.1

#pragma glslify: classicNoise = require(glsl-noise/classic/3d)

float noisy(vec2 uv, float time, vec2 offset) {
    return smoothstep(threshold - fuzz, threshold + fuzz, classicNoise(vec3(uv * scale + offset, time)) / 2.0 + 0.5);
}

void main()	{
    // Coordinate system adjustment
	float aspectRatio = float(renderSize.x) / float(renderSize.y);
	vec2 uv = uv;
	uv = uv * 2.0 - 1.;
	uv.x *= aspectRatio;
	
    // Final color
	vec2 offset = vec2(sin(scaledTime2), cos(scaledTime2)) * offsetLength;
    float noiseTexture1 = noisy(uv, scaledTime, offset);
    float noiseTexture2 = noisy(uv, scaledTime, offset * 2.0);
    float noiseTexture3 = noisy(uv, scaledTime, vec2(offset * 3.0));
    vec3 finalColor = vec3(noiseTexture1, noiseTexture2, noiseTexture3);
	gl_FragColor = vec4(finalColor, 1.0);
}