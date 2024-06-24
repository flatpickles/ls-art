precision highp float;

#pragma glslify: simplexNoise = require(glsl-noise/simplex/3d)

varying vec2 vUv;
uniform vec2 renderSize;
uniform float scaledTime;

uniform float scale; // "Grid Scale", 20, 2 to 100, step 1
uniform float fuzz; // "Fuzz", 0.2, 0.0 to 1, step 0.01
const float circleRadius = 0.33;

vec3 hsv(float h, float s, float v) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(vec3(h) + K.xyz) * 6.0 - K.www);
    return v * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s);
}

void main()	{
	// Normalize aspect ratio
	float aspectRatio = float(renderSize.x) / float(renderSize.y);
	vec2 uv = vUv * 2.0 - 1.0;
	uv.x *= aspectRatio;

	// Multiply the coordinate space
	float rowOffset = fract(scaledTime);
	float doubleOffset = fract(scaledTime * 2.0);
	float absOffset = min(doubleOffset, 1.0 - doubleOffset);
	float yHeightScale = sqrt(absOffset * absOffset + 1.0);
	vec2 scaledUV = uv * vec2(scale / 2.0, scale / 2.0 * yHeightScale);
	vec2 rowCol = floor(scaledUV);
	vec2 uvPartial = fract(scaledUV);

	// Create circle masks
	float fuzz = fuzz * scale / 100.0;
	float rowIsOdd = step(1.0, mod(scaledUV.y, 2.0)); // even/odd naming?
	float evenCircleFieldA = step(0.5, rowIsOdd) * length(vec2(uvPartial.x - 0.5 - rowOffset, (uvPartial.y - 0.5) / yHeightScale));
	float evenCircleFieldB = step(0.5, rowIsOdd) * length(vec2(uvPartial.x - 0.5 + (1.0 - rowOffset), (uvPartial.y - 0.5) / yHeightScale));
	float evenCircleField = min(evenCircleFieldA, evenCircleFieldB);
	float oddCircleFieldA = step(rowIsOdd, 0.5) * length(vec2(uvPartial.x - 0.5 + rowOffset, (uvPartial.y - 0.5) / yHeightScale));
	float oddCircleFieldB = step(rowIsOdd, 0.5) * length(vec2(uvPartial.x - 0.5 - (1.0 - rowOffset), (uvPartial.y - 0.5) / yHeightScale));
	float oddCircleField = min(oddCircleFieldA, oddCircleFieldB);
	float circles = 1.0 - smoothstep(circleRadius - fuzz / 2.0, circleRadius + fuzz / 2.0, evenCircleField + oddCircleField);

	// Some color
	float offsetScaledUVX =
		step(0.5, rowIsOdd) * (scaledUV.x - scaledTime) + 
		step(rowIsOdd, 0.5) * (scaledUV.x + scaledTime);
	float hVal = simplexNoise(vec3(offsetScaledUVX, scaledUV.y, scaledTime + rowCol.y));
	vec3 circleColor = hsv(floor(offsetScaledUVX) / scale, hVal / 2.0 + 0.5, 1.0);

	// Foreground background output
	vec3 bgColor = vec3(0.0);
	vec3 outputColor = circleColor * circles + bgColor * (1.0 - circles);
    gl_FragColor = vec4(outputColor, 1.0);
}
