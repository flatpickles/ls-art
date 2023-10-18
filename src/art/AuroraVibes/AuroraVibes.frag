precision highp float;

#pragma glslify: simplexNoise = require(glsl-noise/simplex/3d)
#pragma glslify: classicNoise = require(glsl-noise/classic/3d)

uniform vec2 renderSize;
varying vec2 uv;
uniform float scaledTime;

uniform float seedOffset; // 0.35
uniform float xScale; // 1.25
uniform float yScale; // 4.5
uniform float easing; // 10
uniform bool useSimplex; // false
uniform vec3 baseColor; // [0, 0.07, 0.36]
uniform vec3 color1; // [0.44, 0.85, 0.66]
uniform float mixMin1; // 0.0
uniform float mixMax1; // 1.0
uniform vec3 color2; // [0.34, 0.4, 0.63]
uniform float mixMin2; // 0.0
uniform float mixMax2; // 1.0
uniform vec3 color3; // [0.81, 0.43, 0.5]
uniform float mixMin3; // -0.2
uniform float mixMax3; // 0.6

// Sigmoid easing adapted from:
// https://medium.com/hackernoon/ease-in-out-the-sigmoid-factory-c5116d8abce9

float sigmoidBase(float t, float k) {
	return (1.0 / (1.0 + exp(-k * t))) - 0.5;
}

float sigmoidEasing(float t, float k) {
	float correction = 0.5 / sigmoidBase(1.0, k);
	return correction * sigmoidBase(2.0 * t - 1.0, k) + 0.5;
}

// Mix in a new layerColor over background; mix value is noise, scaled between mixMin & mixMax
vec3 addLayer(vec3 background, vec3 layerColor, vec2 uv, float seed, float mixMin, float mixMax) {
	float noiseVal;
	if (useSimplex) {
		noiseVal = simplexNoise(vec3(uv, seed));
	} else {
		noiseVal = classicNoise(vec3(uv, seed));
	}
	noiseVal = (noiseVal + 1.0) / 2.0; // within [0, 1]
	noiseVal = sigmoidEasing(noiseVal, easing); // apply easing
	noiseVal = mix(mixMin, mixMax, noiseVal); // determine mix
	return mix(background, layerColor, noiseVal);
}

void main()	{
	// Scale the coordinate space
	float aspectRatio = float(renderSize.x) / float(renderSize.y);
	vec2 uv = uv;
	uv = uv * 2.0 - 1.;
	uv.x *= aspectRatio;
	uv.x *= xScale;
	uv.y *= yScale;
	uv /= useSimplex ? 1.5 : 1.0;

	// Create the blended final color
	vec3 blended = baseColor.rgb;
	float noiseTime = scaledTime / (useSimplex ? 1.5 : 1.0);
	blended = addLayer(blended, color1.rgb, uv, noiseTime + seedOffset * 0.0, mixMin1, mixMax1);
	blended = addLayer(blended, color2.rgb, uv, noiseTime + seedOffset * 1.0, mixMin2, mixMax2);
	blended = addLayer(blended, color3.rgb, uv, noiseTime + seedOffset * 2.0, mixMin3, mixMax3);
	gl_FragColor = vec4(blended, 1.0);
}
