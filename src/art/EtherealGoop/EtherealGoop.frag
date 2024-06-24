precision highp float;

#pragma glslify: noise = require(glsl-noise/classic/3d) 

uniform float scaledTime;
uniform vec2 renderSize;

uniform float goopScale; // 6.0, "Goop Scale", 1 to 10
uniform float offsetX; // 0.0, "X Offset", -2 to 2
uniform float offsetY; // 1.0, "Y Offset", -2 to 2
uniform float layerCount; // 7, "Layer Count", 1 to 10, step 1
uniform float noiseEdge; // 0.6, "Noise Edge", 0.2 to 0.8
uniform float edgeTaper; // 0.0, "Edge Taper", -1 to 1
uniform float edgeSoftness; // 0.02, "Edge Softness", 0 to 1
uniform vec3 bgColor; // #042124, "BG Color"
uniform vec3 bottomColor; // #042124, "Bottom Color"
uniform vec3 topColor; // #dffaff, "Top Color"

varying vec2 vUv;

// Color functions: https://www.shadertoy.com/view/XljGzV

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 colorMix(vec3 rgb1, vec3 rgb2, float mixVal) {
    vec3 hsv1 = rgb2hsv(rgb1);
    vec3 hsv2 = rgb2hsv(rgb2);
    vec3 mixed = mix(hsv1, hsv2, mixVal);
    return hsv2rgb(mixed);
}

float scaledTime_MULT = 0.2;

void main() {
    // Adjust coordinate space
	float aspectRatio = float(renderSize.x) / float(renderSize.y);
	vec2 st = vUv;
	st = st * 2.0 - 1.;
	st.x *= aspectRatio;
    st *= goopScale;

    // Useful calculations for use within the layering loop
    float scaledNoiseEdge = ((1.0 - noiseEdge) * 2.0) - 1.0;
    float mixIncrement = (layerCount > 1.0) ? 1.0 / (layerCount - 1.0) : 0.0;
    float taperIncrement = (layerCount > 1.0) ? edgeTaper / (layerCount - 1.0) : 0.0;
    vec2 offsetIncrement = (layerCount > 1.0) ? vec2(offsetX, offsetY) / (layerCount - 1.0) : vec2(0.0);

    // Calculate and add each layer
    float previousMaskInverse = 1.0;
    vec3 compositeColor = vec3(0.0);
    for (int i = 0; i < 10; i += 1) { // must run to layerCount maxValue
        vec3 color = colorMix(topColor, bottomColor, mixIncrement * float(i));
        vec2 stOffset = st + offsetIncrement * float(i);
        float noiseVal = noise(vec3(scaledTime * scaledTime_MULT, stOffset.x, stOffset.y));
        float edgeVal = scaledNoiseEdge + taperIncrement * float(i);
        float smoothingGap = 0.1 * edgeSoftness * goopScale;
        float mask = smoothstep(edgeVal - smoothingGap/2.0, edgeVal + smoothingGap/2.0, noiseVal);

        // Accumulate mask & color
        compositeColor += mask * previousMaskInverse * color;
        previousMaskInverse *= (1.0 - mask);

        // Break once we've painted the right number of layers
        if (float(i + 1) >= layerCount) break;

        // Break if further iterations won't be used anyway
        if (previousMaskInverse == 0.0) break;
    }

    // Add background color and output
    compositeColor += previousMaskInverse * bgColor;
    gl_FragColor = vec4(compositeColor, 1.0);
}
