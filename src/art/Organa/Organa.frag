precision highp float;

#include ../util/lygia/generative/cnoise;
#include ../util/lygia/generative/snoise;
#include ../util/lygia/color/space/hsl2rgb;

varying vec2 vUv;
uniform vec2 renderSize;

uniform sampler2D passBuffer0;
uniform sampler2D passBuffer1;

// Main Params:
uniform float blendFactor; // "Blend Factor", 0.92, 0.5 to 1, step 0.001
uniform float warpDepth; // "Warp Depth", 0.03, 0.0 to 0.15, step 0.001
uniform float baseScale; // "Base Scale", 40.0, 1 to 50
uniform float warpScale; // "Warp Scale", 40.0, 1 to 50 

// Motion Params:
uniform float scaledTime1;
uniform float scaledTime3;
uniform float scaledTime2;
uniform float scaledTime4;

// Color params:
uniform vec3 color1; // #000000
uniform vec3 color2; // #ffffff
uniform vec3 color3; // #2391bb
uniform float easing; // 1, 1 to 20
uniform float midpoint; // 0.5, 0 to 1
uniform bool rainbow; // false

vec3 threeMix(vec3 a, vec3 b, vec3 c, float val) {
    float h = 0.5; // middle
    return mix(mix(a, b, val/h), mix(b, c, (val - h)/(1.0 - h)), step(h, val));
}

float sigmoidBase(float t, float k) {
	return (1.0 / (1.0 + exp(-k * t))) - 0.5;
}

float sigmoidEasing(float t, float k) {
	float correction = 0.5 / sigmoidBase(1.0, k);
	return correction * sigmoidBase(2.0 * t - 1.0, k) + 0.5;
}

void main()	{
#ifdef PASS_0
    // Normalize coordinates:
    vec2 xy = vUv * 2.0 - 1.0;
    xy.x = xy.x * renderSize.x / renderSize.y;

    // Noisy colors:
    float timeVal1 = scaledTime1 * 0.1;
    vec2 baseDriftOffset = vec2(0.0, 1.0) * scaledTime3;
    float noiseVal = cnoise(vec3(xy.x * baseScale + baseDriftOffset.x, xy.y * baseScale + baseDriftOffset.y, timeVal1));
    noiseVal = noiseVal / 2.0 + 0.5; // scale to 0-1
	noiseVal = sigmoidEasing(noiseVal, easing); // apply easing
    noiseVal = fract(noiseVal - 0.5 + midpoint); // shift midpoint
    vec4 threeColor = vec4(threeMix(color1, color2, color3, noiseVal), 1.0);
    vec4 rainbowColor = vec4(hsl2rgb(vec3(noiseVal, 1.0, 0.4)), 1.0);
    vec4 color = rainbow ? rainbowColor : threeColor;

    // Apply warping:
    float timeVal2 = scaledTime2 * 0.1;
    vec4 previous = texture(passBuffer1, vUv);
    vec2 warpDriftOffset = vec2(0.0, 1.0) * scaledTime4;
    float warpX = cnoise(vec3(xy.x * warpScale + warpDriftOffset.x, xy.y * warpScale + warpDriftOffset.y, timeVal2));
    float warpY = cnoise(vec3(xy.y * warpScale + warpDriftOffset.y, xy.x * warpScale + warpDriftOffset.x, -timeVal2));
    vec2 warpOffset = vec2(warpX, warpY) * warpDepth;
    vec4 warped = texture(passBuffer1, vUv + warpOffset);
    gl_FragColor = mix(color, warped, blendFactor);
#elif defined PASS_1
    gl_FragColor = texture(passBuffer0, vUv);
#else
    gl_FragColor = texture(passBuffer0, vUv);
#endif
}
