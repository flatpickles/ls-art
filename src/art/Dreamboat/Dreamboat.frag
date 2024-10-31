precision highp float;
varying vec2 vUv;

uniform float time;
uniform vec2 renderSize;

uniform float scaledTime;
uniform float lineCount; // "Line Count", 10.0, 1 to 40, step 1
uniform vec2 noiseScale; // "Noise Scale", [1.8, 1.8], 0 to 5
uniform vec2 channelOffset; // "XY Offset", [0.5, 0.25], 0 to 1
uniform float timeOffset; // "Time Offset", 0.2, 0 to 1
uniform vec3 split; // "RGB Split", [0, 0.5, 1]

#pragma glslify: classicNoise = require(glsl-noise/classic/3d)

float getMask(vec2 uv, float timeOffset) {
    float lookupWarp = classicNoise(vec3(uv, scaledTime * 0.1 + timeOffset));
    float offsetX = classicNoise(vec3(uv * noiseScale + lookupWarp, scaledTime * 0.1 + timeOffset)) * 0.5;
	float linePattern = fract((uv.x + offsetX) * lineCount);
    float lineInOut = abs(linePattern - 0.5) * 2.0;
	float stepOffset = fwidth(lineInOut);
	return smoothstep(0.5 - stepOffset, 0.5 + stepOffset, lineInOut);
}

void main() {
	vec2 scaledUv = vUv;
	float aspectRatio = float(renderSize.y) / float(renderSize.x);
	scaledUv = scaledUv * 2.0 - 1.;
    scaledUv *= vec2(0.5, 0.75 * aspectRatio);

	vec2 uvOffset = channelOffset * 0.01;
	float maskA = getMask(scaledUv, 0.0);
	float maskB = getMask(scaledUv + uvOffset, 0.05 * timeOffset);
    vec3 color1 = split;
    vec3 color2 = 1.0 - split;
    vec3 color = maskA * color1 + maskB * color2;
    gl_FragColor = vec4(color, 1.0);
}
