precision highp float;
varying vec2 vUv;

uniform float time;
uniform float scaledTime;
uniform vec2 renderSize;

#pragma glslify: classicNoise = require(glsl-noise/classic/3d)

void main()	{
    // Coordinate system adjustment
	float aspectRatio = float(renderSize.x) / float(renderSize.y);
	vec2 uv = vUv;
	uv = uv * 2.0 - 1.;
	uv.x *= aspectRatio;

    // Final color
    float noiseTexture = classicNoise(vec3(uv, scaledTime));
    vec3 finalColor = vec3(noiseTexture / 2.0 + 0.5);
	gl_FragColor = vec4(finalColor, 1.0);
}