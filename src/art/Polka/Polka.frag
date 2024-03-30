precision highp float;

varying vec2 uv;
uniform vec2 renderSize;
uniform float scaledTime;

uniform float scale; // "Scale", 1 to 100, step 1
uniform float circleRadius; // "Circle Radius", 0 to 0.33, step 0.01
uniform float fuzz; // "Fuzz", 0.1, 0.0 to 1, step 0.01
// uniform float rowOffset; // "Row Offset", 0.5, 0.0 to 1.0, step 0.01

void main()	{
	// Normalize aspect ratio
	float aspectRatio = float(renderSize.x) / float(renderSize.y);
	vec2 uv = uv * 2.0 - 1.0;
	uv.x *= aspectRatio;

	// Multiply the coordinate space
	float rowOffset = fract(scaledTime);
	float absOffset = min(rowOffset, 1.0 - rowOffset);
	float yHeightScale = sqrt(absOffset * absOffset + 1.0);

	vec2 scaledUV = uv * vec2(scale, scale * yHeightScale);
	vec2 rowCol = floor(scaledUV);
	vec2 uvPartial = fract(scaledUV);

	// Create a circle on an isometric grid
	float fuzz = fuzz * scale / 100.0;
	float rowIsOdd = step(1.0, mod(scaledUV.y, 2.0));
	float circle = 1.0 - smoothstep(circleRadius - fuzz / 2.0, circleRadius + fuzz / 2.0, length(vec2(uvPartial.x - 0.5 + rowOffset * rowIsOdd, (uvPartial.y - 0.5) / yHeightScale)));
	circle += step(0.5, rowIsOdd) * (1.0 - smoothstep(circleRadius - fuzz / 2.0, circleRadius + fuzz / 2.0, length(vec2(uvPartial.x - 0.5 - (1.0 - rowOffset), (uvPartial.y - 0.5) / yHeightScale))));

	// Foreground background output
	vec3 outputColor = vec3(0.0) * circle + vec3(1.0) * (1.0 - circle);
    gl_FragColor = vec4(outputColor, 1.0);
}
