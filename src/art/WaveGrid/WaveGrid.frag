precision highp float;

#pragma glslify: simplexNoise = require(glsl-noise/simplex/3d)

uniform vec2 renderSize;
varying vec2 uv;
uniform float scaledTime;

uniform float gridScale; // "Grid Scale", 10, 1 to 30
uniform float waveScale; // "Wave Scale", 0.5, 0 to 1
uniform float warpRange; // "Wave Range", 0.5, 0 to 1
uniform float smoothing; // "Smoothing", 0, 0 to 0.5, step 0.001
uniform vec3 colorA; // "Color A", #55ccce
uniform vec3 colorB; // "Color B", #301593

void main() {
	float aspectRatio = float(renderSize.x) / float(renderSize.y);
	vec2 uv = uv;
	uv = uv - 0.5;

    float littleX = fract(uv.x * gridScale * aspectRatio);
    float littleY = fract(uv.y * gridScale);
    vec3 triangleFillSeed = vec3(uv.x * gridScale * waveScale * aspectRatio, uv.y * gridScale * waveScale, scaledTime / 2.0);
    float triangleFill = simplexNoise(triangleFillSeed);
    float triangleMask = smoothstep(littleX + littleY - smoothing, littleX + littleY + smoothing, 1.0 + triangleFill * warpRange);

    vec3 color = colorA * triangleMask + colorB * (1.0 - triangleMask);
    gl_FragColor = vec4(color, 1.0);
}