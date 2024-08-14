precision highp float;
varying vec2 vUv;

uniform float time;
uniform float scaledTime;
uniform float scaledTime2;
uniform vec2 renderSize;
uniform vec2 scale; // "Scale", [1, 1], 0 to 20, step 0.1
uniform float threshold; // 0.5
uniform float offsetLength; // 0.1

float edgeWidth = 0.05;

uniform sampler2D passBuffer0;
uniform sampler2D passBuffer1;

#pragma glslify: classicNoise = require(glsl-noise/classic/3d)

float antialiasedStep(float threshold, float value, float width) {
    float halfWidth = width * 0.5;
    return smoothstep(threshold - halfWidth, threshold + halfWidth, value);
}

void main() {
    float aspectRatio = float(renderSize.x) / float(renderSize.y);
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= aspectRatio;

    vec2 offset = vec2(sin(scaledTime2), cos(scaledTime2)) * offsetLength;
    
    vec3 noiseInput1 = vec3(uv * scale + offset, scaledTime);
    vec3 noiseInput2 = vec3(uv * scale + offset * 2.0, scaledTime);
    vec3 noiseInput3 = vec3(uv * scale + offset * 3.0, scaledTime);
    
    float noise1 = classicNoise(noiseInput1) / 2.0 + 0.5;
    float noise2 = classicNoise(noiseInput2) / 2.0 + 0.5;
    float noise3 = classicNoise(noiseInput3) / 2.0 + 0.5;
    noise1 = fract(noise1 * 10.0);
    noise2 = fract(noise2 * 10.0);
    noise3 = fract(noise3 * 10.0);
    // still aliasing....
    
    vec3 noiseValues = vec3(noise1, noise2, noise3);
    
    vec3 gradients;
    for (int i = 0; i < 3; i++) {
        // Calculate derivatives
        float dx = dFdx(noiseValues[i]);
        float dy = dFdy(noiseValues[i]);
        float gradLen = length(vec2(dx, dy));
        
        // Adjust edgeWidth based on scale and gradient length
        float scaledEdgeWidth = edgeWidth * length(scale);
        float adjustedWidth = scaledEdgeWidth * (gradLen * 2.0 + 0.01);
        
        gradients[i] = antialiasedStep(threshold, noiseValues[i], adjustedWidth);
    }
    
    gl_FragColor = vec4(gradients, 1.0);
}