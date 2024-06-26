precision highp float;

#include ../util/lygia/generative/cnoise;
#include ../util/lygia/generative/snoise;
#include ../util/lygia/color/space/hsl2rgb;

varying vec2 vUv;
uniform vec2 renderSize;

uniform sampler2D passBuffer0;
uniform sampler2D passBuffer1;

uniform float scaledTime1;
uniform float scaledTime2;
uniform float spaceScale; // 40.0, 1 to 50
uniform float lookupScale; // 40.0, 1 to 50 
uniform float blendAmount; // 0.92, 0.75 to 0.95
uniform float warpScale; // 0.03, 0.001 to 0.15, step 0.001
uniform vec2 noiseWind; // [0.0, 0.0], -1 to 1
uniform vec2 warpWind; // [0.0, 0.0], -1 to 1

uniform vec3 color1; // #000000
uniform vec3 color2; // #ffffff
uniform vec3 color3; // #2391bb

uniform bool rainbow; // false

/*
todo:
- easing
- param triage & naming
- code cleanup
- presets
*/

vec3 threeMix(vec3 a, vec3 b, vec3 c, float val) {
    float h = 0.5; // middle
    return mix(mix(a, b, val/h), mix(b, c, (val - h)/(1.0 - h)), step(h, val));
}

void main()	{
#ifdef PASS_0
    vec2 xy = vUv * 2.0 - 1.0;
    xy.y = xy.y * renderSize.y / renderSize.x;

    float timeVal1 = scaledTime1 * 0.05;
    vec2 noiseWindOffset = noiseWind * scaledTime1;
    float noiseVal = snoise(vec3(xy.x * spaceScale + noiseWindOffset.x, xy.y * spaceScale + noiseWindOffset.y, timeVal1));
    float scaledNoiseVal = noiseVal / 2.0 + 0.5;
    vec4 threeColor = vec4(threeMix(color1, color2, color3, scaledNoiseVal), 1.0);
    vec4 rainbowColor = vec4(hsl2rgb(vec3(scaledNoiseVal, 1.0, 0.4)), 1.0);
    vec4 color = rainbow ? rainbowColor : threeColor;

    float timeVal2 = scaledTime2 * 0.05;
    vec4 previous = texture(passBuffer1, vUv);
    vec2 warpWindOffset = warpWind * scaledTime2;
    float warpX = snoise(vec3(xy.x * lookupScale + warpWindOffset.x, xy.y * lookupScale + warpWindOffset.y, timeVal2));
    float warpY = snoise(vec3(xy.y * lookupScale + warpWindOffset.y, xy.x * lookupScale + warpWindOffset.x, -timeVal2));
    vec2 warpOffset = vec2(warpX, warpY) * warpScale;
    vec4 warped = texture(passBuffer1, vUv + warpOffset);
    gl_FragColor = mix(color, warped, blendAmount);
#elif defined PASS_1
    gl_FragColor = texture(passBuffer0, vUv);
#else
    gl_FragColor = texture(passBuffer0, vUv);
#endif
}
