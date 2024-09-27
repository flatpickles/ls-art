precision highp float;
varying vec2 vUv;

uniform float time;
uniform vec2 renderSize;

uniform float scaledTime;
uniform float lineCount; // 20.0, 1 to 40, step 1
uniform vec2 noiseScale; // [1.0, 2.0], 0 to 4
uniform vec2 channelOffset; // [0.5, 0.25], 0 to 1
uniform float timeOffset; // 0.0, 0 to 1
uniform vec3 split; // [1, 0.5, 0]

#pragma glslify: classicNoise = require(glsl-noise/classic/3d)

float getMask(vec2 uv, float timeOffset) {
    // todo: make lookupWark paramaterizable, keep playing with this
    float lookupWarp = classicNoise(vec3(uv, scaledTime * 0.1 + timeOffset));
    float offsetX = classicNoise(vec3(uv * noiseScale + lookupWarp, scaledTime * 0.1 + timeOffset)) * 0.5;
	float linePattern = fract((uv.x + offsetX) * lineCount);
    float lineInOut = abs(linePattern - 0.5) * 2.0;
	float stepOffset = fwidth(lineInOut);
	return smoothstep(0.5 - stepOffset, 0.5 + stepOffset, lineInOut);
}

void main() {
	vec2 uvOffset = channelOffset * 0.01;
	float maskA = getMask(vUv, 0.0);
	float maskB = getMask(vUv + uvOffset, 0.05 * timeOffset);
    vec3 color1 = split;
    vec3 color2 = 1.0 - split;
    vec3 color = maskA * color1 + maskB * color2;
    gl_FragColor = vec4(color, 1.0);
}


/*
    Ideas:
    - channel offset in direction of motion
    - more explicit color control // more colors
    - mouse interaction // displacement
*/