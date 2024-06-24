precision highp float;

#pragma glslify: simplexNoise = require(glsl-noise/simplex/4d)

uniform float scaledTime;
uniform vec2 renderSize;

varying vec2 vUv;

vec3 hsv(float h, float s, float v) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(vec3(h) + K.xyz) * 6.0 - K.www);
    return v * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s);
}

void main()	{
	float aspectRatio = float(renderSize.x) / float(renderSize.y);
	vec2 vUv = vUv;
	vUv = vUv * 2.0 - 1.;
	vUv.x *= aspectRatio;

	// imported from 20.03.26.frag

    vec2 st = vUv;
    st *= 3.;

    float motion = scaledTime / 10.;
    st.y -= motion * 2.;

    vec4 seedR = vec4(st * 1.3, motion * 2., 240.);
    vec4 seedG = vec4(st * 1.0, motion * 1.5, 470.);
    vec4 seedB = vec4(st * 0.7, motion * 0.5, 928.);

    float offset1 = simplexNoise(seedR);
    offset1 = smoothstep(0.5, 0.65, offset1);
    float offset2 = simplexNoise(seedG);
    offset2 = smoothstep(0.3, 0.45, offset2);
    float offset3 = simplexNoise(seedB);
    offset3 = smoothstep(0.0, 0.5, offset3);
    float h = fract(offset1 - offset2 * 1.0 - offset3 * 1.0 + scaledTime / 15.);
    vec3 color = hsv(h, 0.95, 1.0);

    gl_FragColor = vec4(color, 1.0);
}